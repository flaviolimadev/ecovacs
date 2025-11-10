import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";

const ecovacsLogo = "/assets/logo.jpg";
const WelcomePopup = () => {
  const [open, setOpen] = useState(false);
  useEffect(() => {
    // Open popup when component mounts
    setOpen(true);
  }, []);
  return <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="max-w-md p-0 gap-0 bg-white border-none rounded-2xl overflow-hidden">
        <DialogTitle className="sr-only">Bem-vindo à Ecovacs</DialogTitle>
        <DialogDescription className="sr-only">Ecovacs - Comissão de Desempenho</DialogDescription>
        
        {/* Close Button */}
        <button 
          onClick={() => setOpen(false)}
          className="absolute top-2 right-2 z-10 bg-white/90 hover:bg-white rounded-full p-1 shadow-lg transition-colors"
        >
          <X className="w-4 h-4 text-gray-700" />
        </button>

        {/* Banner Logo - Compacto */}
        <div className="w-full h-32 bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center overflow-hidden">
          <img 
            src={ecovacsLogo} 
            alt="Ecovacs Robotics" 
            className="w-full h-full object-cover"
          />
        </div>

        {/* Content - Compacto */}
        <div className="p-4 space-y-3">
          <div className="bg-gradient-to-r from-[#E0F2FE] to-[#DBEAFE] px-3 py-2 rounded-lg">
            <h3 className="text-xs font-bold text-[#0369A1]">
              🚀 Programa de Comissões Ecovacs
            </h3>
          </div>

          {/* Grid de Comissões - Compacto */}
          <div className="grid grid-cols-3 gap-2 text-xs">
            {/* 1ª Compra */}
            <div className="bg-gradient-to-br from-blue-50 to-purple-50 p-2 rounded-lg">
              <p className="font-bold text-[#0369A1] mb-1 text-[10px]">📦 1ª Compra</p>
              <div className="space-y-0.5 text-[10px]">
                <p><strong>15%</strong> A</p>
                <p><strong>2%</strong> B</p>
                <p><strong>1%</strong> C</p>
              </div>
            </div>

            {/* 2ª+ Compra */}
            <div className="bg-gradient-to-br from-orange-50 to-pink-50 p-2 rounded-lg">
              <p className="font-bold text-orange-700 mb-1 text-[10px]">🔁 Demais</p>
              <div className="space-y-0.5 text-[10px]">
                <p><strong>8%</strong> A</p>
                <p><strong>2%</strong> B</p>
                <p><strong>1%</strong> C</p>
              </div>
            </div>

            {/* Residual */}
            <div className="bg-gradient-to-br from-green-50 to-emerald-50 p-2 rounded-lg">
              <p className="font-bold text-green-700 mb-1 text-[10px]">💰 Residual</p>
              <div className="space-y-0.5 text-[10px]">
                <p><strong>2,5%</strong> A</p>
                <p><strong>0,5%</strong> B</p>
                <p><strong>0,15%</strong> C</p>
              </div>
            </div>
          </div>

          {/* Texto motivacional - Compacto */}
          <p className="text-xs text-center text-gray-600 leading-relaxed">
            Ganhe com indicações e pelo desempenho da sua equipe!
          </p>

          {/* Buttons - Compactos */}
          <div className="space-y-2">
            <Button 
              className="w-full bg-[#10B981] hover:bg-[#059669] text-white font-semibold h-10 text-sm" 
              onClick={() => window.open('https://chat.whatsapp.com/LGPKK4SbB8h4JpWNxaBy8s?mode=wwt', '_blank')}
            >
              <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24" fill="currentColor">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
              </svg>
              Grupo WhatsApp
            </Button>
            
            <Button 
              variant="outline" 
              className="w-full h-9 text-xs" 
              onClick={() => setOpen(false)}
            >
              Fechar
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>;
};
export default WelcomePopup;