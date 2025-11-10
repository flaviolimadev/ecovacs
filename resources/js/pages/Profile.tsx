import { ArrowLeft, User, Lock, Receipt, Edit, Eye, EyeOff, Download, Loader2, Share2, Copy, LogOut } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import BottomNavigation from "@/components/BottomNavigation";
import { useToast } from "@/hooks/use-toast";
import { profileAPI, networkAPI } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";

const Profile = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, fetchUser, logout } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  // User data from API
  const [userInfo, setUserInfo] = useState({
    name: "",
    email: "",
    phone: "",
  });

  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  // Financial data from API
  const [balanceInvested, setBalanceInvested] = useState(0);      // Saldo para investir
  const [balanceWithdraw, setBalanceWithdraw] = useState(0);      // Saldo para saque
  const [transactions, setTransactions] = useState<any[]>([]);
  
  // Referral data
  const [referralLink, setReferralLink] = useState("");
  const [referralCode, setReferralCode] = useState("");

  // Carregar dados do perfil e extrato
  useEffect(() => {
    const loadProfileData = async () => {
      try {
        setIsLoading(true);
        
        // Buscar perfil
        const profileResponse = await profileAPI.get();
        const profileData = profileResponse.data.data;
        
        setUserInfo({
          name: profileData.name,
          email: profileData.email,
          phone: profileData.phone || "",
        });

        // Buscar extrato
        const statementResponse = await profileAPI.getStatement();
        setBalanceInvested(profileData.balance || 0);
        setBalanceWithdraw(profileData.balance_withdrawn || 0);
        setTransactions(statementResponse.data.data);
        
        // Buscar dados de indicação
        const networkResponse = await networkAPI.getStats();
        setReferralCode(networkResponse.data.data.referral_code);
        setReferralLink(networkResponse.data.data.referral_link);
      } catch (error: any) {
        toast({
          title: "Erro",
          description: "Não foi possível carregar os dados",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    loadProfileData();
  }, [toast]);

  const handleCopyLink = () => {
    navigator.clipboard.writeText(referralLink);
    toast({
      title: "Link copiado!",
      description: "O link de indicação foi copiado para a área de transferência.",
    });
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(referralCode);
    toast({
      title: "Código copiado!",
      description: "Seu código de indicação foi copiado.",
    });
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: "Junte-se à minha equipe!",
          text: `Use meu código de indicação: ${referralCode}`,
          url: referralLink,
        });
      } catch (error) {
        // User cancelled share
      }
    } else {
      handleCopyLink();
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      // Erro já tratado no AuthContext
    }
  };

  const handleSaveProfile = async () => {
    try {
      setIsSaving(true);
      
      await profileAPI.update({
        name: userInfo.name,
        email: userInfo.email,
        phone: userInfo.phone || undefined,
      });

      // Atualizar contexto de autenticação
      await fetchUser();

      toast({
        title: "Perfil atualizado",
        description: "Suas informações foram atualizadas com sucesso.",
      });
    } catch (error: any) {
      const message = error.response?.data?.message || "Erro ao atualizar perfil";
      
      // Se for erro de validação (422)
      if (error.response?.status === 422 && error.response?.data?.errors) {
        const errors = error.response.data.errors;
        const firstError = Object.values(errors)[0] as string[];
        toast({
          title: "Erro de validação",
          description: firstError[0],
          variant: "destructive",
        });
      } else {
        toast({
          title: "Erro",
          description: message,
          variant: "destructive",
        });
      }
    } finally {
      setIsSaving(false);
    }
  };

  const handleChangePassword = async () => {
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast({
        title: "Erro",
        description: "As senhas não coincidem.",
        variant: "destructive",
      });
      return;
    }

    if (passwordData.newPassword.length < 6) {
      toast({
        title: "Erro",
        description: "A senha deve ter no mínimo 6 caracteres.",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsChangingPassword(true);
      
      await profileAPI.updatePassword({
        current_password: passwordData.currentPassword,
        new_password: passwordData.newPassword,
        new_password_confirmation: passwordData.confirmPassword,
      });

      toast({
        title: "Senha alterada",
        description: "Sua senha foi alterada com sucesso.",
      });
      
      setPasswordData({ currentPassword: "", newPassword: "", confirmPassword: "" });
    } catch (error: any) {
      const message = error.response?.data?.message || "Erro ao alterar senha";
      
      // Se for erro de validação (422)
      if (error.response?.status === 422 && error.response?.data?.errors) {
        const errors = error.response.data.errors;
        const firstError = Object.values(errors)[0] as string[];
        toast({
          title: "Erro",
          description: firstError[0],
          variant: "destructive",
        });
      } else {
        toast({
          title: "Erro",
          description: message,
          variant: "destructive",
        });
      }
    } finally {
      setIsChangingPassword(false);
    }
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto text-primary" />
          <p className="mt-2 text-muted-foreground">Carregando perfil...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen bg-background pb-20">
      {/* Header */}
      <div className="bg-primary text-primary-foreground p-6 rounded-b-3xl">
        <div className="flex items-center justify-between mb-4">
          <button onClick={() => navigate("/")} className="p-2 hover:bg-white/10 rounded-full transition-colors">
            <ArrowLeft className="w-6 h-6" />
          </button>
          <h1 className="text-xl font-semibold flex-1 text-center">Perfil</h1>
          <div className="flex items-center gap-2">
            {user?.role === 'admin' && (
              <button onClick={() => navigate("/admin/users")} className="p-2 hover:bg-white/10 rounded-full transition-colors" title="Admin">
                🔐
              </button>
            )}
            <button onClick={handleLogout} className="p-2 hover:bg-white/10 rounded-full transition-colors" title="Sair">
              <LogOut className="w-6 h-6" />
            </button>
          </div>
        </div>
        <div className="flex justify-center">
          <div className="bg-white/20 p-4 rounded-full">
            <User className="w-8 h-8" />
          </div>
        </div>
      </div>

      {/* Balance Cards */}
      <div className="px-4 mt-4 space-y-3">
        {/* Saldo para Investir */}
        <Card className="p-4 bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
          <p className="text-xs text-blue-700 mb-1 font-medium">💰 Saldo para Investir</p>
          <p className="text-2xl font-bold text-blue-900">R$ {balanceInvested.toFixed(2)}</p>
          <p className="text-[10px] text-blue-600 mt-1">Use este saldo para comprar planos</p>
          <div className="flex gap-2 mt-3">
            <Button size="sm" variant="outline" className="flex-1 border-blue-300 text-blue-700 hover:bg-blue-50" onClick={() => navigate("/deposit")}>
              Depositar
            </Button>
          </div>
        </Card>

        {/* Saldo Disponível para Saque */}
        <Card className="p-4 bg-gradient-to-br from-green-50 to-green-100 border-green-200">
          <p className="text-xs text-green-700 mb-1 font-medium">💵 Disponível para Saque</p>
          <p className="text-2xl font-bold text-green-900">R$ {balanceWithdraw.toFixed(2)}</p>
          <p className="text-[10px] text-green-600 mt-1">Ganhos de rendimentos e comissões</p>
          <div className="flex gap-2 mt-3">
            <Button size="sm" variant="default" className="flex-1 bg-green-600 hover:bg-green-700" onClick={() => navigate("/withdraw")}>
              Sacar
            </Button>
          </div>
        </Card>
      </div>

      {/* Referral Link Section */}
      <div className="px-4 mt-6">
        <Card className="p-4 bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
          <div className="mb-3">
            <p className="text-sm font-semibold text-purple-900 mb-1">💎 Seu Código de Indicação</p>
            <div className="flex gap-2">
              <Input 
                value={referralCode} 
                readOnly 
                className="text-center font-bold text-lg bg-white"
              />
              <Button onClick={handleCopyCode} size="icon" variant="outline" className="border-purple-300">
                <Copy className="w-4 h-4" />
              </Button>
            </div>
          </div>
          
          <div className="mb-3">
            <p className="text-sm font-semibold text-purple-900 mb-1">🔗 Link de Indicação</p>
            <div className="flex gap-2">
              <Input 
                value={referralLink} 
                readOnly 
                className="text-xs bg-white"
              />
              <Button onClick={handleCopyLink} size="icon" variant="outline" className="border-purple-300">
                <Copy className="w-4 h-4" />
              </Button>
            </div>
          </div>

          <Button onClick={handleShare} className="w-full bg-purple-600 hover:bg-purple-700" variant="default">
            <Share2 className="w-4 h-4 mr-2" />
            Compartilhar Link de Indicação
          </Button>
        </Card>
      </div>

      {/* Tabs */}
      <div className="px-4 mt-6">
        <Tabs defaultValue="info" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="info">
              <User className="w-4 h-4 mr-1" />
              <span className="text-xs">Dados</span>
            </TabsTrigger>
            <TabsTrigger value="password">
              <Lock className="w-4 h-4 mr-1" />
              <span className="text-xs">Senha</span>
            </TabsTrigger>
            <TabsTrigger value="financial">
              <Receipt className="w-4 h-4 mr-1" />
              <span className="text-xs">Extrato</span>
            </TabsTrigger>
          </TabsList>

          {/* Personal Info Tab */}
          <TabsContent value="info" className="space-y-4 mt-4">
            <Card className="p-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-foreground">Informações Pessoais</h3>
                <Edit className="w-4 h-4 text-muted-foreground" />
              </div>
              
              <div className="space-y-3">
                <div>
                  <Label htmlFor="name" className="text-xs">Nome Completo</Label>
                  <Input
                    id="name"
                    value={userInfo.name}
                    onChange={(e) => setUserInfo({ ...userInfo, name: e.target.value })}
                    className="mt-1"
                  />
                </div>
                
                <div>
                  <Label htmlFor="email" className="text-xs">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={userInfo.email}
                    onChange={(e) => setUserInfo({ ...userInfo, email: e.target.value })}
                    className="mt-1"
                  />
                </div>
                
                <div>
                  <Label htmlFor="phone" className="text-xs">Telefone</Label>
                  <Input
                    id="phone"
                    value={userInfo.phone}
                    onChange={(e) => setUserInfo({ ...userInfo, phone: e.target.value })}
                    className="mt-1"
                  />
                </div>
                
                <div>
                  <Label htmlFor="referralCode" className="text-xs">Código de Indicação</Label>
                  <Input
                    id="referralCode"
                    value={user?.referral_code || "Carregando..."}
                    disabled
                    className="mt-1 bg-muted"
                  />
                  <p className="text-xs text-muted-foreground mt-1">Use este código para indicar pessoas</p>
                </div>
              </div>

              <Button onClick={handleSaveProfile} className="w-full mt-4" disabled={isSaving}>
                {isSaving ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Salvando...
                  </>
                ) : (
                  "Salvar Alterações"
                )}
              </Button>
            </Card>
          </TabsContent>

          {/* Password Tab */}
          <TabsContent value="password" className="space-y-4 mt-4">
            <Card className="p-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-foreground">Alterar Senha</h3>
                <Lock className="w-4 h-4 text-muted-foreground" />
              </div>
              
              <div className="space-y-3">
                <div>
                  <Label htmlFor="currentPassword" className="text-xs">Senha Atual</Label>
                  <div className="relative mt-1">
                    <Input
                      id="currentPassword"
                      type={showPassword ? "text" : "password"}
                      value={passwordData.currentPassword}
                      onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
                
                <div>
                  <Label htmlFor="newPassword" className="text-xs">Nova Senha</Label>
                  <div className="relative mt-1">
                    <Input
                      id="newPassword"
                      type={showNewPassword ? "text" : "password"}
                      value={passwordData.newPassword}
                      onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                    >
                      {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
                
                <div>
                  <Label htmlFor="confirmPassword" className="text-xs">Confirmar Nova Senha</Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    value={passwordData.confirmPassword}
                    onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                    className="mt-1"
                  />
                </div>
              </div>

              <Button onClick={handleChangePassword} className="w-full mt-4" disabled={isChangingPassword}>
                {isChangingPassword ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Alterando...
                  </>
                ) : (
                  "Alterar Senha"
                )}
              </Button>
            </Card>
          </TabsContent>

          {/* Financial Tab */}
          <TabsContent value="financial" className="space-y-4 mt-4">
            <Card className="p-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-foreground">Extrato da Conta</h3>
                <Button size="sm" variant="outline">
                  <Download className="w-3 h-3 mr-1" />
                  Exportar
                </Button>
              </div>

              <div className="space-y-2">
                {transactions.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Receipt className="w-12 h-12 mx-auto mb-2 opacity-50" />
                    <p>Nenhuma transação encontrada</p>
                  </div>
                ) : (
                  transactions.map((transaction) => (
                    <div
                      key={transaction.id}
                      className="flex items-center justify-between p-3 rounded-lg bg-muted/30 border border-border"
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xs font-medium text-foreground">{transaction.type_label}</span>
                          <span className={`text-[10px] px-1.5 py-0.5 rounded ${
                            transaction.status === "completed" 
                              ? "bg-green-100 text-green-700" 
                              : "bg-yellow-100 text-yellow-700"
                          }`}>
                            {transaction.status_label}
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground">{transaction.description}</p>
                        <p className="text-[10px] text-muted-foreground mt-1">
                          {new Date(transaction.date).toLocaleDateString('pt-BR')}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className={`text-sm font-bold ${
                          transaction.amount > 0 ? "text-green-600" : "text-red-600"
                        }`}>
                          {transaction.amount > 0 ? "+" : ""}R$ {Math.abs(transaction.amount).toFixed(2)}
                        </p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Logout Button */}
      <div className="px-4 mt-6 mb-8">
        <Button 
          onClick={handleLogout} 
          variant="outline" 
          className="w-full border-red-300 text-red-600 hover:bg-red-50 hover:text-red-700"
        >
          <LogOut className="w-4 h-4 mr-2" />
          Sair da Conta
        </Button>
      </div>

      <BottomNavigation />
    </div>
  );
};

export default Profile;
