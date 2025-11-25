import { ArrowLeft, Gift, Loader2, Calendar, Sparkles, CheckCircle2, Flame, Star, Zap } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import api from "@/lib/api";
import BottomNavigation from "@/components/BottomNavigation";

interface DailyRewardStatus {
  can_claim: boolean;
  today_claimed: boolean;
  reward_amount: number;
  total_earned: number;
  current_streak: number;
  history: Array<{
    date: string;
    amount: number;
    claimed: boolean;
  }>;
}

const DailyReward = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { fetchUser } = useAuth();
  const [status, setStatus] = useState<DailyRewardStatus | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isClaiming, setIsClaiming] = useState(false);

  const loadStatus = async () => {
    try {
      setIsLoading(true);
      const response = await api.get('/daily-reward/status');
      setStatus(response.data.data);
    } catch (error: any) {
      toast({
        title: "Erro",
        description: "Não foi possível carregar o status do prêmio diário",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadStatus();
  }, []);

  const handleClaim = async () => {
    try {
      setIsClaiming(true);
      const response = await api.post('/daily-reward/claim');
      
      toast({
        title: "🎉 Parabéns!",
        description: response.data.message,
      });

      // Recarregar status
      await loadStatus();
      
      // Atualizar dados do usuário
      await fetchUser();
      
    } catch (error: any) {
      const errorData = error.response?.data;
      
      toast({
        title: "Erro",
        description: errorData?.message || "Não foi possível resgatar o prêmio",
        variant: "destructive",
      });
    } finally {
      setIsClaiming(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center"
        >
          <Loader2 className="w-12 h-12 animate-spin mx-auto text-primary mb-3" />
          <p className="text-sm text-muted-foreground">Carregando prêmio...</p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen bg-background pb-20">
      {/* Header Moderno */}
      <header className="sticky top-0 z-40 border-b border-border bg-background/95 backdrop-blur-lg">
        <div className="flex items-center gap-4 px-4 py-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate("/")}
            className="hover:bg-secondary"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-lg font-bold text-foreground">Prêmio Diário</h1>
        </div>
      </header>

      <div className="container max-w-lg px-4 py-6 space-y-6">
        {/* Main Reward Card */}
        <AnimatePresence mode="wait">
          {status?.can_claim ? (
            <motion.div
              key="can-claim"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <Card className="relative overflow-hidden border-accent/30 bg-gradient-to-br from-accent/10 via-accent/5 to-background">
                {/* Animated Background Stars */}
                <div className="absolute inset-0 overflow-hidden">
                  <motion.div
                    animate={{
                      rotate: [0, 360],
                    }}
                    transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                    className="absolute -top-10 -right-10 w-40 h-40 opacity-10"
                  >
                    <Sparkles className="w-full h-full text-accent" />
                  </motion.div>
                  <motion.div
                    animate={{
                      rotate: [360, 0],
                    }}
                    transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
                    className="absolute -bottom-10 -left-10 w-40 h-40 opacity-10"
                  >
                    <Star className="w-full h-full text-accent" />
                  </motion.div>
                </div>

                <div className="relative z-10 p-6 text-center">
                  <motion.div
                    animate={{
                      scale: [1, 1.1, 1],
                      rotate: [0, 5, -5, 0],
                    }}
                    transition={{ duration: 2, repeat: Infinity }}
                  >
                    <Gift className="w-20 h-20 mx-auto text-accent mb-4" />
                  </motion.div>
                  
                  <h2 className="text-2xl font-bold text-foreground mb-2">
                    Seu Prêmio Está Pronto!
                  </h2>
                  <p className="text-sm text-muted-foreground mb-6">
                    Resgate agora e ganhe instantaneamente
                  </p>

                  <div className="bg-accent/10 rounded-xl p-4 mb-6">
                    <p className="text-sm text-muted-foreground mb-1">Valor do Prêmio</p>
                    <p className="text-4xl font-bold text-accent">
                      R$ {status?.reward_amount.toFixed(2)}
                    </p>
                  </div>

                  <Button 
                    onClick={handleClaim}
                    disabled={isClaiming}
                    className="w-full bg-gradient-to-r from-accent to-accent/80 hover:from-accent/90 hover:to-accent/70 text-accent-foreground h-12 text-base font-bold shadow-lg"
                  >
                    {isClaiming ? (
                      <>
                        <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                        Resgatando...
                      </>
                    ) : (
                      <>
                        <Zap className="w-5 h-5 mr-2" />
                        Resgatar Agora
                      </>
                    )}
                  </Button>
                </div>
              </Card>
            </motion.div>
          ) : (
            <motion.div
              key="claimed"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <Card className="relative overflow-hidden border-success/30 bg-gradient-to-br from-success/10 via-success/5 to-background">
                <div className="p-6 text-center">
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", stiffness: 200, damping: 15 }}
                  >
                    <CheckCircle2 className="w-20 h-20 mx-auto text-success mb-4" />
                  </motion.div>
                  
                  <h2 className="text-2xl font-bold text-foreground mb-2">
                    Prêmio Resgatado!
                  </h2>
                  <p className="text-sm text-muted-foreground mb-4">
                    Você já resgatou o prêmio de hoje
                  </p>

                  <div className="bg-muted/50 rounded-xl p-4">
                    <p className="text-sm text-muted-foreground mb-1">Próximo prêmio em</p>
                    <p className="text-lg font-bold text-foreground">
                      {new Date(new Date().setDate(new Date().getDate() + 1)).toLocaleDateString('pt-BR', {
                        day: '2-digit',
                        month: 'long',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </p>
                  </div>
                </div>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Stats Grid */}
        <div className="grid grid-cols-3 gap-3">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Card className="p-4 text-center border-primary/20 bg-gradient-to-br from-primary/10 to-primary/5">
              <Gift className="w-6 h-6 mx-auto text-primary mb-2" />
              <p className="text-xs text-muted-foreground mb-1">Prêmio</p>
              <p className="text-lg font-bold text-primary">
                R$ {status?.reward_amount.toFixed(2)}
              </p>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Card className="p-4 text-center border-warning/20 bg-gradient-to-br from-warning/10 to-warning/5">
              <Flame className="w-6 h-6 mx-auto text-warning mb-2" />
              <p className="text-xs text-muted-foreground mb-1">Sequência</p>
              <p className="text-lg font-bold text-warning">
                {status?.current_streak} dias
              </p>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <Card className="p-4 text-center border-success/20 bg-gradient-to-br from-success/10 to-success/5">
              <Star className="w-6 h-6 mx-auto text-success mb-2" />
              <p className="text-xs text-muted-foreground mb-1">Total</p>
              <p className="text-lg font-bold text-success">
                R$ {status?.total_earned.toFixed(2)}
              </p>
            </Card>
          </motion.div>
        </div>

        {/* Info Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-background p-5">
            <div className="flex items-center gap-2 mb-4">
              <div className="p-2 rounded-lg bg-primary/10">
                <Sparkles className="w-5 h-5 text-primary" />
              </div>
              <h3 className="font-bold text-foreground">Como Funciona?</h3>
            </div>
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 w-6 h-6 rounded-full bg-accent/10 flex items-center justify-center">
                  <span className="text-xs font-bold text-accent">1</span>
                </div>
                <p className="text-sm text-foreground">
                  Resgate <strong className="text-accent">R$ {status?.reward_amount.toFixed(2)}</strong> todos os dias
                </p>
              </div>
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 w-6 h-6 rounded-full bg-accent/10 flex items-center justify-center">
                  <span className="text-xs font-bold text-accent">2</span>
                </div>
                <p className="text-sm text-foreground">
                  O valor vai direto para seu <strong className="text-accent">saldo de saque</strong>
                </p>
              </div>
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 w-6 h-6 rounded-full bg-accent/10 flex items-center justify-center">
                  <span className="text-xs font-bold text-accent">3</span>
                </div>
                <p className="text-sm text-foreground">
                  Mantenha sua <strong className="text-accent">sequência diária</strong> ativa
                </p>
              </div>
            </div>
          </Card>
        </motion.div>

        {/* History */}
        {status?.history && status.history.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
          >
            <Card className="border-border bg-card p-5">
              <div className="flex items-center gap-2 mb-4">
                <div className="p-2 rounded-lg bg-muted">
                  <Calendar className="w-5 h-5 text-foreground" />
                </div>
                <h3 className="font-bold text-foreground">Últimos 7 Dias</h3>
              </div>
              <div className="grid grid-cols-7 gap-2">
                {status.history.map((day, index) => (
                  <motion.div 
                    key={index}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.5 + (index * 0.05) }}
                    className="flex flex-col items-center gap-2"
                  >
                    <motion.div 
                      className={`w-12 h-12 rounded-xl flex items-center justify-center shadow-sm ${
                        day.claimed 
                          ? 'bg-gradient-to-br from-success to-success/80 text-success-foreground' 
                          : 'bg-muted text-muted-foreground'
                      }`}
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      {day.claimed ? (
                        <CheckCircle2 className="w-6 h-6" />
                      ) : (
                        <div className="w-2 h-2 rounded-full bg-current opacity-30" />
                      )}
                    </motion.div>
                    <span className="text-[10px] font-medium text-muted-foreground">
                      {new Date(day.date).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}
                    </span>
                  </motion.div>
                ))}
              </div>
            </Card>
          </motion.div>
        )}
      </div>

      <BottomNavigation />
    </div>
  );
};

export default DailyReward;











