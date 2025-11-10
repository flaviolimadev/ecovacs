import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { authAPI } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';

interface User {
  id: number;
  name: string;
  email: string;
  phone?: string;
  role: string;                 // 'user' ou 'admin'
  referral_code: string;
  balance: number;              // Saldo para investir (comprar pacotes)
  balance_withdrawn: number;    // Saldo disponível para saque
  total_invested?: number;
  total_earned?: number;
  total_withdrawn?: number;
  is_verified?: boolean;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (email: string, password: string) => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  logout: () => Promise<void>;
  fetchUser: () => Promise<void>;
  isAuthenticated: boolean;
  loading: boolean;
}

interface RegisterData {
  name: string;
  email: string;
  phone?: string;
  password: string;
  password_confirmation: string;
  referral_code?: string;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  // Carregar dados do localStorage ao iniciar
  useEffect(() => {
    const storedToken = localStorage.getItem('auth_token');
    const storedUser = localStorage.getItem('user');

    if (storedToken && storedUser) {
      setToken(storedToken);
      setUser(JSON.parse(storedUser));
      // Verificar se o token ainda é válido
      authAPI.me()
        .then((response) => {
          setUser(response.data.data);
          localStorage.setItem('user', JSON.stringify(response.data.data));
        })
        .catch(() => {
          // Token inválido
          localStorage.removeItem('auth_token');
          localStorage.removeItem('user');
          setToken(null);
          setUser(null);
        })
        .finally(() => setIsLoading(false));
    } else {
      setIsLoading(false);
    }
  }, []);

  const login = async (email: string, password: string) => {
    try {
      const response = await authAPI.login(email, password);
      const { user: userData, token: userToken } = response.data.data;

      setUser(userData);
      setToken(userToken);
      localStorage.setItem('auth_token', userToken);
      localStorage.setItem('user', JSON.stringify(userData));

      toast({
        title: "Login realizado!",
        description: `Bem-vindo(a), ${userData.name}!`,
      });
    } catch (error: any) {
      const message = error.response?.data?.message || 'Erro ao fazer login';
      toast({
        title: "Erro no login",
        description: message,
        variant: "destructive",
      });
      throw error;
    }
  };

  const register = async (data: RegisterData) => {
    try {
      const response = await authAPI.register(data);
      const { user: userData, token: userToken } = response.data.data;

      setUser(userData);
      setToken(userToken);
      localStorage.setItem('auth_token', userToken);
      localStorage.setItem('user', JSON.stringify(userData));

      toast({
        title: "Cadastro realizado!",
        description: "Sua conta foi criada com sucesso!",
      });
    } catch (error: any) {
      const message = error.response?.data?.message || 'Erro ao cadastrar';
      const errors = error.response?.data?.errors;
      
      let description = message;
      if (errors) {
        description = Object.values(errors).flat().join(', ');
      }

      toast({
        title: "Erro no cadastro",
        description,
        variant: "destructive",
      });
      throw error;
    }
  };

  const logout = async () => {
    try {
      await authAPI.logout();
    } catch (error) {
      console.error('Erro ao fazer logout:', error);
    } finally {
      setUser(null);
      setToken(null);
      localStorage.removeItem('auth_token');
      localStorage.removeItem('user');
      
      toast({
        title: "Logout realizado",
        description: "Você foi desconectado com sucesso.",
      });
    }
  };

  const fetchUser = async () => {
    try {
      const response = await authAPI.me();
      const userData = response.data.data.user;
      setUser(userData);
      localStorage.setItem('user', JSON.stringify(userData));
    } catch (error: any) {
      console.error('Failed to fetch user:', error);
      throw error;
    }
  };

  const value = {
    user,
    token,
    login,
    register,
    logout,
    fetchUser,
    isAuthenticated: !!token && !!user,
    loading: isLoading,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

