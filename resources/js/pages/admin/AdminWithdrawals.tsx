import { Search, DollarSign, Clock, CheckCircle, XCircle, Eye, AlertCircle, Loader2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { AdminHeader } from "@/components/AdminHeader";
import api from "@/lib/api";

interface Withdrawal {
  id: number;
  user: {
    id: number;
    name: string;
    email: string;
    cpf: string | null;
  };
  amount: number;
  fee_amount: number;
  net_amount: number;
  pix_key: string;
  pix_key_type: string;
  cpf: string;
  status: 'REQUESTED' | 'APPROVED' | 'PAID' | 'REJECTED';
  transaction_id: string | null;
  requested_at: string;
  processed_at: string | null;
  error_message: string | null;
}

interface Stats {
  total_withdrawals: number;
  by_status: {
    requested: number;
    approved: number;
    paid: number;
    rejected: number;
  };
  amounts: {
    total_requested: number;
    total_paid: number;
    total_fees: number;
    today: number;
  };
  period: {
    today: number;
    this_week: number;
    this_month: number;
  };
}

export default function AdminWithdrawals() {
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  
  const [selectedWithdrawal, setSelectedWithdrawal] = useState<Withdrawal | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [actionDialogOpen, setActionDialogOpen] = useState(false);
  const [actionType, setActionType] = useState<'approve' | 'paid' | 'reject' | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [transactionId, setTransactionId] = useState("");

  useEffect(() => {
    loadData();
  }, [statusFilter, search]);

  const loadData = async () => {
    try {
      setLoading(true);
      
      const params: any = {};
      if (statusFilter !== 'all') params.status = statusFilter;
      if (search) params.search = search;
      
      const [withdrawalsRes, statsRes] = await Promise.all([
        api.get("/admin/withdrawals", { params }),
        api.get("/admin/withdrawals/stats"),
      ]);
      
      setWithdrawals(withdrawalsRes.data.data);
      setStats(statsRes.data.data);
    } catch (error: any) {
      console.error("Erro ao carregar saques:", error);
      toast({
        title: "Erro",
        description: error.response?.data?.error?.message || "Não foi possível carregar os saques.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const openActionDialog = (withdrawal: Withdrawal, action: 'approve' | 'paid' | 'reject') => {
    setSelectedWithdrawal(withdrawal);
    setActionType(action);
    setActionDialogOpen(true);
    setRejectReason("");
    setTransactionId("");
  };

  const handleAction = async () => {
    if (!selectedWithdrawal || !actionType) return;

    try {
      setActionLoading(true);
      
      let endpoint = "";
      let payload: any = {};

      switch (actionType) {
        case 'approve':
          endpoint = `/admin/withdrawals/${selectedWithdrawal.id}/approve`;
          break;
        case 'paid':
          endpoint = `/admin/withdrawals/${selectedWithdrawal.id}/mark-as-paid`;
          payload = { transaction_id: transactionId || null };
          break;
        case 'reject':
          endpoint = `/admin/withdrawals/${selectedWithdrawal.id}/reject`;
          payload = { reason: rejectReason };
          break;
      }

      await api.post(endpoint, payload);

      toast({
        title: "Sucesso!",
        description: getSuccessMessage(actionType),
      });

      setActionDialogOpen(false);
      loadData();
    } catch (error: any) {
      console.error("Erro na ação:", error);
      toast({
        title: "Erro",
        description: error.response?.data?.error?.message || "Não foi possível realizar a ação.",
        variant: "destructive",
      });
    } finally {
      setActionLoading(false);
    }
  };

  const getSuccessMessage = (action: 'approve' | 'paid' | 'reject') => {
    switch (action) {
      case 'approve': return "Saque aprovado com sucesso!";
      case 'paid': return "Saque marcado como pago!";
      case 'reject': return "Saque rejeitado e saldo estornado!";
    }
  };

  const getStatusBadge = (status: string) => {
    const styles = {
      REQUESTED: "bg-yellow-100 text-yellow-800 border-yellow-300",
      APPROVED: "bg-blue-100 text-blue-800 border-blue-300",
      PAID: "bg-green-100 text-green-800 border-green-300",
      REJECTED: "bg-red-100 text-red-800 border-red-300",
    };
    const labels = {
      REQUESTED: "Solicitado",
      APPROVED: "Aprovado",
      PAID: "Pago",
      REJECTED: "Rejeitado",
    };
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium border ${styles[status as keyof typeof styles]}`}>
        {labels[status as keyof typeof labels]}
      </span>
    );
  };

  const getPixKeyTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      cpf: "CPF",
      email: "E-mail",
      phone: "Telefone",
      random: "Aleatória",
    };
    return labels[type] || type;
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <AdminHeader 
        title="Gerenciamento de Saques" 
        subtitle="Aprove, processe ou rejeite solicitações de saque"
      />

      <div className="p-6 max-w-7xl mx-auto">
        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Solicitados</p>
                    <p className="text-2xl font-bold text-yellow-600">{stats.by_status.requested}</p>
                  </div>
                  <Clock className="w-8 h-8 text-yellow-600" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Pagos</p>
                    <p className="text-2xl font-bold text-green-600">{stats.by_status.paid}</p>
                  </div>
                  <CheckCircle className="w-8 h-8 text-green-600" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Total Pago</p>
                    <p className="text-2xl font-bold">R$ {stats.amounts.total_paid.toFixed(2)}</p>
                  </div>
                  <DollarSign className="w-8 h-8 text-primary" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Hoje</p>
                    <p className="text-2xl font-bold">{stats.period.today}</p>
                  </div>
                  <AlertCircle className="w-8 h-8 text-blue-600" />
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Filters */}
        <Card className="mb-6">
          <CardContent className="p-4">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input
                    placeholder="Buscar por nome, email ou CPF..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full md:w-[200px]">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="REQUESTED">Solicitados</SelectItem>
                  <SelectItem value="APPROVED">Aprovados</SelectItem>
                  <SelectItem value="PAID">Pagos</SelectItem>
                  <SelectItem value="REJECTED">Rejeitados</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Table */}
        <Card>
          <CardContent className="p-0">
            {loading ? (
              <div className="p-8 text-center">
                <Loader2 className="w-8 h-8 animate-spin mx-auto text-primary" />
                <p className="text-sm text-muted-foreground mt-2">Carregando...</p>
              </div>
            ) : withdrawals.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground">
                Nenhum saque encontrado.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>ID</TableHead>
                      <TableHead>Usuário</TableHead>
                      <TableHead>Valor</TableHead>
                      <TableHead>Líquido</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Data</TableHead>
                      <TableHead className="text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {withdrawals.map((withdrawal) => (
                      <TableRow key={withdrawal.id}>
                        <TableCell className="font-medium">#{withdrawal.id}</TableCell>
                        <TableCell>
                          <div>
                            <p className="font-medium">{withdrawal.user.name}</p>
                            <p className="text-xs text-muted-foreground">{withdrawal.user.email}</p>
                          </div>
                        </TableCell>
                        <TableCell>R$ {withdrawal.amount.toFixed(2)}</TableCell>
                        <TableCell className="text-green-600 font-medium">
                          R$ {withdrawal.net_amount.toFixed(2)}
                        </TableCell>
                        <TableCell>{getStatusBadge(withdrawal.status)}</TableCell>
                        <TableCell className="text-sm">
                          {new Date(withdrawal.requested_at).toLocaleDateString('pt-BR')}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex gap-2 justify-end">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setSelectedWithdrawal(withdrawal);
                                setDetailsOpen(true);
                              }}
                            >
                              <Eye className="w-4 h-4" />
                            </Button>
                            {withdrawal.status === 'REQUESTED' && (
                              <>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="text-green-600 hover:bg-green-50"
                                  onClick={() => openActionDialog(withdrawal, 'approve')}
                                >
                                  Aprovar
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="text-red-600 hover:bg-red-50"
                                  onClick={() => openActionDialog(withdrawal, 'reject')}
                                >
                                  Rejeitar
                                </Button>
                              </>
                            )}
                            {withdrawal.status === 'APPROVED' && (
                              <Button
                                variant="outline"
                                size="sm"
                                className="text-blue-600 hover:bg-blue-50"
                                onClick={() => openActionDialog(withdrawal, 'paid')}
                              >
                                Marcar Pago
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Details Dialog */}
      <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Detalhes do Saque #{selectedWithdrawal?.id}</DialogTitle>
          </DialogHeader>
          {selectedWithdrawal && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-xs text-muted-foreground">Usuário</Label>
                  <p className="font-medium">{selectedWithdrawal.user.name}</p>
                  <p className="text-sm text-muted-foreground">{selectedWithdrawal.user.email}</p>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Status</Label>
                  <div className="mt-1">{getStatusBadge(selectedWithdrawal.status)}</div>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label className="text-xs text-muted-foreground">Valor Solicitado</Label>
                  <p className="text-lg font-bold">R$ {selectedWithdrawal.amount.toFixed(2)}</p>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Taxa</Label>
                  <p className="text-lg font-bold text-red-600">- R$ {selectedWithdrawal.fee_amount.toFixed(2)}</p>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Valor Líquido</Label>
                  <p className="text-lg font-bold text-green-600">R$ {selectedWithdrawal.net_amount.toFixed(2)}</p>
                </div>
              </div>

              <div className="border-t pt-4">
                <Label className="text-xs text-muted-foreground">Chave PIX ({getPixKeyTypeLabel(selectedWithdrawal.pix_key_type)})</Label>
                <p className="font-mono text-sm">{selectedWithdrawal.pix_key}</p>
              </div>

              <div>
                <Label className="text-xs text-muted-foreground">CPF do Titular</Label>
                <p className="font-mono text-sm">{selectedWithdrawal.cpf}</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-xs text-muted-foreground">Data da Solicitação</Label>
                  <p className="text-sm">{new Date(selectedWithdrawal.requested_at).toLocaleString('pt-BR')}</p>
                </div>
                {selectedWithdrawal.processed_at && (
                  <div>
                    <Label className="text-xs text-muted-foreground">Data do Processamento</Label>
                    <p className="text-sm">{new Date(selectedWithdrawal.processed_at).toLocaleString('pt-BR')}</p>
                  </div>
                )}
              </div>

              {selectedWithdrawal.transaction_id && (
                <div>
                  <Label className="text-xs text-muted-foreground">ID da Transação</Label>
                  <p className="font-mono text-sm">{selectedWithdrawal.transaction_id}</p>
                </div>
              )}

              {selectedWithdrawal.error_message && (
                <div className="bg-red-50 border border-red-200 rounded p-3">
                  <Label className="text-xs text-red-800">Motivo da Rejeição</Label>
                  <p className="text-sm text-red-600 mt-1">{selectedWithdrawal.error_message}</p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Action Dialog */}
      <Dialog open={actionDialogOpen} onOpenChange={setActionDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {actionType === 'approve' && 'Aprovar Saque'}
              {actionType === 'paid' && 'Marcar como Pago'}
              {actionType === 'reject' && 'Rejeitar Saque'}
            </DialogTitle>
            <DialogDescription>
              {actionType === 'approve' && 'Tem certeza que deseja aprovar este saque?'}
              {actionType === 'paid' && 'Confirme que o pagamento foi realizado.'}
              {actionType === 'reject' && 'O saldo será estornado para o usuário.'}
            </DialogDescription>
          </DialogHeader>

          {selectedWithdrawal && (
            <div className="space-y-4">
              <div className="bg-gray-50 rounded p-3">
                <p className="text-sm"><strong>Usuário:</strong> {selectedWithdrawal.user.name}</p>
                <p className="text-sm"><strong>Valor:</strong> R$ {selectedWithdrawal.net_amount.toFixed(2)}</p>
              </div>

              {actionType === 'paid' && (
                <div>
                  <Label htmlFor="transaction_id">ID da Transação (opcional)</Label>
                  <Input
                    id="transaction_id"
                    value={transactionId}
                    onChange={(e) => setTransactionId(e.target.value)}
                    placeholder="Ex: PIX_123456"
                  />
                </div>
              )}

              {actionType === 'reject' && (
                <div>
                  <Label htmlFor="reason">Motivo da Rejeição *</Label>
                  <Textarea
                    id="reason"
                    value={rejectReason}
                    onChange={(e) => setRejectReason(e.target.value)}
                    placeholder="Digite o motivo da rejeição..."
                    rows={3}
                  />
                </div>
              )}
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setActionDialogOpen(false)} disabled={actionLoading}>
              Cancelar
            </Button>
            <Button
              onClick={handleAction}
              disabled={actionLoading || (actionType === 'reject' && !rejectReason)}
            >
              {actionLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Processando...
                </>
              ) : (
                'Confirmar'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

