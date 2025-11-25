import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, ArrowDownToLine, ArrowUpFromLine, Users, Users2, TrendingUp, Filter, Loader2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import BottomNavigation from "@/components/BottomNavigation";
import { profileAPI } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";

type TransactionType = "DEPOSIT" | "WITHDRAW" | "EARNING" | "COMMISSION" | "ADJUSTMENT";

interface Transaction {
  id: number;
  type: TransactionType;
  amount: number;
  description: string;
  created_at: string;
  reference_type?: string;
  reference_id?: number;
  operation?: string;
}

const Statement = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [filter, setFilter] = useState<TransactionType | "all">("all");
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalBalance, setTotalBalance] = useState(0);

  useEffect(() => {
    fetchStatement();
  }, []);

  const fetchStatement = async () => {
    try {
      setLoading(true);
      const response = await profileAPI.getStatement();
      
      if (response.data?.data) {
        setTransactions(response.data.data);
        
        // Calcular saldo total (soma de créditos - débitos)
        const balance = response.data.data.reduce((sum: number, t: Transaction) => {
          return sum + parseFloat(t.amount.toString());
        }, 0);
        setTotalBalance(balance);
      }
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.response?.data?.message || "Erro ao carregar extrato",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getTransactionIcon = (type: TransactionType) => {
    switch (type) {
      case "DEPOSIT":
        return <ArrowDownToLine className="h-5 w-5 text-success" />;
      case "WITHDRAW":
        return <ArrowUpFromLine className="h-5 w-5 text-destructive" />;
      case "COMMISSION":
        return <Users className="h-5 w-5 text-accent" />;
      case "EARNING":
        return <TrendingUp className="h-5 w-5 text-primary" />;
      case "ADJUSTMENT":
        return <Users2 className="h-5 w-5 text-warning" />;
      default:
        return <TrendingUp className="h-5 w-5 text-muted-foreground" />;
    }
  };

  const getTransactionLabel = (type: TransactionType) => {
    switch (type) {
      case "DEPOSIT":
        return "Depósito";
      case "WITHDRAW":
        return "Saque";
      case "COMMISSION":
        return "Comissão";
      case "EARNING":
        return "Rendimento";
      case "ADJUSTMENT":
        return "Ajuste";
      default:
        return type;
    }
  };

  const filteredTransactions = filter === "all" 
    ? transactions 
    : transactions.filter(t => t.type === filter);

  return (
    <div className="min-h-screen bg-background pb-20">
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
          <h1 className="text-lg font-bold text-foreground">Extrato</h1>
        </div>
      </header>

      <div className="container max-w-lg px-4 py-6 space-y-6">
        <Card className="border-border bg-gradient-to-br from-primary to-primary/80 p-6 text-primary-foreground">
          <div className="space-y-2">
            <p className="text-sm opacity-90">Saldo Total Movimentado</p>
            {loading ? (
              <div className="flex items-center gap-2">
                <Loader2 className="h-6 w-6 animate-spin" />
                <span className="text-xl">Carregando...</span>
              </div>
            ) : (
              <p className="text-3xl font-bold">
                R$ {totalBalance.toFixed(2)}
              </p>
            )}
          </div>
        </Card>

        <Tabs defaultValue="all" className="w-full" onValueChange={(v) => setFilter(v as TransactionType | "all")}>
          <div className="overflow-x-auto -mx-4 px-4 pb-2">
            <TabsList className="inline-flex w-max min-w-full">
              <TabsTrigger value="all" className="text-xs whitespace-nowrap px-4">Todos</TabsTrigger>
              <TabsTrigger value="DEPOSIT" className="text-xs whitespace-nowrap px-4">Depósitos</TabsTrigger>
              <TabsTrigger value="WITHDRAW" className="text-xs whitespace-nowrap px-4">Saques</TabsTrigger>
              <TabsTrigger value="EARNING" className="text-xs whitespace-nowrap px-4">Rendimentos</TabsTrigger>
              <TabsTrigger value="COMMISSION" className="text-xs whitespace-nowrap px-3">Comissões</TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value={filter} className="mt-6 space-y-3">
            {loading ? (
              <Card className="border-border bg-card p-8 text-center">
                <Loader2 className="mx-auto h-12 w-12 text-primary animate-spin mb-3" />
                <p className="text-muted-foreground">Carregando transações...</p>
              </Card>
            ) : filteredTransactions.length === 0 ? (
              <Card className="border-border bg-card p-8 text-center">
                <Filter className="mx-auto h-12 w-12 text-muted-foreground mb-3" />
                <p className="text-muted-foreground">Nenhuma transação encontrada</p>
              </Card>
            ) : (
              filteredTransactions.map((transaction, index) => (
                <motion.div
                  key={transaction.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.05 }}
                >
                  <Card className="border-border bg-card p-4 hover:shadow-md transition-shadow">
                    <div className="flex items-center gap-3">
                      <div className="flex-shrink-0 rounded-full bg-muted p-2.5">
                        {getTransactionIcon(transaction.type)}
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-3">
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold text-foreground text-sm">
                              {getTransactionLabel(transaction.type)}
                            </p>
                            <p className="text-xs text-muted-foreground truncate">
                              {transaction.description}
                            </p>
                            <p className="text-xs text-muted-foreground mt-1">
                              {new Date(transaction.created_at).toLocaleDateString('pt-BR', { 
                                day: '2-digit', 
                                month: '2-digit',
                                year: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </p>
                          </div>
                          
                          <div className="flex-shrink-0 text-right">
                            <p className={`font-bold text-sm whitespace-nowrap ${
                              transaction.amount >= 0 ? 'text-success' : 'text-destructive'
                            }`}>
                              {transaction.amount >= 0 ? '+' : ''} R$ {Math.abs(parseFloat(transaction.amount.toString())).toFixed(2)}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </Card>
                </motion.div>
              ))
            )}
          </TabsContent>
        </Tabs>
      </div>

      <BottomNavigation />
    </div>
  );
};

export default Statement;

