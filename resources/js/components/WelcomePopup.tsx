import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { X, Gift, TrendingUp, Users, Sparkles } from "lucide-react";
import angloGoldLogo from "@/assets/anglogold-logo.png";

const WelcomePopup = () => {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    // Delay para o popup aparecer após a página carregar
    const timer = setTimeout(() => {
      setOpen(true);
    }, 1000);

    return () => clearTimeout(timer);
  }, []);

  return (
    <AnimatePresence>
      {open && (
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogContent className="max-w-md p-0 gap-0 bg-gradient-to-br from-card via-card to-muted border-2 border-primary/20 rounded-3xl overflow-hidden shadow-2xl">
            <DialogTitle className="sr-only">Bem-vindo à AngloGold</DialogTitle>
            <DialogDescription className="sr-only">AngloGold - Sistema de Comissões</DialogDescription>
            
            {/* Close Button */}
            <motion.button
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.5 }}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => setOpen(false)}
              className="absolute top-4 right-4 z-10 bg-background/90 hover:bg-background rounded-full p-2 shadow-lg transition-colors border border-border"
            >
              <X className="w-4 h-4 text-foreground" />
            </motion.button>

            {/* Header com Logo */}
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="relative w-full h-40 bg-gradient-to-br from-primary via-primary/90 to-primary/80 flex flex-col items-center justify-center overflow-hidden"
            >
              {/* Background pattern */}
              <div className="absolute inset-0 opacity-10">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(255,255,255,0.1),transparent_50%)]" />
              </div>

              {/* Logo */}
              <motion.div
                initial={{ scale: 0.5, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.3, type: "spring" }}
                className="relative z-10"
              >
                <img 
                  src={angloGoldLogo} 
                  alt="AngloGold" 
                  className="h-16 w-auto mb-2"
                />
              </motion.div>

              {/* Title */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="relative z-10 flex items-center gap-2"
              >
                <Sparkles className="w-4 h-4 text-accent" />
                <h3 className="text-white font-bold text-lg">Bem-vindo!</h3>
                <Sparkles className="w-4 h-4 text-accent" />
              </motion.div>
            </motion.div>

            {/* Content */}
            <div className="p-6 space-y-4">
              {/* Título da seção */}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.5 }}
                className="bg-gradient-to-r from-accent/20 to-accent/10 px-4 py-3 rounded-xl border border-accent/30"
              >
                <div className="flex items-center gap-2">
                  <Gift className="w-5 h-5 text-accent" />
                  <h4 className="text-sm font-bold text-foreground">
                    Sistema de Comissões MLM
                  </h4>
                </div>
              </motion.div>

              {/* Grid de Comissões */}
              <div className="grid grid-cols-3 gap-3 text-xs">
                {/* 1ª Compra */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.6 }}
                  className="bg-gradient-to-br from-primary/10 to-primary/5 p-3 rounded-xl border border-primary/20"
                >
                  <div className="flex items-center gap-1 mb-2">
                    <TrendingUp className="w-3 h-3 text-primary" />
                    <p className="font-bold text-primary text-[10px]">1ª Compra</p>
                  </div>
                  <div className="space-y-1 text-[10px]">
                    <p className="text-foreground"><strong className="text-primary">15%</strong> Nível A</p>
                    <p className="text-foreground"><strong className="text-primary">2%</strong> Nível B</p>
                    <p className="text-foreground"><strong className="text-primary">1%</strong> Nível C</p>
                  </div>
                </motion.div>

                {/* 2ª+ Compra */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.7 }}
                  className="bg-gradient-to-br from-warning/10 to-warning/5 p-3 rounded-xl border border-warning/20"
                >
                  <div className="flex items-center gap-1 mb-2">
                    <Users className="w-3 h-3 text-warning" />
                    <p className="font-bold text-warning text-[10px]">Demais</p>
                  </div>
                  <div className="space-y-1 text-[10px]">
                    <p className="text-foreground"><strong className="text-warning">8%</strong> Nível A</p>
                    <p className="text-foreground"><strong className="text-warning">2%</strong> Nível B</p>
                    <p className="text-foreground"><strong className="text-warning">1%</strong> Nível C</p>
                  </div>
                </motion.div>

                {/* Residual */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.8 }}
                  className="bg-gradient-to-br from-success/10 to-success/5 p-3 rounded-xl border border-success/20"
                >
                  <div className="flex items-center gap-1 mb-2">
                    <Sparkles className="w-3 h-3 text-success" />
                    <p className="font-bold text-success text-[10px]">Residual</p>
                  </div>
                  <div className="space-y-1 text-[10px]">
                    <p className="text-foreground"><strong className="text-success">2,5%</strong> Nível A</p>
                    <p className="text-foreground"><strong className="text-success">0,5%</strong> Nível B</p>
                    <p className="text-foreground"><strong className="text-success">0,15%</strong> Nível C</p>
                  </div>
                </motion.div>
              </div>

              {/* Info Box */}
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.9 }}
                className="bg-gradient-to-r from-muted/50 to-muted/30 p-4 rounded-xl border border-border"
              >
                <p className="text-xs text-center text-muted-foreground leading-relaxed">
                  ✨ <strong className="text-foreground">Ganhe comissões</strong> por indicações e pelo desempenho da sua equipe!
                </p>
              </motion.div>

              {/* Buttons */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1.0 }}
                className="space-y-3 pt-2"
              >
                <Button 
                  className="w-full bg-gradient-to-r from-[#10B981] to-[#059669] hover:from-[#059669] hover:to-[#047857] text-white font-semibold h-11 text-sm shadow-lg" 
                  onClick={() => window.open('https://chat.whatsapp.com/ENpJ4S4bAIgAtMqCUcri1z?mode=hqrt3', '_blank')}
                >
                  <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
                  </svg>
                  Entrar no Grupo WhatsApp
                </Button>
                
                <Button 
                  variant="outline" 
                  className="w-full h-10 text-sm border-2 hover:bg-muted" 
                  onClick={() => setOpen(false)}
                >
                  Continuar
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
