import { Search, TrendingUp, Clock, CheckCircle, XCircle, Eye, AlertCircle, Loader2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { AdminHeader } from "@/components/AdminHeader";
import { formatCurrency } from "@/lib/format";
import api from "@/lib/api";

interface Deposit {
  id: number;
  user: {
    id: number;
    name: string;
    email: string;
  };
  amount: number;
  status: 'PENDING' | 'PAID' | 'EXPIRED' | 'CANCELLED';
  transaction_id: string | null;
  order_id: string | null;
  created_at: string;
  paid_at: string | null;
  expires_at: string | null;
}

interface Stats {
  summary: {
    total: number;
    pending: number;
    paid: number;
    expired: number;
    cancelled: number;
  };
  amounts: {
    total_paid: number;
    pending: number;
  };
}

export default function AdminDeposits() {
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [deposits, setDeposits] = useState<Deposit[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [perPage] = useState(20);
  
  const [selectedDeposit, setSelectedDeposit] = useState<Deposit | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [depositDetails, setDepositDetails] = useState<any>(null);

  useEffect(() => {
    loadData();
  }, [statusFilter, search, currentPage]);

  const loadData = async () => {
    try {
      setLoading(true);
      
      const params: any = {
        page: currentPage,
        per_page: perPage,
      };
      if (statusFilter !== 'all') params.status = statusFilter;
      if (search) params.search = search;
      
      const [depositsRes, statsRes] = await Promise.all([
        api.get("/admin/deposits", { params }),
        api.get("/admin/deposits/stats"),
      ]);
      
      setDeposits(depositsRes.data.data);
      setStats(statsRes.data.data);
      
      if (depositsRes.data.meta) {
        setTotalPages(depositsRes.data.meta.last_page);
        setCurrentPage(depositsRes.data.meta.current_page);
      }
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.response?.data?.error?.message || "Não foi possível carregar os depósitos.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleViewDetails = async (deposit: Deposit) => {
    setSelectedDeposit(deposit);
    setDetailsOpen(true);
    setDetailsLoading(true);
    
    try {
      const response = await api.get(`/admin/deposits/${deposit.id}`);
      setDepositDetails(response.data.data);
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.response?.data?.error?.message || "Não foi possível carregar os detalhes.",
        variant: "destructive",
      });
    } finally {
      setDetailsLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, "default" | "destructive" | "outline" | "secondary"> = {
      PAID: "default",
      PENDING: "secondary",
      EXPIRED: "outline",
      CANCELLED: "destructive",
    };
    
    const labels: Record<string, string> = {
      PAID: "Pago",
      PENDING: "Pendente",
      EXPIRED: "Expirado",
      CANCELLED: "Cancelado",
    };

    return (
      <Badge variant={variants[status] || "outline"}>
        {labels[status] || status}
      </Badge>
    );
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <AdminHeader title="Depósitos" subtitle="Gerenciamento de todos os depósitos do sistema" />
      <div className="container mx-auto px-4 py-6 max-w-7xl">
        {/* Estatísticas */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Total</p>
                    <p className="text-2xl font-bold">{stats.summary.total}</p>
                  </div>
                  <TrendingUp className="w-8 h-8 text-blue-600" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Pendentes</p>
                    <p className="text-2xl font-bold text-orange-600">{stats.summary.pending}</p>
                  </div>
                  <Clock className="w-8 h-8 text-orange-600" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Pagos</p>
                    <p className="text-2xl font-bold text-green-600">{stats.summary.paid}</p>
                  </div>
                  <CheckCircle className="w-8 h-8 text-green-600" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Total Pago</p>
                    <p className="text-xl font-bold text-green-600">
                      {formatCurrency(stats.amounts.total_paid)}
                    </p>
                  </div>
                  <CheckCircle className="w-8 h-8 text-green-600" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Pendente</p>
                    <p className="text-xl font-bold text-orange-600">
                      {formatCurrency(stats.amounts.pending)}
                    </p>
                  </div>
                  <Clock className="w-8 h-8 text-orange-600" />
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
                  placeholder="Buscar por usuário, email, transaction ID ou order ID..."
                  value={search}
                  onChange={(e) => {
                    setSearch(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="pl-10"
                />
              </div>
              <Select value={statusFilter} onValueChange={(value) => {
                setStatusFilter(value);
                setCurrentPage(1);
              }}>
                <SelectTrigger className="w-full md:w-[180px]">
                  <SelectValue placeholder="Filtrar por status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="PENDING">Pendente</SelectItem>
                  <SelectItem value="PAID">Pago</SelectItem>
                  <SelectItem value="EXPIRED">Expirado</SelectItem>
                  <SelectItem value="CANCELLED">Cancelado</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Tabela */}
        <Card>
          <CardHeader>
            <CardTitle>Lista de Depósitos</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
                <p className="ml-3 text-gray-600">Carregando depósitos...</p>
              </div>
            ) : deposits.length === 0 ? (
              <div className="text-center py-12">
                <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">Nenhum depósito encontrado</p>
              </div>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>ID</TableHead>
                        <TableHead>Usuário</TableHead>
                        <TableHead>Valor</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Transaction ID</TableHead>
                        <TableHead>Data</TableHead>
                        <TableHead>Pago em</TableHead>
                        <TableHead className="text-right">Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {deposits.map((deposit) => (
                        <TableRow key={deposit.id}>
                          <TableCell className="font-medium">{deposit.id}</TableCell>
                          <TableCell>
                            <div>
                              <p className="font-medium">{deposit.user.name}</p>
                              <p className="text-sm text-gray-500">{deposit.user.email}</p>
                            </div>
                          </TableCell>
                          <TableCell className="font-semibold text-green-600">
                            {formatCurrency(deposit.amount)}
                          </TableCell>
                          <TableCell>{getStatusBadge(deposit.status)}</TableCell>
                          <TableCell className="font-mono text-xs">
                            {deposit.transaction_id || "N/A"}
                          </TableCell>
                          <TableCell>{formatDate(deposit.created_at)}</TableCell>
                          <TableCell>{formatDate(deposit.paid_at)}</TableCell>
                          <TableCell className="text-right">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleViewDetails(deposit)}
                              title="Ver detalhes"
                            >
                              <Eye className="w-4 h-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>

                {/* Paginação */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-between mt-4">
                    <p className="text-sm text-gray-600">
                      Página {currentPage} de {totalPages}
                    </p>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentPage(currentPage - 1)}
                        disabled={currentPage <= 1}
                      >
                        Anterior
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentPage(currentPage + 1)}
                        disabled={currentPage >= totalPages}
                      >
                        Próxima
                      </Button>
                    </div>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>

        {/* Modal de Detalhes */}
        <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Detalhes do Depósito #{selectedDeposit?.id}</DialogTitle>
              <DialogDescription>
                Informações completas do depósito
              </DialogDescription>
            </DialogHeader>

            {detailsLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
                <p className="ml-3 text-gray-600">Carregando detalhes...</p>
              </div>
            ) : depositDetails ? (
              <div className="space-y-4">
                {/* Informações do Usuário */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Usuário</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div>
                      <p className="text-sm text-gray-600">Nome</p>
                      <p className="font-medium">{depositDetails.user.name}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Email</p>
                      <p className="font-medium">{depositDetails.user.email}</p>
                    </div>
                    {depositDetails.user.phone && (
                      <div>
                        <p className="text-sm text-gray-600">Telefone</p>
                        <p className="font-medium">{depositDetails.user.phone}</p>
                      </div>
                    )}
                    <div className="grid grid-cols-2 gap-4 mt-4">
                      <div>
                        <p className="text-sm text-gray-600">Saldo Investível</p>
                        <p className="font-bold text-blue-600">
                          {formatCurrency(depositDetails.user.balance)}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Saldo para Saque</p>
                        <p className="font-bold text-green-600">
                          {formatCurrency(depositDetails.user.balance_withdrawn)}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Informações do Depósito */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Depósito</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div>
                      <p className="text-sm text-gray-600">Valor</p>
                      <p className="text-2xl font-bold text-green-600">
                        {formatCurrency(depositDetails.amount)}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Status</p>
                      <div className="mt-1">{getStatusBadge(depositDetails.status)}</div>
                    </div>
                    {depositDetails.transaction_id && (
                      <div>
                        <p className="text-sm text-gray-600">Transaction ID</p>
                        <p className="font-mono text-sm">{depositDetails.transaction_id}</p>
                      </div>
                    )}
                    {depositDetails.order_id && (
                      <div>
                        <p className="text-sm text-gray-600">Order ID</p>
                        <p className="font-mono text-sm">{depositDetails.order_id}</p>
                      </div>
                    )}
                    <div>
                      <p className="text-sm text-gray-600">Criado em</p>
                      <p className="font-medium">{formatDate(depositDetails.created_at)}</p>
                    </div>
                    {depositDetails.paid_at && (
                      <div>
                        <p className="text-sm text-gray-600">Pago em</p>
                        <p className="font-medium text-green-600">
                          {formatDate(depositDetails.paid_at)}
                        </p>
                      </div>
                    )}
                    {depositDetails.expires_at && (
                      <div>
                        <p className="text-sm text-gray-600">Expira em</p>
                        <p className="font-medium">
                          {formatDate(depositDetails.expires_at)}
                        </p>
                      </div>
                    )}
                    {depositDetails.qr_code_image && (
                      <div>
                        <p className="text-sm text-gray-600 mb-2">QR Code</p>
                        <img
                          src={depositDetails.qr_code_image}
                          alt="QR Code"
                          className="max-w-xs border rounded-lg"
                        />
                      </div>
                    )}
                    {depositDetails.order_url && (
                      <div>
                        <p className="text-sm text-gray-600">Link do Pedido</p>
                        <a
                          href={depositDetails.order_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:underline text-sm"
                        >
                          {depositDetails.order_url}
                        </a>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            ) : (
              <div className="text-center py-8">
                <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">Não foi possível carregar os detalhes</p>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}

