import { motion } from "framer-motion";
import { TrendingUp, Calendar, DollarSign, Target } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface PlanCardProps {
  title: string;
  image: string;
  investment: number;
  dailyProfit: number;
  cycle: number;
  totalReturn: number;
  badge?: string;
  onSelect: () => void;
}

const PlanCard = ({
  title,
  image,
  investment,
  dailyProfit,
  cycle,
  totalReturn,
  badge,
  onSelect,
}: PlanCardProps) => {
  const profitPercentage = ((totalReturn - investment) / investment * 100).toFixed(0);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -4 }}
      transition={{ duration: 0.2 }}
    >
      <Card className="overflow-hidden border-border bg-card shadow-md hover:shadow-lg transition-shadow">
        <div className="relative h-40 overflow-hidden">
          <img
            src={image}
            alt={title}
            className="h-full w-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
          
          {badge && (
            <div className="absolute right-2 top-2 rounded-full bg-accent px-3 py-1 shadow-lg">
              <span className="text-xs font-bold text-accent-foreground">{badge}</span>
            </div>
          )}

          <div className="absolute bottom-2 left-3">
            <h3 className="text-lg font-bold text-white">{title}</h3>
          </div>
        </div>

        <div className="space-y-3 p-4">
          <div className="flex items-center justify-between rounded-lg bg-primary/10 p-3">
            <span className="text-xs text-muted-foreground">Investimento</span>
            <span className="text-lg font-bold text-primary">
              R$ {investment.toFixed(2)}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div className="flex items-center gap-2 rounded-lg bg-success/10 p-2">
              <TrendingUp className="h-4 w-4 text-success" />
              <div className="flex flex-col">
                <span className="text-[10px] text-muted-foreground">Lucro/dia</span>
                <span className="text-sm font-bold text-success">
                  R$ {dailyProfit.toFixed(2)}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2 rounded-lg bg-accent/10 p-2">
              <Calendar className="h-4 w-4 text-accent" />
              <div className="flex flex-col">
                <span className="text-[10px] text-muted-foreground">Ciclo</span>
                <span className="text-sm font-bold text-accent">
                  {cycle} dias
                </span>
              </div>
            </div>
          </div>

          <div className="rounded-lg border-2 border-success/30 bg-success/5 p-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Target className="h-5 w-5 text-success" />
                <span className="text-xs font-semibold text-foreground">
                  Retorno Total
                </span>
              </div>
              <div className="text-right">
                <div className="text-lg font-bold text-success">
                  R$ {totalReturn.toFixed(2)}
                </div>
                <div className="text-[10px] text-success/80">
                  +{profitPercentage}% de lucro
                </div>
              </div>
            </div>
          </div>

          <Button
            onClick={onSelect}
            className="w-full bg-primary text-primary-foreground hover:bg-primary/90"
            size="lg"
          >
            Investir Agora
          </Button>
        </div>
      </Card>
    </motion.div>
  );
};

export default PlanCard;

