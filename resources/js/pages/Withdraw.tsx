import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, AlertTriangle, CheckCircle2, Clock, TrendingDown, Loader2, Wallet, Shield, Zap } from "lucide-react";
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

  const quickAmounts = [30, 50, 100, 200, Math.min(500, availableBalance)].filter(v => v <= availableBalance);

  const isWithdrawTimeValid = () => {
    const now = new Date();
    const hour = now.getHours();
    return hour >= 10 && hour < 17;
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-success/5 to-background pb-20">
      {/* Header */}
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
          <div className="flex items-center gap-2">
            <div className="rounded-full bg-gradient-to-r from-success to-primary p-2">
              <TrendingDown className="h-4 w-4 text-white" />
            </div>
            <h1 className="text-lg font-bold text-foreground">Solicitar Saque</h1>
          </div>
        </div>
      </header>

      <div className="container max-w-lg px-4 py-6">
        {loadingSettings ? (
          <Card className="p-8 text-center border-0 shadow-lg">
            <Loader2 className="w-10 h-10 animate-spin mx-auto text-primary" />
            <p className="text-sm text-muted-foreground mt-3">Carregando...</p>
          </Card>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-4"
          >
            {step === "input" ? (
              <>
                {/* Banner Saldo */}
                <Card className="relative overflow-hidden border-0 bg-gradient-to-r from-success via-primary to-success p-6 text-white shadow-xl">
                  <div className="absolute right-0 top-0 h-32 w-32 rounded-full bg-white/10 blur-3xl" />
                  <div className="relative">
                    <div className="flex items-center gap-2 mb-2">
                      <Wallet className="h-5 w-5" />
                      <span className="text-sm font-medium opacity-90">Saldo Disponível</span>
                    </div>
                    <p className="text-4xl font-bold">
                      R$ {availableBalance.toFixed(2)}
                    </p>
                  </div>
                </Card>

                {/* Regras e Limites */}
                <Card className="border-warning/40 bg-gradient-to-r from-warning/10 to-accent/10 p-4">
                  <div className="flex items-start gap-3">
                    <div className="rounded-full bg-warning/20 p-2 mt-0.5">
                      <Shield className="h-4 w-4 text-warning" />
                    </div>
                    <div className="space-y-2 text-xs text-foreground flex-1">
                      <div className="grid grid-cols-2 gap-2">
                        <div className="flex items-center gap-1.5">
                          <div className="w-1.5 h-1.5 rounded-full bg-success" />
                          <span>Mín: R$ {minAmount.toFixed(2)}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <div className="w-1.5 h-1.5 rounded-full bg-warning" />
                          <span>Taxa: {(fee * 100).toFixed(0)}%</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                          <span>1 saque/dia</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <div className="w-1.5 h-1.5 rounded-full bg-accent" />
                          <span>10h às 17h</span>
                        </div>
                      </div>
                      <p className="text-xs text-muted-foreground pt-1 border-t border-warning/20">
                        💰 Disponível todos os dias da semana
                      </p>
                      {!canWithdraw && (
                        <p className="text-xs text-destructive font-semibold pt-1 flex items-center gap-1">
                          <AlertTriangle className="h-3 w-3" />
                          {settings?.validation_message}
                        </p>
                      )}
                    </div>
                  </div>
                </Card>

                {!isWithdrawTimeValid() && (
                  <Card className="border-destructive/40 bg-destructive/10 p-3">
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-destructive" />
                      <p className="text-xs text-destructive font-medium">
                        Saque temporariamente indisponível (horário: 10h - 17h)
                      </p>
                    </div>
                  </Card>
                )}

                {/* Formulário */}
                <Card className="border-border bg-card p-6 shadow-sm" translate="no">
                  <div className="space-y-5 notranslate">
                    {/* Valor do Saque */}
                    <div className="space-y-3">
                      <Label htmlFor="amount" className="text-base font-semibold text-foreground">
                        Quanto deseja sacar?
                      </Label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-lg font-bold text-success">
                          R$
                        </span>
                        <Input
                          id="amount"
                          type="text"
                          placeholder="0,00"
                          value={amount}
                          onChange={(e) => handleAmountChange(e.target.value)}
                          className="pl-10 text-lg font-semibold border-2 border-border focus:border-success h-12 notranslate"
                          translate="no"
                          autoComplete="off"
                          disabled={!canWithdraw}
                        />
                      </div>

                      {/* Valores Rápidos */}
                      {quickAmounts.length > 0 && (
                        <div className="flex gap-2 flex-wrap">
                          {quickAmounts.map((value) => (
                            <Button
                              key={value}
                              variant="outline"
                              size="sm"
                              onClick={() => setAmount(value.toString())}
                              disabled={!canWithdraw}
                              className={`${
                                getNumericAmount() === value 
                                  ? 'bg-success text-white border-success' 
                                  : 'hover:bg-success/10 hover:border-success'
                              }`}
                            >
                              {value}
                            </Button>
                          ))}
                        </div>
                      )}

                      {/* Cálculo da Taxa */}
                      {amount && getNumericAmount() >= minAmount && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: "auto" }}
                          className="rounded-xl bg-gradient-to-r from-success/5 to-primary/5 p-4 space-y-2 text-sm border border-success/20"
                        >
                          <div className="flex justify-between items-center">
                            <span className="text-muted-foreground">Valor solicitado:</span>
                            <span className="font-semibold">R$ {getNumericAmount().toFixed(2)}</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-muted-foreground">Taxa ({(fee * 100).toFixed(0)}%):</span>
                            <span className="text-warning font-semibold">- R$ {calculateFee().toFixed(2)}</span>
                          </div>
                          <div className="flex justify-between items-center border-t border-success/20 pt-2 mt-2">
                            <span className="font-bold text-foreground">Você receberá:</span>
                            <span className="font-bold text-success text-lg">R$ {calculateNetAmount().toFixed(2)}</span>
                          </div>
                        </motion.div>
                      )}
                    </div>

                    {/* CPF */}
                    <div className="space-y-2">
                      <Label htmlFor="cpf" className="text-base font-semibold text-foreground">
                        CPF do Titular
                      </Label>
                      <Input
                        id="cpf"
                        type="text"
                        placeholder="000.000.000-00"
                        maxLength={14}
                        value={cpf}
                        onChange={(e) => handleCpfChange(e.target.value)}
                        className="border-2 border-border focus:border-success h-11 notranslate"
                        translate="no"
                        autoComplete="off"
                        disabled={!canWithdraw}
                      />
                    </div>

                    {/* Tipo de Chave PIX */}
                    <div className="space-y-2">
                      <Label htmlFor="pixType" className="text-base font-semibold text-foreground">
                        Tipo de Chave PIX
                      </Label>
                      <select
                        id="pixType"
                        value={pixKeyType}
                        onChange={(e) => {
                          setPixKeyType(e.target.value as typeof pixKeyType);
                          setPixKey("");
                        }}
                        className="flex h-11 w-full rounded-md border-2 border-border bg-background px-3 py-2 text-sm focus:border-success focus:outline-none notranslate"
                        translate="no"
                        disabled={!canWithdraw}
                      >
                        <option value="cpf">CPF</option>
                        <option value="email">E-mail</option>
                        <option value="phone">Telefone</option>
                        <option value="random">Chave Aleatória</option>
                      </select>
                    </div>

                    {/* Chave PIX */}
                    <div className="space-y-2">
                      <Label htmlFor="pixKey" className="text-base font-semibold text-foreground">
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
                        className="border-2 border-border focus:border-success h-11 notranslate"
                        translate="no"
                        autoComplete="off"
                        disabled={!canWithdraw}
                      />
                    </div>

                    {/* Botão Continuar */}
                    <Button
                      onClick={handleContinue}
                      className="w-full bg-gradient-to-r from-success to-primary text-white hover:opacity-90 shadow-lg mt-2"
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
                      <Zap className="mr-2 h-5 w-5" />
                      Solicitar Saque
                    </Button>
                  </div>
                </Card>
              </>
            ) : (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="space-y-4"
              >
                {/* Confirmação */}
                <Card className="relative overflow-hidden border-0 bg-gradient-to-br from-success/10 via-primary/10 to-accent/10 p-8 text-center shadow-xl notranslate" translate="no">
                  <div className="absolute inset-0 bg-grid-white/5 [mask-image:radial-gradient(white,transparent_85%)]" />
                  
                  <div className="relative">
                    <div className="mb-4 flex justify-center">
                      <div className="rounded-full bg-gradient-to-r from-success to-primary p-4 shadow-lg">
                        <CheckCircle2 className="h-12 w-12 text-white" />
                      </div>
                    </div>
                    
                    <h2 className="mb-2 text-2xl font-bold text-foreground">
                      Confirme os Dados
                    </h2>
                    
                    <p className="mb-6 text-sm text-muted-foreground">
                      Verifique cuidadosamente antes de confirmar
                    </p>

                    {/* Detalhes */}
                    <div className="rounded-xl bg-card/80 backdrop-blur-sm p-5 space-y-3 text-sm border border-border shadow-inner">
                      <div className="flex justify-between items-center pb-2 border-b border-border">
                        <span className="text-muted-foreground font-medium">Valor líquido:</span>
                        <span className="font-bold text-success text-xl">
                          R$ {calculateNetAmount().toFixed(2)}
                        </span>
                      </div>
                      <div className="flex justify-between items-start">
                        <span className="text-muted-foreground font-medium">Chave PIX:</span>
                        <span className="font-semibold text-foreground break-all text-right ml-2 max-w-[60%]">
                          {pixKey}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-muted-foreground font-medium">Tipo:</span>
                        <span className="font-semibold text-foreground uppercase text-xs bg-primary/10 px-2 py-1 rounded">
                          {pixKeyType}
                        </span>
                      </div>
                      <div className="flex justify-between items-center pt-2 border-t border-border">
                        <span className="text-muted-foreground font-medium">Prazo:</span>
                        <span className="font-semibold text-primary">Até 24 horas</span>
                      </div>
                    </div>

                    {/* Botões */}
                    <div className="flex gap-3 mt-6">
                      <Button
                        onClick={() => setStep("input")}
                        variant="outline"
                        className="flex-1"
                        size="lg"
                        disabled={loading}
                      >
                        Voltar
                      </Button>
                      <Button
                        onClick={handleConfirmWithdraw}
                        className="flex-1 bg-gradient-to-r from-success to-primary text-white hover:opacity-90 shadow-lg"
                        size="lg"
                        disabled={loading}
                      >
                        {loading ? (
                          <>
                            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                            Processando...
                          </>
                        ) : (
                          <>
                            <CheckCircle2 className="mr-2 h-5 w-5" />
                            Confirmar Saque
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                </Card>

                {/* Informações Adicionais */}
                <Card className="border-primary/30 bg-primary/5 p-4">
                  <h3 className="mb-3 text-sm font-bold text-foreground flex items-center gap-2">
                    <Zap className="h-4 w-4 text-primary" />
                    Informações importantes:
                  </h3>
                  <ul className="space-y-2 text-xs text-muted-foreground">
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="h-3 w-3 text-success mt-0.5 flex-shrink-0" />
                      <span>Processamento em até 24 horas úteis</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="h-3 w-3 text-success mt-0.5 flex-shrink-0" />
                      <span>Você receberá notificação quando o saque for aprovado</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="h-3 w-3 text-success mt-0.5 flex-shrink-0" />
                      <span>Verifique se a chave PIX está correta</span>
                    </li>
                  </ul>
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
