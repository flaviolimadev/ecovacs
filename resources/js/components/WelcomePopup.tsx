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
          <DialogContent className="max-w-sm p-0 gap-0 bg-gradient-to-br from-background to-muted/20 border border-accent/20 rounded-xl overflow-hidden shadow-xl">
            <DialogTitle className="sr-only">Bem-vindo à AngloGold</DialogTitle>
            <DialogDescription className="sr-only">AngloGold - Lucro Diário e Automático</DialogDescription>
            
            {/* Close Button */}
            <motion.button
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2, type: "spring" }}
              whileHover={{ scale: 1.1, rotate: 90 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => setOpen(false)}
              className="absolute top-2 right-2 z-50 bg-destructive/80 hover:bg-destructive text-destructive-foreground rounded-full p-1 shadow-md"
            >
              <X className="w-3 h-3" />
            </motion.button>

            {/* Compact Header */}
            <div className="relative overflow-hidden bg-gradient-to-br from-accent to-accent/80 py-4">
              <div className="relative z-10 px-4 text-center">
                {/* Logo */}
                <motion.div
                  initial={{ scale: 0, rotate: -180 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ delay: 0.1, type: "spring", stiffness: 200 }}
                  className="mb-2"
                >
                  <div className="inline-block p-2 bg-white/15 backdrop-blur-sm rounded-xl">
                    <img 
                      src={angloGoldLogo} 
                      alt="AngloGold" 
                      className="h-10 w-auto"
                    />
                  </div>
                </motion.div>

                {/* Title */}
                <motion.h2
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.2 }}
                  className="text-lg font-bold text-white mb-1"
                >
                  Lucro Diário Automático 💰
                </motion.h2>
              </div>
            </div>

            {/* Content */}
            <div className="p-4 space-y-3">
              {/* Benefits Grid - Compact */}
              <div className="grid grid-cols-2 gap-2">
                <div className="bg-gradient-to-br from-success/10 to-success/5 p-2.5 rounded-lg border border-success/20">
                  <div className="flex items-center gap-2">
                    <Zap className="w-5 h-5 text-success" />
                    <div>
                      <p className="text-[10px] font-bold text-foreground">Depósito</p>
                      <p className="text-[11px] text-accent font-bold">R$ 30</p>
                    </div>
                  </div>
                </div>

                <div className="bg-gradient-to-br from-accent/10 to-accent/5 p-2.5 rounded-lg border border-accent/20">
                  <div className="flex items-center gap-2">
                    <Coins className="w-5 h-5 text-accent" />
                    <div>
                      <p className="text-[10px] font-bold text-foreground">Saque</p>
                      <p className="text-[11px] text-accent font-bold">R$ 30 (12%)</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Time Info - Single Row */}
              <div className="bg-gradient-to-r from-primary/10 to-primary/5 p-2 rounded-lg border border-primary/20 text-center">
                <p className="text-[10px] text-muted-foreground">Saques: <span className="font-bold text-foreground">Seg-Dom • 10h-17h</span></p>
              </div>

              {/* Commission Section - Compact */}
              <div className="bg-gradient-to-r from-accent/10 to-transparent p-3 rounded-lg border border-accent/20">
                <div className="flex items-center gap-1.5 mb-2">
                  <Star className="w-4 h-4 text-accent" />
                  <h3 className="text-xs font-bold text-foreground">Programa de Indicação</h3>
                </div>

                <div className="grid grid-cols-2 gap-2 text-[10px]">
                  {/* 1ª Compra */}
                  <div className="bg-background/50 p-2 rounded">
                    <p className="font-semibold text-muted-foreground mb-1">1ª Compra</p>
                    <div className="space-y-0.5">
                      <div className="flex justify-between">
                        <span>N1:</span>
                        <span className="font-bold text-accent">25%</span>
                      </div>
                      <div className="flex justify-between">
                        <span>N2:</span>
                        <span className="font-bold text-primary">2%</span>
                      </div>
                      <div className="flex justify-between">
                        <span>N3:</span>
                        <span className="font-bold text-success">1%</span>
                      </div>
                    </div>
                  </div>

                  {/* 2ª+ Compra */}
                  <div className="bg-background/50 p-2 rounded">
                    <p className="font-semibold text-muted-foreground mb-1">Demais</p>
                    <div className="space-y-0.5">
                      <div className="flex justify-between">
                        <span>N1:</span>
                        <span className="font-bold text-accent">13%</span>
                      </div>
                      <div className="flex justify-between">
                        <span>N2:</span>
                        <span className="font-bold text-primary">1%</span>
                      </div>
                      <div className="flex justify-between">
                        <span>N3:</span>
                        <span className="font-bold text-success">1%</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Important Note - Compact */}
              <div className="bg-warning/10 p-2 rounded-lg border border-warning/20">
                <p className="text-[10px] text-center text-foreground">
                  <strong>⚠️</strong> Só saca com plano ativo
                </p>
              </div>

              {/* Action Buttons - Compact */}
              <div className="space-y-2">
                <Button 
                  className="w-full bg-gradient-to-r from-accent to-accent/80 hover:from-accent/90 hover:to-accent/70 text-accent-foreground font-bold h-9 text-xs shadow-md rounded-lg" 
                  onClick={() => window.open('https://chat.whatsapp.com/ENpJ4S4bAIgAtMqCUcri1z?mode=hqrt3', '_blank')}
                >
                  <svg className="w-4 h-4 mr-1.5" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
                  </svg>
                  Grupo WhatsApp
                </Button>
                
                <Button 
                  variant="outline" 
                  className="w-full h-8 text-xs border border-border hover:bg-accent/10 font-semibold rounded-lg" 
                  onClick={() => setOpen(false)}
                >
                  Começar Agora 🚀
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </AnimatePresence>
  );
};

export default WelcomePopup;
