import { motion } from "framer-motion";
import { ArrowRight, Wallet } from "lucide-react";
import { Card } from "@/components/ui/card";

interface DepositBannerProps {
  onClick?: () => void;
}

const DepositBanner = ({ onClick }: DepositBannerProps) => {
  return (
    <section className="container px-4 py-4">
      <motion.div
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
      >
        <Card 
          className="relative cursor-pointer overflow-hidden border-warning/30 shadow-md hover:shadow-lg transition-all"
          onClick={onClick}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              onClick?.();
            }
          }}
        >
          <div className="absolute inset-0 bg-gradient-to-br from-warning/20 via-warning/10 to-transparent" />
          <div className="relative z-10 flex items-center justify-between p-4 backdrop-blur-sm">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-warning">
                <Wallet className="h-6 w-6 text-warning-foreground" aria-hidden="true" />
              </div>
              
              <div className="flex flex-col">
                <h3 className="text-lg font-bold text-foreground">
                  Depósito
                </h3>
                <p className="text-sm text-muted-foreground">
                  Recarregue sua conta agora
                </p>
              </div>
            </div>

            <motion.div
              animate={{ x: [0, 5, 0] }}
              transition={{ repeat: Infinity, duration: 1.5 }}
            >
              <ArrowRight className="h-6 w-6 text-warning" aria-hidden="true" />
            </motion.div>
          </div>
        </Card>
      </motion.div>
    </section>
  );
};

export default DepositBanner;



