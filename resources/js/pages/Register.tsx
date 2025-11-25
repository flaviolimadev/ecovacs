import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Eye, EyeOff, UserPlus, Sparkles, Gift } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { trackCompleteRegistration } from "@/lib/facebookPixel";
import angloGoldLogo from "@/assets/anglogold-logo.png";

const Register = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { register } = useAuth();
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

  // Capturar código de indicação da URL
  useEffect(() => {
    const refCode = searchParams.get('ref');
    if (refCode) {
      setFormData(prev => ({ ...prev, referralCode: refCode }));
      toast.success(`Código de indicação aplicado: ${refCode}`);
    }
  }, [searchParams]);

  // Rastrear Facebook Pixel
  useEffect(() => {
    const timer = setTimeout(() => trackCompleteRegistration(), 500);
    return () => clearTimeout(timer);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validações
    if (!formData.name || !formData.email || !formData.password || !formData.confirmPassword || !formData.referralCode) {
      toast.error("Por favor, preencha todos os campos obrigatórios");
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      toast.error("As senhas não coincidem");
      return;
    }

    if (formData.password.length < 6) {
      toast.error("A senha deve ter no mínimo 6 caracteres");
      return;
    }

    if (!agreedToTerms) {
      toast.error("Você precisa concordar com os termos de uso");
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
      toast.success("Conta criada com sucesso! Bem-vindo! 🎉");
      navigate("/");
    } catch (error) {
      // Erro já tratado no AuthContext
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/30 to-background flex items-center justify-center p-4 py-8 relative overflow-hidden">
      {/* Animated background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 0.1, scale: 1 }}
          transition={{ duration: 2, repeat: Infinity, repeatType: "reverse" }}
          className="absolute -top-20 -right-20 w-96 h-96 bg-accent rounded-full blur-3xl"
        />
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 0.1, scale: 1 }}
          transition={{ duration: 2, delay: 1, repeat: Infinity, repeatType: "reverse" }}
          className="absolute -bottom-20 -left-20 w-96 h-96 bg-primary rounded-full blur-3xl"
        />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md relative z-10"
      >
        {/* Logo and Title */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="text-center mb-6"
        >
          <motion.div
            whileHover={{ scale: 1.05 }}
            className="inline-block mb-4"
          >
            <img 
              src={angloGoldLogo} 
              alt="AngloGold" 
              className="h-14 w-auto mx-auto"
            />
          </motion.div>
          
          <h1 className="text-2xl font-bold text-foreground mb-2 flex items-center justify-center gap-2">
            Crie sua conta
            <Sparkles className="w-5 h-5 text-accent" />
          </h1>
          <p className="text-sm text-muted-foreground">Comece a investir em ouro hoje</p>
        </motion.div>

        {/* Register Card */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.3 }}
          className="bg-card border border-border rounded-2xl shadow-2xl p-6 backdrop-blur-sm"
        >
          <form onSubmit={handleSubmit} className="space-y-4 notranslate" translate="no">
            {/* Name */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4 }}
              className="space-y-2"
            >
              <Label htmlFor="name" className="text-sm font-semibold text-foreground">
                Nome Completo *
              </Label>
              <Input
                id="name"
                type="text"
                placeholder="Seu nome completo"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="h-11 bg-background/50 border-2 border-border focus:border-primary transition-colors"
                autoComplete="name"
              />
            </motion.div>

            {/* Email */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.45 }}
              className="space-y-2"
            >
              <Label htmlFor="email" className="text-sm font-semibold text-foreground">
                E-mail *
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="seu@email.com"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="h-11 bg-background/50 border-2 border-border focus:border-primary transition-colors"
                autoComplete="email"
              />
            </motion.div>

            {/* Phone */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.5 }}
              className="space-y-2"
            >
              <Label htmlFor="phone" className="text-sm font-semibold text-foreground">
                Telefone (Opcional)
              </Label>
              <Input
                id="phone"
                type="tel"
                placeholder="(00) 00000-0000"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="h-11 bg-background/50 border-2 border-border focus:border-primary transition-colors"
                autoComplete="tel"
              />
            </motion.div>

            {/* Referral Code - Destacado */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.55 }}
              className="space-y-2 p-4 rounded-xl bg-gradient-to-br from-accent/10 to-accent/5 border-2 border-accent/30"
            >
              <Label htmlFor="referralCode" className="text-sm font-bold text-foreground flex items-center gap-2">
                <Gift className="w-4 h-4 text-accent" />
                Código de Indicação * 
                {formData.referralCode && <span className="text-success">✓</span>}
              </Label>
              <Input
                id="referralCode"
                type="text"
                placeholder="Digite o código de quem te indicou"
                value={formData.referralCode}
                onChange={(e) => setFormData({ ...formData, referralCode: e.target.value.toUpperCase() })}
                className={`h-11 bg-background border-2 transition-colors ${
                  formData.referralCode 
                    ? 'border-success bg-success/5' 
                    : 'border-accent/50 focus:border-accent'
                }`}
                autoComplete="off"
                required
              />
              {formData.referralCode && (
                <motion.p
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-xs text-success font-medium"
                >
                  ✓ Código aplicado com sucesso
                </motion.p>
              )}
            </motion.div>

            {/* Password */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.6 }}
              className="space-y-2"
            >
              <Label htmlFor="password" className="text-sm font-semibold text-foreground">
                Senha *
              </Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Mínimo 6 caracteres"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="h-11 bg-background/50 border-2 border-border focus:border-primary transition-colors pr-12"
                  autoComplete="new-password"
                />
                <motion.button
                  whileTap={{ scale: 0.95 }}
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </motion.button>
              </div>
            </motion.div>

            {/* Confirm Password */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.65 }}
              className="space-y-2"
            >
              <Label htmlFor="confirmPassword" className="text-sm font-semibold text-foreground">
                Confirmar Senha *
              </Label>
              <div className="relative">
                <Input
                  id="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  placeholder="Digite a senha novamente"
                  value={formData.confirmPassword}
                  onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                  className="h-11 bg-background/50 border-2 border-border focus:border-primary transition-colors pr-12"
                  autoComplete="new-password"
                />
                <motion.button
                  whileTap={{ scale: 0.95 }}
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </motion.button>
              </div>
            </motion.div>

            {/* Terms */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.7 }}
              className="flex items-start space-x-3 pt-2"
            >
              <Checkbox
                id="terms"
                checked={agreedToTerms}
                onCheckedChange={(checked) => setAgreedToTerms(checked as boolean)}
                className="mt-0.5"
              />
              <label htmlFor="terms" className="text-xs text-muted-foreground leading-tight cursor-pointer">
                Eu concordo com os{" "}
                <button type="button" className="text-primary hover:underline font-semibold">
                  Termos de Uso
                </button>{" "}
                e a{" "}
                <button type="button" className="text-primary hover:underline font-semibold">
                  Política de Privacidade
                </button>
              </label>
            </motion.div>

            {/* Submit Button */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.75 }}
            >
              <Button
                type="submit"
                className="w-full h-12 bg-gradient-to-r from-accent to-accent/80 hover:from-accent/90 hover:to-accent/70 text-accent-foreground font-semibold shadow-lg transition-all"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                      className="mr-2 h-5 w-5 border-2 border-accent-foreground border-t-transparent rounded-full"
                    />
                    Criando conta...
                  </>
                ) : (
                  <>
                    <UserPlus className="w-5 h-5 mr-2" />
                    Criar Conta
                  </>
                )}
              </Button>
            </motion.div>
          </form>

          {/* Divider */}
          <div className="relative my-4">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-border"></div>
            </div>
            <div className="relative flex justify-center text-xs">
              <span className="px-3 bg-card text-muted-foreground">ou</span>
            </div>
          </div>

          {/* Login Link */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8 }}
            className="text-center"
          >
            <p className="text-muted-foreground text-sm">
              Já tem uma conta?{" "}
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => navigate("/login")}
                className="text-primary font-semibold hover:text-primary/80 transition-colors"
              >
                Entrar agora
              </motion.button>
            </p>
          </motion.div>
        </motion.div>

        {/* Footer */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.85 }}
          className="text-center text-xs text-muted-foreground mt-4"
        >
          Ao se cadastrar, você concorda com nossos termos e políticas
        </motion.p>
      </motion.div>
    </div>
  );
};

export default Register;
