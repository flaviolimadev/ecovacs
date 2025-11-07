import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { CheckCircle2, XCircle } from "lucide-react";

interface TeamLevelCardProps {
  level: string;
  members: number;
  subtitle: string;
  totalDeposits: number;
  color: "yellow" | "green" | "red";
  activeMembers?: number;
  inactiveMembers?: number;
}

const TeamLevelCard = ({ level, members, subtitle, totalDeposits, color, activeMembers, inactiveMembers }: TeamLevelCardProps) => {
  const colorClasses = {
    yellow: "bg-yellow-100 border-yellow-200",
    green: "bg-green-100 border-green-200",
    red: "bg-red-100 border-red-200"
  };

  const textColorClasses = {
    yellow: "text-yellow-700",
    green: "text-green-700",
    red: "text-red-700"
  };

  const hasStatusData = activeMembers !== undefined && inactiveMembers !== undefined;

  return (
    <Card className={`${colorClasses[color]} border p-3 flex flex-col items-center justify-between h-full`}>
      <div className="text-center flex-1 w-full">
        <div className="text-3xl font-bold text-foreground mb-1">{members}</div>
        <p className={`text-[10px] leading-tight ${textColorClasses[color]} mb-2`}>
          {subtitle}
        </p>
        
        {/* Status de membros ativos/inativos */}
        {hasStatusData && members > 0 && (
          <div className="flex items-center justify-center gap-2 mb-2">
            <div className="flex items-center gap-0.5 text-[9px]">
              <CheckCircle2 className="w-3 h-3 text-green-600" />
              <span className="font-semibold text-green-700">{activeMembers}</span>
            </div>
            <div className="flex items-center gap-0.5 text-[9px]">
              <XCircle className="w-3 h-3 text-red-600" />
              <span className="font-semibold text-red-700">{inactiveMembers}</span>
            </div>
          </div>
        )}
        
        <p className={`text-xs font-semibold ${textColorClasses[color]}`}>
          R$ {totalDeposits.toFixed(2)}
        </p>
        <p className={`text-[9px] ${textColorClasses[color]}`}>Total Depósitos</p>
      </div>
      <Button 
        variant="default" 
        size="sm" 
        className="w-full mt-3 bg-[#2C3E50] hover:bg-[#34495E] text-white h-8 text-xs"
      >
        {level} nível
      </Button>
    </Card>
  );
};

export default TeamLevelCard;
