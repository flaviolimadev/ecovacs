import { Package, Loader2 } from "lucide-react";
import { useState, useEffect } from "react";
import ProductCard from "./ProductCard";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { plansAPI } from "@/lib/api";

interface Plan {
  id: number;
  name: string;
  image: string;
  price: number | string; // Laravel retorna decimal como string
  daily_income: number | string | null; // Laravel retorna decimal como string
  duration_days: number;
  total_return: number | string; // Laravel retorna decimal como string
  max_purchases: number;
  type: 'DAILY' | 'END_CYCLE';
}

const ProductsSection = () => {
  const [standardPlans, setStandardPlans] = useState<Plan[]>([]);
  const [cyclePlans, setCyclePlans] = useState<Plan[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadPlans = async () => {
      try {
        setIsLoading(true);
        const response = await plansAPI.getAll();
        const data = response.data.data;
        
        setStandardPlans(data.standard || []);
        setCyclePlans(data.cycle || []);
      } catch (error) {

      } finally {
        setIsLoading(false);
      }
    };

    loadPlans();
  }, []);

  // Formatar plano para o formato esperado pelo ProductCard
  const formatPlan = (plan: Plan) => {
    // Converter strings para números (Laravel retorna decimal como string)
    const price = typeof plan.price === 'string' ? parseFloat(plan.price) : plan.price;
    const dailyIncome = plan.daily_income 
      ? (typeof plan.daily_income === 'string' ? parseFloat(plan.daily_income) : plan.daily_income)
      : null;
    const totalReturn = typeof plan.total_return === 'string' ? parseFloat(plan.total_return) : plan.total_return;

    return {
      id: plan.id,
      name: plan.name,
      image: plan.image,
      price: `R$${price.toFixed(2).replace('.', ',')}`,
      dailyIncome: dailyIncome 
        ? `R$${dailyIncome.toFixed(2).replace('.', ',')}` 
        : "Lucro no final do ciclo",
      duration: `${plan.duration_days} dias`,
      totalReturn: `R$${totalReturn.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      maxPurchases: plan.max_purchases === 0 
        ? "Compra Ilimitado" 
        : `${plan.max_purchases} ${plan.max_purchases === 1 ? 'compra por vez' : 'planos por vez'}`
    };
  };

  if (isLoading) {
    return (
      <div className="mx-4 mt-6 mb-6 text-center py-12">
        <Loader2 className="w-8 h-8 animate-spin mx-auto text-primary mb-2" />
        <p className="text-sm text-muted-foreground">Carregando planos...</p>
      </div>
    );
  }

  return (
    <div className="mx-4 mt-6 mb-6">
      <div className="mb-4 flex items-center gap-2">
        <Package className="h-5 w-5 text-primary" />
        <h2 className="text-base font-bold text-foreground">Planos de Rendimento Progressivo</h2>
      </div>

      <Tabs defaultValue="standard" className="w-full">
        <TabsList className="grid w-full grid-cols-2 mb-4">
          <TabsTrigger value="standard">Diário</TabsTrigger>
          <TabsTrigger value="cycle">Ciclo</TabsTrigger>
        </TabsList>
        
        <TabsContent value="standard" className="space-y-3">
          {standardPlans.length > 0 ? (
            standardPlans.map((plan) => (
              <ProductCard key={plan.id} {...formatPlan(plan)} />
            ))
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <Package className="w-12 h-12 mx-auto mb-2 opacity-50" />
              <p>Nenhum plano diário disponível</p>
            </div>
          )}
        </TabsContent>
        
        <TabsContent value="cycle" className="space-y-3">
          {cyclePlans.length > 0 ? (
            cyclePlans.map((plan) => (
              <ProductCard key={plan.id} {...formatPlan(plan)} />
            ))
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <Package className="w-12 h-12 mx-auto mb-2 opacity-50" />
              <p>Nenhum plano ciclo disponível</p>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};
export default ProductsSection;