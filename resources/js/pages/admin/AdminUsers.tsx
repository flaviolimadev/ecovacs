import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
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
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { 
  Search, 
  Edit, 
  Trash2, 
  UserPlus,
  User,
  TrendingUp,
  Shield,
  DollarSign,
  Eye
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { AdminHeader } from "@/components/AdminHeader";
import { UserDetailsModal } from "./UserDetailsModal";
import { formatCurrency } from "@/lib/format";

interface User {
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
  referral_code: string;
  referred_by?: {
    id: number;
    name: string;
    email: string;
  };
  created_at: string;
}

interface Stats {
  users: {
    total: number;
    admins: number;
    regular: number;
    today: number;
  };
  balances: {
    total_balance: number;
    total_balance_withdrawn: number;
    total_invested: number;
    total_earned: number;
  };
}

export default function AdminUsers() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [users, setUsers] = useState<User[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [searchTerm, setSearchTerm] = useState(""); // Termo digitado (com debounce)
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [perPage, setPerPage] = useState(20);
  const [total, setTotal] = useState(0);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);
  const [detailsUserId, setDetailsUserId] = useState<number | null>(null);
  const [editForm, setEditForm] = useState({
    name: "",
    email: "",
    role: "user",
    password: "",
    balance: "",
    balance_withdrawn: "",
  });

  // Debounce para busca (aguarda 500ms após parar de digitar)
  useEffect(() => {
    const timer = setTimeout(() => {
      setSearchTerm(search);
    }, 500);
    
    return () => clearTimeout(timer);
  }, [search]);

  useEffect(() => {
    loadData();
  }, [currentPage, searchTerm]);

  const loadData = async () => {
    try {
      setLoading(true);

      const [usersRes, statsRes] = await Promise.all([
        api.get("/admin/users", { 
          params: { 
            page: currentPage,
            per_page: perPage,
            search: searchTerm || undefined
          } 
        }),
        api.get("/admin/users/stats"),
      ]);
      
      setUsers(usersRes.data.data);
      setStats(statsRes.data.data);
      
      // Atualizar informações de paginação
      if (usersRes.data.meta) {
        setCurrentPage(usersRes.data.meta.current_page);
        setTotalPages(usersRes.data.meta.last_page);
        setPerPage(usersRes.data.meta.per_page);
        setTotal(usersRes.data.meta.total);
      }
    } catch (error: any) {



      if (error.response?.status === 403) {
        toast({
          title: "Acesso Negado",
          description: "Você não tem permissão de administrador.",
          variant: "destructive",
        });
        navigate("/");
      } else if (error.response?.status === 401) {
        toast({
          title: "Sessão Expirada",
          description: "Faça login novamente.",
          variant: "destructive",
        });
        navigate("/login");
      } else {
        toast({
          title: "Erro",
          description: error.response?.data?.error?.message || "Não foi possível carregar os dados.",
          variant: "destructive",
        });
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async () => {
    setSearchTerm(search); // Aplica busca imediatamente
    setCurrentPage(1); // Resetar para primeira página ao buscar
  };

  const handleClear = () => {
    setSearch("");
    setSearchTerm("");
    setCurrentPage(1);
  };

  const handleEdit = (user: User) => {
    setSelectedUser(user);
    setEditForm({
      name: user.name,
      email: user.email,
      role: user.role,
      password: "",
      balance: user.balance.toString(),
      balance_withdrawn: user.balance_withdrawn.toString(),
    });
    setEditDialogOpen(true);
  };

  const handleSaveEdit = async () => {
    if (!selectedUser) return;

    try {
      const data: any = {
        name: editForm.name,
        email: editForm.email,
        role: editForm.role,
      };

      if (editForm.password) {
        data.password = editForm.password;
      }

      if (editForm.balance !== selectedUser.balance.toString()) {
        data.balance = parseFloat(editForm.balance);
      }

      if (editForm.balance_withdrawn !== selectedUser.balance_withdrawn.toString()) {
        data.balance_withdrawn = parseFloat(editForm.balance_withdrawn);
      }

      await api.put(`/admin/users/${selectedUser.id}`, data);

      toast({
        title: "Sucesso",
        description: "Usuário atualizado com sucesso!",
      });

      setEditDialogOpen(false);
      loadData();
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.response?.data?.error?.message || "Erro ao atualizar usuário.",
        variant: "destructive",
      });
    }
  };

  const handleDelete = async (userId: number) => {
    if (!confirm("Tem certeza que deseja deletar este usuário?")) return;

    try {
      await api.delete(`/admin/users/${userId}`);
      toast({
        title: "Sucesso",
        description: "Usuário deletado com sucesso!",
      });
      loadData();
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.response?.data?.error?.message || "Erro ao deletar usuário.",
        variant: "destructive",
      });
    }
  };

  if (loading && !users.length) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-gray-600">Carregando...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <AdminHeader 
        title="Gerenciamento de Usuários" 
        subtitle="Visualize, edite e gerencie todos os usuários da plataforma"
      />

      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Stats */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <Card className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Usuários</p>
                  <p className="text-2xl font-bold">{stats.users.total}</p>
                </div>
                <User className="w-8 h-8 text-blue-600" />
              </div>
            </Card>
            <Card className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Admins</p>
                  <p className="text-2xl font-bold">{stats.users.admins}</p>
                </div>
                <Shield className="w-8 h-8 text-purple-600" />
              </div>
            </Card>
            <Card className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Saldo Total</p>
                  <p className="text-2xl font-bold">
                    {formatCurrency(stats.balances.total_balance)}
                  </p>
                </div>
                <DollarSign className="w-8 h-8 text-green-600" />
              </div>
            </Card>
            <Card className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Investido</p>
                  <p className="text-2xl font-bold">
                    {formatCurrency(stats.balances.total_invested)}
                  </p>
                </div>
                <TrendingUp className="w-8 h-8 text-orange-600" />
              </div>
            </Card>
          </div>
        )}

        {/* Search */}
        <Card className="p-4 mb-6">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
              <Input
                placeholder="Buscar por nome, email ou código..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                className="pl-10"
              />
            </div>
            <Button onClick={handleSearch} disabled={loading}>
              Buscar
            </Button>
            <Button onClick={handleClear} variant="outline" disabled={loading}>
              Limpar
            </Button>
          </div>
        </Card>

        {/* Users Table */}
        <Card>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID</TableHead>
                  <TableHead>Nome</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Indicado por</TableHead>
                  <TableHead className="text-right">Saldo Investir</TableHead>
                  <TableHead className="text-right">Saldo Sacar</TableHead>
                  <TableHead>Código</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell className="font-medium">{user.id}</TableCell>
                    <TableCell>{user.name}</TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell>
                      <Badge variant={user.role === "admin" ? "default" : "secondary"}>
                        {user.role}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {user.referred_by ? (
                        <div className="text-sm">
                          <div className="font-medium">{user.referred_by.name}</div>
                          <div className="text-xs text-gray-500">{user.referred_by.email}</div>
                        </div>
                      ) : (
                        <span className="text-gray-400 text-sm">N/A</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      {formatCurrency(user.balance)}
                    </TableCell>
                    <TableCell className="text-right">
                      {formatCurrency(user.balance_withdrawn)}
                    </TableCell>
                    <TableCell className="font-mono text-xs">
                      {user.referral_code}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex gap-2 justify-end">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => {
                            setDetailsUserId(user.id);
                            setDetailsDialogOpen(true);
                          }}
                          title="Ver Detalhes"
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleEdit(user)}
                          title="Editar"
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => handleDelete(user.id)}
                          title="Deletar"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {/* Paginação */}
          <div className="flex items-center justify-between px-4 py-4 border-t">
            <div className="text-sm text-gray-600">
              Mostrando {users.length > 0 ? ((currentPage - 1) * perPage + 1) : 0} até {Math.min(currentPage * perPage, total)} de {total} usuários
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1 || loading}
              >
                Anterior
              </Button>
              <div className="flex items-center gap-2">
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  let pageNum;
                  if (totalPages <= 5) {
                    pageNum = i + 1;
                  } else if (currentPage <= 3) {
                    pageNum = i + 1;
                  } else if (currentPage >= totalPages - 2) {
                    pageNum = totalPages - 4 + i;
                  } else {
                    pageNum = currentPage - 2 + i;
                  }
                  return (
                    <Button
                      key={pageNum}
                      variant={currentPage === pageNum ? "default" : "outline"}
                      size="sm"
                      onClick={() => setCurrentPage(pageNum)}
                      disabled={loading}
                      className="w-10"
                    >
                      {pageNum}
                    </Button>
                  );
                })}
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages || loading}
              >
                Próxima
              </Button>
            </div>
          </div>
        </Card>
      </div>

      {/* Edit Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Editar Usuário #{selectedUser?.id}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label>Nome</Label>
              <Input
                value={editForm.name}
                onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
              />
            </div>
            <div>
              <Label>Email</Label>
              <Input
                type="email"
                value={editForm.email}
                onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
              />
            </div>
            <div>
              <Label>Role</Label>
              <select
                value={editForm.role}
                onChange={(e) => setEditForm({ ...editForm, role: e.target.value })}
                className="w-full border rounded-md px-3 py-2"
              >
                <option value="user">User</option>
                <option value="admin">Admin</option>
              </select>
            </div>
            <div>
              <Label>Nova Senha (deixe vazio para não alterar)</Label>
              <Input
                type="password"
                value={editForm.password}
                onChange={(e) => setEditForm({ ...editForm, password: e.target.value })}
                placeholder="••••••"
              />
            </div>
            <div>
              <Label>Saldo para Investir</Label>
              <Input
                type="number"
                step="0.01"
                value={editForm.balance}
                onChange={(e) => setEditForm({ ...editForm, balance: e.target.value })}
              />
            </div>
            <div>
              <Label>Saldo para Sacar</Label>
              <Input
                type="number"
                step="0.01"
                value={editForm.balance_withdrawn}
                onChange={(e) =>
                  setEditForm({ ...editForm, balance_withdrawn: e.target.value })
                }
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSaveEdit}>Salvar Alterações</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal de Detalhes do Usuário */}
      <UserDetailsModal
        userId={detailsUserId}
        open={detailsDialogOpen}
        onClose={() => {
          setDetailsDialogOpen(false);
          setDetailsUserId(null);
        }}
      />
    </div>
  );
}

