import { RefreshCw, Wallet, Users, Headphones } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { networkAPI } from "@/lib/api";

const ActionButtonsGrid = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [referralLink, setReferralLink] = useState("");
  const [referralCode, setReferralCode] = useState("");

  useEffect(() => {
    const loadReferralData = async () => {
      try {
        const response = await networkAPI.getStats();
        setReferralCode(response.data.data.referral_code);
        setReferralLink(response.data.data.referral_link);
      } catch (error) {
        console.error("Failed to load referral data:", error);
      }
    };

    loadReferralData();
  }, []);

  const handleInvite = async () => {
    if (!referralLink) {
      toast({
        title: "Aguarde",
        description: "Carregando seu link de indicação...",
      });
      return;
    }

    // Tentar usar Web Share API (mobile)
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
      // Fallback: copiar link
      navigator.clipboard.writeText(referralLink);
      toast({
        title: "Link copiado!",
        description: "O link de indicação foi copiado para a área de transferência.",
      });
    }
  };
  
  const actions = [
    {
      icon: RefreshCw,
      label: "Recarregar",
      color: "bg-gradient-to-br from-green-500 to-emerald-600",
      onClick: () => navigate("/deposit"),
    },
    {
      icon: Wallet,
      label: "Retirada",
      color: "bg-gradient-to-br from-orange-500 to-red-500",
      onClick: () => navigate("/withdraw"),
    },
    {
      icon: Users,
      label: "Convidar",
      color: "bg-gradient-to-br from-purple-500 to-pink-500",
      onClick: handleInvite,
    },
    {
      icon: Headphones,
      label: "Suporte",
      color: "bg-gradient-to-br from-blue-500 to-cyan-500",
      onClick: () => {},
    },
  ];

  return (
    <div className="mx-4 mt-6 grid grid-cols-4 gap-4">
      {actions.map((action) => (
        <button
          key={action.label}
          onClick={action.onClick}
          className="flex flex-col items-center gap-2 transition-transform hover:scale-105 active:scale-95"
        >
          <div className={`${action.color} flex h-14 w-14 items-center justify-center rounded-2xl shadow-lg hover:shadow-xl transition-shadow`}>
            <action.icon className="h-6 w-6 text-white" />
          </div>
          <span className="text-xs text-foreground font-medium">{action.label}</span>
        </button>
      ))}
    </div>
  );
};

export default ActionButtonsGrid;
