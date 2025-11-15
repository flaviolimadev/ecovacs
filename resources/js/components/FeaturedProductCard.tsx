import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ShoppingCart, Loader2, AlertCircle, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { investmentsAPI } from "@/lib/api";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface FeaturedProductCardProps {
  id: number;
  name: string;
  image: string;
  price: string;
  dailyIncome: string;
  duration: string;
  totalReturn: string;
  maxPurchases: string;
  featuredColor: string;
  featuredEndsAt: string | null;
}

const FeaturedProductCard = ({ 
  id, 
  name, 
  image, 
  price, 
  dailyIncome, 
  duration, 
  totalReturn, 
  maxPurchases,
  featuredColor,
  featuredEndsAt
}: FeaturedProductCardProps) => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, fetchUser } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [activePurchases, setActivePurchases] = useState(0);
  const [checkingLimit, setCheckingLimit] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState<{ hours: number; minutes: number; seconds: number } | null>(null);
  const [isExpired, setIsExpired] = useState(false);

  // Calcular tempo restante
  useEffect(() => {
    if (!featuredEndsAt) {
      setTimeRemaining(null);
      setIsExpired(false);
      return;
    }

    const updateTime = () => {
      const now = new Date().getTime();
      const end = new Date(featuredEndsAt!).getTime();
      const diff = end - now;

      if (diff <= 0) {
        setTimeRemaining(null);
        setIsExpired(true);
        return;
      }

      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);
      setTimeRemaining({ hours, minutes, seconds });
      setIsExpired(false);
    };

    updateTime();
    const interval = setInterval(updateTime, 1000); // Atualizar a cada segundo

    return () => clearInterval(interval);
  }, [featuredEndsAt]);

  // Buscar quantidade de compras ativas deste plano
  useEffect(() => {
    const checkActivePurchases = async () => {
      try {
        setCheckingLimit(true);
        const response = await investmentsAPI.getAll('active');
        const investments = response.data.data;
        
        const count = investments.filter((inv: any) => inv.plan_id === id).length;
        setActivePurchases(count);
      } catch (error) {
        // Silenciar erro
      } finally {
        setCheckingLimit(false);
      }
    };

    checkActivePurchases();
  }, [id]);

  const maxPurchasesNumber = parseInt(maxPurchases.split(' ')[0]) || 0;
  const isUnlimited = maxPurchasesNumber === 0 || maxPurchases.includes('Ilimitado');
  const limitReached = !isUnlimited && activePurchases >= maxPurchasesNumber;

  const handlePurchase = async () => {
    setShowConfirmDialog(false);
    setIsLoading(true);

    try {
      const response = await investmentsAPI.create(id);
      await fetchUser();
      setActivePurchases(prev => prev + 1);

      toast({
        title: "🎉 Plano contratado!",
        description: `Você contratou o plano ${name} com sucesso!`,
      });
    } catch (error: any) {
      const errorData = error.response?.data;
      
      if (errorData?.error === 'INSUFFICIENT_BALANCE') {
        toast({
          title: "💰 Saldo insuficiente",
          description: `Você precisa de ${price}. Faltam R$ ${errorData.data.missing.toFixed(2)}`,
          variant: "destructive",
        });

        setTimeout(() => {
          navigate('/deposit');
        }, 2000);
      } else if (errorData?.error === 'PURCHASE_LIMIT_REACHED') {
        toast({
          title: "⚠️ Limite atingido",
          description: `Você já possui o máximo de ${errorData.data.max_purchases} planos ativos deste tipo.`,
          variant: "destructive",
        });
      } else {
        toast({
          title: "❌ Erro",
          description: errorData?.message || "Não foi possível contratar o plano",
          variant: "destructive",
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <div 
        className="relative rounded-2xl bg-card p-3 shadow-lg border-2"
        style={{ borderColor: featuredColor }}
      >
        {/* Badge de Plano Limitado */}
        <div 
          className="absolute top-2 right-2 px-2 py-1 rounded-lg text-xs font-bold text-white z-10"
          style={{ backgroundColor: featuredColor }}
        >
          ⚡ LIMITADO
        </div>

        {/* Relógio de Contagem Regressiva */}
        {featuredEndsAt ? (
          <div 
            className="absolute top-2 left-2 px-3 py-1.5 rounded-lg text-xs font-bold text-white z-10 flex flex-col items-center gap-0.5 shadow-lg"
            style={{ backgroundColor: featuredColor }}
          >
            {isExpired ? (
              <div className="flex items-center gap-1">
                <Clock className="w-3 h-3" />
                <span>Expirado</span>
              </div>
            ) : timeRemaining ? (
              <>
                <div className="flex items-center gap-1 text-[10px] opacity-90">
                  <Clock className="w-2.5 h-2.5" />
                  <span>Disponível por:</span>
                </div>
                <div className="text-sm font-mono">
                  {String(timeRemaining.hours).padStart(2, '0')}:
                  {String(timeRemaining.minutes).padStart(2, '0')}:
                  {String(timeRemaining.seconds).padStart(2, '0')}
                </div>
              </>
            ) : (
              <div className="flex items-center gap-1">
                <Clock className="w-3 h-3" />
                <span>Calculando...</span>
              </div>
            )}
          </div>
        ) : (
          <div 
            className="absolute top-2 left-2 px-3 py-1.5 rounded-lg text-xs font-bold text-white z-10 flex items-center gap-1 shadow-lg"
            style={{ backgroundColor: featuredColor }}
          >
            <Clock className="w-3 h-3" />
            <span>Disponível</span>
          </div>
        )}

        {/* Imagem com animação piscando */}
        <div 
          className="mb-3 rounded-xl p-3 flex items-center justify-center relative overflow-hidden"
          style={{ backgroundColor: `${featuredColor}15` }}
        >
          <div 
            className="absolute inset-0 opacity-20 animate-pulse"
            style={{ backgroundColor: featuredColor }}
          />
          <img
            src={image}
            alt={name}
            className="h-40 w-full object-contain relative z-10 animate-pulse"
            style={{ animationDuration: '2s' }}
          />
        </div>

        <h3 className="mb-3 text-sm font-bold text-foreground">{name}</h3>

        <div className="space-y-1.5 text-xs">
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">💵 Valor:</span>
            <span className="font-bold text-primary">{price}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">📈 Renda Diária:</span>
            <span className="font-semibold text-success">{dailyIncome}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">📅 Duração:</span>
            <span className="font-medium text-foreground">{duration}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">💰 Total Recebido:</span>
            <span className="font-bold text-foreground">{totalReturn}</span>
          </div>
          <div className={`mt-2 rounded-lg px-2 py-1 text-center ${
            limitReached ? 'bg-red-100 border border-red-200' : 'bg-primary/10'
          }`}>
            <span className={`text-xs font-medium ${
              limitReached ? 'text-red-700' : 'text-primary'
            }`}>
              {!isUnlimited && `${activePurchases}/${maxPurchasesNumber} ativos • `}
              {maxPurchases}
            </span>
          </div>
        </div>

        {limitReached && (
          <div className="mt-2 p-2 bg-amber-50 border border-amber-200 rounded-lg flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
            <p className="text-xs text-amber-700">
              Você atingiu o limite de compras simultâneas deste plano. Aguarde finalizar um investimento ativo.
            </p>
          </div>
        )}

        <Button
          onClick={() => setShowConfirmDialog(true)}
          disabled={isLoading || checkingLimit || limitReached}
          className={`w-full mt-3 ${
            limitReached 
              ? 'bg-gray-400 hover:bg-gray-400 cursor-not-allowed' 
              : ''
          } text-white`}
          style={!limitReached ? {
            background: `linear-gradient(to right, ${featuredColor}, ${featuredColor}dd)`,
          } : {}}
        >
          {checkingLimit ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Verificando...
            </>
          ) : isLoading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Processando...
            </>
          ) : limitReached ? (
            <>
              <AlertCircle className="w-4 h-4 mr-2" />
              Limite Atingido
            </>
          ) : (
            <>
              <ShoppingCart className="w-4 h-4 mr-2" />
              Alugar
            </>
          )}
        </Button>
      </div>

      <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar Aluguel</AlertDialogTitle>
            <AlertDialogDescription className="space-y-3">
              <p>Você está prestes a alugar o equipamento:</p>
              <div className="bg-muted p-3 rounded-lg space-y-2 text-sm">
                <p className="font-semibold text-foreground">{name}</p>
                <div className="flex justify-between">
                  <span>Valor:</span>
                  <span className="font-bold text-primary">{price}</span>
                </div>
                <div className="flex justify-between">
                  <span>Retorno Total:</span>
                  <span className="font-bold text-green-600">{totalReturn}</span>
                </div>
                <div className="flex justify-between">
                  <span>Seu Saldo Atual:</span>
                  <span className="font-bold">R$ {user?.balance ? user.balance.toFixed(2) : '0,00'}</span>
                </div>
              </div>
              <p className="text-xs">O valor será debitado do seu saldo disponível.</p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handlePurchase} style={{ backgroundColor: featuredColor }}>
              Confirmar Aluguel
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default FeaturedProductCard;

