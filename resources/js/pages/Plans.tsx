import { ArrowLeft, Loader2, Package } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import PlanCard from "@/components/PlanCard";
import BottomNavigation from "@/components/BottomNavigation";
import api from "@/lib/api";

interface Plan {
  id: number;
  name: string;
  image: string;
  price: number;
  daily_income: number | null;
  duration_days: number;
  total_return: number;
  max_purchases: number;
  type: 'DAILY' | 'END_CYCLE';
  description: string | null;
  is_active: boolean;
  order: number;
  is_featured: boolean;
  featured_color: string | null;
}

const Plans = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [plans, setPlans] = useState<Plan[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadPlans = async () => {
      try {
        setIsLoading(true);
        const response = await api.get('/admin/plans', {
          params: {
            status: 'active',
            per_page: 100,
          }
        });
        
        // Ordenar por ordem e por preço
        const sortedPlans = response.data.data.sort((a: Plan, b: Plan) => {
          if (a.order !== b.order) {
            return a.order - b.order;
          }
          return a.price - b.price;
        });
        
        setPlans(sortedPlans);
      } catch (error: any) {
        console.error("Failed to load plans:", error);
        toast({
          title: "Erro",
          description: "Não foi possível carregar os planos disponíveis.",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    loadPlans();
  }, []);

  const handleSelectPlan = async (plan: Plan) => {
    // Verificar se o usuário tem saldo suficiente
    try {
      const profileResponse = await api.get('/profile');
      const userBalance = profileResponse.data.data.balance;

      if (userBalance < plan.price) {
        toast({
          title: "Saldo Insuficiente",
          description: `Você precisa de R$ ${plan.price.toFixed(2)} para investir neste plano. Saldo atual: R$ ${userBalance.toFixed(2)}`,
          variant: "destructive",
        });
        
        // Perguntar se quer fazer depósito
        setTimeout(() => {
          if (confirm("Deseja fazer um depósito agora?")) {
            navigate("/deposit");
          }
        }, 500);
        return;
      }

      // Navegar para confirmação ou criar investimento direto
      // Por enquanto, vamos apenas mostrar um toast e criar o investimento
      const confirmPurchase = confirm(
        `Confirma a compra do ${plan.name}?\n\n` +
        `Valor: R$ ${plan.price.toFixed(2)}\n` +
        `Lucro ${plan.type === 'DAILY' ? 'diário' : 'no final'}: R$ ${plan.daily_income?.toFixed(2) || plan.total_return.toFixed(2)}\n` +
        `Duração: ${plan.duration_days} dias\n` +
        `Retorno Total: R$ ${plan.total_return.toFixed(2)}`
      );

      if (!confirmPurchase) return;

      setIsLoading(true);
      
      await api.post('/investments', {
        plan_id: plan.id,
        amount: plan.price,
      });

      toast({
        title: "Investimento Realizado!",
        description: `Você investiu no ${plan.name}. Seu lucro começará em breve!`,
      });

      // Navegar para a página de investimentos
      setTimeout(() => {
        navigate("/earnings");
      }, 1500);

    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.response?.data?.message || "Não foi possível realizar o investimento.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="fixed inset-0 bg-background z-50 flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="relative">
            <div className="w-16 h-16 border-4 border-primary/20 border-t-primary rounded-full animate-spin mx-auto" />
          </div>
          <div className="space-y-2">
            <p className="text-lg font-semibold text-foreground">Carregando planos...</p>
            <p className="text-sm text-muted-foreground">Buscando melhores opções para você</p>
          </div>
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
            onClick={() => navigate(-1)}
            className="hover:bg-secondary"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-lg font-bold text-foreground">Planos de Investimento</h1>
        </div>
      </header>

      <div className="container max-w-6xl px-4 py-6">
        {/* Banner Informativo */}
        <div className="mb-6 rounded-xl bg-gradient-to-r from-primary/10 to-accent/10 p-4 border border-primary/20">
          <h2 className="mb-2 text-base font-bold text-foreground">
            Invista e Lucre Diariamente
          </h2>
          <p className="text-sm text-muted-foreground">
            Escolha o plano ideal para você. Quanto maior o investimento, maior o retorno!
          </p>
        </div>

        {/* Grid de Planos */}
        {plans.length > 0 ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {plans.map((plan) => (
              <PlanCard
                key={plan.id}
                title={plan.name}
                image={plan.image || "/assets/banner-investment.jpg"}
                investment={plan.price}
                dailyProfit={plan.daily_income || 0}
                cycle={plan.duration_days}
                totalReturn={plan.total_return}
                badge={plan.is_featured ? "Destaque" : undefined}
                onSelect={() => handleSelectPlan(plan)}
              />
            ))}
          </div>
        ) : (
          /* Empty State */
          <div className="text-center py-12">
            <Package className="w-16 h-16 mx-auto mb-4 text-muted-foreground opacity-50" />
            <h3 className="text-lg font-semibold text-foreground mb-2">
              Nenhum Plano Disponível
            </h3>
            <p className="text-sm text-muted-foreground mb-4 max-w-md mx-auto">
              No momento não há planos de investimento disponíveis. Tente novamente mais tarde.
            </p>
            <Button
              onClick={() => navigate("/")}
              variant="outline"
            >
              Voltar para Início
            </Button>
          </div>
        )}

        {/* Como Funciona */}
        <div className="mt-6 rounded-xl bg-card p-4 border border-border">
          <h3 className="mb-3 text-sm font-bold text-foreground">Como Funciona?</h3>
          <ul className="space-y-2 text-xs text-muted-foreground">
            <li>✅ Escolha seu plano de investimento</li>
            <li>✅ O valor será debitado do seu saldo disponível</li>
            <li>✅ Receba lucros diariamente durante o ciclo</li>
            <li>✅ Ao final do ciclo, seus ganhos são liberados para saque</li>
            <li>✅ Você pode ter múltiplos investimentos ativos simultaneamente</li>
            <li>⚠️ Certifique-se de ter saldo suficiente antes de investir</li>
          </ul>
        </div>
      </div>

      <BottomNavigation />
    </div>
  );
};

export default Plans;

