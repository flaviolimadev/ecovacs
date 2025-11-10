import { Trophy, Target, Sparkles, Gift, Zap, Star } from "lucide-react";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import GoalsSection from "./GoalsSection";
import { networkAPI } from "@/lib/api";

const FeatureCards = () => {
  const navigate = useNavigate();
  const [directNetworkVolume, setDirectNetworkVolume] = useState(0);

  useEffect(() => {
    const loadNetworkVolume = async () => {
      try {
        const response = await networkAPI.getStats();
        const stats = response.data.data;
        
        // Volume direto = total_deposits do nível A (índice 0)
        const levelA = stats.levels.find((level: any) => level.level === 1);
        setDirectNetworkVolume(levelA?.total_deposits || 0);
      } catch (error) {

        setDirectNetworkVolume(0);
      }
    };

    loadNetworkVolume();
  }, []);

  const handleTaskClick = () => {
    const goalsButton = document.querySelector('#goals-section-wrapper button');
    if (goalsButton instanceof HTMLElement) {
      goalsButton.click();
    }
  };

  const handleDailyRewardClick = () => {
    navigate('/daily-reward');
  };

  return (
    <>
      <div className="mx-4 mt-6 grid grid-cols-2 gap-3">
        {/* Sorteio Premiado Card - Compacto */}
        <button 
          onClick={handleDailyRewardClick}
          className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-amber-400 via-orange-500 to-pink-500 p-4 shadow-lg transition-all hover:scale-105 hover:shadow-xl active:scale-95"
        >
          <div className="relative z-10">
            <div className="flex items-center gap-1 mb-1">
              <Trophy className="h-4 w-4 text-white" strokeWidth={2.5} />
              <Sparkles className="h-3 w-3 text-yellow-200 animate-pulse" />
            </div>
            <h3 className="text-sm font-bold text-white">Sorteio</h3>
            <h3 className="text-sm font-bold text-white/90 mb-2">premiado</h3>
            
            <div className="flex items-center justify-center bg-white/20 backdrop-blur-sm rounded-xl py-2">
              <Gift className="h-8 w-8 text-white drop-shadow-lg" strokeWidth={2} />
            </div>
          </div>
          
          {/* Decorative elements */}
          <div className="absolute top-2 right-2 w-16 h-16 bg-white/10 rounded-full blur-xl"></div>
          <Star className="absolute bottom-2 right-2 h-4 w-4 text-yellow-200 opacity-80" fill="currentColor" />
        </button>

        {/* Concluir Tarefa Card - Compacto */}
        <button 
          onClick={handleTaskClick}
          className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-cyan-400 via-blue-500 to-purple-600 p-4 shadow-lg transition-all hover:scale-105 hover:shadow-xl active:scale-95"
        >
          <div className="relative z-10">
            <div className="flex items-center gap-1 mb-1">
              <Target className="h-4 w-4 text-white" strokeWidth={2.5} />
              <Zap className="h-3 w-3 text-yellow-300 animate-pulse" />
            </div>
            <h3 className="text-sm font-bold text-white">Completar</h3>
            <h3 className="text-sm font-bold text-white/90 mb-2">Tarefas</h3>
            
            <div className="bg-white/20 backdrop-blur-sm rounded-xl py-2 px-2 space-y-1">
              {[
                { progress: 100, label: "3/3" },
                { progress: 66, label: "2/3" },
                { progress: 33, label: "1/3" }
              ].map((item, index) => (
                <div key={index} className="flex items-center gap-1.5">
                  <div className="flex-1 h-1.5 bg-white/30 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-gradient-to-r from-green-400 to-emerald-300 rounded-full transition-all duration-500"
                      style={{ width: `${item.progress}%` }}
                    ></div>
                  </div>
                  <span className="text-[9px] font-bold text-white/90 min-w-[20px]">{item.label}</span>
                </div>
              ))}
            </div>
          </div>
          
          {/* Decorative elements */}
          <div className="absolute top-2 right-2 w-16 h-16 bg-white/10 rounded-full blur-xl"></div>
          <Sparkles className="absolute bottom-2 right-2 h-4 w-4 text-cyan-200 opacity-80" />
        </button>
      </div>

      {/* Hidden Goals modal trigger */}
      <div className="fixed -left-[9999px]" id="goals-section-wrapper">
        <GoalsSection currentVolume={directNetworkVolume} />
      </div>
    </>
  );
};

export default FeatureCards;
