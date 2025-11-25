import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, Copy, Share2, Users, Users2, TrendingUp, CheckCircle2, Loader2, Info, Target } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { toast } from "@/hooks/use-toast";
import BottomNavigation from "@/components/BottomNavigation";
import TeamLevelCard from "@/components/TeamLevelCard";
import MembersList from "@/components/MembersList";
import GoalsSection from "@/components/GoalsSection";
import CommissionDetailsDialog from "@/components/CommissionDetailsDialog";
import { networkAPI } from "@/lib/api";

interface TeamStats {
  level: string;
  members: number;
  activeMembers: number;
  inactiveMembers: number;
  subtitle: string;
  totalDeposits: number;
  color: "yellow" | "green" | "red";
}

const Members = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [referralCode, setReferralCode] = useState("");
  const [referralLink, setReferralLink] = useState("");
  const [teamStats, setTeamStats] = useState<TeamStats[]>([]);
  const [directNetworkVolume, setDirectNetworkVolume] = useState(0);

  useEffect(() => {
    const loadNetworkData = async () => {
      try {
        setIsLoading(true);
        
        // Buscar estatísticas da rede
        const statsResponse = await networkAPI.getStats();
        const data = statsResponse.data.data;
        
        setReferralCode(data.referral_code || "");
        setReferralLink(data.referral_link || "");
        
        // Formatar dados para os TeamLevelCards
        const formattedStats: TeamStats[] = data.levels.map((level: any, index: number) => ({
          level: level.level_name,
          members: level.members,
          activeMembers: level.active_members || 0,
          inactiveMembers: level.inactive_members || 0,
          subtitle: `Número de Membros ${level.level_name}`,
          totalDeposits: level.total_deposits || 0,
          color: index === 0 ? "yellow" : index === 1 ? "green" : "red"
        }));
        
        setTeamStats(formattedStats);
        
        // Volume direto da rede (nível A)
        setDirectNetworkVolume(formattedStats[0]?.totalDeposits || 0);
      } catch (error: any) {
        toast({
          title: "Erro",
          description: "Não foi possível carregar os dados da rede",
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

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto text-primary" />
          <p className="mt-2 text-muted-foreground">Carregando rede...</p>
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
          <h1 className="text-lg font-bold text-foreground">Programa de Indicação</h1>
          <div className="ml-auto">
            <CommissionDetailsDialog />
          </div>
        </div>
      </header>

      <div className="container max-w-lg px-4 py-6 space-y-6">
        {/* Código de Indicação */}
        <Card className="border-accent/30 bg-gradient-to-br from-accent/10 to-accent/5 p-6">
          <div className="space-y-4">
            <div className="text-center">
              <p className="text-sm text-muted-foreground mb-2">Seu Código de Indicação</p>
              <p className="text-2xl font-bold text-foreground mb-4">{referralCode || "Carregando..."}</p>
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

        {/* Cards de Estatísticas por Nível */}
        <div>
          <p className="text-center text-sm text-muted-foreground mb-4">Número da Equipe:</p>
          <div className="grid grid-cols-3 gap-3">
            {teamStats.length > 0 ? (
              teamStats.map((stat) => (
                <TeamLevelCard key={stat.level} {...stat} />
              ))
            ) : (
              <div className="col-span-3 text-center py-8 text-muted-foreground">
                <Users className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p>Você ainda não tem membros na sua rede</p>
                <p className="text-xs mt-1">Compartilhe seu código para começar!</p>
              </div>
            )}
          </div>
        </div>
        
        {/* Seção de Metas de Volume */}
        <GoalsSection currentVolume={directNetworkVolume} />

        {/* Tabela de Comissões - Mantida como referência rápida */}
        <Card className="border-border bg-card p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-foreground">Tabela de Comissões</h3>
            <Button 
              variant="ghost" 
              size="sm"
              className="text-xs text-primary hover:text-primary/80"
              onClick={() => document.querySelector('[data-commission-details]')?.dispatchEvent(new MouseEvent('click', { bubbles: true }))}
            >
              <Info className="w-3 h-3 mr-1" />
              Ver Detalhes
            </Button>
          </div>
          
          <div className="space-y-3">
            <div>
              <p className="text-xs font-semibold text-muted-foreground mb-2">Primeira Compra</p>
              <div className="space-y-2">
                <div className="flex items-center justify-between p-2 rounded-lg bg-accent/10">
                  <span className="text-sm text-foreground">Nível A</span>
                  <span className="text-sm font-bold text-accent">15%</span>
                </div>
                <div className="flex items-center justify-between p-2 rounded-lg bg-primary/10">
                  <span className="text-sm text-foreground">Nível B</span>
                  <span className="text-sm font-bold text-primary">2%</span>
                </div>
                <div className="flex items-center justify-between p-2 rounded-lg bg-success/10">
                  <span className="text-sm text-foreground">Nível C</span>
                  <span className="text-sm font-bold text-success">1%</span>
                </div>
              </div>
            </div>

            <div>
              <p className="text-xs font-semibold text-muted-foreground mb-2">Segunda Compra em Diante</p>
              <div className="space-y-2">
                <div className="flex items-center justify-between p-2 rounded-lg bg-accent/10">
                  <span className="text-sm text-foreground">Nível A</span>
                  <span className="text-sm font-bold text-accent">8%</span>
                </div>
                <div className="flex items-center justify-between p-2 rounded-lg bg-primary/10">
                  <span className="text-sm text-foreground">Nível B</span>
                  <span className="text-sm font-bold text-primary">2%</span>
                </div>
                <div className="flex items-center justify-between p-2 rounded-lg bg-success/10">
                  <span className="text-sm text-foreground">Nível C</span>
                  <span className="text-sm font-bold text-success">1%</span>
                </div>
              </div>
            </div>
          </div>
        </Card>

        {/* Como Funciona */}
        <Card className="border-warning/30 bg-warning/10 p-4">
          <h3 className="text-sm font-semibold text-foreground mb-3">💡 Como Funciona?</h3>
          <div className="space-y-2 text-xs text-foreground">
            <p>• <strong>Nível A:</strong> Indicações diretas (15% → 8%)</p>
            <p>• <strong>Nível B:</strong> Indicações de segundo nível (2%)</p>
            <p>• <strong>Nível C:</strong> Indicações de terceiro nível (1%)</p>
            <p className="mt-3 pt-3 border-t border-warning/30">
              <strong>Importante:</strong> Percentuais aplicados na primeira e demais compras. Toque no ícone ℹ️ acima para ver detalhes completos!
            </p>
          </div>
        </Card>
        {/* Lista Completa de Membros */}
        <MembersList />
      </div>

      <BottomNavigation />
    </div>
  );
};

export default Members;
