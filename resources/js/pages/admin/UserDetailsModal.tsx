import { useState, useEffect } from "react";
import api from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  User, 
  TrendingUp, 
  Users, 
  FileText,
  Clock,
  CheckCircle,
  XCircle,
  Loader2
} from "lucide-react";

interface UserDetails {
  user: {
    id: number;
    name: string;
    email: string;
    cpf?: string;
    phone?: string;
    role: string;
    balance: number;
    balance_withdrawn: number;
    total_invested: number;
    total_earned: number;
    total_withdrawn: number;
    referral_code: string;
    referred_by?: {
      id: number;
      name: string;
      email: string;
    };
    created_at: string;
  };
  cycles: {
    summary: {
      total: number;
      active: number;
      finished: number;
      cancelled: number;
      total_invested_in_cycles: number;
    };
    list: Array<{
      id: number;
      plan_name: string;
      amount: number;
      type: string;
      status: string;
      duration_days: number;
      days_paid: number;
      daily_income: number;
      total_return: number;
      total_paid: number;
      started_at: string;
      ends_at?: string;
      created_at: string;
    }>;
  };
  ledger: {
    total_entries: number;
    showing: number;
    entries: Array<{
      id: number;
      type: string;
      description: string;
      amount: number;
      operation: string;
      balance_type: string;
      created_at: string;
    }>;
  };
  referral_network: {
    total_referrals: number;
    by_level: {
      [key: number]: {
        level: number;
        count: number;
        total_invested: number;
        total_earned: number;
        users: Array<{
          id: number;
          name: string;
          email: string;
          total_invested: number;
          total_earned: number;
          active_cycles: number;
          created_at: string;
        }>;
      };
    };
  };
}

interface UserDetailsModalProps {
  userId: number | null;
  open: boolean;
  onClose: () => void;
}

export function UserDetailsModal({ userId, open, onClose }: UserDetailsModalProps) {
  const [details, setDetails] = useState<UserDetails | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open && userId) {
      loadDetails();
    } else {
      // Reset ao fechar
      setDetails(null);
      setError(null);
    }
  }, [open, userId]);

  const loadDetails = async () => {
    if (!userId) return;

    try {
      setLoading(true);
      setError(null);
      const response = await api.get(`/admin/users/${userId}`);
      setDetails(response.data.data);
    } catch (error: any) {
      const errorMessage = error.response?.data?.error?.message || 
                          error.response?.data?.message || 
                          "Erro ao carregar detalhes do usuário";
      setError(errorMessage);
      console.error("Erro ao carregar detalhes:", error);
      console.error("Detalhes do erro:", error.response?.data);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, "default" | "destructive" | "outline" | "secondary"> = {
      ACTIVE: "default",
      FINISHED: "secondary",
      CANCELLED: "destructive",
    };
    return <Badge variant={variants[status] || "outline"}>{status}</Badge>;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (!open || !userId) return null;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <User className="w-5 h-5" />
            Detalhes do Usuário
          </DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
            <p className="ml-3 text-gray-600">Carregando detalhes...</p>
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center py-12">
            <XCircle className="w-12 h-12 text-red-500 mb-4" />
            <p className="text-red-600 font-medium mb-2">Erro ao carregar detalhes</p>
            <p className="text-gray-600 text-sm mb-4">{error}</p>
            <Button onClick={loadDetails} variant="outline">
              Tentar Novamente
            </Button>
          </div>
        ) : details && details.user ? (
          <Tabs defaultValue="overview" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="overview">Resumo</TabsTrigger>
              <TabsTrigger value="cycles">Ciclos ({details.cycles?.summary?.total || 0})</TabsTrigger>
              <TabsTrigger value="ledger">Extrato ({details.ledger?.showing || 0})</TabsTrigger>
              <TabsTrigger value="network">Rede ({details.referral_network?.total_referrals || 0})</TabsTrigger>
            </TabsList>

            {/* TAB 1: RESUMO */}
            <TabsContent value="overview" className="space-y-4">
              <Card className="p-4">
                <h3 className="font-semibold mb-4">Informações Pessoais</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  <div>
                    <p className="text-sm text-gray-600">Nome</p>
                    <p className="font-medium">{details.user?.name || "N/A"}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Email</p>
                    <p className="font-medium">{details.user?.email || "N/A"}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">CPF</p>
                    <p className="font-medium">{details.user?.cpf || "N/A"}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Telefone</p>
                    <p className="font-medium">{details.user?.phone || "N/A"}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Código de Indicação</p>
                    <p className="font-mono font-medium">{details.user?.referral_code || "N/A"}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Indicado por</p>
                    {details.user?.referred_by ? (
                      <div>
                        <p className="font-medium">{details.user.referred_by.name}</p>
                        <p className="text-sm text-gray-500">{details.user.referred_by.email}</p>
                      </div>
                    ) : (
                      <p className="font-medium text-gray-400">N/A</p>
                    )}
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Cadastrado em</p>
                    <p className="font-medium">{details.user?.created_at ? formatDate(details.user.created_at) : "N/A"}</p>
                  </div>
                </div>
              </Card>

              <div className="grid grid-cols-3 gap-4">
                <Card className="p-4">
                  <p className="text-sm text-gray-600">Saldo Investível</p>
                  <p className="text-2xl font-bold text-blue-600">
                    R$ {(details.user?.balance || 0).toFixed(2)}
                  </p>
                </Card>
                <Card className="p-4">
                  <p className="text-sm text-gray-600">Saldo para Saque</p>
                  <p className="text-2xl font-bold text-green-600">
                    R$ {(details.user?.balance_withdrawn || 0).toFixed(2)}
                  </p>
                </Card>
                <Card className="p-4">
                  <p className="text-sm text-gray-600">Total Investido</p>
                  <p className="text-2xl font-bold text-purple-600">
                    R$ {(details.user?.total_invested || 0).toFixed(2)}
                  </p>
                </Card>
              </div>

              {details.cycles?.summary && (
                <Card className="p-4">
                  <h3 className="font-semibold mb-4">Resumo de Ciclos</h3>
                  <div className="grid grid-cols-4 gap-4">
                    <div>
                      <p className="text-sm text-gray-600">Total</p>
                      <p className="text-xl font-bold">{details.cycles.summary.total || 0}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Ativos</p>
                      <p className="text-xl font-bold text-green-600">
                        {details.cycles.summary.active || 0}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Finalizados</p>
                      <p className="text-xl font-bold text-blue-600">
                        {details.cycles.summary.finished || 0}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Cancelados</p>
                      <p className="text-xl font-bold text-red-600">
                        {details.cycles.summary.cancelled || 0}
                      </p>
                    </div>
                  </div>
                </Card>
              )}
            </TabsContent>

            {/* TAB 2: CICLOS */}
            <TabsContent value="cycles">
              {details.cycles?.list && details.cycles.list.length > 0 ? (
                <Card>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Plano</TableHead>
                        <TableHead>Valor</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Dias</TableHead>
                        <TableHead>Rendimento</TableHead>
                        <TableHead>Início</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {details.cycles.list.map((cycle) => (
                        <TableRow key={cycle.id}>
                          <TableCell className="font-medium">{cycle.plan_name}</TableCell>
                          <TableCell>R$ {cycle.amount.toFixed(2)}</TableCell>
                          <TableCell>{getStatusBadge(cycle.status)}</TableCell>
                          <TableCell>
                            {cycle.days_paid}/{cycle.duration_days}
                          </TableCell>
                          <TableCell className="text-green-600">
                            R$ {cycle.total_paid.toFixed(2)}
                          </TableCell>
                          <TableCell>{formatDate(cycle.started_at)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </Card>
              ) : (
                <Card className="p-8">
                  <p className="text-center text-gray-500">Nenhum ciclo encontrado</p>
                </Card>
              )}
            </TabsContent>

            {/* TAB 3: EXTRATO */}
            <TabsContent value="ledger">
              {details.ledger?.entries && details.ledger.entries.length > 0 ? (
                <Card>
                  <div className="p-4 border-b">
                    <p className="text-sm text-gray-600">
                      Mostrando {details.ledger.showing || 0} de {details.ledger.total_entries || 0} movimentações
                    </p>
                  </div>
                  <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Tipo</TableHead>
                      <TableHead>Descrição</TableHead>
                      <TableHead>Valor</TableHead>
                      <TableHead>Operação</TableHead>
                      <TableHead>Data</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {details.ledger.entries.map((entry) => (
                      <TableRow key={entry.id}>
                        <TableCell>
                          <Badge variant="outline">{entry.type}</Badge>
                        </TableCell>
                        <TableCell className="max-w-xs truncate">
                          {entry.description}
                        </TableCell>
                        <TableCell
                          className={
                            entry.operation === "CREDIT"
                              ? "text-green-600 font-medium"
                              : "text-red-600 font-medium"
                          }
                        >
                          {entry.operation === "CREDIT" ? "+" : "-"}R${" "}
                          {entry.amount.toFixed(2)}
                        </TableCell>
                        <TableCell>{entry.operation}</TableCell>
                        <TableCell>{formatDate(entry.created_at)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </Card>
              ) : (
                <Card className="p-8">
                  <p className="text-center text-gray-500">Nenhuma movimentação encontrada</p>
                </Card>
              )}
            </TabsContent>

            {/* TAB 4: REDE DE INDICAÇÕES */}
            <TabsContent value="network" className="space-y-4">
              <Card className="p-4">
                <h3 className="font-semibold mb-2">Total de Indicados</h3>
                <p className="text-3xl font-bold text-primary">
                  {details.referral_network?.total_referrals || 0}
                </p>
              </Card>

              {details.referral_network?.by_level ? (
                (() => {
                  const levelsWithData = [1, 2, 3]
                    .map((level) => {
                      const levelData = details.referral_network.by_level[level];
                      return levelData && levelData.count > 0 ? { level, levelData } : null;
                    })
                    .filter(Boolean);

                  if (levelsWithData.length === 0) {
                    return (
                      <Card className="p-8">
                        <p className="text-center text-gray-500">
                          Este usuário ainda não possui indicados em sua rede.
                        </p>
                      </Card>
                    );
                  }

                  return levelsWithData.map(({ level, levelData }) => (
                    <Card key={level} className="p-4">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="font-semibold">
                          Nível {level} ({levelData.count} usuários)
                        </h3>
                        <div className="text-right">
                          <p className="text-sm text-gray-600">Total Investido</p>
                          <p className="font-bold text-green-600">
                            R$ {levelData.total_invested.toFixed(2)}
                          </p>
                        </div>
                      </div>

                      {levelData.users.length > 0 ? (
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Nome</TableHead>
                              <TableHead>Email</TableHead>
                              <TableHead>Investido</TableHead>
                              <TableHead>Ganhos</TableHead>
                              <TableHead>Ciclos Ativos</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {levelData.users.map((user) => (
                              <TableRow key={user.id}>
                                <TableCell className="font-medium">{user.name}</TableCell>
                                <TableCell>{user.email}</TableCell>
                                <TableCell>R$ {user.total_invested.toFixed(2)}</TableCell>
                                <TableCell className="text-green-600">
                                  R$ {user.total_earned.toFixed(2)}
                                </TableCell>
                                <TableCell>{user.active_cycles}</TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      ) : (
                        <p className="text-center text-gray-500 py-4">Nenhum indicado neste nível</p>
                      )}
                    </Card>
                  ));
                })()
              ) : (
                <Card className="p-8">
                  <p className="text-center text-gray-500">Carregando dados da rede...</p>
                </Card>
              )}
            </TabsContent>
          </Tabs>
        ) : (
          <p className="text-center py-8 text-gray-500">Erro ao carregar detalhes</p>
        )}

        <div className="flex justify-end">
          <Button variant="outline" onClick={onClose}>
            Fechar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

