import { ArrowLeft, Loader2, Package, CheckCircle2, XCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import PlanCard from "@/components/PlanCard";
import BottomNavigation from "@/components/BottomNavigation";
import { investmentsAPI } from "@/lib/api";

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
  }, []);

  const handleSelectPlan = (planName: string, planId: number) => {
    toast({
      title: "Investimento Selecionado",
      description: `${planName}`,
    });
    // Aqui você pode adicionar navegação ou ação específica
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center pb-20">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto text-primary mb-2" />
          <p className="text-sm text-muted-foreground">Carregando investimentos...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-20">
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
          <h1 className="text-lg font-bold text-foreground">Meus Investimentos</h1>
        </div>
      </header>

      <div className="container max-w-6xl px-4 py-6">
        {/* Banner de Status do Usuário */}
        <div className="mb-6 rounded-xl bg-gradient-to-r from-primary/10 to-accent/10 p-4 border border-primary/20">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-base font-bold text-foreground">
              Status da Conta
            </h2>
            {userStats && (
              <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold ${
                userStats.is_active 
                  ? 'bg-success/20 text-success border border-success/30' 
                  : 'bg-destructive/20 text-destructive border border-destructive/30'
              }`}>
                {userStats.is_active ? (
                  <>
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Ativo</span>
                  </>
                ) : (
                  <>
                    <XCircle className="w-3.5 h-3.5" />
                    <span>Inativo</span>
                  </>
                )}
              </div>
            )}
          </div>
          <div className="grid grid-cols-3 gap-2 mt-3">
            <div className="text-center">
              <p className="text-xs text-muted-foreground">Ativos</p>
              <p className="text-lg font-bold text-foreground">{userStats?.active_cycles || 0}</p>
            </div>
            <div className="text-center">
              <p className="text-xs text-muted-foreground">Investido</p>
              <p className="text-lg font-bold text-primary">R$ {(userStats?.total_invested || 0).toFixed(2)}</p>
            </div>
            <div className="text-center">
              <p className="text-xs text-muted-foreground">Ganho</p>
              <p className="text-lg font-bold text-success">R$ {(userStats?.total_earned || 0).toFixed(2)}</p>
            </div>
          </div>
        </div>

        {/* Grid de Investimentos Ativos */}
        {investments.length > 0 ? (
          <>
            <h2 className="text-base font-bold text-foreground mb-4">Investimentos Ativos</h2>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {investments.map((investment) => (
                <PlanCard
                  key={investment.id}
                  title={investment.plan_name}
                  image={investment.plan_image || "/assets/banner-investment.jpg"}
                  investment={investment.amount}
                  dailyProfit={investment.daily_income || 0}
                  cycle={investment.duration_days}
                  totalReturn={investment.total_return}
                  badge={investment.status === 'active' ? 'Ativo' : undefined}
                  onSelect={() => handleSelectPlan(investment.plan_name, investment.id)}
                  customContent={
                    <div className="space-y-2 pt-2 border-t border-border">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-muted-foreground">Progresso do Ciclo</span>
                        <span className="font-semibold text-foreground">
                          {investment.days_paid}/{investment.duration_days} dias
                        </span>
                      </div>
                      <div className="h-2.5 bg-muted rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-gradient-to-r from-primary to-accent transition-all duration-300"
                          style={{ width: `${investment.progress}%` }}
                        />
                      </div>
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-muted-foreground">Total Recebido</span>
                        <span className="font-bold text-success">R$ {investment.total_paid.toFixed(2)}</span>
                      </div>
                      {investment.last_payment_at && (
                        <div className="text-[10px] text-muted-foreground text-center pt-1">
                          Último pagamento: {new Date(investment.last_payment_at).toLocaleDateString('pt-BR')}
                        </div>
                      )}
                    </div>
                  }
                />
              ))}
            </div>
          </>
        ) : (
          /* Empty State */
          <div className="text-center py-12">
            <Package className="w-16 h-16 mx-auto mb-4 text-muted-foreground opacity-50" />
            <h3 className="text-lg font-semibold text-foreground mb-2">
              {userStats?.is_active ? 'Nenhum investimento ativo' : 'Conta Inativa'}
            </h3>
            <p className="text-sm text-muted-foreground mb-4 max-w-md mx-auto">
              {userStats?.is_active 
                ? 'Você não possui pacotes ativos no momento. Invista em um novo plano para começar a lucrar!'
                : 'Você ainda não realizou nenhuma compra. Faça seu primeiro investimento para ativar sua conta e começar a ganhar!'
              }
            </p>
            <Button
              onClick={() => navigate("/plans")}
              className="bg-primary text-primary-foreground hover:bg-primary/90"
            >
              {userStats?.is_active ? 'Ver Planos Disponíveis' : 'Fazer Primeiro Investimento'}
            </Button>
          </div>
        )}

        {/* Como Funciona */}
        <div className="mt-6 rounded-xl bg-card p-4 border border-border">
          <h3 className="mb-3 text-sm font-bold text-foreground">Como Funciona?</h3>
          <ul className="space-y-2 text-xs text-muted-foreground">
            <li>✅ Seus investimentos ativos aparecem aqui</li>
            <li>✅ Acompanhe o progresso diário de cada plano</li>
            <li>✅ Receba lucros diariamente durante o ciclo</li>
            <li>✅ Ao final do ciclo, o valor total é liberado para saque</li>
            <li>✅ Você pode ter múltiplos investimentos ativos simultaneamente</li>
          </ul>
        </div>
      </div>

      <BottomNavigation />
    </div>
  );
};

export default Earnings;
