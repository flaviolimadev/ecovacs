import { ArrowLeft, Users, Loader2, Share2, Copy } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import TeamLevelCard from "@/components/TeamLevelCard";
import MembersList from "@/components/MembersList";
import GoalsSection from "@/components/GoalsSection";
import BottomNavigation from "@/components/BottomNavigation";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { networkAPI } from "@/lib/api";

const Members = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [teamStats, setTeamStats] = useState<any[]>([]);
  const [referralLink, setReferralLink] = useState("");
  const [referralCode, setReferralCode] = useState("");
  const [directNetworkVolume, setDirectNetworkVolume] = useState(0);

  useEffect(() => {
    const loadNetworkData = async () => {
      try {
        setIsLoading(true);
        
        // Buscar estatísticas da rede
        const statsResponse = await networkAPI.getStats();
        const stats = statsResponse.data.data;
        
        // Formatar dados para os cards
        const formattedStats = stats.levels.map((level: any, index: number) => ({
          level: level.level_name,
          members: level.members,
          activeMembers: level.active_members,
          inactiveMembers: level.inactive_members,
          subtitle: `Número de Membros ${level.level_name}`,
          totalDeposits: level.total_deposits,
          color: index === 0 ? "yellow" : index === 1 ? "green" : "red"
        }));
        
        setTeamStats(formattedStats);
        setReferralCode(stats.referral_code);
        setReferralLink(stats.referral_link);
        
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
  }, [toast]);

  const handleCopyLink = () => {
    navigator.clipboard.writeText(referralLink);
    toast({
      title: "Link copiado!",
      description: "O link de indicação foi copiado para a área de transferência.",
    });
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(referralCode);
    toast({
      title: "Código copiado!",
      description: "Seu código de indicação foi copiado.",
    });
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: "Junte-se à minha equipe!",
          text: `Use meu código de indicação: ${referralCode}`,
          url: referralLink,
        });
      } catch (error) {
        // User cancelled share
      }
    } else {
      handleCopyLink();
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
    <div className="relative min-h-screen bg-background pb-20">
      {/* Header */}
      <div className="bg-primary text-primary-foreground p-6 rounded-b-3xl">
        <div className="flex items-center justify-between mb-4">
          <button onClick={() => navigate("/")} className="p-2 hover:bg-white/10 rounded-full transition-colors">
            <ArrowLeft className="w-6 h-6" />
          </button>
          <h1 className="text-xl font-semibold flex-1 text-center">Equipa</h1>
          <div className="w-10"></div>
        </div>
        <div className="flex justify-center">
          <div className="bg-white/20 p-4 rounded-full">
            <Users className="w-8 h-8" />
          </div>
        </div>
      </div>

      {/* Referral Link Section */}
      <div className="px-4 mt-6">
        <Card className="p-4 bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
          <div className="mb-3">
            <p className="text-sm font-semibold text-foreground mb-1">💎 Seu Código de Indicação</p>
            <div className="flex gap-2">
              <Input 
                value={referralCode} 
                readOnly 
                className="text-center font-bold text-lg"
              />
              <Button onClick={handleCopyCode} size="icon" variant="outline">
                <Copy className="w-4 h-4" />
              </Button>
            </div>
          </div>
          
          <div className="mb-3">
            <p className="text-sm font-semibold text-foreground mb-1">🔗 Link de Indicação</p>
            <div className="flex gap-2">
              <Input 
                value={referralLink} 
                readOnly 
                className="text-xs"
              />
              <Button onClick={handleCopyLink} size="icon" variant="outline">
                <Copy className="w-4 h-4" />
              </Button>
            </div>
          </div>

          <Button onClick={handleShare} className="w-full" variant="default">
            <Share2 className="w-4 h-4 mr-2" />
            Compartilhar Link
          </Button>
        </Card>
      </div>

      {/* Team Stats */}
      <div className="px-4 mt-6">
        <p className="text-center text-sm text-muted-foreground mb-4">Número da Equipe:</p>
        <div className="grid grid-cols-3 gap-3 mb-6">
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

      {/* Goals Button */}
      <div className="px-4 mb-4">
        <GoalsSection currentVolume={directNetworkVolume} />
      </div>

      {/* Members List */}
      <MembersList />

      <BottomNavigation />
    </div>
  );
};

export default Members;
