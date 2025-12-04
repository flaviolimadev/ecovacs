import { motion } from "framer-motion";
import { LucideIcon } from "lucide-react";
import { Card } from "@/components/ui/card";

interface ActionCardProps {
  title: string;
  icon: LucideIcon;
  color: "primary" | "success" | "warning" | "accent";
  onClick?: () => void;
}

const colorClasses = {
  primary: "bg-primary/10 text-primary hover:bg-primary/20",
  success: "bg-success/10 text-success hover:bg-success/20",
  warning: "bg-warning/10 text-warning hover:bg-warning/20",
  accent: "bg-accent/10 text-accent hover:bg-accent/20",
};

const ActionCard = ({ title, icon: Icon, color, onClick }: ActionCardProps) => {
  return (
    <motion.div
      whileHover={{ scale: 1.05, y: -4 }}
      whileTap={{ scale: 0.98 }}
      transition={{ type: "spring", stiffness: 300, damping: 20 }}
    >
      <Card
        className="group cursor-pointer overflow-hidden border-border bg-card shadow-sm transition-all hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
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
        <div className="flex flex-col items-center justify-center gap-2 p-3">
          <motion.div
            className={`flex h-10 w-10 items-center justify-center rounded-lg transition-colors ${colorClasses[color]}`}
            whileHover={{ rotate: 5 }}
            transition={{ duration: 0.2 }}
          >
            <Icon className="h-5 w-5" aria-hidden="true" />
          </motion.div>
          
          <h3 className="text-xs font-semibold text-foreground text-center leading-tight whitespace-nowrap">
            {title}
          </h3>
        </div>
      </Card>
    </motion.div>
  );
};

export default ActionCard;



