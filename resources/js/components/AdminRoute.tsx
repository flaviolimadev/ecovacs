import { Navigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

export function AdminRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-gray-600">Carregando...</p>
        </div>
      </div>
    );
  }

  if (!user) {

    return <Navigate to="/login" replace />;
  }

  console.log('AdminRoute: Verificando permissões', { 
    userId: user.id, 
    userEmail: user.email, 
    userRole: user.role 
  });

  if (user.role !== "admin") {

    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}

