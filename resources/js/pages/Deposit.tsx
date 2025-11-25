import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Copy, CheckCircle2, Loader2, RefreshCw, QrCode } from "lucide-react";
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
    // Remove non-numeric characters except comma and dot
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
        cpf: cpf.replace(/\D/g, '') // Remove formatação do CPF
      });

      const data = response.data.data;

      // Processar base64 - adicionar prefixo se necessário
      let qrCodeBase64 = data.pix?.base64 || data.qrCode;
      if (qrCodeBase64 && !qrCodeBase64.startsWith('data:image')) {
        qrCodeBase64 = `data:image/png;base64,${qrCodeBase64}`;
      }
      
      // Mapear resposta para o formato esperado
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
    <div className="min-h-screen bg-background pb-20">
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
          <h1 className="text-lg font-bold text-foreground">Recarregar Conta</h1>
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
            >
              <Card className="overflow-hidden border-border bg-card p-6 shadow-sm">
                <div className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="amount" className="text-foreground">
                      Valor do Depósito (R$)
                    </Label>
                    <Input
                      id="amount"
                      type="text"
                      placeholder="Ex: 50.00"
                      value={amount}
                      onChange={(e) => handleAmountChange(e.target.value)}
                      className="border-border bg-background"
                    />
                    <p className="text-xs text-muted-foreground">Valor mínimo: R$ {minAmount.toFixed(2)}</p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="cpf" className="text-foreground">
                      CPF do Titular
                    </Label>
                    <Input
                      id="cpf"
                      type="text"
                      placeholder="000.000.000-00"
                      maxLength={14}
                      value={cpf}
                      onChange={(e) => handleCPFChange(e.target.value)}
                      className="border-border bg-background"
                    />
                  </div>

                  <Button
                    onClick={handleContinue}
                    className="w-full bg-primary text-primary-foreground hover:bg-primary/90"
                    size="lg"
                    disabled={!amount || getNumericAmount() < minAmount || !cpf || cpf.replace(/\D/g, '').length !== 11 || loading}
                  >
                    {loading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Gerando PIX...
                      </>
                    ) : (
                      'Gerar QR Code PIX'
                    )}
                  </Button>
                </div>
              </Card>

              <Card className="mt-4 border-warning/30 bg-warning/10 p-4">
                <h3 className="mb-2 text-sm font-semibold text-foreground">
                  Instruções:
                </h3>
                <ul className="space-y-1 text-xs text-muted-foreground">
                  <li>• Digite o valor que deseja depositar</li>
                  <li>• Informe seu CPF para identificação</li>
                  <li>• Será gerado um QR Code PIX para pagamento</li>
                  <li>• O saldo é creditado em até 2 minutos</li>
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
              <Card className="overflow-hidden border-border bg-card p-6 shadow-sm">
                <div className="mb-4 text-center">
                  <h2 className="text-lg font-bold text-foreground">
                    Escaneie o QR Code
                  </h2>
                  <p className="text-sm text-muted-foreground">
                    Valor: R$ {depositData?.amount.toFixed(2)}
                  </p>
                </div>

                {depositData?.qr_code_base64 || depositData?.qr_code_image ? (
                  <div className="flex justify-center rounded-lg bg-white p-4">
                    <img 
                      src={depositData.qr_code_base64 || depositData.qr_code_image} 
                      alt="QR Code PIX" 
                      className="w-56 h-56 object-contain"
                    />
                  </div>
                ) : (
                  <div className="flex justify-center rounded-lg bg-muted/30 p-8 border-2 border-dashed border-border">
                    <div className="text-center">
                      <QrCode className="w-40 h-40 mx-auto text-muted-foreground/30" />
                      <p className="text-xs text-muted-foreground mt-2">Gerando QR Code...</p>
                    </div>
                  </div>
                )}

                <div className="mt-6 space-y-3">
                  {depositData?.qr_code && (
                    <>
                      <div className="rounded-lg bg-muted p-3">
                        <p className="mb-1 text-xs font-semibold text-foreground">
                          Chave PIX Copia e Cola:
                        </p>
                        <p className="break-all text-xs text-muted-foreground">
                          {depositData.qr_code.substring(0, 50)}...
                        </p>
                      </div>

                      <Button
                        onClick={handleCopyPixCode}
                        variant="outline"
                        className="w-full"
                        size="lg"
                      >
                        {copied ? (
                          <>
                            <CheckCircle2 className="mr-2 h-4 w-4 text-success" />
                            Copiado!
                          </>
                        ) : (
                          <>
                            <Copy className="mr-2 h-4 w-4" />
                            Copiar Chave PIX
                          </>
                        )}
                      </Button>
                    </>
                  )}

                  <Button
                    onClick={handleCheckStatus}
                    className="w-full"
                    disabled={checking}
                  >
                    {checking ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Verificando...
                      </>
                    ) : (
                      <>
                        <RefreshCw className="mr-2 h-4 w-4" />
                        Verificar Pagamento
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
                    variant="ghost"
                    className="w-full"
                  >
                    Fazer Novo Depósito
                  </Button>
                </div>
              </Card>

              <Card className="border-success/30 bg-success/10 p-4">
                <h3 className="mb-2 text-sm font-semibold text-foreground">
                  Próximos passos:
                </h3>
                <ol className="space-y-1 text-xs text-muted-foreground">
                  <li>1. Abra o app do seu banco</li>
                  <li>2. Escolha pagar com PIX</li>
                  <li>3. Escaneie o QR Code ou cole a chave</li>
                  <li>4. Confirme o pagamento</li>
                  <li>5. Seu saldo será creditado automaticamente</li>
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
