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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { AdminHeader } from "@/components/AdminHeader";
import { useToast } from "@/hooks/use-toast";
import {
  Activity,
  CheckCircle,
  XCircle,
  AlertCircle,
  Clock,
  Loader2,
  Search,
  Filter,
  Eye,
} from "lucide-react";
import api from "@/lib/api";

interface Webhook {
  id: number;
  provider: string;
  event: string;
  external_id: string;
  status: string;
  deposit_id: number | null;
  deposit: {
    id: number;
    amount: number;
    status: string;
    paid_at: string | null;
    user: {
      id: number;
      name: string;
      email: string;
    } | null;
  } | null;
  error_message: string | null;
  created_at: string;
  processed_at: string | null;
  is_late: boolean;
}

interface Stats {
  total: number;
  received: number;
  processed: number;
  failed: number;
  late_arrival: number;
}

export default function AdminWebhooks() {
  const navigate = useNavigate();
  const { toast } = useToast();

  const [webhooks, setWebhooks] = useState<Webhook[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  // Filtros
  const [search, setSearch] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [lateOnly, setLateOnly] = useState(false);

  // Paginação
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  // Modal
  const [selectedWebhook, setSelectedWebhook] = useState<any | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [detailsLoading, setDetailsLoading] = useState(false);

  useEffect(() => {
    loadData();
  }, [currentPage, search, selectedStatus, lateOnly]);

  const loadData = async () => {
    try {
      setLoading(true);

      // Carregar stats
      const statsRes = await api.get("/admin/webhooks/stats");
      setStats(statsRes.data.data);

      // Carregar webhooks com filtros
      const params: any = {
        page: currentPage,
        per_page: 20,
      };

      if (search) params.search = search;
      if (selectedStatus !== "all") params.status = selectedStatus;
      if (lateOnly) params.late_only = "true";

      const webhooksRes = await api.get("/admin/webhooks", { params });
      setWebhooks(webhooksRes.data.data);
      setCurrentPage(webhooksRes.data.meta.current_page);
      setTotalPages(webhooksRes.data.meta.last_page);
      setTotal(webhooksRes.data.meta.total);
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

  const handleViewDetails = async (webhook: Webhook) => {
    setDetailsOpen(true);
    setDetailsLoading(true);

    try {
      const response = await api.get(`/admin/webhooks/${webhook.id}`);
      setSelectedWebhook(response.data.data);
    } catch (error: any) {
      toast({
        title: "Erro",
        description: "Não foi possível carregar os detalhes.",
        variant: "destructive",
      });
    } finally {
      setDetailsLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const configs: Record<string, { label: string; className: string; icon: any }> = {
      received: { label: "Recebido", className: "bg-blue-500", icon: Clock },
      processed: { label: "Processado", className: "bg-green-500", icon: CheckCircle },
      failed: { label: "Falhou", className: "bg-red-500", icon: XCircle },
      late_arrival: { label: "Atrasado", className: "bg-orange-500", icon: AlertCircle },
    };
    const config = configs[status] || { label: status, className: "bg-gray-500", icon: Activity };
    const Icon = config.icon;
    
    return (
      <Badge className={`${config.className} text-white`}>
        <Icon className="w-3 h-3 mr-1" />
        {config.label}
      </Badge>
    );
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleString("pt-BR");
  };

  const clearFilters = () => {
    setSearch("");
    setSelectedStatus("all");
    setLateOnly(false);
    setCurrentPage(1);
  };

  if (loading && webhooks.length === 0) {
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
            <h1 className="text-3xl font-bold">Webhooks</h1>
            <p className="text-muted-foreground">
              Monitore os webhooks recebidos da processadora de pagamentos
            </p>
          </div>
        </div>

        {/* Stats */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total</CardTitle>
                <Activity className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.total}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Processados</CardTitle>
                <CheckCircle className="h-4 w-4 text-green-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-500">{stats.processed}</div>
              </CardContent>
            </Card>

            <Card className="border-2 border-orange-200 bg-orange-50">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">⚠️ Atrasados</CardTitle>
                <AlertCircle className="h-4 w-4 text-orange-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-orange-600">{stats.late_arrival}</div>
                <p className="text-xs text-orange-600 mt-1">Pagos manualmente antes</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Falhados</CardTitle>
                <XCircle className="h-4 w-4 text-red-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-500">{stats.failed}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Recebidos</CardTitle>
                <Clock className="h-4 w-4 text-blue-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-500">{stats.received}</div>
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
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <Label>Buscar</Label>
                <div className="relative">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="ID externo ou depósito..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="pl-8"
                  />
                </div>
              </div>

              <div>
                <Label>Status</Label>
                <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                  <SelectTrigger>
                    <SelectValue placeholder="Todos" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    <SelectItem value="received">Recebido</SelectItem>
                    <SelectItem value="processed">Processado</SelectItem>
                    <SelectItem value="failed">Falhou</SelectItem>
                    <SelectItem value="late_arrival">Atrasado</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-end">
                <Button
                  variant={lateOnly ? "default" : "outline"}
                  onClick={() => setLateOnly(!lateOnly)}
                  className={lateOnly ? "bg-orange-600 hover:bg-orange-700" : ""}
                >
                  <AlertCircle className="w-4 h-4 mr-2" />
                  {lateOnly ? "Mostrando Atrasados" : "Apenas Atrasados"}
                </Button>
              </div>

              <div className="flex items-end justify-end">
                <Button variant="outline" onClick={clearFilters}>
                  Limpar Filtros
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tabela */}
        <Card>
          <CardHeader>
            <CardTitle>
              Webhooks ({total} {total === 1 ? "registro" : "registros"})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID</TableHead>
                  <TableHead>Provider</TableHead>
                  <TableHead>Evento</TableHead>
                  <TableHead>External ID</TableHead>
                  <TableHead>Depósito</TableHead>
                  <TableHead>Usuário</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Recebido em</TableHead>
                  <TableHead>Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {webhooks.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">
                      Nenhum webhook encontrado
                    </TableCell>
                  </TableRow>
                ) : (
                  webhooks.map((webhook) => (
                    <TableRow key={webhook.id} className={webhook.is_late ? "bg-orange-50" : ""}>
                      <TableCell className="font-medium">#{webhook.id}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{webhook.provider}</Badge>
                      </TableCell>
                      <TableCell>
                        <code className="text-xs">{webhook.event}</code>
                      </TableCell>
                      <TableCell>
                        <code className="text-xs">{webhook.external_id || "N/A"}</code>
                      </TableCell>
                      <TableCell>
                        {webhook.deposit ? (
                          <div>
                            <div className="font-medium">#{webhook.deposit.id}</div>
                            <div className="text-xs text-muted-foreground">
                              R$ {webhook.deposit.amount.toFixed(2)}
                            </div>
                          </div>
                        ) : (
                          <span className="text-muted-foreground">N/A</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {webhook.deposit?.user ? (
                          <div>
                            <div className="font-medium text-sm">{webhook.deposit.user.name}</div>
                            <div className="text-xs text-muted-foreground">
                              {webhook.deposit.user.email}
                            </div>
                          </div>
                        ) : (
                          <span className="text-muted-foreground">N/A</span>
                        )}
                      </TableCell>
                      <TableCell>{getStatusBadge(webhook.status)}</TableCell>
                      <TableCell>
                        <div className="text-sm">{formatDate(webhook.created_at)}</div>
                        {webhook.processed_at && (
                          <div className="text-xs text-muted-foreground">
                            Proc: {formatDate(webhook.processed_at)}
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleViewDetails(webhook)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
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

      {/* Modal de Detalhes */}
      <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Detalhes do Webhook #{selectedWebhook?.id}</DialogTitle>
            <DialogDescription>
              Informações completas do webhook recebido
            </DialogDescription>
          </DialogHeader>

          {detailsLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : selectedWebhook ? (
            <div className="space-y-4">
              {/* Webhook Info */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Informações do Webhook</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-600">Provider</p>
                      <p className="font-medium">{selectedWebhook.provider}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Evento</p>
                      <p className="font-medium">{selectedWebhook.event}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">External ID</p>
                      <code className="text-sm">{selectedWebhook.external_id || "N/A"}</code>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Status</p>
                      {getStatusBadge(selectedWebhook.status)}
                    </div>
                  </div>

                  {selectedWebhook.is_late && (
                    <div className="mt-4 p-4 bg-orange-50 border border-orange-200 rounded-md">
                      <div className="flex items-start gap-2">
                        <AlertCircle className="w-5 h-5 text-orange-600 flex-shrink-0 mt-0.5" />
                        <div>
                          <p className="font-semibold text-orange-800">⚠️ Webhook Atrasado</p>
                          <p className="text-sm text-orange-700 mt-1">
                            {selectedWebhook.error_message}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {selectedWebhook.error_message && !selectedWebhook.is_late && (
                    <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-md">
                      <p className="text-sm text-red-800">{selectedWebhook.error_message}</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Deposit Info */}
              {selectedWebhook.deposit && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Depósito Vinculado</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-gray-600">ID do Depósito</p>
                        <p className="font-medium">#{selectedWebhook.deposit.id}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Valor</p>
                        <p className="font-bold text-green-600">
                          R$ {selectedWebhook.deposit.amount.toFixed(2)}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Status do Depósito</p>
                        <Badge>{selectedWebhook.deposit.status}</Badge>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Pago em</p>
                        <p className="font-medium">
                          {selectedWebhook.deposit.paid_at
                            ? formatDate(selectedWebhook.deposit.paid_at)
                            : "Pendente"}
                        </p>
                      </div>
                    </div>

                    {selectedWebhook.deposit.user && (
                      <div className="mt-4 pt-4 border-t">
                        <p className="text-sm text-gray-600 mb-2">Usuário</p>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <p className="text-xs text-gray-500">Nome</p>
                            <p className="font-medium">{selectedWebhook.deposit.user.name}</p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-500">Email</p>
                            <p className="font-medium">{selectedWebhook.deposit.user.email}</p>
                          </div>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}

              {/* Payload */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Payload Recebido</CardTitle>
                </CardHeader>
                <CardContent>
                  <pre className="bg-gray-100 p-4 rounded-md overflow-x-auto text-xs">
                    {JSON.stringify(selectedWebhook.payload, null, 2)}
                  </pre>
                </CardContent>
              </Card>
            </div>
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  );
}

