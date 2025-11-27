import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Copy, CheckCircle2, Loader2, RefreshCw, QrCode, Wallet, CreditCard, Sparkles } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import BottomNavigation from "@/components/BottomNavigation";
import api from "@/lib/api";

interface DepositData {
  id: number;
  amount: number;
  status: string;
  transaction_id: string | null;
  qr_code: string | null;
  qr_code_base64: string | null;
  qr_code_image: string | null;
  order_url: string | null;
  expires_at: string | null;
  created_at: string;
}

const Deposit = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [amount, setAmount] = useState("");
  const [cpf, setCpf] = useState("");
  const [step, setStep] = useState<"input" | "payment">("input");
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(false);
  const [depositData, setDepositData] = useState<DepositData | null>(null);

  const minAmount = 30;

  const handleAmountChange = (value: string) => {
    const numericValue = value.replace(/[^\d.,]/g, '');
    setAmount(numericValue);
  };

  const getNumericAmount = () => {
    return parseFloat(amount.replace(',', '.')) || 0;
  };

  const formatCPF = (value: string) => {
    const numbers = value.replace(/\D/g, '');
    if (numbers.length <= 11) {
      return numbers
        .replace(/(\d{3})(\d)/, '$1.$2')
        .replace(/(\d{3})(\d)/, '$1.$2')
        .replace(/(\d{3})(\d{1,2})$/, '$1-$2');
    }
    return value;
  };

  const handleCPFChange = (value: string) => {
    setCpf(formatCPF(value));
  };

  const handleContinue = async () => {
    const numAmount = getNumericAmount();
    
    if (!amount || numAmount < minAmount) {
      toast({
        title: "Valor inválido",
        description: `O valor mínimo para depósito é R$ ${minAmount.toFixed(2)}`,
        variant: "destructive",
      });
      return;
    }

    if (!cpf || cpf.replace(/\D/g, '').length !== 11) {
      toast({
        title: "CPF inválido",
        description: "Por favor, informe um CPF válido.",
        variant: "destructive",
      });
      return;
    }

    try {
      setLoading(true);
      
      const response = await api.post('/deposits', {
        amount: numAmount,
        cpf: cpf.replace(/\D/g, '')
      });

      const data = response.data.data;

      let qrCodeBase64 = data.pix?.base64 || data.qrCode;
      if (qrCodeBase64 && !qrCodeBase64.startsWith('data:image')) {
        qrCodeBase64 = `data:image/png;base64,${qrCodeBase64}`;
      }
      
      const mappedData = {
        id: data.deposit_id,
        amount: data.amount,
        status: data.status,
        transaction_id: data.transactionId || data.provider_ref,
        qr_code: data.pix?.code || data.copia_cola,
        qr_code_base64: qrCodeBase64,
        qr_code_image: data.pix?.image,
        order_url: data.order?.url,
        expires_at: data.expires_at,
        created_at: data.created_at,
      };

      setDepositData(mappedData);
      setStep("payment");
      
      toast({
        title: "PIX gerado!",
        description: "Escaneie o QR Code ou copie o código para pagar.",
      });
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.response?.data?.error?.message || "Erro ao gerar PIX. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCopyPixCode = () => {
    if (!depositData?.qr_code) return;
    
    navigator.clipboard.writeText(depositData.qr_code);
    setCopied(true);
    toast({
      title: "Copiado!",
      description: "Código PIX copiado. Cole no seu app de pagamento.",
    });
    setTimeout(() => setCopied(false), 2000);
  };

  const handleCheckStatus = async () => {
    if (!depositData?.id) return;

    try {
      setChecking(true);
      
      const response = await api.post(`/deposits/${depositData.id}/check-status`);
      
      if (response.data.data.status === 'PAID') {
        toast({
          title: "Pagamento confirmado! 🎉",
          description: "Seu saldo foi atualizado.",
        });
        setTimeout(() => navigate("/profile"), 2000);
      } else {
        toast({
          title: "Aguardando pagamento",
          description: "Ainda não identificamos seu pagamento. Tente novamente em alguns instantes.",
        });
      }
    } catch (error: any) {
      toast({
        title: "Erro",
        description: "Erro ao verificar status. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setChecking(false);
    }
  };

  const quickAmounts = [30, 50, 100, 200, 500];

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-primary/5 to-background pb-20">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-border bg-background/95 backdrop-blur-lg">
        <div className="flex items-center gap-4 px-4 py-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => step === "payment" ? setStep("input") : navigate("/")}
            className="hover:bg-secondary"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex items-center gap-2">
            <div className="rounded-full bg-gradient-to-r from-primary to-accent p-2">
              <Wallet className="h-4 w-4 text-white" />
            </div>
            <h1 className="text-lg font-bold text-foreground">Recarregar Conta</h1>
          </div>
        </div>
      </header>

      <div className="container max-w-lg px-4 py-6">
        <AnimatePresence mode="wait">
          {step === "input" ? (
            <motion.div
              key="form"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-4"
            >
              {/* Banner Destaque */}
              <Card className="relative overflow-hidden border-0 bg-gradient-to-r from-primary via-accent to-primary p-6 text-white shadow-lg">
                <div className="absolute right-0 top-0 h-32 w-32 rounded-full bg-white/10 blur-3xl" />
                <div className="relative flex items-center gap-3">
                  <Sparkles className="h-8 w-8" />
                  <div>
                    <h2 className="text-lg font-bold">Deposite e Invista</h2>
                    <p className="text-sm opacity-90">Comece a lucrar hoje mesmo</p>
                  </div>
                </div>
              </Card>

              {/* Formulário */}
              <Card className="border-border bg-card p-6 shadow-sm">
                <div className="space-y-5">
                  {/* Valor */}
                  <div className="space-y-3">
                    <Label htmlFor="amount" className="text-base font-semibold text-foreground">
                      Quanto deseja depositar?
                    </Label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-lg font-bold text-primary">
                        R$
                      </span>
                      <Input
                        id="amount"
                        type="text"
                        placeholder="0,00"
                        value={amount}
                        onChange={(e) => handleAmountChange(e.target.value)}
                        className="pl-10 text-lg font-semibold border-2 border-border focus:border-primary h-12"
                      />
                    </div>
                    
                    {/* Valores Rápidos */}
                    <div className="grid grid-cols-5 gap-2">
                      {quickAmounts.map((value) => (
                        <Button
                          key={value}
                          variant="outline"
                          size="sm"
                          onClick={() => setAmount(value.toString())}
                          className={`${
                            getNumericAmount() === value 
                              ? 'bg-primary text-primary-foreground border-primary' 
                              : 'hover:bg-primary/10 hover:border-primary'
                          }`}
                        >
                          {value}
                        </Button>
                      ))}
                    </div>
                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                      <CheckCircle2 className="h-3 w-3" />
                      Mínimo: R$ {minAmount.toFixed(2)}
                    </p>
                  </div>

                  {/* CPF */}
                  <div className="space-y-2">
                    <Label htmlFor="cpf" className="text-base font-semibold text-foreground">
                      CPF do Titular
                    </Label>
                    <div className="relative">
                      <CreditCard className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="cpf"
                        type="text"
                        placeholder="000.000.000-00"
                        maxLength={14}
                        value={cpf}
                        onChange={(e) => handleCPFChange(e.target.value)}
                        className="pl-10 border-2 border-border focus:border-primary h-12"
                      />
                    </div>
                  </div>

                  {/* Botão Gerar PIX */}
                  <Button
                    onClick={handleContinue}
                    className="w-full bg-gradient-to-r from-primary to-accent text-white hover:opacity-90 shadow-lg"
                    size="lg"
                    disabled={!amount || getNumericAmount() < minAmount || !cpf || cpf.replace(/\D/g, '').length !== 11 || loading}
                  >
                    {loading ? (
                      <>
                        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                        Gerando PIX...
                      </>
                    ) : (
                      <>
                        <QrCode className="mr-2 h-5 w-5" />
                        Gerar QR Code PIX
                      </>
                    )}
                  </Button>
                </div>
              </Card>

              {/* Instruções */}
              <Card className="border-accent/30 bg-accent/5 p-4">
                <h3 className="mb-3 text-sm font-bold text-foreground flex items-center gap-2">
                  <div className="rounded-full bg-accent/20 p-1">
                    <CheckCircle2 className="h-4 w-4 text-accent" />
                  </div>
                  Como funciona?
                </h3>
                <ul className="space-y-2 text-xs text-muted-foreground">
                  <li className="flex items-start gap-2">
                    <span className="text-accent font-bold mt-0.5">1.</span>
                    <span>Escolha o valor e informe seu CPF</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-accent font-bold mt-0.5">2.</span>
                    <span>Será gerado um QR Code PIX instantâneo</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-accent font-bold mt-0.5">3.</span>
                    <span>Pague pelo app do seu banco</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-accent font-bold mt-0.5">4.</span>
                    <span>Saldo creditado automaticamente em até 2 minutos</span>
                  </li>
                </ul>
              </Card>
            </motion.div>
          ) : (
            <motion.div
              key="qrcode"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="space-y-4"
            >
              {/* Header do Pagamento */}
              <Card className="border-0 bg-gradient-to-r from-success/20 via-primary/20 to-accent/20 p-6 text-center">
                <div className="mb-3 flex justify-center">
                  <div className="rounded-full bg-success/20 p-3">
                    <QrCode className="h-8 w-8 text-success" />
                  </div>
                </div>
                <h2 className="text-xl font-bold text-foreground">
                  PIX Gerado!
                </h2>
                <p className="text-3xl font-bold text-primary mt-2">
                  R$ {depositData?.amount.toFixed(2)}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Escaneie o QR Code ou copie o código
                </p>
              </Card>

              {/* QR Code */}
              <Card className="border-border bg-card p-6 shadow-sm">
                {depositData?.qr_code_base64 || depositData?.qr_code_image ? (
                  <div className="flex justify-center rounded-xl bg-white p-6 shadow-inner">
                    <img 
                      src={depositData.qr_code_base64 || depositData.qr_code_image} 
                      alt="QR Code PIX" 
                      className="w-64 h-64 object-contain"
                    />
                  </div>
                ) : (
                  <div className="flex justify-center rounded-xl bg-muted/30 p-8 border-2 border-dashed border-border">
                    <div className="text-center">
                      <QrCode className="w-40 h-40 mx-auto text-muted-foreground/30 animate-pulse" />
                      <p className="text-xs text-muted-foreground mt-2">Gerando QR Code...</p>
                    </div>
                  </div>
                )}

                {/* Código Copia e Cola */}
                {depositData?.qr_code && (
                  <div className="mt-4 space-y-3">
                    <div className="rounded-lg bg-muted/50 p-3 border border-border">
                      <p className="mb-1 text-xs font-semibold text-foreground">
                        Código Copia e Cola:
                      </p>
                      <p className="break-all text-xs text-muted-foreground font-mono">
                        {depositData.qr_code.substring(0, 60)}...
                      </p>
                    </div>

                    <Button
                      onClick={handleCopyPixCode}
                      variant={copied ? "default" : "outline"}
                      className={`w-full ${copied ? 'bg-success hover:bg-success/90' : ''}`}
                      size="lg"
                    >
                      {copied ? (
                        <>
                          <CheckCircle2 className="mr-2 h-5 w-5" />
                          Copiado!
                        </>
                      ) : (
                        <>
                          <Copy className="mr-2 h-5 w-5" />
                          Copiar Código PIX
                        </>
                      )}
                    </Button>
                  </div>
                )}
              </Card>

              {/* Ações */}
              <div className="grid grid-cols-2 gap-3">
                <Button
                  onClick={handleCheckStatus}
                  variant="outline"
                  size="lg"
                  disabled={checking}
                  className="flex-1"
                >
                  {checking ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Verificando...
                    </>
                  ) : (
                    <>
                      <RefreshCw className="mr-2 h-4 w-4" />
                      Verificar
                    </>
                  )}
                </Button>

                <Button
                  onClick={() => {
                    setStep("input");
                    setDepositData(null);
                    setAmount("");
                    setCpf("");
                  }}
                  className="flex-1 bg-primary hover:bg-primary/90"
                  size="lg"
                >
                  Novo Depósito
                </Button>
              </div>

              {/* Próximos Passos */}
              <Card className="border-success/30 bg-success/5 p-4">
                <h3 className="mb-3 text-sm font-bold text-foreground flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-success" />
                  Próximos passos:
                </h3>
                <ol className="space-y-2 text-xs text-muted-foreground">
                  {['Abra o app do seu banco', 'Escolha pagar com PIX', 'Escaneie o QR Code ou cole o código', 'Confirme o pagamento', 'Aguarde a confirmação automática'].map((step, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <span className="rounded-full bg-success/20 text-success font-bold text-[10px] w-4 h-4 flex items-center justify-center mt-0.5">{i + 1}</span>
                      <span>{step}</span>
                    </li>
                  ))}
                </ol>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <BottomNavigation />
    </div>
  );
};

export default Deposit;
