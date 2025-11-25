import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, Copy, Share2, Users, Users2, TrendingUp, CheckCircle2, Loader2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { toast } from "@/hooks/use-toast";
import BottomNavigation from "@/components/BottomNavigation";
import { networkAPI } from "@/lib/api";

interface Referral {
  id: string;
  name: string;
  level: 1 | 2 | 3;
  purchases: number;
  totalEarned: number;
  joinDate: Date;
  status: "active" | "inactive";
}

const Members = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [referralCode, setReferralCode] = useState("");
  const [referralLink, setReferralLink] = useState("");
  const [mockReferrals, setMockReferrals] = useState<Referral[]>([]);
  const [stats, setStats] = useState({
    level1: 0,
    level2: 0,
    level3: 0,
    totalEarned: 0,
  });

  useEffect(() => {
    const loadNetworkData = async () => {
      try {
        setIsLoading(true);
        const [statsResponse, membersResponse] = await Promise.all([
          networkAPI.getStats(),
          networkAPI.getMembers(),
        ]);

        const networkStats = statsResponse.data.data;
        setReferralCode(networkStats.referral_code);
        setReferralLink(networkStats.referral_link);

        setStats({
          level1: networkStats.levels.find((l: any) => l.level_name === 'A')?.members || 0,
          level2: networkStats.levels.find((l: any) => l.level_name === 'B')?.members || 0,
          level3: networkStats.levels.find((l: any) => l.level_name === 'C')?.members || 0,
          totalEarned: networkStats.total_commission_earned || 0,
        });

        // Mapear membros da API para o formato Referral
        const formattedMembers: Referral[] = membersResponse.data.data.map((member: any) => ({
          id: member.id.toString(),
          name: member.name || member.email,
          level: member.level as 1 | 2 | 3,
          purchases: member.total_purchases || 0,
          totalEarned: member.total_commission_earned || 0,
          joinDate: new Date(member.created_at),
          status: member.is_active ? "active" : "inactive",
        }));
        setMockReferrals(formattedMembers);

      } catch (error) {
        console.error("Failed to load network data:", error);
        toast({
          title: "Erro",
          description: "Não foi possível carregar os dados da rede.",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };
    loadNetworkData();
  }, []);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copiado!",
      description: "Código copiado para a área de transferência",
    });
  };

  const shareReferral = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: "Invista em Ouro Comigo!",
          text: `Junte-se a mim na AngloGold e ganhe dinheiro investindo em ouro! Use meu código: ${referralCode}`,
          url: referralLink,
        });
      } catch (error) {
        console.log("Share cancelled");
      }
    } else {
      copyToClipboard(referralLink);
    }
  };

  const getLevelColor = (level: number) => {
    switch (level) {
      case 1:
        return "text-accent";
      case 2:
        return "text-primary";
      case 3:
        return "text-success";
      default:
        return "text-muted-foreground";
    }
  };

  const getLevelBg = (level: number) => {
    switch (level) {
      case 1:
        return "bg-accent/20";
      case 2:
        return "bg-primary/20";
      case 3:
        return "bg-success/20";
      default:
        return "bg-muted";
    }
  };

  return (
    <div className="min-h-screen bg-background pb-20">
      <header className="sticky top-0 z-40 border-b border-border bg-background/95 backdrop-blur-lg">
        <div className="flex items-center gap-4 px-4 py-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate("/profile")}
            className="hover:bg-secondary"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-lg font-bold text-foreground">Programa de Indicação</h1>
        </div>
      </header>

      <div className="container max-w-lg px-4 py-6 space-y-6">
        {/* Código de Indicação */}
        <Card className="border-accent/30 bg-gradient-to-br from-accent/10 to-accent/5 p-6">
          <div className="space-y-4">
            <div className="text-center">
              <p className="text-sm text-muted-foreground mb-2">Seu Código de Indicação</p>
              <p className="text-2xl font-bold text-foreground mb-4">{referralCode}</p>
            </div>

            <div className="space-y-2">
              <div className="flex gap-2">
                <Input
                  value={referralLink}
                  readOnly
                  className="bg-background border-border"
                />
                <Button
                  size="icon"
                  variant="outline"
                  onClick={() => copyToClipboard(referralLink)}
                  className="flex-shrink-0"
                >
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
              
              <Button
                onClick={shareReferral}
                className="w-full bg-accent text-accent-foreground hover:bg-accent/90"
              >
                <Share2 className="mr-2 h-4 w-4" />
                Compartilhar Link
              </Button>
            </div>
          </div>
        </Card>

        {/* Estatísticas */}
        <div className="grid grid-cols-2 gap-3">
          <Card className="border-accent/30 bg-card p-4 text-center">
            <Users className="h-6 w-6 text-accent mx-auto mb-2" />
            <p className="text-xl font-bold text-foreground">{stats.level1}</p>
            <p className="text-xs text-muted-foreground">Nível 1</p>
          </Card>
          
          <Card className="border-primary/30 bg-card p-4 text-center">
            <Users2 className="h-6 w-6 text-primary mx-auto mb-2" />
            <p className="text-xl font-bold text-foreground">{stats.level2}</p>
            <p className="text-xs text-muted-foreground">Nível 2</p>
          </Card>
          
          <Card className="border-success/30 bg-card p-4 text-center">
            <TrendingUp className="h-6 w-6 text-success mx-auto mb-2" />
            <p className="text-xl font-bold text-foreground">{stats.level3}</p>
            <p className="text-xs text-muted-foreground">Nível 3</p>
          </Card>

          <Card className="border-border bg-gradient-to-br from-primary to-primary/80 p-4 text-center">
            <p className="text-xs text-primary-foreground/90 mb-1">Ganhos</p>
            <p className="text-sm font-bold text-primary-foreground">R$ {stats.totalEarned.toFixed(2)}</p>
          </Card>
        </div>

        {/* Tabela de Comissões */}
        <Card className="border-border bg-card p-6">
          <h3 className="text-sm font-bold text-foreground mb-4">Tabela de Comissões</h3>
          
          <div className="space-y-4">
            <div>
              <p className="text-xs font-semibold text-muted-foreground mb-2">Primeira Compra</p>
              <div className="space-y-2">
                <div className="flex items-center justify-between p-2 rounded-lg bg-accent/10">
                  <span className="text-sm text-foreground">Nível 1</span>
                  <span className="text-sm font-bold text-accent">15%</span>
                </div>
                <div className="flex items-center justify-between p-2 rounded-lg bg-primary/10">
                  <span className="text-sm text-foreground">Nível 2</span>
                  <span className="text-sm font-bold text-primary">2%</span>
                </div>
                <div className="flex items-center justify-between p-2 rounded-lg bg-success/10">
                  <span className="text-sm text-foreground">Nível 3</span>
                  <span className="text-sm font-bold text-success">1%</span>
                </div>
              </div>
            </div>

            <div>
              <p className="text-xs font-semibold text-muted-foreground mb-2">Segunda Compra em Diante</p>
              <div className="space-y-2">
                <div className="flex items-center justify-between p-2 rounded-lg bg-accent/10">
                  <span className="text-sm text-foreground">Nível 1</span>
                  <span className="text-sm font-bold text-accent">8%</span>
                </div>
                <div className="flex items-center justify-between p-2 rounded-lg bg-primary/10">
                  <span className="text-sm text-foreground">Nível 2</span>
                  <span className="text-sm font-bold text-primary">2%</span>
                </div>
                <div className="flex items-center justify-between p-2 rounded-lg bg-success/10">
                  <span className="text-sm text-foreground">Nível 3</span>
                  <span className="text-sm font-bold text-success">1%</span>
                </div>
              </div>
            </div>
          </div>
        </Card>

        {/* Como Funciona */}
        <Card className="border-warning/30 bg-warning/10 p-4">
          <h3 className="text-sm font-semibold text-foreground mb-3">Como Funciona?</h3>
          <div className="space-y-2 text-xs text-foreground">
            <p>• <strong>Nível 1:</strong> Pessoas que você indicou diretamente</p>
            <p>• <strong>Nível 2:</strong> Pessoas indicadas pelos seus indicados</p>
            <p>• <strong>Nível 3:</strong> Pessoas indicadas pelos indicados de nível 2</p>
            <p className="mt-3 pt-3 border-t border-warning/30">
              <strong>Importante:</strong> As comissões são calculadas sobre o valor do pacote comprado, não sobre o depósito.
            </p>
          </div>
        </Card>

        {/* Lista de Indicados */}
        <div className="space-y-3">
          <h3 className="text-sm font-bold text-foreground">Minha Rede ({mockReferrals.length})</h3>
          
          {mockReferrals.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Users className="w-12 h-12 mx-auto mb-2 opacity-50" />
              <p>Você ainda não tem membros na sua rede</p>
              <p className="text-xs mt-1">Compartilhe seu código para começar!</p>
            </div>
          ) : (
            mockReferrals.map((referral) => (
              <motion.div
                key={referral.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
              >
                <Card className="border-border bg-card p-4">
                  <div className="flex items-center gap-3">
                    <div className={`flex-shrink-0 rounded-full ${getLevelBg(referral.level)} p-2.5`}>
                      {referral.level === 1 && <Users className={`h-5 w-5 ${getLevelColor(1)}`} />}
                      {referral.level === 2 && <Users2 className={`h-5 w-5 ${getLevelColor(2)}`} />}
                      {referral.level === 3 && <TrendingUp className={`h-5 w-5 ${getLevelColor(3)}`} />}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="font-semibold text-foreground text-sm">{referral.name}</p>
                        {referral.status === "active" && (
                          <CheckCircle2 className="h-4 w-4 text-success flex-shrink-0" />
                        )}
                      </div>
                      
                      <div className="flex items-center gap-3 text-xs text-muted-foreground">
                        <span>Nível {referral.level}</span>
                        <span>•</span>
                        <span>{referral.purchases} compra{referral.purchases > 1 ? 's' : ''}</span>
                        <span>•</span>
                        <span>{referral.joinDate.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}</span>
                      </div>
                    </div>
                    
                    <div className="flex-shrink-0 text-right">
                      <p className="text-sm font-bold text-success">
                        +R$ {referral.totalEarned.toFixed(2)}
                      </p>
                    </div>
                  </div>
                </Card>
              </motion.div>
            ))
          )}
        </div>
      </div>

      <BottomNavigation />
    </div>
  );
};

export default Members;
