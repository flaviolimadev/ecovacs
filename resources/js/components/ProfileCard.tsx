import { motion } from "framer-motion";
import { Wallet, ArrowDownToLine } from "lucide-react";
import { Card } from "@/components/ui/card";

interface ProfileCardProps {
  userId: string;
  balance: number;
  onDeposit: () => void;
  onWithdraw: () => void;
}

const ProfileCard = ({ userId, balance, onDeposit, onWithdraw }: ProfileCardProps) => {
  return (
    <Card className="relative overflow-hidden border-primary/20 bg-gradient-to-br from-primary via-primary/90 to-primary/80 shadow-lg">
      <div className="absolute inset-0 opacity-10">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(255,255,255,0.1),transparent_50%)]" />
      </div>
      
      <div className="relative z-10 flex flex-col items-center gap-3 p-4">
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.3 }}
        >
          <div className="relative">
            <div className="h-20 w-20 rounded-full border-4 border-accent bg-gradient-to-br from-accent/20 to-accent/40 flex items-center justify-center shadow-lg">
              <span className="text-3xl">👤</span>
            </div>
            <div className="absolute -bottom-1 -right-1 flex h-7 w-7 items-center justify-center rounded-full bg-accent shadow-md">
              <span className="text-xs font-bold text-accent-foreground">VIP</span>
            </div>
          </div>
        </motion.div>

        <div className="flex w-full flex-col items-center gap-1.5 rounded-xl bg-primary-foreground/10 px-4 py-3 backdrop-blur-sm">
          <span className="text-xl font-bold text-primary-foreground">{userId}</span>
          <div className="flex items-baseline gap-1">
            <span className="text-xs text-accent/90">saldo atual</span>
            <span className="text-xl font-bold text-accent">R$ {balance.toFixed(2)}</span>
          </div>
        </div>

        <div className="flex w-full gap-3">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={onDeposit}
            className="flex flex-1 flex-col items-center gap-1.5 rounded-xl bg-gradient-to-br from-cyan-400 to-cyan-600 p-3 shadow-md transition-shadow hover:shadow-lg"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white/20">
              <Wallet className="h-5 w-5 text-white" />
            </div>
            <span className="text-xs font-semibold text-white whitespace-nowrap">depósito</span>
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={onWithdraw}
            className="flex flex-1 flex-col items-center gap-1.5 rounded-xl bg-gradient-to-br from-pink-400 to-pink-600 p-3 shadow-md transition-shadow hover:shadow-lg"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white/20">
              <ArrowDownToLine className="h-5 w-5 text-white" />
            </div>
            <span className="text-xs font-semibold text-white whitespace-nowrap">Retirada</span>
          </motion.button>
        </div>
      </div>
    </Card>
  );
};

export default ProfileCard;



