import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Calendar, TrendingUp, Clock } from "lucide-react";

interface PackageData {
  id: number;
  name: string;
  image: string;
  purchaseDate: string;
  value: number;
  dailyIncome: number;
  duration: number;
  daysCompleted: number;
  totalEarned: number;
  lastPayment: {
    date: string;
    amount: number;
  } | null;
  status: string;
  cycleReward?: number;
}

interface ActivePackageCardProps {
  package: PackageData;
}

const ActivePackageCard = ({ package: pkg }: ActivePackageCardProps) => {
  const progress = (pkg.daysCompleted / pkg.duration) * 100;
  const isCyclePackage = pkg.cycleReward !== undefined;

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const getTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffHours < 1) return "Há alguns minutos";
    if (diffHours < 24) return `Há ${diffHours}h`;
    const diffDays = Math.floor(diffHours / 24);
    return `Há ${diffDays} dia${diffDays > 1 ? 's' : ''}`;
  };

  return (
    <Card className="overflow-hidden">
      <div className="flex gap-4 p-4">
        {/* Package Image */}
        <div className="w-24 h-24 bg-muted/30 rounded-lg flex items-center justify-center flex-shrink-0">
          <img 
            src={pkg.image} 
            alt={pkg.name}
            className="w-full h-full object-contain p-2"
          />
        </div>

        {/* Package Info */}
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-foreground mb-1 truncate">{pkg.name}</h3>
          
          <div className="space-y-1 text-xs text-muted-foreground mb-2">
            <div className="flex items-center gap-1">
              <Calendar className="w-3 h-3" />
              <span>Comprado em {formatDate(pkg.purchaseDate)}</span>
            </div>
            <div className="flex items-center gap-1">
              <Clock className="w-3 h-3" />
              <span>{pkg.daysCompleted}/{pkg.duration} dias completos</span>
            </div>
          </div>

          {/* Progress Bar */}
          <Progress value={progress} className="h-2 mb-2" />
          <p className="text-xs text-muted-foreground mb-2">{progress.toFixed(0)}% completo</p>

          {/* Earnings Info */}
          <div className="grid grid-cols-2 gap-2">
            <div className="bg-green-50 border border-green-200 rounded px-1.5 py-2">
              <p className="text-[9px] text-green-600 font-medium whitespace-nowrap overflow-hidden text-ellipsis">
                {isCyclePackage ? "Recompensa Final" : "Rend. Diário"}
              </p>
              <p className="text-sm font-bold text-green-700 whitespace-nowrap">
                R$ {isCyclePackage ? pkg.cycleReward : pkg.dailyIncome.toFixed(2)}
              </p>
            </div>
            <div className="bg-blue-50 border border-blue-200 rounded px-1.5 py-2">
              <p className="text-[9px] text-blue-600 font-medium whitespace-nowrap">Ganho Total</p>
              <p className="text-sm font-bold text-blue-700 whitespace-nowrap">R$ {pkg.totalEarned.toFixed(2)}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Last Payment Info */}
      {pkg.lastPayment && (
        <div className="bg-muted/30 px-4 py-2 border-t border-border">
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-1 text-muted-foreground">
              <TrendingUp className="w-3 h-3" />
              <span>Último rendimento:</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="font-semibold text-green-600">R$ {pkg.lastPayment.amount.toFixed(2)}</span>
              <span className="text-muted-foreground">• {getTimeAgo(pkg.lastPayment.date)}</span>
            </div>
          </div>
        </div>
      )}

      {isCyclePackage && !pkg.lastPayment && (
        <div className="bg-yellow-50 px-4 py-2 border-t border-yellow-200">
          <p className="text-xs text-yellow-700 text-center">
            💰 Lucro pago no final do ciclo ({pkg.duration} dias)
          </p>
        </div>
      )}
    </Card>
  );
};

export default ActivePackageCard;
