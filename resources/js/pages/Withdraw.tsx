import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, AlertCircle, CheckCircle2, Clock, TrendingDown, Loader2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import BottomNavigation from "@/components/BottomNavigation";
import { useAuth } from "@/contexts/AuthContext";
import api from "@/lib/api";

const Withdraw = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  const [amount, setAmount] = useState("");
  const [cpf, setCpf] = useState("");
  const [pixKey, setPixKey] = useState("");
  const [pixKeyType, setPixKeyType] = useState<"cpf" | "email" | "phone" | "random">("cpf");
  const [step, setStep] = useState<"input" | "confirmation">("input");
  const [loading, setLoading] = useState(false);
  const [settings, setSettings] = useState<any>(null);
  const [loadingSettings, setLoadingSettings] = useState(true);

  const minAmount = settings?.min_amount || 30;
  const fee = settings?.fee_percent || 0.10;
  const availableBalance = user?.balance_withdrawn || 0;
  const hasWithdrawnToday = settings?.has_withdrawn_today || false;
  const canWithdraw = settings?.can_withdraw || false;

  // Carregar configurações de saque
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const response = await api.get('/withdrawals/settings');
        setSettings(response.data.data);
      } catch (error) {

        toast({
          title: "Erro",
          description: "Não foi possível carregar as configurações de saque",
          variant: "destructive",
        });
      } finally {
        setLoadingSettings(false);
      }
    };

    fetchSettings();
  }, []);

  const handleAmountChange = (value: string) => {
    const numericValue = value.replace(/[^\d.,]/g, '');
    setAmount(numericValue);
  };

  const getNumericAmount = () => {
    return parseFloat(amount.replace(',', '.')) || 0;
  };

  const calculateFee = () => {
    return getNumericAmount() * fee;
  };

  const calculateNetAmount = () => {
    return getNumericAmount() - calculateFee();
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

  const formatPixKey = (value: string, type: string) => {
    if (type === "cpf") {
      return formatCPF(value);
    } else if (type === "phone") {
      const numbers = value.replace(/\D/g, '');
      if (numbers.length <= 11) {
        return numbers
          .replace(/(\d{2})(\d)/, '($1) $2')
          .replace(/(\d{5})(\d)/, '$1-$2');
      }
      return value;
    }
    return value;
  };

  const handleCpfChange = (value: string) => {
    setCpf(formatCPF(value));
  };

  const handlePixKeyChange = (value: string) => {
    setPixKey(formatPixKey(value, pixKeyType));
  };

  const validateCPF = () => {
    return cpf.replace(/\D/g, '').length === 11;
  };

  const validatePixKey = () => {
    if (!pixKey) return false;
    
    switch (pixKeyType) {
      case "cpf":
        return pixKey.replace(/\D/g, '').length === 11;
      case "phone":
        return pixKey.replace(/\D/g, '').length >= 10;
      case "email":
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(pixKey);
      case "random":
        return pixKey.length >= 32;
      default:
        return false;
    }
  };

  const handleContinue = () => {
    const numAmount = getNumericAmount();
    
    if (!canWithdraw) {
      toast({
        title: "Saque não disponível",
        description: settings?.validation_message || "Saques não disponíveis no momento.",
        variant: "destructive",
      });
      return;
    }

    if (hasWithdrawnToday) {
      toast({
        title: "Limite atingido",
        description: "Você já realizou um saque hoje. Tente novamente amanhã.",
        variant: "destructive",
      });
      return;
    }

    if (!amount || numAmount < minAmount) {
      toast({
        title: "Valor inválido",
        description: `O valor mínimo para saque é R$ ${minAmount.toFixed(2)}`,
        variant: "destructive",
      });
      return;
    }

    if (numAmount > availableBalance) {
      toast({
        title: "Saldo insuficiente",
        description: "Você não tem saldo disponível para este saque.",
        variant: "destructive",
      });
      return;
    }

    if (!validateCPF()) {
      toast({
        title: "CPF inválido",
        description: "Por favor, informe um CPF válido.",
        variant: "destructive",
      });
      return;
    }

    if (!validatePixKey()) {
      toast({
        title: "Chave PIX inválida",
        description: "Por favor, informe uma chave PIX válida.",
        variant: "destructive",
      });
      return;
    }

    setStep("confirmation");
  };

  const handleConfirmWithdraw = async () => {
    try {
      setLoading(true);
      
      const response = await api.post('/withdrawals', {
        amount: getNumericAmount(),
        cpf: cpf.replace(/\D/g, ''),
        pix_key: pixKey,
        pix_key_type: pixKeyType,
      });

      toast({
        title: "Saque solicitado!",
        description: response.data.data.message || "Seu saque será processado em breve.",
      });
      
      setTimeout(() => navigate("/profile"), 2000);
    } catch (error: any) {

      toast({
        title: "Erro ao processar saque",
        description: error.response?.data?.error?.message || "Tente novamente mais tarde.",
        variant: "destructive",
      });
      setLoading(false);
    }
  };

  const quickAmounts = [30, 50, 100, 200, 500];

  const isWithdrawTimeValid = () => {
    const now = new Date();
    const hour = now.getHours();
    return hour >= 10 && hour < 17;
  };

  return (
    <div className="min-h-screen bg-background pb-20">
      <header className="sticky top-0 z-40 border-b border-border bg-background/95 backdrop-blur-lg">
        <div className="flex items-center gap-4 px-4 py-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => step === "confirmation" ? setStep("input") : navigate("/")}
            className="hover:bg-secondary"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-lg font-bold text-foreground">Solicitar Saque</h1>
        </div>
      </header>

      <div className="container max-w-lg px-4 py-6">
        {loadingSettings ? (
          <Card className="p-6 text-center">
            <Loader2 className="w-8 h-8 animate-spin mx-auto text-primary" />
            <p className="text-sm text-muted-foreground mt-2">Carregando...</p>
          </Card>
        ) : (

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-4"
          >
            <Card className="border-success/30 bg-success/10 p-4">
              <div className="flex items-start gap-3">
                <CheckCircle2 className="h-5 w-5 text-success mt-0.5" />
                <div>
                  <h3 className="text-sm font-semibold text-foreground mb-1">
                    Saldo Disponível
                  </h3>
                  <p className="text-2xl font-bold text-success">
                    R$ {availableBalance.toFixed(2)}
                  </p>
                </div>
              </div>
            </Card>

            <Card className="border-warning/30 bg-warning/10 p-4">
              <div className="flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-warning mt-0.5" />
                <div className="space-y-1 text-xs text-foreground">
                  <p>• Valor mínimo: R$ {minAmount.toFixed(2)}</p>
                  <p>• Taxa de saque: {(fee * 100).toFixed(0)}%</p>
                  <p>• Limite: 1 saque por dia</p>
                  {!canWithdraw && <p>• {settings?.validation_message}</p>}
                </div>
              </div>
            </Card>

            {!isWithdrawTimeValid() && (
              <Card className="border-destructive/30 bg-destructive/10 p-3">
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-destructive" />
                  <p className="text-xs text-destructive font-medium">
                    Saque temporariamente indisponível
                  </p>
                </div>
              </Card>
            )}

            {step === "input" ? (
              <>
                <Card className="overflow-hidden border-border bg-card p-6 shadow-sm">
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="amount" className="text-foreground">
                        Valor do Saque (R$)
                      </Label>
                      <Input
                        id="amount"
                        type="text"
                        placeholder="Ex: 50.00"
                        value={amount}
                        onChange={(e) => handleAmountChange(e.target.value)}
                        className="border-border bg-background"
                        disabled={!canWithdraw}
                      />
                      
                      {amount && getNumericAmount() >= minAmount && (
                        <div className="rounded-lg bg-muted p-3 space-y-1 text-sm">
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Valor bruto:</span>
                            <span className="font-semibold">R$ {getNumericAmount().toFixed(2)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Taxa ({(fee * 100).toFixed(0)}%):</span>
                            <span className="text-destructive">- R$ {calculateFee().toFixed(2)}</span>
                          </div>
                          <div className="flex justify-between border-t border-border pt-1 mt-1">
                            <span className="font-semibold">Você receberá:</span>
                            <span className="font-bold text-success">R$ {calculateNetAmount().toFixed(2)}</span>
                          </div>
                        </div>
                      )}
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
                        onChange={(e) => handleCpfChange(e.target.value)}
                        className="border-border bg-background"
                        disabled={!canWithdraw}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="pixType" className="text-foreground">
                        Tipo de Chave PIX
                      </Label>
                      <select
                        id="pixType"
                        value={pixKeyType}
                        onChange={(e) => {
                          setPixKeyType(e.target.value as typeof pixKeyType);
                          setPixKey("");
                        }}
                        className="flex h-10 w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
                        disabled={!canWithdraw}
                      >
                        <option value="cpf">CPF</option>
                        <option value="email">E-mail</option>
                        <option value="phone">Telefone</option>
                        <option value="random">Chave Aleatória</option>
                      </select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="pixKey" className="text-foreground">
                        Chave PIX
                      </Label>
                      <Input
                        id="pixKey"
                        type="text"
                        placeholder={
                          pixKeyType === "cpf" ? "000.000.000-00" :
                          pixKeyType === "email" ? "email@exemplo.com" :
                          pixKeyType === "phone" ? "(00) 00000-0000" :
                          "Chave aleatória"
                        }
                        value={pixKey}
                        onChange={(e) => handlePixKeyChange(e.target.value)}
                        maxLength={pixKeyType === "cpf" ? 14 : pixKeyType === "phone" ? 15 : undefined}
                        className="border-border bg-background"
                        disabled={!canWithdraw}
                      />
                      <p className="text-xs text-muted-foreground">
                        Digite a chave conforme o tipo selecionado
                      </p>
                    </div>

                    <Button
                      onClick={handleContinue}
                      className="w-full bg-success text-success-foreground hover:bg-success/90"
                      size="lg"
                      disabled={
                        !canWithdraw || 
                        !isWithdrawTimeValid() ||
                        !amount || 
                        getNumericAmount() < minAmount || 
                        getNumericAmount() > availableBalance ||
                        !validateCPF() ||
                        !validatePixKey()
                      }
                    >
                      <TrendingDown className="mr-2 h-4 w-4" />
                      Solicitar Saque
                    </Button>
                  </div>
                </Card>
              </>
            ) : (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="space-y-4"
              >
                <Card className="border-success/30 bg-card p-6 text-center">
                  <div className="mb-4 flex justify-center">
                    <div className="rounded-full bg-success/20 p-4">
                      <CheckCircle2 className="h-12 w-12 text-success" />
                    </div>
                  </div>
                  
                  <h2 className="mb-2 text-xl font-bold text-foreground">
                    Confirme os Dados
                  </h2>
                  
                  <p className="mb-4 text-sm text-muted-foreground">
                    Verifique cuidadosamente antes de confirmar
                  </p>

                  <div className="rounded-lg bg-muted p-4 space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Valor líquido:</span>
                      <span className="font-bold text-success">
                        R$ {calculateNetAmount().toFixed(2)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Chave PIX:</span>
                      <span className="font-semibold break-all text-right ml-2">{pixKey}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Prazo:</span>
                      <span className="font-semibold">Até 24 horas</span>
                    </div>
                  </div>

                  <div className="flex gap-3 mt-6">
                    <Button
                      onClick={() => setStep("input")}
                      variant="outline"
                      className="flex-1"
                      disabled={loading}
                    >
                      Voltar
                    </Button>
                    <Button
                      onClick={handleConfirmWithdraw}
                      className="flex-1 bg-success text-success-foreground hover:bg-success/90"
                      disabled={loading}
                    >
                      {loading ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Processando...
                        </>
                      ) : (
                        'Confirmar Saque'
                      )}
                    </Button>
                  </div>
                </Card>
              </motion.div>
            )}
          </motion.div>
        )}
      </div>

      <BottomNavigation />
    </div>
  );
};

export default Withdraw;
