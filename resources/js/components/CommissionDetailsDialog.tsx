import { useState } from "react";
import { Info, TrendingUp, Users, Percent, DollarSign, Loader2, X } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { networkAPI } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";

interface CommissionData {
  summary: {
    total_earned: number;
    first_purchase_total: number;
    subsequent_purchase_total: number;
    residual_total?: number;
    total_commissions_count: number;
  };
  first_purchase: {
    total: number;
    count: number;
    by_level: Array<{
      level: number;
      percentage: number;
      count: number;
      total: number;
    }>;
  };
  subsequent_purchase: {
    total: number;
    count: number;
    by_level: Array<{
      level: number;
      percentage: number;
      count: number;
      total: number;
    }>;
  };
  residual?: {
    total: number;
    count: number;
    by_level: Array<{
      level: number;
      percentage: number;
      count: number;
      total: number;
    }>;
  };
  percentages_config: {
    first_purchase: Array<{
      level: number;
      percentage: number;
    }>;
    subsequent_purchase: Array<{
      level: number;
      percentage: number;
    }>;
    residual: Array<{
      level: number;
      percentage: number;
    }>;
  };
}

const CommissionDetailsDialog = () => {
  const { toast } = useToast();
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [data, setData] = useState<CommissionData | null>(null);

  const loadData = async () => {
    try {
      setIsLoading(true);
      const response = await networkAPI.getCommissionDetails();
      setData(response.data.data);
    } catch (error: any) {
      toast({
        title: "Erro",
        description: "Não foi possível carregar os detalhes de comissões",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenChange = (open: boolean) => {
    setIsOpen(open);
    if (open && !data) {
      loadData();
    }
  };

  const getLevelName = (level: number) => {
    return ['A', 'B', 'C'][level - 1] || level;
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <button className="p-2 hover:bg-white/10 rounded-full transition-colors">
          <Info className="w-6 h-6" />
        </button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogClose className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-accent data-[state=open]:text-muted-foreground">
          <X className="h-4 w-4" />
          <span className="sr-only">Fechar</span>
        </DialogClose>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-primary" />
            Detalhes de Comissões
          </DialogTitle>
          <DialogDescription>
            Veja suas porcentagens de comissão e quanto você já ganhou
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : data ? (
          <div className="space-y-4">
            {/* Resumo Geral */}
            <Card className="p-4 bg-gradient-to-br from-green-50 to-emerald-100 border-green-200">
              <div className="flex items-center gap-2 mb-3">
                <DollarSign className="w-5 h-5 text-green-600" />
                <h3 className="font-semibold text-foreground">Resumo Geral</h3>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <p className="text-xs text-muted-foreground">Total Ganho</p>
                  <p className="text-lg font-bold text-green-600">
                    R$ {data.summary.total_earned.toFixed(2)}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Total de Comissões</p>
                  <p className="text-lg font-bold text-foreground">
                    {data.summary.total_commissions_count}
                  </p>
                </div>
              </div>
            </Card>

            {/* Primeira Compra */}
            <Card className="p-4 bg-gradient-to-br from-blue-50 to-purple-100 border-blue-200">
              <div className="flex items-center gap-2 mb-3">
                <Users className="w-5 h-5 text-blue-600" />
                <h3 className="font-semibold text-foreground">Primeira Compra (Indicação)</h3>
              </div>
              
              <div className="mb-4 p-3 bg-white/50 rounded-lg">
                <p className="text-sm font-medium text-foreground mb-2">Total Ganho:</p>
                <p className="text-2xl font-bold text-blue-600">
                  R$ {data.summary.first_purchase_total.toFixed(2)}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {data.first_purchase.count} comissões recebidas
                </p>
              </div>

              <div className="space-y-2">
                <p className="text-sm font-semibold text-foreground flex items-center gap-2">
                  <Percent className="w-4 h-4" />
                  Porcentagens por Nível:
                </p>
                {data.percentages_config.first_purchase.map((config) => {
                  const levelData = data.first_purchase.by_level.find(l => l.level === config.level);
                  return (
                    <div
                      key={config.level}
                      className="flex items-center justify-between p-2 bg-white/50 rounded"
                    >
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-blue-600">Nível {getLevelName(config.level)}:</span>
                        <span className="text-lg font-bold text-foreground">{config.percentage}%</span>
                      </div>
                      <div className="text-right">
                        {levelData && (
                          <>
                            <p className="text-sm font-semibold text-green-600">
                              R$ {levelData.total.toFixed(2)}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {levelData.count} indicações
                            </p>
                          </>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </Card>

            {/* Compras Subsequentes */}
            <Card className="p-4 bg-gradient-to-br from-orange-50 to-pink-100 border-orange-200">
              <div className="flex items-center gap-2 mb-3">
                <Users className="w-5 h-5 text-orange-600" />
                <h3 className="font-semibold text-foreground">Compras Subsequentes</h3>
              </div>
              
              <div className="mb-4 p-3 bg-white/50 rounded-lg">
                <p className="text-sm font-medium text-foreground mb-2">Total Ganho:</p>
                <p className="text-2xl font-bold text-orange-600">
                  R$ {data.summary.subsequent_purchase_total.toFixed(2)}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {data.subsequent_purchase.count} comissões recebidas
                </p>
              </div>

              <div className="space-y-2">
                <p className="text-sm font-semibold text-foreground flex items-center gap-2">
                  <Percent className="w-4 h-4" />
                  Porcentagens por Nível:
                </p>
                {data.percentages_config.subsequent_purchase.map((config) => {
                  const levelData = data.subsequent_purchase.by_level.find(l => l.level === config.level);
                  return (
                    <div
                      key={config.level}
                      className="flex items-center justify-between p-2 bg-white/50 rounded"
                    >
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-orange-600">Nível {getLevelName(config.level)}:</span>
                        <span className="text-lg font-bold text-foreground">{config.percentage}%</span>
                      </div>
                      <div className="text-right">
                        {levelData && (
                          <>
                            <p className="text-sm font-semibold text-green-600">
                              R$ {levelData.total.toFixed(2)}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {levelData.count} comissões
                            </p>
                          </>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </Card>

            {/* Comissões Residuais */}
            <Card className="p-4 bg-gradient-to-br from-emerald-50 to-teal-100 border-emerald-200">
              <div className="flex items-center gap-2 mb-3">
                <TrendingUp className="w-5 h-5 text-emerald-600" />
                <h3 className="font-semibold text-foreground">Comissões Residuais</h3>
              </div>
              
              <div className="mb-4 p-3 bg-white/50 rounded-lg">
                <p className="text-sm font-medium text-foreground mb-2">Total Ganho:</p>
                <p className="text-2xl font-bold text-emerald-600">
                  R$ {(data.summary.residual_total || 0).toFixed(2)}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {data.residual?.count || 0} comissões recebidas
                </p>
              </div>

              <div className="space-y-2">
                <p className="text-sm font-semibold text-foreground flex items-center gap-2">
                  <Percent className="w-4 h-4" />
                  Porcentagens por Nível:
                </p>
                {data.percentages_config.residual.map((config) => {
                  const levelData = data.residual?.by_level.find(l => l.level === config.level);
                  return (
                    <div
                      key={config.level}
                      className="flex items-center justify-between p-2 bg-white/50 rounded"
                    >
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-emerald-600">Nível {getLevelName(config.level)}:</span>
                        <span className="text-lg font-bold text-foreground">{config.percentage}%</span>
                      </div>
                      <div className="text-right">
                        {levelData ? (
                          <>
                            <p className="text-sm font-semibold text-green-600">
                              R$ {levelData.total.toFixed(2)}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {levelData.count} comissões
                            </p>
                          </>
                        ) : (
                          <p className="text-xs text-muted-foreground">
                            R$ 0,00
                          </p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </Card>

            {/* Informação Adicional */}
            <div className="p-3 bg-muted rounded-lg text-xs text-muted-foreground">
              <p className="font-semibold mb-1">ℹ️ Como funciona:</p>
              <ul className="space-y-1 ml-4">
                <li>• <strong>Primeira Compra:</strong> Comissão recebida quando alguém da sua rede faz o primeiro investimento</li>
                <li>• <strong>Compras Subsequentes:</strong> Comissão recebida quando alguém da sua rede faz investimentos adicionais</li>
                <li>• <strong>Comissões Residuais:</strong> Comissão recebida sobre os rendimentos gerados pelos planos da sua rede</li>
                <li>• <strong>Nível A:</strong> Indicados diretos (você indicou)</li>
                <li>• <strong>Nível B:</strong> Indicados dos seus indicados</li>
                <li>• <strong>Nível C:</strong> Indicados de nível 2</li>
              </ul>
            </div>
          </div>
        ) : null}
      </DialogContent>
    </Dialog>
  );
};

export default CommissionDetailsDialog;

