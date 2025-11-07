import { Home, Users, CircleDollarSign, User } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";

const BottomNavigation = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const navItems = [
    { id: "home", path: "/", icon: Home, label: "Início" },
    { id: "members", path: "/members", icon: Users, label: "Membro" },
    { id: "earnings", path: "/earnings", icon: CircleDollarSign, label: "Rendimentos" },
    { id: "user", path: "/profile", icon: User, label: "Utilizador" },
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 border-t border-border bg-card shadow-lg">
      <div className="mx-auto flex max-w-md items-center justify-around py-2">
        {navItems.map((item) => (
          <button
            key={item.id}
            onClick={() => navigate(item.path)}
            className={`flex flex-col items-center gap-1 px-4 py-1.5 transition-colors ${
              location.pathname === item.path ? "text-primary" : "text-muted-foreground"
            }`}
          >
            <item.icon className="h-6 w-6" strokeWidth={2} />
            <span className="text-xs font-medium">{item.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
};

export default BottomNavigation;
