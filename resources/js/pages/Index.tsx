import { useState, useEffect } from "react";
import { Calendar, CreditCard, DollarSign, Package, UserPlus, HelpCircle, Gift } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import api from "@/lib/api";
import Carousel from "@/components/Carousel";
import ActionCard from "@/components/ActionCard";
import RealtimeFeed from "@/components/RealtimeFeed";
import DepositBanner from "@/components/DepositBanner";
import BottomNavigation from "@/components/BottomNavigation";
import FloatingMessageButton from "@/components/FloatingMessageButton";
import WelcomePopup from "@/components/WelcomePopup";
import { toast } from "sonner";
import angloGoldLogo from "@/assets/anglogold-logo.png";
import banner1 from "@/assets/banner-1.jpg";
import banner2 from "@/assets/banner-2.jpg";
import banner3 from "@/assets/banner-3.jpg";

const Index = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [balanceWithdrawn, setBalanceWithdrawn] = useState(0);
  const [feedData, setFeedData] = useState<any[]>([]);
  
  const banners = [
    { id: 1, image: banner1, alt: "AngloGold Investment Platform" },
    { id: 2, image: banner2, alt: "Earn Daily with Gold Investments" },
    { id: 3, image: banner3, alt: "Join our Community" },
  ];

  useEffect(() => {
    if (user) {
      loadUserData();
      loadRecentEarnings();
    }
  }, [user]);

  const loadUserData = async () => {
    try {
      const response = await api.get("/profile");
      setBalanceWithdrawn(response.data.balance_withdrawn || 0);
    } catch (error) {
      console.error("Error loading user data:", error);
    }
  };

  const loadRecentEarnings = async () => {
    try {
      // Simular dados de feed de ganhos recentes
      // TODO: Integrar com API real quando disponível
      setFeedData([
        { id: 1, username: `User_${Math.floor(Math.random() * 10000)}`, package: "Plano Ouro", earnings: 245.50, timestamp: "2 min atrás" },
        { id: 2, username: `User_${Math.floor(Math.random() * 10000)}`, package: "Plano Prata", earnings: 180.00, timestamp: "5 min atrás" },
        { id: 3, username: `User_${Math.floor(Math.random() * 10000)}`, package: "Plano Diamante", earnings: 320.75, timestamp: "8 min atrás" },
      ]);
    } catch (error) {
      console.error("Error loading earnings feed:", error);
    }
  };

  const handleActionClick = (action: string) => {
    switch (action) {
      case "Daily Reward":
        navigate("/daily-reward");
        break;
      case "Deposit":
        navigate("/deposit");
        break;
      case "Withdraw":
        navigate("/withdraw");
        break;
      case "Plans":
        navigate("/earnings");
        break;
      case "Referral":
        navigate("/members");
        break;
      case "Support":
        toast.info("Em breve: Suporte ao cliente");
        break;
      case "Rewards":
        toast.info("Em breve: Sistema de recompensas");
        break;
      default:
        toast.info(`Ação: ${action}`);
    }
  };

  return (
    <div className="min-h-screen bg-background pb-20">
      <WelcomePopup />
      
      <header className="sticky top-0 z-40 bg-background/95 backdrop-blur-lg supports-[backdrop-filter]:bg-background/90 border-b border-border">
        <div className="px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <img 
                src={angloGoldLogo} 
                alt="AngloGold" 
                className="h-12 w-auto object-contain"
              />
            </div>
            <div className="flex flex-col items-end">
              <span className="text-xs text-muted-foreground">Saldo Disponível</span>
              <span className="text-lg font-bold text-success">
                R$ {balanceWithdrawn.toFixed(2)}
              </span>
            </div>
          </div>
        </div>
      </header>
      
      <main>
        <Carousel banners={banners} />
        
        <section className="container px-4 py-8" aria-label="Quick actions">
          <h2 className="mb-6 text-2xl font-bold text-foreground">Ações Rápidas</h2>
          
          <div className="grid grid-cols-3 gap-3">
            <ActionCard
              title="Check-in"
              icon={Calendar}
              color="primary"
              onClick={() => handleActionClick("Daily Reward")}
            />
            <ActionCard
              title="Depósito"
              icon={CreditCard}
              color="success"
              onClick={() => handleActionClick("Deposit")}
            />
            <ActionCard
              title="Saque"
              icon={DollarSign}
              color="warning"
              onClick={() => handleActionClick("Withdraw")}
            />
            <ActionCard
              title="Planos"
              icon={Package}
              color="primary"
              onClick={() => handleActionClick("Plans")}
            />
            <ActionCard
              title="Indicação"
              icon={UserPlus}
              color="accent"
              onClick={() => handleActionClick("Referral")}
            />
            <ActionCard
              title="Suporte"
              icon={HelpCircle}
              color="success"
              onClick={() => handleActionClick("Support")}
            />
          </div>
        </section>

        {feedData.length > 0 && <RealtimeFeed data={feedData} />}
        
        <DepositBanner onClick={() => navigate("/deposit")} />
      </main>

      <FloatingMessageButton />
      <BottomNavigation />
    </div>
  );
};

export default Index;
