import { useState } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { LucideIcon, Lock, DollarSign, FileText, MessageCircle, Info, Users, Download, LogOut } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import ChangePasswordDialog from "./ChangePasswordDialog";

interface ActionItem {
  id: string;
  icon: LucideIcon;
  label: string;
  color: string;
  onClick: () => void;
}

const ProfileActionGrid = () => {
  const navigate = useNavigate();
  const { logout } = useAuth();
  const [changePasswordOpen, setChangePasswordOpen] = useState(false);
  
  const handleLogout = () => {
    logout();
    toast.success("Você saiu da conta com sucesso");
    navigate("/login");
  };
  
  const actions: ActionItem[] = [
    {
      id: "password",
      icon: Lock,
      label: "alterar senha",
      color: "from-lime-400 to-lime-600",
      onClick: () => setChangePasswordOpen(true),
    },
    {
      id: "withdraw",
      icon: DollarSign,
      label: "saque",
      color: "from-orange-400 to-orange-600",
      onClick: () => navigate("/withdraw"),
    },
    {
      id: "balance",
      icon: FileText,
      label: "extrato",
      color: "from-purple-400 to-purple-600",
      onClick: () => navigate("/statement"),
    },
    {
      id: "contact",
      icon: MessageCircle,
      label: "contato",
      color: "from-cyan-400 to-cyan-600",
      onClick: () => window.open("https://chat.whatsapp.com/ENpJ4S4bAIgAtMqCUcri1z?mode=hqrt3", "_blank"),
    },
    {
      id: "about",
      icon: Info,
      label: "sobre",
      color: "from-indigo-400 to-indigo-600",
      onClick: () => navigate("/about"),
    },
    {
      id: "referral",
      icon: Users,
      label: "código",
      color: "from-green-400 to-green-600",
      onClick: () => navigate("/members"),
    },
    {
      id: "download",
      icon: Download,
      label: "download",
      color: "from-pink-400 to-pink-600",
      onClick: () => toast.info("Em breve: Download do app"),
    },
    {
      id: "logout",
      icon: LogOut,
      label: "sair",
      color: "from-gray-400 to-gray-600",
      onClick: handleLogout,
    },
  ];

  return (
    <>
      <div className="grid grid-cols-4 gap-3">
        {actions.map((action, index) => (
          <motion.button
            key={action.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={action.onClick}
            className="flex flex-col items-center gap-1.5 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
          >
            <div className={`flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br ${action.color} shadow-md`}>
              <action.icon className="h-6 w-6 text-white" />
            </div>
            <span className="text-[10px] text-center text-foreground font-medium leading-tight whitespace-nowrap">
              {action.label}
            </span>
          </motion.button>
        ))}
      </div>

      <ChangePasswordDialog 
        open={changePasswordOpen} 
        onOpenChange={setChangePasswordOpen} 
      />
    </>
  );
};

export default ProfileActionGrid;

