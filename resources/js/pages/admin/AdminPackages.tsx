import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { AdminHeader } from "@/components/AdminHeader";
import {
  Search,
  Package,
  TrendingUp,
  DollarSign,
  Users,
  CheckCircle,
  XCircle,
  Clock,
  Eye,
  Filter,
  Loader2,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

interface Plan {
  id: number;
  name: string;
  image: string;
  price: number;
  daily_income: number | null;
  duration_days: number;
  total_return: number;
  max_purchases: number;
  type: "DAILY" | "END_CYCLE";
  description: string | null;
  is_active: boolean;
  order: number;
  created_at: string;
  stats: {
    total_sold: number;
    active: number;
    finished: number;
    cancelled: number;
    total_invested: number;
    total_return: number;
    total_paid: number;
    pending_return: number;
  };
}

interface Cycle {
  id: number;
  user: {
    id: number;
    name: string;
    email: string;
  };
  amount: number;
  type: string;
  status: string;
  duration_days: number;
  days_paid: number;
  daily_income: number | null;
  total_return: number;
  total_paid: number;
  started_at: string | null;
  ends_at: string | null;
  created_at: string;
}

interface Stats {
  plans: {
    total: number;
    active: number;
  };
  cycles: {
    total: number;
    active: number;
    finished: number;
    cancelled: number;
  };
  financial: {
    total_invested: number;
    total_return: number;
    total_paid: number;
    pending_return: number;
  };
}

export default function AdminPackages() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [plans, setPlans] = useState<Plan[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  
  // Modal de detalhes
  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null);
  const [cycles, setCycles] = useState<Cycle[]>([]);
  const [cyclesLoading, setCyclesLoading] = useState(false);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [cyclesPage, setCyclesPage] = useState(1);
  const [cyclesTotalPages, setCyclesTotalPages] = useState(1);
  const [cyclesTotal, setCyclesTotal] = useState(0);
  const [cyclesSearch, setCyclesSearch] = useState("");
  const [cyclesStatusFilter, setCyclesStatusFilter] = useState<string>("all");

  useEffect(() => {
    loadData();
  }, [typeFilter, statusFilter, search]);

  useEffect(() => {
    if (detailsOpen && selectedPlan) {
      loadCycles();
    }
  }, [detailsOpen, selectedPlan, cyclesPage, cyclesSearch, cyclesStatusFilter]);

  const loadData = async () => {
    try {
      setLoading(true);
      const params: any = {};
      if (search) params.search = search;
      if (typeFilter !== "all") params.type = typeFilter;
      if (statusFilter !== "all") params.is_active = statusFilter === "active";

      const [plansRes, statsRes] = await Promise.all([
        api.get("/admin/packages", { params }),
        api.get("/admin/packages/stats"),
      ]);

      setPlans(plansRes.data.data);
      setStats(statsRes.data.data);
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.response?.data?.error?.message || "Não foi possível carregar os dados.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const loadCycles = async () => {
    if (!selectedPlan) return;

    try {
      setCyclesLoading(true);
      const params: any = {
        page: cyclesPage,
        per_page: 20,
      };
      if (cyclesSearch) params.search = cyclesSearch;
      if (cyclesStatusFilter !== "all") params.status = cyclesStatusFilter;

      const response = await api.get(`/admin/packages/${selectedPlan.id}`, { params });
      setCycles(response.data.data.cycles);
      setCyclesTotalPages(response.data.data.meta.last_page);
      setCyclesTotal(response.data.data.meta.total);
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.response?.data?.error?.message || "Não foi possível carregar os ciclos.",
        variant: "destructive",
      });
    } finally {
      setCyclesLoading(false);
    }
  };

  const handleViewDetails = (plan: Plan) => {
    setSelectedPlan(plan);
    setCyclesPage(1);
    setCyclesSearch("");
    setCyclesStatusFilter("all");
    setDetailsOpen(true);
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

  const getStatusBadge = (status: string) => {
    const variants: Record<string, "default" | "destructive" | "outline" | "secondary"> = {
      ACTIVE: "default",
      FINISHED: "secondary",
      CANCELLED: "destructive",
    };
    return <Badge variant={variants[status] || "outline"}>{status}</Badge>;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <AdminHeader title="Pacotes e Planos" subtitle="Estatísticas de vendas e ciclos" />
      <div className="container mx-auto px-4 py-6 max-w-7xl">

        {/* Estatísticas Gerais */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Total de Planos</p>
                    <p className="text-2xl font-bold">{stats.plans.total}</p>
                    <p className="text-xs text-green-600 mt-1">{stats.plans.active} ativos</p>
                  </div>
                  <Package className="w-8 h-8 text-blue-600" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Total de Ciclos</p>
                    <p className="text-2xl font-bold">{stats.cycles.total}</p>
                    <p className="text-xs text-gray-600 mt-1">
                      {stats.cycles.active} ativos • {stats.cycles.finished} encerrados
                    </p>
                  </div>
                  <TrendingUp className="w-8 h-8 text-green-600" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Total Investido</p>
                    <p className="text-2xl font-bold text-green-600">
                      R$ {stats.financial.total_invested.toFixed(2)}
                    </p>
                    <p className="text-xs text-gray-600 mt-1">
                      Retorno: R$ {stats.financial.total_return.toFixed(2)}
                    </p>
                  </div>
                  <DollarSign className="w-8 h-8 text-green-600" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Total Pago</p>
                    <p className="text-2xl font-bold text-blue-600">
                      R$ {stats.financial.total_paid.toFixed(2)}
                    </p>
                    <p className="text-xs text-orange-600 mt-1">
                      Pendente: R$ {stats.financial.pending_return.toFixed(2)}
                    </p>
                  </div>
                  <CheckCircle className="w-8 h-8 text-blue-600" />
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Filtros */}
        <Card className="mb-6">
          <CardContent className="p-4">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  placeholder="Buscar por nome do plano..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className="w-full md:w-[180px]">
                  <Filter className="w-4 h-4 mr-2" />
                  <SelectValue placeholder="Tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os tipos</SelectItem>
                  <SelectItem value="DAILY">Diário</SelectItem>
                  <SelectItem value="END_CYCLE">Fim de Ciclo</SelectItem>
                </SelectContent>
              </Select>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full md:w-[180px]">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="active">Ativos</SelectItem>
                  <SelectItem value="inactive">Inativos</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Tabela de Planos */}
        <Card>
          <CardHeader>
            <CardTitle>Planos Cadastrados</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
                <p className="ml-3 text-gray-600">Carregando...</p>
              </div>
            ) : plans.length === 0 ? (
              <div className="text-center py-12">
                <Package className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">Nenhum plano encontrado</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Plano</TableHead>
                      <TableHead>Tipo</TableHead>
                      <TableHead className="text-right">Preço</TableHead>
                      <TableHead className="text-center">Vendidos</TableHead>
                      <TableHead className="text-center">Ativos</TableHead>
                      <TableHead className="text-center">Encerrados</TableHead>
                      <TableHead className="text-right">Total Investido</TableHead>
                      <TableHead className="text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {plans.map((plan) => (
                      <TableRow key={plan.id}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <img
                              src={plan.image}
                              alt={plan.name}
                              className="w-12 h-12 object-cover rounded-lg"
                            />
                            <div>
                              <p className="font-medium">{plan.name}</p>
                              <p className="text-xs text-gray-500">
                                {plan.duration_days} dias • Retorno: R$ {plan.total_return.toFixed(2)}
                              </p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant={plan.type === "DAILY" ? "default" : "secondary"}>
                            {plan.type === "DAILY" ? "Diário" : "Fim de Ciclo"}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right font-medium">
                          R$ {plan.price.toFixed(2)}
                        </TableCell>
                        <TableCell className="text-center">
                          <span className="font-semibold">{plan.stats.total_sold}</span>
                        </TableCell>
                        <TableCell className="text-center">
                          <Badge variant="default" className="bg-green-600">
                            {plan.stats.active}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-center">
                          <Badge variant="secondary">
                            {plan.stats.finished}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right font-semibold text-green-600">
                          R$ {plan.stats.total_invested.toFixed(2)}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleViewDetails(plan)}
                          >
                            <Eye className="w-4 h-4 mr-2" />
                            Detalhes
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Modal de Detalhes */}
        <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
          <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Package className="w-5 h-5" />
                Detalhes do Plano: {selectedPlan?.name}
              </DialogTitle>
            </DialogHeader>

            {selectedPlan && (
              <div className="space-y-4">
                {/* Estatísticas do Plano */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <Card>
                    <CardContent className="p-4">
                      <p className="text-sm text-gray-600">Total Vendido</p>
                      <p className="text-2xl font-bold">{selectedPlan.stats.total_sold}</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4">
                      <p className="text-sm text-gray-600">Ativos</p>
                      <p className="text-2xl font-bold text-green-600">{selectedPlan.stats.active}</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4">
                      <p className="text-sm text-gray-600">Encerrados</p>
                      <p className="text-2xl font-bold text-blue-600">{selectedPlan.stats.finished}</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4">
                      <p className="text-sm text-gray-600">Cancelados</p>
                      <p className="text-2xl font-bold text-red-600">{selectedPlan.stats.cancelled}</p>
                    </CardContent>
                  </Card>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Card>
                    <CardContent className="p-4">
                      <p className="text-sm text-gray-600">Total Investido</p>
                      <p className="text-xl font-bold text-green-600">
                        R$ {selectedPlan.stats.total_invested.toFixed(2)}
                      </p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4">
                      <p className="text-sm text-gray-600">Total Pago</p>
                      <p className="text-xl font-bold text-blue-600">
                        R$ {selectedPlan.stats.total_paid.toFixed(2)}
                      </p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4">
                      <p className="text-sm text-gray-600">Pendente</p>
                      <p className="text-xl font-bold text-orange-600">
                        R$ {selectedPlan.stats.pending_return.toFixed(2)}
                      </p>
                    </CardContent>
                  </Card>
                </div>

                {/* Filtros de Ciclos */}
                <Card>
                  <CardContent className="p-4">
                    <div className="flex flex-col md:flex-row gap-4">
                      <div className="flex-1 relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <Input
                          placeholder="Buscar por nome ou email do usuário..."
                          value={cyclesSearch}
                          onChange={(e) => {
                            setCyclesSearch(e.target.value);
                            setCyclesPage(1);
                          }}
                          className="pl-10"
                        />
                      </div>
                      <Select value={cyclesStatusFilter} onValueChange={(value) => {
                        setCyclesStatusFilter(value);
                        setCyclesPage(1);
                      }}>
                        <SelectTrigger className="w-full md:w-[180px]">
                          <SelectValue placeholder="Status" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">Todos</SelectItem>
                          <SelectItem value="ACTIVE">Ativos</SelectItem>
                          <SelectItem value="FINISHED">Encerrados</SelectItem>
                          <SelectItem value="CANCELLED">Cancelados</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </CardContent>
                </Card>

                {/* Tabela de Ciclos */}
                <Card>
                  <CardHeader>
                    <CardTitle>Ciclos Vendidos ({cyclesTotal})</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {cyclesLoading ? (
                      <div className="flex items-center justify-center py-12">
                        <Loader2 className="w-8 h-8 animate-spin text-primary" />
                      </div>
                    ) : cycles.length === 0 ? (
                      <div className="text-center py-12">
                        <p className="text-gray-500">Nenhum ciclo encontrado</p>
                      </div>
                    ) : (
                      <>
                        <div className="overflow-x-auto">
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead>Usuário</TableHead>
                                <TableHead>Valor</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead>Progresso</TableHead>
                                <TableHead className="text-right">Pago</TableHead>
                                <TableHead>Início</TableHead>
                                <TableHead>Término</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {cycles.map((cycle) => (
                                <TableRow key={cycle.id}>
                                  <TableCell>
                                    <div>
                                      <p className="font-medium">{cycle.user.name}</p>
                                      <p className="text-xs text-gray-500">{cycle.user.email}</p>
                                    </div>
                                  </TableCell>
                                  <TableCell className="font-medium">
                                    R$ {cycle.amount.toFixed(2)}
                                  </TableCell>
                                  <TableCell>{getStatusBadge(cycle.status)}</TableCell>
                                  <TableCell>
                                    <div className="flex items-center gap-2">
                                      <div className="flex-1 bg-gray-200 rounded-full h-2">
                                        <div
                                          className="bg-blue-600 h-2 rounded-full"
                                          style={{
                                            width: `${Math.min(100, (cycle.days_paid / cycle.duration_days) * 100)}%`,
                                          }}
                                        />
                                      </div>
                                      <span className="text-xs text-gray-600">
                                        {cycle.days_paid}/{cycle.duration_days}
                                      </span>
                                    </div>
                                  </TableCell>
                                  <TableCell className="text-right text-green-600 font-semibold">
                                    R$ {cycle.total_paid.toFixed(2)}
                                  </TableCell>
                                  <TableCell className="text-sm">
                                    {cycle.started_at ? formatDate(cycle.started_at) : "N/A"}
                                  </TableCell>
                                  <TableCell className="text-sm">
                                    {cycle.ends_at ? formatDate(cycle.ends_at) : "N/A"}
                                  </TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </div>

                        {/* Paginação */}
                        {cyclesTotalPages > 1 && (
                          <div className="flex items-center justify-between mt-4 pt-4 border-t">
                            <div className="text-sm text-gray-600">
                              Página {cyclesPage} de {cyclesTotalPages}
                            </div>
                            <div className="flex items-center gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setCyclesPage(Math.max(1, cyclesPage - 1))}
                                disabled={cyclesPage === 1}
                              >
                                <ChevronLeft className="w-4 h-4" />
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setCyclesPage(Math.min(cyclesTotalPages, cyclesPage + 1))}
                                disabled={cyclesPage === cyclesTotalPages}
                              >
                                <ChevronRight className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>
                        )}
                      </>
                    )}
                  </CardContent>
                </Card>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}

