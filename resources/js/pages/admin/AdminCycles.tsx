import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
import { AdminHeader } from "@/components/AdminHeader";
import { useToast } from "@/hooks/use-toast";
import {
  Activity,
  CheckCircle,
  XCircle,
  Trash2,
  PlayCircle,
  StopCircle,
  Loader2,
  Search,
  Filter,
  BarChart3,
} from "lucide-react";
import api from "@/lib/api";

interface Cycle {
  id: number;
  user: {
    id: number;
    name: string;
    email: string;
  };
  plan: {
    id: number;
    name: string;
    image: string;
  };
  amount: number;
  type: string;
  status: string;
  duration_days: number;
  days_paid: number;
  daily_income: number;
  total_return: number;
  total_paid: number;
  started_at: string;
  ends_at: string;
  created_at: string;
  progress_percent: number;
  remaining_days: number;
  remaining_payment: number;
}

interface Stats {
  total: number;
  active: number;
  finished: number;
  cancelled: number;
  financial: {
    total_invested: number;
    total_return: number;
    total_paid: number;
    pending_return: number;
  };
}

interface User {
  id: number;
  name: string;
  email: string;
}

interface Plan {
  id: number;
  name: string;
  image: string;
}

export default function AdminCycles() {
  const navigate = useNavigate();
  const { toast } = useToast();

  const [cycles, setCycles] = useState<Cycle[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<number | null>(null);

  // Filtros
  const [search, setSearch] = useState("");
  const [selectedUser, setSelectedUser] = useState("all");
  const [selectedPlan, setSelectedPlan] = useState("all");
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [selectedType, setSelectedType] = useState("all");

  // Paginação
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  // Dialogs
  const [deleteDialog, setDeleteDialog] = useState<{ open: boolean; cycle: Cycle | null }>({
    open: false,
    cycle: null,
  });

  useEffect(() => {
    loadData();
  }, [currentPage, search, selectedUser, selectedPlan, selectedStatus, selectedType]);

  const loadData = async () => {
    try {
      setLoading(true);

      // Carregar stats
      const statsRes = await api.get("/admin/cycles/stats");
      setStats(statsRes.data.data);

      // Carregar ciclos com filtros
      const params: any = {
        page: currentPage,
        per_page: 15,
      };

      if (search) params.search = search;
      if (selectedUser && selectedUser !== "all") params.user_id = selectedUser;
      if (selectedPlan && selectedPlan !== "all") params.plan_id = selectedPlan;
      if (selectedStatus && selectedStatus !== "all") params.status = selectedStatus;
      if (selectedType && selectedType !== "all") params.type = selectedType;

      const cyclesRes = await api.get("/admin/cycles", { params });
      setCycles(cyclesRes.data.data);
      setCurrentPage(cyclesRes.data.meta.current_page);
      setTotalPages(cyclesRes.data.meta.last_page);
      setTotal(cyclesRes.data.meta.total);

      // Carregar filtros (usuários e planos) apenas na primeira vez
      if (users.length === 0) {
        const usersRes = await api.get("/admin/cycles-filters/users");
        setUsers(usersRes.data.data);
      }

      if (plans.length === 0) {
        const plansRes = await api.get("/admin/cycles-filters/plans");
        setPlans(plansRes.data.data);
      }
    } catch (error: any) {
      console.error("Erro ao carregar dados:", error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar os dados.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleActivate = async (cycle: Cycle) => {
    try {
      setActionLoading(cycle.id);
      await api.post(`/admin/cycles/${cycle.id}/activate`);
      toast({
        title: "Sucesso!",
        description: "Ciclo ativado com sucesso.",
      });
      loadData();
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.response?.data?.message || "Não foi possível ativar o ciclo.",
        variant: "destructive",
      });
    } finally {
      setActionLoading(null);
    }
  };

  const handleCancel = async (cycle: Cycle) => {
    try {
      setActionLoading(cycle.id);
      await api.post(`/admin/cycles/${cycle.id}/cancel`);
      toast({
        title: "Sucesso!",
        description: "Ciclo cancelado com sucesso.",
      });
      loadData();
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.response?.data?.message || "Não foi possível cancelar o ciclo.",
        variant: "destructive",
      });
    } finally {
      setActionLoading(null);
    }
  };

  const handleDelete = async () => {
    if (!deleteDialog.cycle) return;

    try {
      setActionLoading(deleteDialog.cycle.id);
      await api.delete(`/admin/cycles/${deleteDialog.cycle.id}`);
      toast({
        title: "Sucesso!",
        description: "Ciclo deletado com sucesso.",
      });
      setDeleteDialog({ open: false, cycle: null });
      loadData();
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.response?.data?.message || "Não foi possível deletar o ciclo.",
        variant: "destructive",
      });
    } finally {
      setActionLoading(null);
    }
  };

  const getStatusBadge = (status: string) => {
    const configs: Record<string, { label: string; className: string }> = {
      ACTIVE: { label: "Ativo", className: "bg-green-500" },
      FINISHED: { label: "Finalizado", className: "bg-blue-500" },
      CANCELLED: { label: "Cancelado", className: "bg-red-500" },
    };
    const config = configs[status] || { label: status, className: "bg-gray-500" };
    return <Badge className={config.className}>{config.label}</Badge>;
  };

  const getTypeBadge = (type: string) => {
    const configs: Record<string, { label: string; className: string }> = {
      DAILY: { label: "Diário", className: "bg-purple-500" },
      END_CYCLE: { label: "Fim do Ciclo", className: "bg-orange-500" },
    };
    const config = configs[type] || { label: type, className: "bg-gray-500" };
    return <Badge className={config.className}>{config.label}</Badge>;
  };

  const clearFilters = () => {
    setSearch("");
    setSelectedUser("all");
    setSelectedPlan("all");
    setSelectedStatus("all");
    setSelectedType("all");
    setCurrentPage(1);
  };

  if (loading && cycles.length === 0) {
    return (
      <div className="min-h-screen bg-background">
        <AdminHeader />
        <div className="container mx-auto p-6">
          <div className="flex items-center justify-center h-96">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <AdminHeader />
      
      <div className="container mx-auto p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold">Gerenciar Ciclos</h1>
            <p className="text-muted-foreground">
              Gerencie os ciclos/investimentos dos usuários
            </p>
          </div>
        </div>

        {/* Stats */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total de Ciclos</CardTitle>
                <BarChart3 className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.total}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Ativos</CardTitle>
                <Activity className="h-4 w-4 text-green-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-500">{stats.active}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Finalizados</CardTitle>
                <CheckCircle className="h-4 w-4 text-blue-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-500">{stats.finished}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Cancelados</CardTitle>
                <XCircle className="h-4 w-4 text-red-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-500">{stats.cancelled}</div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Filtros */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Filter className="h-5 w-5" />
              Filtros
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
              <div>
                <Label>Buscar</Label>
                <div className="relative">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Nome ou email..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="pl-8"
                  />
                </div>
              </div>

              <div>
                <Label>Usuário</Label>
                <Select value={selectedUser} onValueChange={setSelectedUser}>
                  <SelectTrigger>
                    <SelectValue placeholder="Todos" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    {users.map((user) => (
                      <SelectItem key={user.id} value={user.id.toString()}>
                        {user.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Plano</Label>
                <Select value={selectedPlan} onValueChange={setSelectedPlan}>
                  <SelectTrigger>
                    <SelectValue placeholder="Todos" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    {plans.map((plan) => (
                      <SelectItem key={plan.id} value={plan.id.toString()}>
                        {plan.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Status</Label>
                <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                  <SelectTrigger>
                    <SelectValue placeholder="Todos" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    <SelectItem value="ACTIVE">Ativo</SelectItem>
                    <SelectItem value="FINISHED">Finalizado</SelectItem>
                    <SelectItem value="CANCELLED">Cancelado</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Tipo</Label>
                <Select value={selectedType} onValueChange={setSelectedType}>
                  <SelectTrigger>
                    <SelectValue placeholder="Todos" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    <SelectItem value="DAILY">Diário</SelectItem>
                    <SelectItem value="END_CYCLE">Fim do Ciclo</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex justify-end mt-4">
              <Button variant="outline" onClick={clearFilters}>
                Limpar Filtros
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Tabela */}
        <Card>
          <CardHeader>
            <CardTitle>
              Ciclos ({total} {total === 1 ? "registro" : "registros"})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID</TableHead>
                  <TableHead>Usuário</TableHead>
                  <TableHead>Plano</TableHead>
                  <TableHead>Valor</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Progresso</TableHead>
                  <TableHead>Pago</TableHead>
                  <TableHead>Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {cycles.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">
                      Nenhum ciclo encontrado
                    </TableCell>
                  </TableRow>
                ) : (
                  cycles.map((cycle) => (
                    <TableRow key={cycle.id}>
                      <TableCell className="font-medium">#{cycle.id}</TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">{cycle.user.name}</div>
                          <div className="text-xs text-muted-foreground">{cycle.user.email}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {cycle.plan.image && (
                            <img
                              src={cycle.plan.image}
                              alt={cycle.plan.name}
                              className="h-8 w-8 rounded object-cover"
                            />
                          )}
                          <span className="text-sm">{cycle.plan.name}</span>
                        </div>
                      </TableCell>
                      <TableCell>R$ {cycle.amount.toFixed(2)}</TableCell>
                      <TableCell>{getTypeBadge(cycle.type)}</TableCell>
                      <TableCell>{getStatusBadge(cycle.status)}</TableCell>
                      <TableCell>
                        <div className="text-sm">
                          {cycle.days_paid}/{cycle.duration_days} dias
                          <div className="text-xs text-muted-foreground">
                            {cycle.progress_percent.toFixed(0)}%
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          R$ {cycle.total_paid.toFixed(2)}
                          <div className="text-xs text-muted-foreground">
                            de R$ {cycle.total_return.toFixed(2)}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {cycle.status !== "ACTIVE" && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleActivate(cycle)}
                              disabled={actionLoading === cycle.id}
                            >
                              {actionLoading === cycle.id ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <PlayCircle className="h-4 w-4" />
                              )}
                            </Button>
                          )}

                          {cycle.status === "ACTIVE" && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleCancel(cycle)}
                              disabled={actionLoading === cycle.id}
                            >
                              {actionLoading === cycle.id ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <StopCircle className="h-4 w-4" />
                              )}
                            </Button>
                          )}

                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => setDeleteDialog({ open: true, cycle })}
                            disabled={actionLoading === cycle.id}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>

            {/* Paginação */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between mt-4">
                <div className="text-sm text-muted-foreground">
                  Página {currentPage} de {totalPages}
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    disabled={currentPage === 1 || loading}
                  >
                    Anterior
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages || loading}
                  >
                    Próxima
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Delete Dialog */}
      <AlertDialog open={deleteDialog.open} onOpenChange={(open) => !open && setDeleteDialog({ open: false, cycle: null })}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja deletar o ciclo <strong>#{deleteDialog.cycle?.id}</strong> do usuário{" "}
              <strong>{deleteDialog.cycle?.user.name}</strong>?
              <br />
              <br />
              Esta ação não pode ser desfeita e removerá todos os registros relacionados.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground">
              {actionLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Deletar"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

