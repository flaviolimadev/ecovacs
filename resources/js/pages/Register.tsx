import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Eye, EyeOff, UserPlus, ArrowLeft } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

const ecovacsLogo = "/assets/ecovacs-logo.png";
const Register = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { register } = useAuth();
  const { toast } = useToast();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
    referralCode: ""
  });

  // Capturar código de indicação da URL ao carregar a página
  useEffect(() => {
    const refCode = searchParams.get('ref');
    if (refCode) {
      setFormData(prev => ({
        ...prev,
        referralCode: refCode
      }));
      
      // Mostrar toast informativo
      toast({
        title: "Código de indicação detectado!",
        description: `Você está se cadastrando com o código: ${refCode}`,
      });
    }
  }, [searchParams, toast]);
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validações
    if (!formData.name || !formData.email || !formData.password || !formData.confirmPassword || !formData.referralCode) {
      toast({
        title: "Erro",
        description: "Por favor, preencha todos os campos obrigatórios",
        variant: "destructive"
      });
      return;
    }
    if (formData.password !== formData.confirmPassword) {
      toast({
        title: "Erro",
        description: "As senhas não coincidem",
        variant: "destructive"
      });
      return;
    }
    if (formData.password.length < 6) {
      toast({
        title: "Erro",
        description: "A senha deve ter no mínimo 6 caracteres",
        variant: "destructive"
      });
      return;
    }
    if (!agreedToTerms) {
      toast({
        title: "Erro",
        description: "Você precisa concordar com os termos de uso",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);
    try {
      await register({
        name: formData.name,
        email: formData.email,
        phone: formData.phone || undefined,
        password: formData.password,
        password_confirmation: formData.confirmPassword,
        referral_code: formData.referralCode || undefined,
      });
      navigate("/");
    } catch (error) {
      // Erro já tratado no AuthContext
    } finally {
      setIsLoading(false);
    }
  };
  return <div className="min-h-screen bg-gradient-to-br from-cyan-50 via-blue-50 to-purple-50 flex items-center justify-center p-4 py-8">
      {/* Background decorative elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 right-10 w-72 h-72 bg-cyan-400/20 rounded-full blur-3xl"></div>
        <div className="absolute bottom-20 left-10 w-96 h-96 bg-purple-400/20 rounded-full blur-3xl"></div>
      </div>

      <Card className="w-full max-w-md relative z-10 p-8 shadow-2xl border-none bg-white/95 backdrop-blur-sm">
        {/* Back button */}
        

        {/* Logo */}
        <div className="flex justify-center mb-6">
          <img src={ecovacsLogo} alt="Ecovacs Robotics" className="h-14" />
        </div>

        {/* Title */}
        <div className="text-center mb-6">
          
          <p className="text-gray-600 text-sm">Cadastre-se para começar</p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Name */}
          <div className="space-y-2">
            <Label htmlFor="name" className="text-gray-700 font-medium">
              Nome Completo *
            </Label>
            <Input id="name" type="text" placeholder="Seu nome completo" value={formData.name} onChange={e => setFormData({
            ...formData,
            name: e.target.value
          })} className="h-11 border-2 focus:border-primary" />
          </div>

          {/* Email */}
          <div className="space-y-2">
            <Label htmlFor="email" className="text-gray-700 font-medium">
              E-mail *
            </Label>
            <Input id="email" type="email" placeholder="seu@email.com" value={formData.email} onChange={e => setFormData({
            ...formData,
            email: e.target.value
          })} className="h-11 border-2 focus:border-primary" />
          </div>

          {/* Phone */}
          <div className="space-y-2">
            <Label htmlFor="phone" className="text-gray-700 font-medium">
              Telefone (Opcional)
            </Label>
            <Input id="phone" type="tel" placeholder="(00) 00000-0000" value={formData.phone} onChange={e => setFormData({
            ...formData,
            phone: e.target.value
          })} className="h-11 border-2 focus:border-primary" />
          </div>

          {/* Password */}
          <div className="space-y-2">
            <Label htmlFor="password" className="text-gray-700 font-medium">
              Senha *
            </Label>
            <div className="relative">
              <Input id="password" type={showPassword ? "text" : "password"} placeholder="Mínimo 6 caracteres" value={formData.password} onChange={e => setFormData({
              ...formData,
              password: e.target.value
            })} className="h-11 border-2 focus:border-primary pr-12" />
              <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700">
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>

          {/* Confirm Password */}
          <div className="space-y-2">
            <Label htmlFor="confirmPassword" className="text-gray-700 font-medium">
              Confirmar Senha *
            </Label>
            <div className="relative">
              <Input id="confirmPassword" type={showConfirmPassword ? "text" : "password"} placeholder="Digite a senha novamente" value={formData.confirmPassword} onChange={e => setFormData({
              ...formData,
              confirmPassword: e.target.value
            })} className="h-11 border-2 focus:border-primary pr-12" />
              <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700">
                {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>

          {/* Terms and Conditions */}
          <div className="flex items-start space-x-2 pt-2">
            <Checkbox id="terms" checked={agreedToTerms} onCheckedChange={checked => setAgreedToTerms(checked as boolean)} />
            <label htmlFor="terms" className="text-sm text-gray-600 leading-tight cursor-pointer">
              Eu aceito os{" "}
              <button type="button" className="text-primary hover:underline">
                termos e condições
              </button>{" "}
              e a{" "}
              <button type="button" className="text-primary hover:underline">
                política de privacidade
              </button>
            </label>
          </div>

          {/* Código de Indicação (Obrigatório) */}
          <div className="space-y-2">
            <Label htmlFor="referralCode" className="text-gray-700 font-medium">
              Código de Indicação * {formData.referralCode && <span className="text-green-600">✓</span>}
            </Label>
            <Input 
              id="referralCode" 
              type="text" 
              placeholder="Digite o código de quem te indicou" 
              value={formData.referralCode} 
              onChange={e => setFormData({
                ...formData,
                referralCode: e.target.value.toUpperCase()
              })} 
              className={`h-11 border-2 focus:border-primary ${formData.referralCode ? 'border-green-300 bg-green-50' : ''}`}
              required
            />
            {formData.referralCode && (
              <p className="text-xs text-green-600">
                ✓ Código de indicação aplicado
              </p>
            )}
          </div>

          {/* Submit Button */}
          <Button type="submit" className="w-full h-12 bg-gradient-to-r from-cyan-500 to-purple-600 hover:from-cyan-600 hover:to-purple-700 text-white font-semibold shadow-lg mt-4" disabled={isLoading}>
            {isLoading ? (
              <>
                <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                Criando conta...
              </>
            ) : (
              <>
                <UserPlus className="w-5 h-5 mr-2" />
                Criar Conta
              </>
            )}
          </Button>
        </form>

        {/* Login Link */}
        <div className="mt-6 text-center">
          <p className="text-gray-600 text-sm">
            Já tem uma conta?{" "}
            <button onClick={() => navigate("/login")} className="text-primary font-semibold hover:underline">
              Entrar
            </button>
          </p>
        </div>
      </Card>
    </div>;
};
export default Register;