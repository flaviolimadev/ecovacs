import { ArrowLeft, Sparkles, Shield, TrendingUp, Users, DollarSign, Clock } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import BottomNavigation from "@/components/BottomNavigation";
import angloGoldLogo from "@/assets/anglogold-logo.png";

const About = () => {
  const navigate = useNavigate();

  const features = [
    {
      icon: TrendingUp,
      title: "Lucro Diário Automático",
      description: "Ganhe rendimentos todos os dias de forma automática",
      color: "from-success to-success/80"
    },
    {
      icon: Users,
      title: "Programa de Indicação",
      description: "Ganhe até 25% nas primeiras compras dos seus indicados",
      color: "from-accent to-accent/80"
    },
    {
      icon: DollarSign,
      title: "Depósitos e Saques Simples",
      description: "Depósito mínimo: R$ 30,00 | Saque mínimo: R$ 30,00",
      color: "from-primary to-primary/80"
    },
    {
      icon: Clock,
      title: "Saques Flexíveis",
      description: "Disponível Segunda a Domingo, das 10h às 17h",
      color: "from-warning to-warning/80"
    },
  ];

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-border bg-background/95 backdrop-blur-lg">
        <div className="flex items-center gap-4 px-4 py-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate("/profile")}
            className="hover:bg-secondary"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-lg font-bold text-foreground">Sobre</h1>
        </div>
      </header>

      <div className="container max-w-lg px-4 py-6 space-y-6">
        {/* Logo Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center"
        >
          <div className="inline-block p-4 bg-gradient-to-br from-accent/10 to-accent/5 rounded-2xl mb-4">
            <img 
              src={angloGoldLogo} 
              alt="AngloGold" 
              className="h-20 w-auto mx-auto"
            />
          </div>
          <h2 className="text-2xl font-bold text-foreground mb-2">AngloGold</h2>
          <p className="text-sm text-muted-foreground">Plataforma de Investimentos com Lucro Diário</p>
        </motion.div>

        {/* Description */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card className="border-border bg-card p-5">
            <div className="flex items-center gap-2 mb-3">
              <Sparkles className="w-5 h-5 text-accent" />
              <h3 className="font-bold text-foreground">Nossa Plataforma</h3>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed">
              A AngloGold é uma plataforma inovadora que oferece oportunidades de investimento com 
              rendimentos diários automáticos. Nossa missão é democratizar o acesso a investimentos 
              lucrativos e proporcionar ganhos consistentes aos nossos usuários.
            </p>
          </Card>
        </motion.div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 gap-4">
          {features.map((feature, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 + (index * 0.1) }}
            >
              <Card className="border-border bg-card p-4 hover:shadow-md transition-shadow">
                <div className="flex items-start gap-4">
                  <div className={`flex-shrink-0 p-3 rounded-xl bg-gradient-to-br ${feature.color}`}>
                    <feature.icon className="w-6 h-6 text-white" />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-semibold text-foreground mb-1">{feature.title}</h4>
                    <p className="text-xs text-muted-foreground">{feature.description}</p>
                  </div>
                </div>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Commission Structure */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
        >
          <Card className="border-accent/20 bg-gradient-to-br from-accent/5 to-background p-5">
            <div className="flex items-center gap-2 mb-4">
              <Users className="w-5 h-5 text-accent" />
              <h3 className="font-bold text-foreground">Programa de Indicação</h3>
            </div>
            
            <div className="space-y-3">
              <div>
                <p className="text-xs font-semibold text-muted-foreground mb-2">Primeira Compra</p>
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div className="bg-accent/10 rounded-lg p-2">
                    <p className="text-lg font-bold text-accent">25%</p>
                    <p className="text-[10px] text-muted-foreground">Nível 1</p>
                  </div>
                  <div className="bg-primary/10 rounded-lg p-2">
                    <p className="text-lg font-bold text-primary">2%</p>
                    <p className="text-[10px] text-muted-foreground">Nível 2</p>
                  </div>
                  <div className="bg-success/10 rounded-lg p-2">
                    <p className="text-lg font-bold text-success">1%</p>
                    <p className="text-[10px] text-muted-foreground">Nível 3</p>
                  </div>
                </div>
              </div>

              <div>
                <p className="text-xs font-semibold text-muted-foreground mb-2">Segunda Compra em Diante</p>
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div className="bg-accent/10 rounded-lg p-2">
                    <p className="text-lg font-bold text-accent">13%</p>
                    <p className="text-[10px] text-muted-foreground">Nível 1</p>
                  </div>
                  <div className="bg-primary/10 rounded-lg p-2">
                    <p className="text-lg font-bold text-primary">1%</p>
                    <p className="text-[10px] text-muted-foreground">Nível 2</p>
                  </div>
                  <div className="bg-success/10 rounded-lg p-2">
                    <p className="text-lg font-bold text-success">1%</p>
                    <p className="text-[10px] text-muted-foreground">Nível 3</p>
                  </div>
                </div>
              </div>
            </div>
          </Card>
        </motion.div>

        {/* Important Info */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
        >
          <Card className="border-border bg-card p-5">
            <div className="flex items-center gap-2 mb-3">
              <Shield className="w-5 h-5 text-primary" />
              <h3 className="font-bold text-foreground">Informações Importantes</h3>
            </div>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li className="flex items-start gap-2">
                <span className="text-accent">•</span>
                <span>Comissão aplicada na <strong className="text-foreground">compra do pacote</strong>, não no depósito</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-accent">•</span>
                <span>É necessário ter <strong className="text-foreground">plano ativo</strong> para sacar</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-accent">•</span>
                <span>Taxa de saque: <strong className="text-foreground">12%</strong></span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-accent">•</span>
                <span>Limite: <strong className="text-foreground">1 saque por dia</strong></span>
              </li>
            </ul>
          </Card>
        </motion.div>

        {/* Version */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
          className="text-center text-xs text-muted-foreground"
        >
          <p>Versão 1.0.0</p>
          <p className="mt-1">© 2024 AngloGold. Todos os direitos reservados.</p>
        </motion.div>
      </div>

      <BottomNavigation />
    </div>
  );
};

export default About;



