import { User, Loader2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import ProfileCard from "@/components/ProfileCard";
import ProfileActionGrid from "@/components/ProfileActionGrid";
import BottomNavigation from "@/components/BottomNavigation";
import { toast } from "sonner";
import { profileAPI, networkAPI } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";

const Profile = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [balance, setBalance] = useState(0);
  const [userId, setUserId] = useState("");

  useEffect(() => {
    const loadProfileData = async () => {
      try {
        setIsLoading(true);
        
        const profileResponse = await profileAPI.get();
        const profileData = profileResponse.data.data;
        
        setBalance(profileData.balance_withdrawn || 0);
        setUserId(profileData.referral_code || profileData.id);
      } catch (error: any) {
        toast.error("Não foi possível carregar os dados");
      } finally {
        setIsLoading(false);
      }
    };

    loadProfileData();
  }, []);

  const handleDeposit = () => {
    navigate("/deposit");
  };

  const handleWithdraw = () => {
    navigate("/withdraw");
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto text-primary" />
          <p className="mt-2 text-muted-foreground">Carregando perfil...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-20">
      <div className="container max-w-lg px-4 py-6 space-y-6">
        <ProfileCard
          userId={userId}
          balance={balance}
          onDeposit={handleDeposit}
          onWithdraw={handleWithdraw}
        />

        <div className="rounded-xl bg-card p-4 shadow-sm border border-border">
          <h2 className="mb-4 text-sm font-bold text-foreground">Ações Rápidas</h2>
          <ProfileActionGrid />
        </div>
      </div>

      <BottomNavigation />
    </div>
  );
};

export default Profile;
