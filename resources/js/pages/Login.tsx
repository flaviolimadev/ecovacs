import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Eye, EyeOff, LogIn, ArrowLeft } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

const ecovacsLogo = "/assets/ecovacs-logo.png";
const Login = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    email: "",
    password: ""
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.email || !formData.password) {
      return;
    }

    setIsLoading(true);
    try {
      await login(formData.email, formData.password);
      navigate("/");
    } catch (error) {
      // Erro já tratado no AuthContext
    } finally {
      setIsLoading(false);
    }
  };
  return <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 flex items-center justify-center p-4">
      {/* Background decorative elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-72 h-72 bg-blue-400/20 rounded-full blur-3xl"></div>
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-purple-400/20 rounded-full blur-3xl"></div>
      </div>

      <Card className="w-full max-w-md relative z-10 p-8 shadow-2xl border-none bg-white/95 backdrop-blur-sm">
        {/* Back button */}
        

        {/* Logo */}
        <div className="flex justify-center mb-8">
          <img src={ecovacsLogo} alt="Ecovacs Robotics" className="h-16" />
        </div>

        {/* Title */}
        <div className="text-center mb-8">
          
          <p className="text-gray-600">Entre na sua conta para continuar</p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Email */}
          <div className="space-y-2">
            <Label htmlFor="email" className="text-gray-700 font-medium">
              E-mail
            </Label>
            <Input id="email" type="email" placeholder="seu@email.com" value={formData.email} onChange={e => setFormData({
            ...formData,
            email: e.target.value
          })} className="h-12 border-2 focus:border-primary" />
          </div>

          {/* Password */}
          <div className="space-y-2">
            <Label htmlFor="password" className="text-gray-700 font-medium">
              Senha
            </Label>
            <div className="relative">
              <Input id="password" type={showPassword ? "text" : "password"} placeholder="••••••••" value={formData.password} onChange={e => setFormData({
              ...formData,
              password: e.target.value
            })} className="h-12 border-2 focus:border-primary pr-12" />
              <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700">
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>

          {/* Submit Button */}
          <Button type="submit" className="w-full h-12 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-semibold shadow-lg" disabled={isLoading}>
            {isLoading ? (
              <>
                <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                Entrando...
              </>
            ) : (
              <>
                <LogIn className="w-5 h-5 mr-2" />
                Entrar
              </>
            )}
          </Button>
        </form>

        {/* Register Link */}
        <div className="mt-6 text-center">
          <p className="text-gray-600">
            Não tem uma conta?{" "}
            <button onClick={() => navigate("/register")} className="text-primary font-semibold hover:underline">
              Cadastre-se
            </button>
          </p>
        </div>
      </Card>
    </div>;
};
export default Login;