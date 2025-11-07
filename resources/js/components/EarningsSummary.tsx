import { Card } from "@/components/ui/card";
import { Package, DollarSign, TrendingUp } from "lucide-react";

interface EarningsSummaryProps {
  totalActive: number;
  totalInvested: number;
  totalEarned: number;
}

const EarningsSummary = ({ totalActive, totalInvested, totalEarned }: EarningsSummaryProps) => {
  return (
    <div className="px-4 mt-4">
      <div className="grid grid-cols-3 gap-2">
        <Card className="p-2 text-center bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
          <Package className="w-4 h-4 mx-auto mb-1 text-blue-600" />
          <p className="text-lg font-bold text-blue-700">{totalActive}</p>
          <p className="text-[10px] text-blue-600 mt-0.5">Pacotes Ativos</p>
        </Card>
        
        <Card className="p-2 text-center bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
          <DollarSign className="w-4 h-4 mx-auto mb-1 text-purple-600" />
          <p className="text-sm font-bold text-purple-700">R$ {totalInvested}</p>
          <p className="text-[10px] text-purple-600 mt-0.5">Investido</p>
        </Card>
        
        <Card className="p-2 text-center bg-gradient-to-br from-green-50 to-green-100 border-green-200">
          <TrendingUp className="w-4 h-4 mx-auto mb-1 text-green-600" />
          <p className="text-sm font-bold text-green-700">R$ {totalEarned.toFixed(2)}</p>
          <p className="text-[10px] text-green-600 mt-0.5">Ganho Total</p>
        </Card>
      </div>
    </div>
  );
};

export default EarningsSummary;
