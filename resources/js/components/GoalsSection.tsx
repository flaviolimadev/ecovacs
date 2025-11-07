import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { CheckCircle2, Circle, TrendingUp, Target, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from "@/components/ui/dialog";

interface Goal {
  volume: number;
  reward: number;
  achieved: boolean;
}

interface GoalsSectionProps {
  currentVolume: number;
}

const GoalsSection = ({ currentVolume }: GoalsSectionProps) => {
  const goals: Goal[] = [
    { volume: 5000, reward: 150, achieved: currentVolume >= 5000 },
    { volume: 10000, reward: 500, achieved: currentVolume >= 10000 },
    { volume: 15000, reward: 750, achieved: currentVolume >= 15000 },
    { volume: 30000, reward: 1500, achieved: currentVolume >= 30000 },
    { volume: 50000, reward: 2500, achieved: currentVolume >= 50000 },
    { volume: 100000, reward: 5000, achieved: currentVolume >= 100000 },
    { volume: 200000, reward: 10000, achieved: currentVolume >= 200000 },
    { volume: 300000, reward: 15000, achieved: currentVolume >= 300000 },
  ];

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const formatVolume = (value: number) => {
    if (value >= 1000) {
      return `${(value / 1000).toFixed(0)}k`;
    }
    return value.toString();
  };

  const getProgressToNextGoal = () => {
    const nextGoal = goals.find(g => !g.achieved);
    if (!nextGoal) return 100;
    return (currentVolume / nextGoal.volume) * 100;
  };

  const getNextGoal = () => {
    return goals.find(g => !g.achieved);
  };

  const achievedGoals = goals.filter(g => g.achieved).length;

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button 
          variant="outline" 
          className="w-full h-auto py-4 bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20 hover:from-primary/10 hover:to-primary/20"
        >
          <div className="flex items-center justify-between w-full">
            <div className="flex items-center gap-2">
              <Target className="w-5 h-5 text-primary" />
              <span className="font-semibold text-foreground">Metas de Volume</span>
            </div>
            <div className="text-right">
              <p className="text-xs text-muted-foreground">Atingidas</p>
              <p className="text-sm font-bold text-green-600">{achievedGoals}/{goals.length}</p>
            </div>
          </div>
        </Button>
      </DialogTrigger>
      
      <DialogContent className="max-w-md max-h-[85vh] overflow-y-auto bg-background">
        <DialogClose className="absolute right-4 top-4 rounded-full p-1 hover:bg-accent transition-colors z-50">
          <X className="h-5 w-5" />
          <span className="sr-only">Fechar</span>
        </DialogClose>
        
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-primary" />
            Metas de Volume Direto
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Summary Card */}
          <Card className="p-4 bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Volume Atual:</span>
                <span className="font-bold text-primary">{formatCurrency(currentVolume)}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Metas Atingidas:</span>
                <span className="font-bold text-green-600">{achievedGoals}/{goals.length}</span>
              </div>
            </div>

            {/* Progress to next goal */}
            {getNextGoal() && (
              <div className="mt-4">
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="text-muted-foreground">Próxima meta: {formatCurrency(getNextGoal()!.volume)}</span>
                  <span className="font-medium text-primary">{getProgressToNextGoal().toFixed(0)}%</span>
                </div>
                <Progress value={getProgressToNextGoal()} className="h-2" />
              </div>
            )}
          </Card>

          {/* Goals Grid */}
          <div className="grid gap-3">
            {goals.map((goal, index) => (
              <Card
                key={index}
                className={`p-4 transition-all ${
                  goal.achieved
                    ? "bg-gradient-to-br from-green-50 to-green-100 border-green-200"
                    : currentVolume > 0 && currentVolume < goal.volume
                    ? "bg-gradient-to-br from-yellow-50 to-yellow-100 border-yellow-200"
                    : "bg-card"
                }`}
              >
                <div className="flex items-center gap-3">
                  {/* Icon */}
                  <div className="shrink-0">
                    {goal.achieved ? (
                      <CheckCircle2 className="w-8 h-8 text-green-600" />
                    ) : (
                      <Circle className="w-8 h-8 text-muted-foreground" />
                    )}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <span className={`text-sm font-semibold ${
                        goal.achieved ? "text-green-700" : "text-foreground"
                      }`}>
                        Volume: {formatCurrency(goal.volume)}
                      </span>
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                        goal.achieved 
                          ? "bg-green-600 text-white" 
                          : "bg-primary/10 text-primary"
                      }`}>
                        {goal.achieved ? "✓ Atingida" : "Pendente"}
                      </span>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-muted-foreground">Recompensa:</span>
                      <span className={`text-sm font-bold ${
                        goal.achieved ? "text-green-600" : "text-primary"
                      }`}>
                        {formatCurrency(goal.reward)}
                      </span>
                    </div>

                    {/* Progress bar for non-achieved goals */}
                    {!goal.achieved && currentVolume > 0 && (
                      <div className="mt-2">
                        <Progress 
                          value={Math.min((currentVolume / goal.volume) * 100, 100)} 
                          className="h-1.5"
                        />
                        <p className="text-[10px] text-muted-foreground mt-1">
                          Faltam {formatCurrency(goal.volume - currentVolume)}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default GoalsSection;
