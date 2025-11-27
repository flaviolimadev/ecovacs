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
import banner1 from "@/assets/asdr.jpeg";
import banner2 from "@/assets/123fdrt.jpeg";
import banner3 from "@/assets/image.png";

const Index = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [balance, setBalance] = useState(0);
  const [feedData, setFeedData] = useState<any[]>([]);
  
  const banners = [
    { id: 1, image: banner1, alt: "AngloGold - Referência Mundial na Produção de Ouro" },
    { id: 2, image: banner2, alt: "Invista em Ouro com Segurança" },
    { id: 3, image: banner3, alt: "Pepitas de Ouro - Investimento Sólido" },
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
      // balance = saldo para investir/comprar planos
      setBalance(response.data.data.balance || 0);
    } catch (error) {
      console.error("Error loading user data:", error);
    }
  };

  const loadRecentEarnings = async () => {
    try {
      // Gerar dados realistas e aleatórios de ganhos recentes
      const realNames = [
        "João Silva", "Maria Santos", "Pedro Costa", "Ana Oliveira", "Carlos Souza",
        "Juliana Lima", "Ricardo Alves", "Fernanda Rocha", "Lucas Martins", "Patricia Ferreira",
        "Rafael Gomes", "Camila Ribeiro", "Bruno Carvalho", "Mariana Dias", "Felipe Nunes",
        "Beatriz Castro", "Rodrigo Pereira", "Amanda Barbosa", "Gabriel Monteiro", "Larissa Duarte",
        "Thiago Mendes", "Isabela Araújo", "Diego Fernandes", "Leticia Cardoso", "Vinicius Barros",
        "Carolina Pinto", "Matheus Correia", "Gabriela Teixeira", "Leonardo Freitas", "Julia Moreira"
      ];

      const plans = [
        "⛏️ Carregadeira Subterrânea",
        "🔩 Perfuração de Poços",
        "🚛 Caminhão de Mineração",
        "⚡ Perfuratriz Jumbo",
        "🏗️ Mineração Contínua",
        "⚙️ Moinho de Bolas Premium"
      ];

      const earnings = [15, 35, 38, 55, 80, 200]; // Valores reais dos planos
      
      const timeframes = [
        "agora mesmo", "1 min atrás", "2 min atrás", "3 min atrás", "5 min atrás",
        "7 min atrás", "10 min atrás", "12 min atrás", "15 min atrás", "18 min atrás"
      ];

      // Gerar 5-8 ganhos aleatórios
      const numEarnings = Math.floor(Math.random() * 4) + 5; // 5 a 8 ganhos
      const generatedEarnings = [];

      for (let i = 0; i < numEarnings; i++) {
        const randomName = realNames[Math.floor(Math.random() * realNames.length)];
        const randomPlan = plans[Math.floor(Math.random() * plans.length)];
        const randomEarning = earnings[Math.floor(Math.random() * earnings.length)];
        const randomTime = timeframes[Math.floor(Math.random() * timeframes.length)];
        
        // Mascarar parte do nome para privacidade (João Silva -> João S.***)
        const nameParts = randomName.split(' ');
        const maskedName = nameParts.length > 1 
          ? `${nameParts[0]} ${nameParts[1].charAt(0)}.${"*".repeat(nameParts[1].length - 1)}`
          : `${nameParts[0].substring(0, 3)}${"*".repeat(nameParts[0].length - 3)}`;

        generatedEarnings.push({
          id: i + 1,
          username: maskedName,
          package: randomPlan,
          earnings: randomEarning,
          timestamp: randomTime
        });
      }

      // Ordenar por tempo (mais recente primeiro)
      const sortedEarnings = generatedEarnings.sort((a, b) => {
        const timeA = timeframes.indexOf(a.timestamp);
        const timeB = timeframes.indexOf(b.timestamp);
        return timeA - timeB;
      });

      setFeedData(sortedEarnings);
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
        navigate("/plans");
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
              <span className="text-xs text-muted-foreground">Saldo p/ Investir</span>
              <span className="text-lg font-bold text-primary">
                R$ {balance.toFixed(2)}
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
