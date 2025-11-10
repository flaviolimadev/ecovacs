import { ArrowLeft, Wallet, AlertCircle, Info, Copy, Check, Loader2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Alert, AlertDescription } from "@/components/ui/alert";
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

  const minAmount = settings?.min_amount || 50;
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
        console.error('Erro ao carregar configurações de saque:', error);
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
      console.error('Erro ao processar saque:', error);
      toast({
        title: "Erro ao processar saque",
        description: error.response?.data?.error?.message || "Tente novamente mais tarde.",
        variant: "destructive",
      });
      setLoading(false);
    }
  };

  const quickAmounts = [50, 100, 200, 500, 1000];

  return (
    <div className="relative min-h-screen bg-background pb-8">
      {/* Header */}
      <div className="bg-primary text-primary-foreground p-6 rounded-b-3xl">
        <div className="flex items-center justify-between mb-4">
          <button 
            onClick={() => step === "confirmation" ? setStep("input") : navigate("/profile")} 
            className="p-2 hover:bg-white/10 rounded-full transition-colors"
          >
            <ArrowLeft className="w-6 h-6" />
          </button>
          <h1 className="text-xl font-semibold flex-1 text-center">Sacar</h1>
          <div className="w-10"></div>
        </div>
        <div className="flex justify-center">
          <div className="bg-white/20 p-4 rounded-full">
            <Wallet className="w-8 h-8" />
          </div>
        </div>
      </div>

      <div className="px-4 mt-6">
        {/* Status Alert */}
        {loadingSettings ? (
          <Card className="p-6 text-center">
            <Loader2 className="w-8 h-8 animate-spin mx-auto text-primary" />
            <p className="text-sm text-muted-foreground mt-2">Carregando...</p>
          </Card>
        ) : !canWithdraw ? (
          <Alert className="mb-4 bg-red-50 border-red-200">
            <AlertCircle className="h-4 w-4 text-red-600" />
            <AlertDescription className="text-red-700 text-sm">
              {settings?.validation_message || "Saques não disponíveis no momento."}
            </AlertDescription>
          </Alert>
        ) : hasWithdrawnToday ? (
          <Alert className="mb-4 bg-yellow-50 border-yellow-200">
            <AlertCircle className="h-4 w-4 text-yellow-600" />
            <AlertDescription className="text-yellow-700 text-sm">
              Você já realizou um saque hoje. Tente novamente amanhã.
            </AlertDescription>
          </Alert>
        ) : null}

        {step === "input" ? (
          <>
            {/* Balance Card */}
            <Card className="p-4 bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20 mb-4">
              <p className="text-sm text-muted-foreground mb-1">Saldo Disponível</p>
              <p className="text-3xl font-bold text-primary">R$ {availableBalance.toFixed(2)}</p>
            </Card>

            {/* Amount Input */}
            <Card className="p-6 notranslate" translate="no" data-no-translate="true">
              <div className="mb-6 notranslate" translate="no">
                <Label className="text-sm text-muted-foreground">Quanto deseja sacar?</Label>
                <div className="relative mt-3 notranslate" translate="no">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-2xl font-bold text-muted-foreground notranslate" translate="no">
                    R$
                  </span>
                  <Input
                    type="text"
                    placeholder="0,00"
                    value={amount}
                    onChange={(e) => handleAmountChange(e.target.value)}
                    className="text-3xl font-bold text-center h-16 pl-16 notranslate"
                    translate="no"
                    autoComplete="off"
                    data-no-translate="true"
                    disabled={!canWithdraw}
                  />
                </div>
                <p className="text-xs text-muted-foreground mt-2 notranslate" translate="no">
                  Valor mínimo: R$ {minAmount.toFixed(2)}
                </p>
              </div>

              {/* Quick Amount Buttons */}
              <div className="space-y-3 mb-4">
                <Label className="text-xs text-muted-foreground">Valores rápidos:</Label>
                <div className="grid grid-cols-3 gap-2">
                  {quickAmounts.map((value) => (
                    <Button
                      key={value}
                      variant="outline"
                      size="sm"
                      onClick={() => setAmount(value.toString())}
                      className="h-12"
                      disabled={!canWithdraw || value > availableBalance}
                    >
                      R$ {value}
                    </Button>
                  ))}
                </div>
              </div>

              {/* Fee Information */}
              {amount && getNumericAmount() >= minAmount && (
                <div className="bg-muted/50 rounded-lg p-3 space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Valor solicitado:</span>
                    <span className="font-semibold">R$ {getNumericAmount().toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Taxa (10%):</span>
                    <span className="font-semibold text-red-600">- R$ {calculateFee().toFixed(2)}</span>
                  </div>
                  <div className="h-px bg-border" />
                  <div className="flex justify-between">
                    <span className="font-semibold">Você receberá:</span>
                    <span className="font-bold text-green-600">R$ {calculateNetAmount().toFixed(2)}</span>
                  </div>
                </div>
              )}

              {/* CPF Input */}
              <div className="mt-4 notranslate" translate="no" data-no-translate="true">
                <Label htmlFor="cpf" className="text-xs text-muted-foreground notranslate" translate="no">
                  CPF *
                </Label>
                <Input
                  id="cpf"
                  type="text"
                  placeholder="000.000.000-00"
                  value={cpf}
                  onChange={(e) => handleCpfChange(e.target.value)}
                  maxLength={14}
                  className="mt-1 notranslate"
                  translate="no"
                  autoComplete="off"
                  data-no-translate="true"
                  inputMode="numeric"
                  disabled={!canWithdraw}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Informe seu CPF para identificação
                </p>
              </div>

              {/* PIX Key Type Selection */}
              <div className="mt-4 notranslate" translate="no" data-no-translate="true">
                <Label className="text-xs text-muted-foreground notranslate" translate="no">Tipo de Chave PIX *</Label>
                <div className="grid grid-cols-4 gap-2 mt-1">
                  {[
                    { type: "cpf", label: "CPF" },
                    { type: "email", label: "E-mail" },
                    { type: "phone", label: "Telefone" },
                    { type: "random", label: "Aleatória" }
                  ].map((option) => (
                    <Button
                      key={option.type}
                      variant={pixKeyType === option.type ? "default" : "outline"}
                      size="sm"
                      onClick={() => {
                        setPixKeyType(option.type as typeof pixKeyType);
                        setPixKey("");
                      }}
                      className="text-xs"
                      disabled={!canWithdraw}
                    >
                      {option.label}
                    </Button>
                  ))}
                </div>
              </div>

              {/* PIX Key Input */}
              <div className="mt-4 notranslate" translate="no" data-no-translate="true">
                <Label htmlFor="pixKey" className="text-xs text-muted-foreground notranslate" translate="no">
                  Chave PIX ({pixKeyType === "cpf" ? "CPF" : pixKeyType === "email" ? "E-mail" : pixKeyType === "phone" ? "Telefone" : "Aleatória"}) *
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
                  className="mt-1 notranslate"
                  translate="no"
                  autoComplete="off"
                  data-no-translate="true"
                  disabled={!canWithdraw}
                />
              </div>
            </Card>

            {/* Info Card */}
            <Card className="p-4 mt-4 bg-blue-50 border-blue-200">
              <div className="flex gap-2">
                <Info className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-semibold text-sm text-blue-900 mb-2">Regras de Saque</h3>
                  <ul className="text-xs text-blue-700 space-y-1">
                    <li>• Apenas 1 saque por dia</li>
                    <li>• Horário: Segunda a Sexta, 10:00 às 17:00</li>
                    <li>• Valor mínimo: R$ {minAmount.toFixed(2)}</li>
                    <li>• Taxa de processamento: 10%</li>
                    <li>• Processamento em até 24h úteis</li>
                  </ul>
                </div>
              </div>
            </Card>

            <Button 
              onClick={handleContinue} 
              className="w-full mt-6 h-12 text-base"
              disabled={
                !canWithdraw || 
                !amount || 
                getNumericAmount() < minAmount || 
                getNumericAmount() > availableBalance ||
                !validateCPF() ||
                !validatePixKey()
              }
            >
              Continuar
            </Button>
          </>
        ) : (
          <>
            {/* Confirmation Screen */}
            <Card className="p-6">
              <div className="text-center mb-6">
                <p className="text-sm text-muted-foreground mb-2">Confirme os dados do saque</p>
                <div className="bg-primary/5 rounded-lg p-4 space-y-3 mt-4">
                  <div>
                    <p className="text-xs text-muted-foreground">Valor solicitado</p>
                    <p className="text-2xl font-bold text-foreground">R$ {getNumericAmount().toFixed(2)}</p>
                  </div>
                  <div className="h-px bg-border" />
                  <div>
                    <p className="text-xs text-muted-foreground">Taxa (10%)</p>
                    <p className="text-lg font-semibold text-red-600">- R$ {calculateFee().toFixed(2)}</p>
                  </div>
                  <div className="h-px bg-border" />
                  <div>
                    <p className="text-xs text-muted-foreground">Você receberá</p>
                    <p className="text-3xl font-bold text-green-600">R$ {calculateNetAmount().toFixed(2)}</p>
                  </div>
                </div>
              </div>

              <div className="space-y-3 bg-muted/30 rounded-lg p-4">
                <div>
                  <Label className="text-xs text-muted-foreground">CPF</Label>
                  <p className="text-sm font-medium">{cpf}</p>
                </div>
                <div className="h-px bg-border" />
                <div>
                  <Label className="text-xs text-muted-foreground">Tipo de Chave PIX</Label>
                  <p className="text-sm font-medium">
                    {pixKeyType === "cpf" ? "CPF" : 
                     pixKeyType === "email" ? "E-mail" : 
                     pixKeyType === "phone" ? "Telefone" : 
                     "Chave Aleatória"}
                  </p>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Chave PIX</Label>
                  <p className="text-sm font-medium break-all">{pixKey}</p>
                </div>
              </div>
            </Card>

            <Card className="p-4 mt-4 bg-yellow-50 border-yellow-200">
              <div className="flex gap-2">
                <AlertCircle className="w-4 h-4 text-yellow-600 shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs text-yellow-700">
                    Verifique cuidadosamente os dados antes de confirmar. 
                    O valor será transferido para a chave PIX informada em até 24h úteis.
                  </p>
                </div>
              </div>
            </Card>

            <div className="flex gap-3 mt-6">
              <Button 
                variant="outline" 
                onClick={() => setStep("input")}
                className="flex-1"
                disabled={loading}
              >
                Voltar
              </Button>
              <Button 
                onClick={handleConfirmWithdraw}
                className="flex-1"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Processando...
                  </>
                ) : (
                  'Confirmar Saque'
                )}
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default Withdraw;
