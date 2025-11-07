import { ArrowLeft, Gift, TrendingUp, Loader2, Package, CheckCircle2, XCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import ActivePackageCard from "@/components/ActivePackageCard";
import EarningsSummary from "@/components/EarningsSummary";
import BottomNavigation from "@/components/BottomNavigation";
import { investmentsAPI } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";

interface Investment {
  id: number;
  plan_name: string;
  plan_image: string;
  amount: number;
  type: 'DAILY' | 'END_CYCLE';
  duration_days: number;
  daily_income: number | null;
  total_return: number;
  total_paid: number;
  days_paid: number;
  started_at: string;
  last_payment_at: string | null;
  status: string;
  progress: number;
}

interface UserStats {
  user_status: 'active' | 'inactive';
  is_active: boolean;
  active_cycles: number;
  finished_cycles: number;
  total_invested: number;
  total_earned: number;
}

const Earnings = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [investments, setInvestments] = useState<Investment[]>([]);
  const [userStats, setUserStats] = useState<UserStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        setIsLoading(true);
        
        // Buscar investimentos ativos e estatísticas do usuário
        const [investmentsResponse, statsResponse] = await Promise.all([
          investmentsAPI.getAll('active'),
          investmentsAPI.getStats(),
        ]);
        
        setInvestments(investmentsResponse.data.data);
        setUserStats(statsResponse.data.data);
      } catch (error: any) {
        toast({
          title: "Erro",
          description: "Não foi possível carregar os investimentos",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [toast]);

  // Formatar investimentos para o formato esperado pelo ActivePackageCard
  const activePackages = investments.map(inv => ({
    id: inv.id,
    name: inv.plan_name,
    image: inv.plan_image,
    purchaseDate: inv.started_at,
    value: inv.amount,
    dailyIncome: inv.daily_income || 0,
    duration: inv.duration_days,
    daysCompleted: inv.days_paid,
    totalEarned: inv.total_paid,
    lastPayment: inv.last_payment_at ? {
      date: inv.last_payment_at,
      amount: inv.daily_income || 0
    } : null,
    status: inv.status.toLowerCase(),
    cycleReward: inv.type === 'END_CYCLE' ? inv.total_return : undefined
  }));

  const totalActive = activePackages.length;
  const totalInvested = activePackages.reduce((sum, p) => sum + p.value, 0);
  const totalEarned = activePackages.reduce((sum, p) => sum + p.totalEarned, 0);

  return (
    <div className="relative min-h-screen bg-background pb-20">
      {/* Header */}
      <div className="bg-primary text-primary-foreground p-6 rounded-b-3xl">
        <div className="flex items-center justify-between mb-4">
          <button onClick={() => navigate("/")} className="p-2 hover:bg-white/10 rounded-full transition-colors">
            <ArrowLeft className="w-6 h-6" />
          </button>
          <h1 className="text-xl font-semibold flex-1 text-center">Rendimentos</h1>
          <div className="w-10"></div>
        </div>
        <div className="flex flex-col items-center">
          <div className="bg-white/20 p-4 rounded-full mb-3">
            <Gift className="w-8 h-8" />
          </div>
          
          {/* Status Badge */}
          {!isLoading && userStats && (
            <div className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold ${
              userStats.is_active 
                ? 'bg-green-500/20 text-green-100 border border-green-400/30' 
                : 'bg-red-500/20 text-red-100 border border-red-400/30'
            }`}>
              {userStats.is_active ? (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Usuário Ativo</span>
                </>
              ) : (
                <>
                  <XCircle className="w-4 h-4" />
                  <span>Usuário Inativo</span>
                </>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Summary */}
      {!isLoading && (
        <EarningsSummary 
          totalActive={totalActive}
          totalInvested={totalInvested}
          totalEarned={totalEarned}
        />
      )}

      {/* Loading State */}
      {isLoading && (
        <div className="px-4 mt-6 text-center py-12">
          <Loader2 className="w-8 h-8 animate-spin mx-auto text-primary mb-2" />
          <p className="text-sm text-muted-foreground">Carregando investimentos...</p>
        </div>
      )}

      {/* Active Packages */}
      {!isLoading && activePackages.length > 0 && (
        <div className="px-4 mt-6">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="w-5 h-5 text-primary" />
            <h2 className="text-lg font-semibold text-foreground">Pacotes Ativos</h2>
          </div>
          <div className="space-y-4">
            {activePackages.map((pkg) => (
              <ActivePackageCard key={pkg.id} package={pkg} />
            ))}
          </div>
        </div>
      )}

      {/* Empty State */}
      {!isLoading && activePackages.length === 0 && (
        <div className="px-4 mt-6 text-center py-12">
          <Package className="w-16 h-16 mx-auto mb-4 text-muted-foreground opacity-50" />
          <h3 className="text-lg font-semibold text-foreground mb-2">
            {userStats?.is_active ? 'Nenhum investimento ativo' : 'Conta Inativa'}
          </h3>
          <p className="text-sm text-muted-foreground mb-4">
            {userStats?.is_active 
              ? 'Você não possui pacotes ativos no momento. Invista em um novo plano!'
              : 'Você ainda não realizou nenhuma compra. Faça seu primeiro investimento para ativar sua conta!'
            }
          </p>
          <button
            onClick={() => navigate("/")}
            className="px-6 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
          >
            {userStats?.is_active ? 'Ver Planos Disponíveis' : 'Fazer Primeiro Investimento'}
          </button>
        </div>
      )}

      <BottomNavigation />
    </div>
  );
};

export default Earnings;
