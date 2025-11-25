import { motion } from "framer-motion";
import { Home, CreditCard, DollarSign, Package, User } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";

interface NavItem {
  id: string;
  path: string;
  icon: typeof Home;
  label: string;
}

const BottomNavigation = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const navItems: NavItem[] = [
    { id: "home", path: "/", icon: Home, label: "Home" },
    { id: "recharge", path: "/deposit", icon: CreditCard, label: "Recharge" },
    { id: "withdraw", path: "/withdraw", icon: DollarSign, label: "Withdraw" },
    { id: "planos", path: "/earnings", icon: Package, label: "Planos" },
    { id: "profile", path: "/profile", icon: User, label: "Profile" },
  ];

  return (
    <motion.nav
      initial={{ y: 100 }}
      animate={{ y: 0 }}
      className="fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-background/95 backdrop-blur-lg supports-[backdrop-filter]:bg-background/90"
      role="navigation"
      aria-label="Main navigation"
    >
      <div className="mx-auto flex max-w-lg items-center justify-around px-2 py-2 safe-area-inset-bottom">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path;

          return (
            <motion.button
              key={item.id}
              onClick={() => navigate(item.path)}
              className="flex flex-col items-center gap-1 px-3 py-2 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
              whileTap={{ scale: 0.95 }}
              aria-label={item.label}
              aria-current={isActive ? "page" : undefined}
            >
              <motion.div
                animate={{
                  scale: isActive ? 1.1 : 1,
                  color: isActive ? "hsl(var(--primary))" : "hsl(var(--muted-foreground))",
                }}
                transition={{ duration: 0.2 }}
              >
                <Icon className="h-6 w-6" aria-hidden="true" />
              </motion.div>
              
              <motion.span
                className="text-xs font-medium"
                animate={{
                  color: isActive ? "hsl(var(--primary))" : "hsl(var(--muted-foreground))",
                  fontWeight: isActive ? 600 : 500,
                }}
                transition={{ duration: 0.2 }}
              >
                {item.label}
              </motion.span>

              {isActive && (
                <motion.div
                  layoutId="activeTab"
                  className="absolute -top-0.5 h-1 w-12 rounded-full bg-primary"
                  initial={false}
                  transition={{ type: "spring", stiffness: 380, damping: 30 }}
                />
              )}
            </motion.button>
          );
        })}
      </div>
    </motion.nav>
  );
};

export default BottomNavigation;
