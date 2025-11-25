import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { X, Coins, TrendingUp, Users, Zap, Clock, DollarSign, Star } from "lucide-react";
import angloGoldLogo from "@/assets/anglogold-logo.png";

const WelcomePopup = () => {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    // Delay para o popup aparecer após a página carregar
    const timer = setTimeout(() => {
      setOpen(true);
    }, 1500);

    return () => clearTimeout(timer);
  }, []);

  return (
    <AnimatePresence>
      {open && (
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogContent className="max-w-lg p-0 gap-0 bg-gradient-to-br from-background via-background to-muted/30 border-2 border-accent/30 rounded-2xl overflow-hidden shadow-2xl">
            <DialogTitle className="sr-only">Bem-vindo à AngloGold</DialogTitle>
            <DialogDescription className="sr-only">AngloGold - Lucro Diário e Automático</DialogDescription>
            
            {/* Close Button */}
            <motion.button
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.3, type: "spring" }}
              whileHover={{ scale: 1.15, rotate: 90 }}
              whileTap={{ scale: 0.85 }}
              onClick={() => setOpen(false)}
              className="absolute top-3 right-3 z-50 bg-destructive/90 hover:bg-destructive text-destructive-foreground rounded-full p-1.5 shadow-lg transition-all"
            >
              <X className="w-4 h-4" />
            </motion.button>

            {/* Hero Header */}
            <div className="relative overflow-hidden bg-gradient-to-br from-accent via-accent/90 to-accent/80 pb-8">
              {/* Animated Background Circles */}
              <div className="absolute inset-0 overflow-hidden">
                <motion.div
                  animate={{
                    scale: [1, 1.2, 1],
                    opacity: [0.3, 0.5, 0.3],
                  }}
                  transition={{ duration: 4, repeat: Infinity }}
                  className="absolute -top-20 -right-20 w-60 h-60 bg-white/10 rounded-full blur-3xl"
                />
                <motion.div
                  animate={{
                    scale: [1.2, 1, 1.2],
                    opacity: [0.2, 0.4, 0.2],
                  }}
                  transition={{ duration: 5, repeat: Infinity }}
                  className="absolute -bottom-20 -left-20 w-60 h-60 bg-white/10 rounded-full blur-3xl"
                />
              </div>

              {/* Content */}
              <div className="relative z-10 pt-8 px-6 text-center">
                {/* Logo */}
                <motion.div
                  initial={{ scale: 0, rotate: -180 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
                  className="mb-4"
                >
                  <div className="inline-block p-3 bg-white/20 backdrop-blur-sm rounded-2xl">
                    <img 
                      src={angloGoldLogo} 
                      alt="AngloGold" 
                      className="h-14 w-auto"
                    />
                  </div>
                </motion.div>

                {/* Title */}
                <motion.h2
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="text-2xl font-bold text-white mb-2"
                >
                  Lucro Diário e Automático
                </motion.h2>

                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.4 }}
                  className="text-white/90 text-sm font-medium"
                >
                  Invista e ganhe todos os dias! 🚀
                </motion.p>
              </div>
            </div>

            {/* Content */}
            <div className="p-6 space-y-5">
              {/* Benefits Grid */}
              <div className="grid grid-cols-2 gap-3">
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.5 }}
                  className="bg-gradient-to-br from-success/10 to-success/5 p-4 rounded-xl border border-success/20"
                >
                  <Zap className="w-8 h-8 text-success mb-2" />
                  <p className="text-xs font-bold text-foreground mb-1">Lucro Diário</p>
                  <p className="text-[10px] text-muted-foreground">Ganhe todos os dias automaticamente</p>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.6 }}
                  className="bg-gradient-to-br from-primary/10 to-primary/5 p-4 rounded-xl border border-primary/20"
                >
                  <DollarSign className="w-8 h-8 text-primary mb-2" />
                  <p className="text-xs font-bold text-foreground mb-1">Depósito: R$ 30</p>
                  <p className="text-[10px] text-muted-foreground">Valor mínimo acessível</p>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.7 }}
                  className="bg-gradient-to-br from-accent/10 to-accent/5 p-4 rounded-xl border border-accent/20"
                >
                  <Coins className="w-8 h-8 text-accent mb-2" />
                  <p className="text-xs font-bold text-foreground mb-1">Saque: R$ 30</p>
                  <p className="text-[10px] text-muted-foreground">Taxa: 12%</p>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.8 }}
                  className="bg-gradient-to-br from-warning/10 to-warning/5 p-4 rounded-xl border border-warning/20"
                >
                  <Clock className="w-8 h-8 text-warning mb-2" />
                  <p className="text-xs font-bold text-foreground mb-1">Seg-Dom</p>
                  <p className="text-[10px] text-muted-foreground">10h às 17h</p>
                </motion.div>
              </div>

              {/* Commission Section */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.9 }}
                className="bg-gradient-to-r from-accent/10 via-accent/5 to-transparent p-5 rounded-xl border border-accent/20"
              >
                <div className="flex items-center gap-2 mb-4">
                  <Star className="w-5 h-5 text-accent" />
                  <h3 className="font-bold text-foreground">Programa de Indicação</h3>
                </div>

                <div className="space-y-3">
                  {/* 1ª Compra */}
                  <div className="bg-background/50 p-3 rounded-lg">
                    <p className="text-xs font-semibold text-muted-foreground mb-2">1ª Compra</p>
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-foreground">Nível 1:</span>
                      <span className="font-bold text-accent">25%</span>
                    </div>
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-foreground">Nível 2:</span>
                      <span className="font-bold text-primary">2%</span>
                    </div>
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-foreground">Nível 3:</span>
                      <span className="font-bold text-success">1%</span>
                    </div>
                  </div>

                  {/* 2ª+ Compra */}
                  <div className="bg-background/50 p-3 rounded-lg">
                    <p className="text-xs font-semibold text-muted-foreground mb-2">2ª Compra em Diante</p>
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-foreground">Nível 1:</span>
                      <span className="font-bold text-accent">13%</span>
                    </div>
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-foreground">Nível 2:</span>
                      <span className="font-bold text-primary">1%</span>
                    </div>
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-foreground">Nível 3:</span>
                      <span className="font-bold text-success">1%</span>
                    </div>
                  </div>
                </div>
              </motion.div>

              {/* Important Note */}
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 1.0 }}
                className="bg-gradient-to-r from-destructive/10 to-destructive/5 p-4 rounded-xl border border-destructive/20"
              >
                <p className="text-xs text-center text-foreground leading-relaxed">
                  <strong>⚠️ Importante:</strong> Só saca com plano ativo. Comissão na compra do pacote.
                </p>
              </motion.div>

              {/* Action Buttons */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1.1 }}
                className="space-y-3 pt-2"
              >
                <Button 
                  className="w-full bg-gradient-to-r from-accent to-accent/80 hover:from-accent/90 hover:to-accent/70 text-accent-foreground font-bold h-12 text-sm shadow-lg rounded-xl" 
                  onClick={() => window.open('https://chat.whatsapp.com/ENpJ4S4bAIgAtMqCUcri1z?mode=hqrt3', '_blank')}
                >
                  <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
                  </svg>
                  Grupo WhatsApp Oficial
                </Button>
                
                <Button 
                  variant="outline" 
                  className="w-full h-11 text-sm border-2 border-border hover:bg-accent/10 font-semibold rounded-xl" 
                  onClick={() => setOpen(false)}
                >
                  Começar Agora! 🚀
                </Button>
              </motion.div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </AnimatePresence>
  );
};

export default WelcomePopup;
