import { ArrowLeft, Wallet, Copy, Check, QrCode } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

const Deposit = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [amount, setAmount] = useState("");
  const [cpf, setCpf] = useState("");
  const [step, setStep] = useState<"input" | "payment">("input");
  const [copied, setCopied] = useState(false);

  const minAmount = 50;
  
  // Mock PIX key
  const pixKey = "depositos@empresa.com.br";
  const pixCode = "00020126330014br.gov.bcb.pix0111123456789015204000053039865802BR5925EMPRESA LTDA6009SAO PAULO62070503***63041234";

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

  const handleContinue = () => {
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

    setStep("payment");
  };

  const handleCopyPixKey = () => {
    navigator.clipboard.writeText(pixKey);
    setCopied(true);
    toast({
      title: "Copiado!",
      description: "Chave PIX copiada para a área de transferência.",
    });
    setTimeout(() => setCopied(false), 2000);
  };

  const handleCopyPixCode = () => {
    navigator.clipboard.writeText(pixCode);
    toast({
      title: "Copiado!",
      description: "Código PIX copiado. Cole no seu app de pagamento.",
    });
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
              <div className="mt-4">
                <Label htmlFor="cpf" className="text-xs text-muted-foreground">CPF do Titular *</Label>
                <Input
                  id="cpf"
                  type="text"
                  placeholder="000.000.000-00"
                  value={cpf}
                  onChange={(e) => handleCPFChange(e.target.value)}
                  maxLength={14}
                  className="mt-1"
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
              disabled={!amount || getNumericAmount() < minAmount || !cpf || cpf.replace(/\D/g, '').length !== 11}
            >
              Continuar
            </Button>
          </>
        ) : (
          <>
            {/* Payment Screen */}
            <Card className="p-6">
              <div className="text-center mb-6">
                <p className="text-sm text-muted-foreground mb-2">Valor do depósito</p>
                <p className="text-4xl font-bold text-primary">R$ {getNumericAmount().toFixed(2)}</p>
              </div>

              <div className="space-y-4">
                {/* QR Code Placeholder */}
                <div className="bg-muted/30 rounded-xl p-8 flex items-center justify-center border-2 border-dashed border-border">
                  <div className="text-center">
                    <QrCode className="w-48 h-48 mx-auto text-muted-foreground/30" />
                    <p className="text-xs text-muted-foreground mt-2">QR Code PIX</p>
                  </div>
                </div>

                {/* PIX Instructions */}
                <div className="space-y-3">
                  <div>
                    <Label className="text-xs text-muted-foreground">Chave PIX:</Label>
                    <div className="flex items-center gap-2 mt-1">
                      <Input
                        value={pixKey}
                        readOnly
                        className="bg-muted"
                      />
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={handleCopyPixKey}
                        className="shrink-0"
                      >
                        {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                      </Button>
                    </div>
                  </div>

                  <Button
                    variant="default"
                    className="w-full"
                    onClick={handleCopyPixCode}
                  >
                    <Copy className="w-4 h-4 mr-2" />
                    Copiar Código PIX Copia e Cola
                  </Button>
                </div>
              </div>
            </Card>

            <Card className="p-4 mt-4 bg-yellow-50 border-yellow-200">
              <h3 className="font-semibold text-sm text-yellow-900 mb-2">📱 Como pagar</h3>
              <ol className="text-xs text-yellow-700 space-y-1.5 list-decimal list-inside">
                <li>Abra o app do seu banco</li>
                <li>Escolha pagar com PIX</li>
                <li>Escaneie o QR Code ou cole o código</li>
                <li>Confirme o pagamento de R$ {getNumericAmount().toFixed(2)}</li>
                <li>Aguarde a confirmação automática</li>
              </ol>
            </Card>

            <div className="flex gap-3 mt-6">
              <Button 
                variant="outline" 
                onClick={() => setStep("input")}
                className="flex-1"
              >
                Voltar
              </Button>
              <Button 
                onClick={() => {
                  toast({
                    title: "Aguardando pagamento",
                    description: "Assim que confirmarmos o pagamento, seu saldo será atualizado.",
                  });
                  setTimeout(() => navigate("/profile"), 2000);
                }}
                className="flex-1"
              >
                Já paguei
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default Deposit;
