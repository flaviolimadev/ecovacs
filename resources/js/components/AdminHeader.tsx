import { ArrowLeft, Users, DollarSign, Settings, Home, Package, BarChart3, TrendingUp } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";

interface AdminHeaderProps {
  title: string;
  subtitle?: string;
}

export function AdminHeader({ title, subtitle }: AdminHeaderProps) {
  const navigate = useNavigate();
  const location = useLocation();

  const menuItems = [
    {
      label: "Dashboard",
      icon: BarChart3,
      path: "/admin/dashboard",
    },
    {
      label: "Usuários",
      icon: Users,
      path: "/admin/users",
    },
    {
      label: "Saques",
      icon: DollarSign,
      path: "/admin/withdrawals",
    },
    {
      label: "Depósitos",
      icon: TrendingUp,
      path: "/admin/deposits",
    },
    {
      label: "Planos",
      icon: Package,
      path: "/admin/plans",
    },
    {
      label: "Pacotes",
      icon: Package,
      path: "/admin/packages",
    },
    {
      label: "Configurações",
      icon: Settings,
      path: "/admin/settings",
    },
  ];

  const isActive = (path: string) => location.pathname === path;

  return (
    <div className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 text-white shadow-lg">
      <div className="max-w-7xl mx-auto px-6 py-6">
        {/* Top Bar */}
        <div className="flex items-center justify-between mb-6">
          <Button
            variant="ghost"
            onClick={() => navigate("/")}
            className="text-white hover:bg-white/20"
            size="sm"
          >
            <Home className="w-4 h-4 mr-2" />
            Voltar ao App
          </Button>
          <div className="bg-white/10 backdrop-blur-sm rounded-full px-4 py-2 text-sm font-medium">
            🔐 Painel Admin
          </div>
        </div>

        {/* Title */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-white drop-shadow-lg">{title}</h1>
          {subtitle && (
            <p className="text-white/90 mt-2 text-lg">{subtitle}</p>
          )}
        </div>

        {/* Navigation Menu */}
        <div className="flex flex-wrap gap-2">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.path);

            return (
              <Button
                key={item.path}
                onClick={() => navigate(item.path)}
                variant={active ? "secondary" : "ghost"}
                className={`
                  ${active 
                    ? "bg-white text-purple-600 hover:bg-white/90 font-semibold shadow-md" 
                    : "text-white hover:bg-white/20 border border-white/30"
                  }
                  transition-all duration-200
                `}
                size="default"
              >
                <Icon className="w-4 h-4 mr-2" />
                {item.label}
              </Button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

