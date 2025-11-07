import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";

const ecovacsLogo = "/assets/ecovacs-logo.png";
const WelcomePopup = () => {
  const [open, setOpen] = useState(false);
  useEffect(() => {
    // Open popup when component mounts
    setOpen(true);
  }, []);
  return <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="max-w-sm p-0 gap-0 bg-white border-none rounded-2xl overflow-hidden">
        <DialogTitle className="sr-only">Bem-vindo à Meituan</DialogTitle>
        <DialogDescription className="sr-only">Evento Especial Meituan - Bônus de Embaixador de Indicação</DialogDescription>
        {/* Header */}
        <div className="bg-[#0EA5E9] px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="bg-white px-2 py-1 rounded">
              <img src={ecovacsLogo} alt="Ecovacs Robotics" className="h-6" />
            </div>
          </div>
          
          <button 
            onClick={() => setOpen(false)}
            className="text-white hover:bg-white/20 rounded-full p-1 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Banner Image */}
        <div className="w-full h-32 bg-gradient-to-r from-slate-800 to-slate-900 flex items-center justify-center overflow-hidden">
          <div className="text-white text-4xl font-bold opacity-20">美团外卖</div>
        </div>

        {/* Content */}
        <div className="p-4 space-y-4">
          <div className="bg-[#E0F2FE] p-3 rounded-lg">
            <h3 className="text-sm font-bold text-[#0369A1] flex items-start gap-2">
              <span>⚡</span>
              <span>Evento Especial Meituan - Bônus de Embaixador de Indicação</span>
            </h3>
          </div>

          <div className="space-y-2 text-sm">
            <p className="flex items-start gap-2">
              <span className="text-[#DC2626]">📦</span>
              <span className="text-gray-700">Cada convite e cada ação são forças para crescimento da equipe!</span>
            </p>
            <p className="text-gray-600">O seu esforço merece reconhecimento e recompensa.</p>
            <p className="text-gray-700">A Meituan entende que a verdadeira influência vem de cada membro da equipe.</p>
          </div>

          {/* Buttons */}
          <div className="space-y-2">
            <Button className="w-full bg-[#0EA5E9] hover:bg-[#0284C7] text-white font-semibold" onClick={() => window.open('https://t.me/your-telegram-group', '_blank')}>
              <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.562 8.161c-.18 1.897-.962 6.502-1.359 8.627-.168.9-.5 1.201-.82 1.23-.697.064-1.226-.461-1.901-.903-1.056-.692-1.653-1.123-2.678-1.799-1.185-.781-.417-1.21.258-1.911.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.139-5.062 3.345-.479.329-.913.489-1.302.481-.428-.008-1.252-.241-1.865-.44-.752-.244-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.831-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635.099-.002.321.023.465.142.121.1.155.234.171.329.016.095.037.311.021.48z" />
              </svg>
              IR PARA O GRUPO TELEGRAM
            </Button>
            
            <Button className="w-full bg-[#10B981] hover:bg-[#059669] text-white font-semibold" onClick={() => window.open('https://wa.me/your-whatsapp-group', '_blank')}>
              <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24" fill="currentColor">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
              </svg>
              IR PARA O GRUPO WHATSAPP
            </Button>
            
            <Button className="w-full bg-[#0EA5E9] hover:bg-[#0284C7] text-white font-semibold" onClick={() => setOpen(false)}>
              FECHAR
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>;
};
export default WelcomePopup;