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
  Plus,
  Package,
  TrendingUp,
  DollarSign,
  X,
  Clock,
  Upload,
  Image as ImageIcon,
  Loader2
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { AdminHeader } from "@/components/AdminHeader";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface Plan {
  id: number;
  name: string;
  image: string;
  price: number;
  daily_income: number | null;
  duration_days: number;
  total_return: number;
  max_purchases: number;
  type: 'DAILY' | 'END_CYCLE';
  description: string | null;
  is_active: boolean;
  order: number;
  is_featured: boolean;
  featured_color: string | null;
  featured_ends_at: string | null;
  created_at: string;
  updated_at: string;
}

interface Stats {
  total: number;
  active: number;
  inactive: number;
  by_type: {
    daily: number;
    end_cycle: number;
  };
}

export default function AdminPlans() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [plans, setPlans] = useState<Plan[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [perPage, setPerPage] = useState(20);
  const [total, setTotal] = useState(0);
  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState<{ hours: number; minutes: number; seconds: number; days: number } | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [form, setForm] = useState({
    name: "",
    image: "",
    price: "",
    daily_income: "",
    duration_days: "",
    total_return: "",
    max_purchases: "1",
    type: "DAILY" as 'DAILY' | 'END_CYCLE',
    description: "",
    is_active: true,
    order: "0",
    is_featured: false,
    featured_color: "#FF0000",
    featured_ends_at: "",
  });

  // Calcular tempo restante para exibir no formulário
  useEffect(() => {
    if (!form.is_featured || !form.featured_ends_at) {
      setTimeRemaining(null);
      return;
    }

    const updateTime = () => {
      try {
        const now = new Date().getTime();
        // datetime-local vem como YYYY-MM-DDTHH:mm, precisa ser convertido corretamente
        const dateStr = form.featured_ends_at;
        const endDate = new Date(dateStr);
        
        // Verificar se a data é válida
        if (isNaN(endDate.getTime())) {
          setTimeRemaining(null);
          return;
        }
        
        const end = endDate.getTime();
        const diff = end - now;

        if (diff <= 0) {
          setTimeRemaining(null);
          return;
        }

        const days = Math.floor(diff / (1000 * 60 * 60 * 24));
        const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((diff % (1000 * 60)) / 1000);
        setTimeRemaining({ days, hours, minutes, seconds });
      } catch (error) {
        console.error('Erro ao calcular tempo restante:', error);
        setTimeRemaining(null);
      }
    };

    updateTime();
    const interval = setInterval(updateTime, 1000);

    return () => clearInterval(interval);
  }, [form.is_featured, form.featured_ends_at]);

  // Debounce para busca
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

      const [plansRes, statsRes] = await Promise.all([
        api.get("/admin/plans", { 
          params: { 
            page: currentPage,
            per_page: perPage,
            search: searchTerm || undefined
          } 
        }),
        api.get("/admin/plans/stats"),
      ]);
      
      setPlans(plansRes.data.data);
      setStats(statsRes.data.data);
      
      if (plansRes.data.meta) {
        setCurrentPage(plansRes.data.meta.current_page);
        setTotalPages(plansRes.data.meta.last_page);
        setPerPage(plansRes.data.meta.per_page);
        setTotal(plansRes.data.meta.total);
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
    setSearchTerm(search);
    setCurrentPage(1);
  };

  const handleClear = () => {
    setSearch("");
    setSearchTerm("");
    setCurrentPage(1);
  };

  const resetForm = () => {
    setForm({
      name: "",
      image: "",
      price: "",
      daily_income: "",
      duration_days: "",
      total_return: "",
      max_purchases: "1",
      type: "DAILY",
      description: "",
      is_active: true,
      order: "0",
      is_featured: false,
      featured_color: "#FF0000",
      featured_ends_at: "",
    });
    setImagePreview(null);
  };

  const handleImageUpload = async (file: File) => {
    try {
      setUploadingImage(true);
      const formData = new FormData();
      formData.append('image', file);

      // O interceptor do axios já adiciona o token automaticamente
      // E remove o Content-Type para FormData (deixa o browser definir com boundary)
      const response = await api.post('/admin/upload/image', formData);

      const imageUrl = response.data.data.url;
      setForm({ ...form, image: imageUrl });
      setImagePreview(imageUrl);
      
      toast({
        title: "✅ Imagem enviada!",
        description: "A imagem foi carregada com sucesso.",
      });
    } catch (error: any) {
      toast({
        title: "❌ Erro ao enviar imagem",
        description: error.response?.data?.error?.message || "Erro ao fazer upload da imagem.",
        variant: "destructive",
      });
    } finally {
      setUploadingImage(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validar tipo de arquivo
      if (!file.type.startsWith('image/')) {
        toast({
          title: "❌ Arquivo inválido",
          description: "Por favor, selecione uma imagem.",
          variant: "destructive",
        });
        return;
      }

      // Validar tamanho (5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: "❌ Arquivo muito grande",
          description: "A imagem deve ter no máximo 5MB.",
          variant: "destructive",
        });
        return;
      }

      // Criar preview local
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);

      // Fazer upload
      handleImageUpload(file);
    }
  };

  const handleCreate = () => {
    resetForm();
    setSelectedPlan(null);
    setCreateDialogOpen(true);
  };

  const handleEdit = (plan: Plan) => {
    setSelectedPlan(plan);
    setImagePreview(plan.image);
    setForm({
      name: plan.name,
      image: plan.image,
      price: plan.price.toString(),
      daily_income: plan.daily_income?.toString() || "",
      duration_days: plan.duration_days.toString(),
      total_return: plan.total_return.toString(),
      max_purchases: plan.max_purchases.toString(),
      type: plan.type,
      description: plan.description || "",
      is_active: plan.is_active,
      order: plan.order.toString(),
      is_featured: plan.is_featured,
      featured_color: plan.featured_color || "#FF0000",
      featured_ends_at: plan.featured_ends_at ? new Date(plan.featured_ends_at).toISOString().slice(0, 16) : "",
    });
    setEditDialogOpen(true);
  };

  const handleSave = async () => {
    try {
      // Validação básica antes de enviar
      if (!form.name || !form.image || !form.price || !form.duration_days || !form.total_return) {
        toast({
          title: "❌ Campos obrigatórios",
          description: "Por favor, preencha todos os campos obrigatórios.",
          variant: "destructive",
        });
        return;
      }

      const data: any = {
        name: form.name.trim(),
        image: form.image.trim(),
        price: parseFloat(form.price),
        duration_days: parseInt(form.duration_days),
        total_return: parseFloat(form.total_return),
        max_purchases: parseInt(form.max_purchases) || 1,
        type: form.type,
        description: form.description?.trim() || null,
        is_active: form.is_active !== undefined ? form.is_active : true,
        order: parseInt(form.order) || 0,
      };

      // daily_income é opcional, mas se fornecido deve ser numérico
      if (form.daily_income && form.daily_income.trim() !== '') {
        data.daily_income = parseFloat(form.daily_income);
      }

      // Campos de promoção
      data.is_featured = form.is_featured || false;
      if (form.is_featured) {
        // Validar cor se for promoção
        if (!form.featured_color || !form.featured_color.match(/^#[0-9A-Fa-f]{6}$/)) {
          toast({
            title: "❌ Cor inválida",
            description: "Por favor, escolha uma cor válida no formato hexadecimal (#RRGGBB).",
            variant: "destructive",
          });
          return;
        }
        data.featured_color = form.featured_color;
        
        // Converter datetime-local para ISO string corretamente
        if (form.featured_ends_at && form.featured_ends_at.trim() !== '') {
          try {
            // datetime-local vem no formato: YYYY-MM-DDTHH:mm
            const dateStr = form.featured_ends_at;
            const date = new Date(dateStr);
            
            // Verificar se a data é válida
            if (isNaN(date.getTime())) {
              throw new Error('Data inválida');
            }
            
            data.featured_ends_at = date.toISOString();
          } catch (error) {
            console.error('Erro ao converter data:', error);
            toast({
              title: "❌ Erro na data",
              description: "Por favor, verifique a data de término da promoção.",
              variant: "destructive",
            });
            return; // Não salvar se a data for inválida
          }
        } else {
          data.featured_ends_at = null;
        }
      } else {
        data.featured_color = null;
        data.featured_ends_at = null;
      }

      if (selectedPlan) {
        await api.put(`/admin/plans/${selectedPlan.id}`, data);
        toast({
          title: "Sucesso",
          description: "Plano atualizado com sucesso!",
        });
        setEditDialogOpen(false);
      } else {
        await api.post("/admin/plans", data);
        toast({
          title: "Sucesso",
          description: "Plano criado com sucesso!",
        });
        setCreateDialogOpen(false);
      }

      resetForm();
      loadData();
    } catch (error: any) {
      console.error('Erro ao salvar plano:', error);
      
      // Tratar erros de validação (422)
      if (error.response?.status === 422) {
        const errorData = error.response.data;
        const errorMessage = errorData?.error?.message || 'Dados inválidos';
        const errorDetails = errorData?.error?.details;
        
        let description = errorMessage;
        if (errorDetails) {
          // Se houver detalhes de validação, mostrar os campos com erro
          const fields = Object.keys(errorDetails).map(field => {
            const messages = Array.isArray(errorDetails[field]) 
              ? errorDetails[field].join(', ') 
              : errorDetails[field];
            return `${field}: ${messages}`;
          }).join('\n');
          description = `${errorMessage}\n${fields}`;
        }
        
        toast({
          title: "❌ Erro de Validação",
          description: description,
          variant: "destructive",
        });
      } else {
        toast({
          title: "❌ Erro",
          description: error.response?.data?.error?.message || error.message || "Erro ao salvar plano.",
          variant: "destructive",
        });
      }
    }
  };

  const handleDelete = async (planId: number) => {
    if (!confirm("Tem certeza que deseja deletar este plano?")) return;

    try {
      await api.delete(`/admin/plans/${planId}`);
      toast({
        title: "Sucesso",
        description: "Plano deletado com sucesso!",
      });
      loadData();
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.response?.data?.error?.message || "Erro ao deletar plano.",
        variant: "destructive",
      });
    }
  };

  if (loading && !plans.length) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-gray-600">Carregando planos...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <AdminHeader />
      
      <div className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Gerenciar Planos</h1>
          <p className="text-gray-600 mt-2">Gerencie os planos de investimento do sistema</p>
        </div>

        {/* Estatísticas */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <Card className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total de Planos</p>
                  <p className="text-2xl font-bold">{stats.total}</p>
                </div>
                <Package className="h-8 w-8 text-blue-500" />
              </div>
            </Card>
            <Card className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Planos Ativos</p>
                  <p className="text-2xl font-bold text-green-600">{stats.active}</p>
                </div>
                <TrendingUp className="h-8 w-8 text-green-500" />
              </div>
            </Card>
            <Card className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Planos Inativos</p>
                  <p className="text-2xl font-bold text-gray-600">{stats.inactive}</p>
                </div>
                <X className="h-8 w-8 text-gray-500" />
              </div>
            </Card>
            <Card className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Diários / Ciclo</p>
                  <p className="text-2xl font-bold">{stats.by_type.daily} / {stats.by_type.end_cycle}</p>
                </div>
                <DollarSign className="h-8 w-8 text-purple-500" />
              </div>
            </Card>
          </div>
        )}

        {/* Barra de busca e ações */}
        <Card className="p-4 mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Buscar por nome ou descrição..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                  className="pl-10"
                />
              </div>
              <Button onClick={handleSearch} variant="outline">
                Buscar
              </Button>
              {search && (
                <Button onClick={handleClear} variant="ghost">
                  Limpar
                </Button>
              )}
            </div>
            <Button onClick={handleCreate} className="md:w-auto">
              <Plus className="h-4 w-4 mr-2" />
              Novo Plano
            </Button>
          </div>
        </Card>

        {/* Tabela de planos */}
        <Card>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID</TableHead>
                  <TableHead>Nome</TableHead>
                  <TableHead>Preço</TableHead>
                  <TableHead>Renda Diária</TableHead>
                  <TableHead>Duração</TableHead>
                  <TableHead>Retorno Total</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Ordem</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {plans.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={10} className="text-center py-8 text-gray-500">
                      Nenhum plano encontrado
                    </TableCell>
                  </TableRow>
                ) : (
                  plans.map((plan) => (
                    <TableRow key={plan.id}>
                      <TableCell>{plan.id}</TableCell>
                      <TableCell className="font-medium">{plan.name}</TableCell>
                      <TableCell>R$ {plan.price.toFixed(2)}</TableCell>
                      <TableCell>
                        {plan.daily_income ? `R$ ${plan.daily_income.toFixed(2)}` : '-'}
                      </TableCell>
                      <TableCell>{plan.duration_days} dias</TableCell>
                      <TableCell>R$ {plan.total_return.toFixed(2)}</TableCell>
                      <TableCell>
                        <Badge variant={plan.type === 'DAILY' ? 'default' : 'secondary'}>
                          {plan.type === 'DAILY' ? 'Diário' : 'Fim de Ciclo'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={plan.is_active ? 'default' : 'destructive'}>
                          {plan.is_active ? 'Ativo' : 'Inativo'}
                        </Badge>
                      </TableCell>
                      <TableCell>{plan.order}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEdit(plan)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(plan.id)}
                            className="text-red-600 hover:text-red-700"
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
          </div>

          {/* Paginação */}
          {totalPages > 1 && (
            <div className="p-4 flex items-center justify-between border-t">
              <div className="text-sm text-gray-600">
                Mostrando {((currentPage - 1) * perPage) + 1} a {Math.min(currentPage * perPage, total)} de {total} planos
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                >
                  Anterior
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                >
                  Próxima
                </Button>
              </div>
            </div>
          )}
        </Card>
      </div>

      {/* Dialog de Edição */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Editar Plano</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Nome</Label>
              <Input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="Ex: 💎 Plano Ouro Premium"
              />
            </div>
            <div>
              <Label>Imagem do Plano</Label>
              <div className="space-y-3">
                {/* Input de arquivo */}
                <div className="flex items-center gap-3">
                  <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
                    {uploadingImage ? (
                      <div className="flex flex-col items-center justify-center pt-5 pb-6">
                        <Loader2 className="w-8 h-8 animate-spin text-gray-400 mb-2" />
                        <p className="text-sm text-gray-500">Enviando...</p>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center pt-5 pb-6">
                        <Upload className="w-8 h-8 text-gray-400 mb-2" />
                        <p className="text-sm text-gray-500">
                          <span className="font-semibold">Clique para enviar</span> ou arraste a imagem aqui
                        </p>
                        <p className="text-xs text-gray-400 mt-1">PNG, JPG, WEBP até 5MB</p>
                      </div>
                    )}
                    <input
                      type="file"
                      className="hidden"
                      accept="image/*"
                      onChange={handleFileChange}
                      disabled={uploadingImage}
                    />
                  </label>
                </div>

                {/* Preview da imagem */}
                {imagePreview && (
                  <div className="relative">
                    <img
                      src={imagePreview}
                      alt="Preview"
                      className="w-full h-48 object-contain rounded-lg border border-gray-200 bg-gray-50"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        setImagePreview(null);
                        setForm({ ...form, image: "" });
                      }}
                      className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                )}

                {/* Campo de URL alternativa */}
                <div>
                  <Label className="text-xs text-gray-500">Ou cole uma URL de imagem:</Label>
                  <Input
                    value={form.image}
                    onChange={(e) => {
                      setForm({ ...form, image: e.target.value });
                      if (e.target.value) {
                        setImagePreview(e.target.value);
                      }
                    }}
                    placeholder="https://exemplo.com/imagem.jpg"
                    className="mt-1"
                  />
                </div>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Preço (R$)</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={form.price}
                  onChange={(e) => setForm({ ...form, price: e.target.value })}
                  placeholder="50.00"
                />
              </div>
              <div>
                <Label>Renda Diária (R$) - Opcional</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={form.daily_income}
                  onChange={(e) => setForm({ ...form, daily_income: e.target.value })}
                  placeholder="5.00"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Duração (dias)</Label>
                <Input
                  type="number"
                  value={form.duration_days}
                  onChange={(e) => setForm({ ...form, duration_days: e.target.value })}
                  placeholder="20"
                />
              </div>
              <div>
                <Label>Retorno Total (R$)</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={form.total_return}
                  onChange={(e) => setForm({ ...form, total_return: e.target.value })}
                  placeholder="100.00"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Máximo de Compras</Label>
                <Input
                  type="number"
                  value={form.max_purchases}
                  onChange={(e) => setForm({ ...form, max_purchases: e.target.value })}
                  placeholder="1"
                />
              </div>
              <div>
                <Label>Tipo</Label>
                <Select
                  value={form.type}
                  onValueChange={(value: 'DAILY' | 'END_CYCLE') => setForm({ ...form, type: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="DAILY">Diário</SelectItem>
                    <SelectItem value="END_CYCLE">Fim de Ciclo</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label>Descrição (Opcional)</Label>
              <Textarea
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder="Descrição do plano..."
                rows={3}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Ordem de Exibição</Label>
                <Input
                  type="number"
                  value={form.order}
                  onChange={(e) => setForm({ ...form, order: e.target.value })}
                  placeholder="0"
                />
              </div>
              <div className="flex items-center space-x-2 pt-8">
                <input
                  type="checkbox"
                  id="is_active"
                  checked={form.is_active}
                  onChange={(e) => setForm({ ...form, is_active: e.target.checked })}
                  className="h-4 w-4"
                />
                <Label htmlFor="is_active">Plano Ativo</Label>
              </div>
            </div>
            <div className="border-t pt-4 space-y-4">
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="is_featured"
                  checked={form.is_featured}
                  onChange={(e) => setForm({ ...form, is_featured: e.target.checked })}
                  className="h-4 w-4"
                />
                <Label htmlFor="is_featured" className="font-semibold">Plano em Promoção/Destaque</Label>
              </div>
              {form.is_featured && (
                <>
                  <div>
                    <Label>Cor do Destaque (Hex)</Label>
                    <div className="flex gap-2">
                      <Input
                        type="color"
                        value={form.featured_color}
                        onChange={(e) => setForm({ ...form, featured_color: e.target.value })}
                        className="w-20 h-10"
                      />
                      <Input
                        type="text"
                        value={form.featured_color}
                        onChange={(e) => setForm({ ...form, featured_color: e.target.value })}
                        placeholder="#FF0000"
                        pattern="^#[0-9A-Fa-f]{6}$"
                      />
                    </div>
                  </div>
                  <div>
                    <Label>Data/Hora de Término da Promoção</Label>
                    <Input
                      type="datetime-local"
                      value={form.featured_ends_at}
                      onChange={(e) => setForm({ ...form, featured_ends_at: e.target.value })}
                    />
                    <p className="text-xs text-gray-500 mt-1">Deixe vazio para promoção sem data de término</p>
                    
                    {/* Preview do tempo de disponibilidade */}
                    {form.featured_ends_at && (
                      <div className="mt-3 p-3 rounded-lg border-2" style={{ borderColor: form.featured_color, backgroundColor: `${form.featured_color}10` }}>
                        <div className="flex items-center gap-2 mb-2">
                          <Clock className="w-4 h-4" style={{ color: form.featured_color }} />
                          <span className="text-sm font-semibold" style={{ color: form.featured_color }}>
                            Tempo de Disponibilidade:
                          </span>
                        </div>
                        {timeRemaining ? (
                          <div className="space-y-1">
                            <div className="text-lg font-mono font-bold" style={{ color: form.featured_color }}>
                              {timeRemaining.days > 0 && `${timeRemaining.days}d `}
                              {String(timeRemaining.hours).padStart(2, '0')}:
                              {String(timeRemaining.minutes).padStart(2, '0')}:
                              {String(timeRemaining.seconds).padStart(2, '0')}
                            </div>
                            <div className="text-xs text-gray-600">
                              O plano estará disponível até: <strong>{new Date(form.featured_ends_at).toLocaleString('pt-BR')}</strong>
                            </div>
                          </div>
                        ) : (
                          <div className="text-sm text-gray-600">
                            Calculando tempo restante...
                          </div>
                        )}
                      </div>
                    )}
                    {!form.featured_ends_at && (
                      <div className="mt-3 p-3 rounded-lg bg-gray-100 border border-gray-300">
                        <div className="flex items-center gap-2">
                          <Clock className="w-4 h-4 text-gray-600" />
                          <span className="text-sm text-gray-600">
                            <strong>Disponível indefinidamente</strong> (sem data de término)
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSave}>Salvar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog de Criação */}
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Novo Plano</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Nome</Label>
              <Input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="Ex: 💎 Plano Ouro Premium"
              />
            </div>
            <div>
              <Label>Imagem do Plano</Label>
              <div className="space-y-3">
                {/* Input de arquivo */}
                <div className="flex items-center gap-3">
                  <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
                    {uploadingImage ? (
                      <div className="flex flex-col items-center justify-center pt-5 pb-6">
                        <Loader2 className="w-8 h-8 animate-spin text-gray-400 mb-2" />
                        <p className="text-sm text-gray-500">Enviando...</p>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center pt-5 pb-6">
                        <Upload className="w-8 h-8 text-gray-400 mb-2" />
                        <p className="text-sm text-gray-500">
                          <span className="font-semibold">Clique para enviar</span> ou arraste a imagem aqui
                        </p>
                        <p className="text-xs text-gray-400 mt-1">PNG, JPG, WEBP até 5MB</p>
                      </div>
                    )}
                    <input
                      type="file"
                      className="hidden"
                      accept="image/*"
                      onChange={handleFileChange}
                      disabled={uploadingImage}
                    />
                  </label>
                </div>

                {/* Preview da imagem */}
                {imagePreview && (
                  <div className="relative">
                    <img
                      src={imagePreview}
                      alt="Preview"
                      className="w-full h-48 object-contain rounded-lg border border-gray-200 bg-gray-50"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        setImagePreview(null);
                        setForm({ ...form, image: "" });
                      }}
                      className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                )}

                {/* Campo de URL alternativa */}
                <div>
                  <Label className="text-xs text-gray-500">Ou cole uma URL de imagem:</Label>
                  <Input
                    value={form.image}
                    onChange={(e) => {
                      setForm({ ...form, image: e.target.value });
                      if (e.target.value) {
                        setImagePreview(e.target.value);
                      }
                    }}
                    placeholder="https://exemplo.com/imagem.jpg"
                    className="mt-1"
                  />
                </div>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Preço (R$)</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={form.price}
                  onChange={(e) => setForm({ ...form, price: e.target.value })}
                  placeholder="50.00"
                />
              </div>
              <div>
                <Label>Renda Diária (R$) - Opcional</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={form.daily_income}
                  onChange={(e) => setForm({ ...form, daily_income: e.target.value })}
                  placeholder="5.00"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Duração (dias)</Label>
                <Input
                  type="number"
                  value={form.duration_days}
                  onChange={(e) => setForm({ ...form, duration_days: e.target.value })}
                  placeholder="20"
                />
              </div>
              <div>
                <Label>Retorno Total (R$)</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={form.total_return}
                  onChange={(e) => setForm({ ...form, total_return: e.target.value })}
                  placeholder="100.00"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Máximo de Compras</Label>
                <Input
                  type="number"
                  value={form.max_purchases}
                  onChange={(e) => setForm({ ...form, max_purchases: e.target.value })}
                  placeholder="1"
                />
              </div>
              <div>
                <Label>Tipo</Label>
                <Select
                  value={form.type}
                  onValueChange={(value: 'DAILY' | 'END_CYCLE') => setForm({ ...form, type: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="DAILY">Diário</SelectItem>
                    <SelectItem value="END_CYCLE">Fim de Ciclo</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label>Descrição (Opcional)</Label>
              <Textarea
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder="Descrição do plano..."
                rows={3}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Ordem de Exibição</Label>
                <Input
                  type="number"
                  value={form.order}
                  onChange={(e) => setForm({ ...form, order: e.target.value })}
                  placeholder="0"
                />
              </div>
              <div className="flex items-center space-x-2 pt-8">
                <input
                  type="checkbox"
                  id="is_active_create"
                  checked={form.is_active}
                  onChange={(e) => setForm({ ...form, is_active: e.target.checked })}
                  className="h-4 w-4"
                />
                <Label htmlFor="is_active_create">Plano Ativo</Label>
              </div>
            </div>
            <div className="border-t pt-4 space-y-4">
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="is_featured_create"
                  checked={form.is_featured}
                  onChange={(e) => setForm({ ...form, is_featured: e.target.checked })}
                  className="h-4 w-4"
                />
                <Label htmlFor="is_featured_create" className="font-semibold">Plano em Promoção/Destaque</Label>
              </div>
              {form.is_featured && (
                <>
                  <div>
                    <Label>Cor do Destaque (Hex)</Label>
                    <div className="flex gap-2">
                      <Input
                        type="color"
                        value={form.featured_color}
                        onChange={(e) => setForm({ ...form, featured_color: e.target.value })}
                        className="w-20 h-10"
                      />
                      <Input
                        type="text"
                        value={form.featured_color}
                        onChange={(e) => setForm({ ...form, featured_color: e.target.value })}
                        placeholder="#FF0000"
                        pattern="^#[0-9A-Fa-f]{6}$"
                      />
                    </div>
                  </div>
                  <div>
                    <Label>Data/Hora de Término da Promoção</Label>
                    <Input
                      type="datetime-local"
                      value={form.featured_ends_at}
                      onChange={(e) => setForm({ ...form, featured_ends_at: e.target.value })}
                    />
                    <p className="text-xs text-gray-500 mt-1">Deixe vazio para promoção sem data de término</p>
                    
                    {/* Preview do tempo de disponibilidade */}
                    {form.featured_ends_at && (
                      <div className="mt-3 p-3 rounded-lg border-2" style={{ borderColor: form.featured_color, backgroundColor: `${form.featured_color}10` }}>
                        <div className="flex items-center gap-2 mb-2">
                          <Clock className="w-4 h-4" style={{ color: form.featured_color }} />
                          <span className="text-sm font-semibold" style={{ color: form.featured_color }}>
                            Tempo de Disponibilidade:
                          </span>
                        </div>
                        {timeRemaining ? (
                          <div className="space-y-1">
                            <div className="text-lg font-mono font-bold" style={{ color: form.featured_color }}>
                              {timeRemaining.days > 0 && `${timeRemaining.days}d `}
                              {String(timeRemaining.hours).padStart(2, '0')}:
                              {String(timeRemaining.minutes).padStart(2, '0')}:
                              {String(timeRemaining.seconds).padStart(2, '0')}
                            </div>
                            <div className="text-xs text-gray-600">
                              O plano estará disponível até: <strong>{new Date(form.featured_ends_at).toLocaleString('pt-BR')}</strong>
                            </div>
                          </div>
                        ) : (
                          <div className="text-sm text-gray-600">
                            Calculando tempo restante...
                          </div>
                        )}
                      </div>
                    )}
                    {!form.featured_ends_at && (
                      <div className="mt-3 p-3 rounded-lg bg-gray-100 border border-gray-300">
                        <div className="flex items-center gap-2">
                          <Clock className="w-4 h-4 text-gray-600" />
                          <span className="text-sm text-gray-600">
                            <strong>Disponível indefinidamente</strong> (sem data de término)
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSave}>Criar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

