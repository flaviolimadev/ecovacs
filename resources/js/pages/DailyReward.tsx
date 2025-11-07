import { ArrowLeft, Gift, Loader2, Calendar, TrendingUp, CheckCircle2, Flame } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
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
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto text-primary" />
          <p className="mt-2 text-muted-foreground">Carregando...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen bg-background pb-20">
      {/* Header */}
      <div className="bg-gradient-to-br from-amber-400 via-orange-500 to-pink-500 text-white p-6 rounded-b-3xl">
        <div className="flex items-center justify-between mb-4">
          <button onClick={() => navigate("/")} className="p-2 hover:bg-white/10 rounded-full transition-colors">
            <ArrowLeft className="w-6 h-6" />
          </button>
          <h1 className="text-xl font-semibold flex-1 text-center">Prêmio Diário</h1>
          <div className="w-10"></div>
        </div>
        <div className="flex justify-center">
          <div className="bg-white/20 p-4 rounded-full">
            <Gift className="w-8 h-8" />
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="px-4 mt-6 grid grid-cols-3 gap-3">
        <Card className="p-3 text-center bg-gradient-to-br from-green-50 to-green-100 border-green-200">
          <div className="text-2xl font-bold text-green-600">
            R$ {status?.reward_amount.toFixed(2)}
          </div>
          <div className="text-xs text-muted-foreground mt-1">Prêmio</div>
        </Card>

        <Card className="p-3 text-center bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
          <div className="flex items-center justify-center gap-1">
            <Flame className="w-5 h-5 text-orange-500" />
            <span className="text-2xl font-bold text-blue-600">{status?.current_streak}</span>
          </div>
          <div className="text-xs text-muted-foreground mt-1">Sequência</div>
        </Card>

        <Card className="p-3 text-center bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
          <div className="text-2xl font-bold text-purple-600">
            R$ {status?.total_earned.toFixed(2)}
          </div>
          <div className="text-xs text-muted-foreground mt-1">Total Ganho</div>
        </Card>
      </div>

      {/* Claim Button */}
      <div className="px-4 mt-6">
        {status?.can_claim ? (
          <Card className="p-6 bg-gradient-to-br from-amber-50 to-orange-100 border-orange-200">
            <div className="text-center mb-4">
              <Gift className="w-16 h-16 mx-auto text-orange-500 mb-2 animate-bounce" />
              <h3 className="text-lg font-bold text-foreground">Seu prêmio diário está disponível!</h3>
              <p className="text-sm text-muted-foreground mt-1">
                Clique no botão abaixo para resgatar R$ 0,50
              </p>
            </div>

            <Button 
              onClick={handleClaim}
              disabled={isClaiming}
              className="w-full bg-gradient-to-r from-orange-500 to-pink-500 hover:from-orange-600 hover:to-pink-600 text-white h-12 text-lg font-bold"
            >
              {isClaiming ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  Resgatando...
                </>
              ) : (
                <>
                  <Gift className="w-5 h-5 mr-2" />
                  Resgatar Prêmio
                </>
              )}
            </Button>
          </Card>
        ) : (
          <Card className="p-6 bg-gradient-to-br from-gray-50 to-gray-100 border-gray-200">
            <div className="text-center">
              <CheckCircle2 className="w-16 h-16 mx-auto text-green-500 mb-2" />
              <h3 className="text-lg font-bold text-foreground">Prêmio já resgatado hoje!</h3>
              <p className="text-sm text-muted-foreground mt-1">
                Volte amanhã para resgatar novamente
              </p>
              <div className="mt-4 text-xs text-muted-foreground">
                Próximo prêmio disponível em: <span className="font-bold text-foreground">
                  {new Date(new Date().setDate(new Date().getDate() + 1)).toLocaleDateString('pt-BR')}
                </span>
              </div>
            </div>
          </Card>
        )}
      </div>

      {/* Info Card */}
      <div className="px-4 mt-6">
        <Card className="p-4 bg-gradient-to-br from-blue-50 to-cyan-100 border-blue-200">
          <h4 className="font-semibold text-foreground mb-2 flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-blue-600" />
            Como funciona?
          </h4>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li className="flex items-start gap-2">
              <span className="text-blue-600">•</span>
              <span>Resgate <strong className="text-foreground">R$ 0,50</strong> todos os dias</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-blue-600">•</span>
              <span>O valor vai direto para seu <strong className="text-foreground">saldo de saque</strong></span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-blue-600">•</span>
              <span>Você pode resgatar <strong className="text-foreground">1 vez por dia</strong></span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-blue-600">•</span>
              <span>Mantenha sua <strong className="text-foreground">sequência</strong> para não perder o hábito!</span>
            </li>
          </ul>
        </Card>
      </div>

      {/* History */}
      {status?.history && status.history.length > 0 && (
        <div className="px-4 mt-6 mb-6">
          <h3 className="text-sm font-semibold text-muted-foreground mb-3 flex items-center gap-2">
            <Calendar className="w-4 h-4" />
            Últimos 7 dias
          </h3>
          <div className="grid grid-cols-7 gap-2">
            {status.history.map((day, index) => (
              <div key={index} className="flex flex-col items-center gap-1">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                  day.claimed 
                    ? 'bg-green-500 text-white' 
                    : 'bg-gray-200 text-gray-400'
                }`}>
                  {day.claimed ? (
                    <CheckCircle2 className="w-5 h-5" />
                  ) : (
                    <span className="text-xs">—</span>
                  )}
                </div>
                <span className="text-[10px] text-muted-foreground">
                  {new Date(day.date).getDate()}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      <BottomNavigation />
    </div>
  );
};

export default DailyReward;

