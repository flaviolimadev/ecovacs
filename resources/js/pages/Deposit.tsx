import { ArrowLeft, Wallet, Copy, Check, QrCode, Loader2, RefreshCw } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
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

  const minAmount = 50;

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
      
      const response = await api.post('/v1/deposits', {
        amount: numAmount,
        cpf: cpf.replace(/\D/g, '') // Remove formatação do CPF
      });

      const data = response.data.data;
      
      // Mapear resposta para o formato esperado
      setDepositData({
        id: data.deposit_id,
        amount: data.amount,
        status: data.status,
        transaction_id: data.transactionId || data.provider_ref,
        qr_code: data.pix?.code || data.copia_cola,
        qr_code_base64: data.pix?.base64 || data.qrCode,
        qr_code_image: data.pix?.image,
        order_url: data.order?.url,
        expires_at: data.expires_at,
        created_at: data.created_at,
      });
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
      
      const response = await api.post(`/v1/deposits/${depositData.id}/check-status`);
      
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

  const quickAmounts = [50, 100, 200, 500, 1000];

  return (
    <div className="relative min-h-screen bg-background pb-8">
      {/* Header */}
      <div className="bg-primary text-primary-foreground p-6 rounded-b-3xl">
        <div className="flex items-center justify-between mb-4">
          <button 
            onClick={() => step === "payment" ? setStep("input") : navigate("/profile")} 
            className="p-2 hover:bg-white/10 rounded-full transition-colors"
          >
            <ArrowLeft className="w-6 h-6" />
          </button>
          <h1 className="text-xl font-semibold flex-1 text-center">Depositar</h1>
          <div className="w-10"></div>
        </div>
        <div className="flex justify-center">
          <div className="bg-white/20 p-4 rounded-full">
            <Wallet className="w-8 h-8" />
          </div>
        </div>
      </div>

      <div className="px-4 mt-6">
        {step === "input" ? (
          <>
            {/* Amount Input */}
            <Card className="p-6">
              <div className="text-center mb-6">
                <Label className="text-sm text-muted-foreground">Quanto deseja depositar?</Label>
                <div className="relative mt-3">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-2xl font-bold text-muted-foreground">
                    R$
                  </span>
                  <Input
                    type="text"
                    placeholder="0,00"
                    value={amount}
                    onChange={(e) => handleAmountChange(e.target.value)}
                    className="text-3xl font-bold text-center h-16 pl-16"
                  />
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  Valor mínimo: R$ {minAmount.toFixed(2)}
                </p>
              </div>

              {/* Quick Amount Buttons */}
              <div className="space-y-3">
                <Label className="text-xs text-muted-foreground">Valores rápidos:</Label>
                <div className="grid grid-cols-3 gap-2">
                  {quickAmounts.map((value) => (
                    <Button
                      key={value}
                      variant="outline"
                      size="sm"
                      onClick={() => setAmount(value.toString())}
                      className="h-12"
                    >
                      R$ {value}
                    </Button>
                  ))}
                </div>
              </div>

              {/* CPF Input */}
              <div className="mt-6">
                <Label htmlFor="cpf" className="text-sm text-muted-foreground">CPF do Titular *</Label>
                <Input
                  id="cpf"
                  type="text"
                  placeholder="000.000.000-00"
                  value={cpf}
                  onChange={(e) => handleCPFChange(e.target.value)}
                  maxLength={14}
                  className="mt-1 h-12"
                />
              </div>
            </Card>

            {/* Info Card */}
            <Card className="p-4 mt-4 bg-blue-50 border-blue-200">
              <h3 className="font-semibold text-sm text-blue-900 mb-2">ℹ️ Informações Importantes</h3>
              <ul className="text-xs text-blue-700 space-y-1">
                <li>• Depósitos via PIX são confirmados em até 5 minutos</li>
                <li>• Valor mínimo de depósito: R$ {minAmount.toFixed(2)}</li>
                <li>• O saldo é creditado automaticamente após confirmação</li>
                <li>• Em caso de dúvidas, entre em contato com o suporte</li>
              </ul>
            </Card>

            <Button 
              onClick={handleContinue} 
              className="w-full mt-6 h-12 text-base"
              disabled={!amount || getNumericAmount() < minAmount || !cpf || cpf.replace(/\D/g, '').length !== 11 || loading}
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Gerando PIX...
                </>
              ) : (
                'Continuar'
              )}
            </Button>
          </>
        ) : (
          <>
            {/* Payment Screen */}
            <Card className="p-6">
              <div className="text-center mb-6">
                <p className="text-sm text-muted-foreground mb-2">Valor do depósito</p>
                <p className="text-4xl font-bold text-primary">R$ {depositData?.amount.toFixed(2)}</p>
              </div>

              <div className="space-y-4">
                {/* QR Code */}
                {depositData?.qr_code_base64 ? (
                  <div className="bg-white rounded-xl p-4 flex items-center justify-center border-2 border-border">
                    <img 
                      src={depositData.qr_code_base64} 
                      alt="QR Code PIX" 
                      className="w-64 h-64"
                    />
                  </div>
                ) : depositData?.qr_code_image ? (
                  <div className="bg-white rounded-xl p-4 flex items-center justify-center border-2 border-border">
                    <img 
                      src={depositData.qr_code_image} 
                      alt="QR Code PIX" 
                      className="w-64 h-64"
                    />
                  </div>
                ) : (
                  <div className="bg-muted/30 rounded-xl p-8 flex items-center justify-center border-2 border-dashed border-border">
                    <div className="text-center">
                      <QrCode className="w-48 h-48 mx-auto text-muted-foreground/30" />
                      <p className="text-xs text-muted-foreground mt-2">QR Code não disponível</p>
                    </div>
                  </div>
                )}

                {/* PIX Copia e Cola */}
                {depositData?.qr_code && (
                  <div className="space-y-2">
                    <Label className="text-xs text-muted-foreground">ou copie o código:</Label>
                    <Button
                      variant="default"
                      className="w-full"
                      onClick={handleCopyPixCode}
                    >
                      {copied ? <Check className="w-4 h-4 mr-2" /> : <Copy className="w-4 h-4 mr-2" />}
                      {copied ? 'Código Copiado!' : 'Copiar Código PIX'}
                    </Button>
                  </div>
                )}
              </div>
            </Card>

            <Card className="p-4 mt-4 bg-yellow-50 border-yellow-200">
              <h3 className="font-semibold text-sm text-yellow-900 mb-2">📱 Como pagar</h3>
              <ol className="text-xs text-yellow-700 space-y-1.5 list-decimal list-inside">
                <li>Abra o app do seu banco</li>
                <li>Escolha pagar com PIX</li>
                <li>Escaneie o QR Code ou cole o código</li>
                <li>Confirme o pagamento de R$ {depositData?.amount.toFixed(2)}</li>
                <li>Clique em "Verificar Pagamento" após pagar</li>
              </ol>
            </Card>

            <div className="flex flex-col gap-3 mt-6">
              <Button 
                onClick={handleCheckStatus}
                className="w-full h-12"
                disabled={checking}
              >
                {checking ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Verificando...
                  </>
                ) : (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Verificar Pagamento
                  </>
                )}
              </Button>
              
              <Button 
                variant="outline" 
                onClick={() => {
                  setStep("input");
                  setDepositData(null);
                  setAmount("");
                  setCpf("");
                }}
                className="w-full"
              >
                Voltar
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default Deposit;
