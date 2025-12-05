import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { AdminHeader } from "@/components/AdminHeader";
import { useToast } from "@/hooks/use-toast";
import {
  Users,
  DollarSign,
  TrendingUp,
  Award,
  Loader2,
  Crown,
  Network,
} from "lucide-react";
import api from "@/lib/api";

interface Recruiter {
  id: number;
  name: string;
  email: string;
  phone: string;
  referral_code: string;
  created_at: string;
  direct_referrals: number;
  total_network: number;
  total_commissions: number;
  total_withdrawn: number;
  balance_withdrawn: number;
}

interface Stats {
  total_commissions_distributed: number;
  total_withdrawn: number;
  active_recruiters: number;
  total_users_in_network: number;
  avg_commissions_per_recruiter: number;
}

export default function AdminTopRecruiters() {
  const navigate = useNavigate();
  const { toast } = useToast();

  const [topByNetwork, setTopByNetwork] = useState<Recruiter[]>([]);
  const [topByCommissions, setTopByCommissions] = useState<Recruiter[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"network" | "commissions">("network");

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);

      // Carregar stats
      const statsRes = await api.get("/admin/top-recruiters/stats");
      setStats(statsRes.data.data);

      // Carregar top por rede
      const networkRes = await api.get("/admin/top-recruiters/by-network");
      setTopByNetwork(networkRes.data.data);

      // Carregar top por comissões
      const commissionsRes = await api.get("/admin/top-recruiters/by-commissions");
      setTopByCommissions(commissionsRes.data.data);
    } catch (error: any) {
      toast({
        title: "Erro ao carregar dados",
        description: error.response?.data?.message || "Erro desconhecido",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  if (loading || !stats) {
    return (
      <div className="min-h-screen bg-gray-50">
        <AdminHeader />
        <div className="flex items-center justify-center h-96">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  const currentData = activeTab === "network" ? topByNetwork : topByCommissions;

  return (
    <div className="min-h-screen bg-gray-50">
      <AdminHeader />

      <div className="container mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <Crown className="w-8 h-8 text-yellow-500" />
              Top Recrutadores MLM
            </h1>
            <p className="text-gray-600 mt-1">
              Ranking dos melhores recrutadores da rede
            </p>
          </div>
        </div>

        {/* Stats Cards */}
        {stats && (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Comissões Distribuídas</CardTitle>
                <DollarSign className="h-4 w-4 text-green-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">
                  {formatCurrency(stats.total_commissions_distributed)}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Sacado</CardTitle>
                <TrendingUp className="h-4 w-4 text-blue-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-600">
                  {formatCurrency(stats.total_withdrawn)}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Recrutadores Ativos</CardTitle>
                <Users className="h-4 w-4 text-purple-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-purple-600">
                  {stats.active_recruiters}
                </div>
                <p className="text-xs text-gray-600 mt-1">Com pelo menos 1 indicado</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Usuários na Rede</CardTitle>
                <Network className="h-4 w-4 text-orange-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-orange-600">
                  {stats.total_users_in_network}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Média por Recrutador</CardTitle>
                <Award className="h-4 w-4 text-yellow-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-yellow-600">
                  {formatCurrency(stats.avg_commissions_per_recruiter)}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Tabs */}
        <div className="flex gap-2">
          <Button
            variant={activeTab === "network" ? "default" : "outline"}
            onClick={() => setActiveTab("network")}
            className="flex items-center gap-2"
          >
            <Network className="w-4 h-4" />
            🏆 Top 10 por Rede
          </Button>
          <Button
            variant={activeTab === "commissions" ? "default" : "outline"}
            onClick={() => setActiveTab("commissions")}
            className="flex items-center gap-2"
          >
            <DollarSign className="w-4 h-4" />
            💰 Top 10 por Comissões
          </Button>
        </div>

        {/* Table */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {activeTab === "network" ? (
                <>
                  <Network className="w-5 h-5 text-purple-600" />
                  Top 10 - Maior Rede MLM
                </>
              ) : (
                <>
                  <DollarSign className="w-5 h-5 text-green-600" />
                  Top 10 - Maiores Ganhadores de Comissões
                </>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">#</TableHead>
                  <TableHead>Recrutador</TableHead>
                  <TableHead className="text-center">Diretos</TableHead>
                  <TableHead className="text-center">Rede Total</TableHead>
                  <TableHead className="text-right">Comissões Ganhas</TableHead>
                  <TableHead className="text-right">Total Sacado</TableHead>
                  <TableHead className="text-right">Saldo Disponível</TableHead>
                  <TableHead className="text-center">Membro Desde</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {currentData.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center text-gray-500 py-8">
                      Nenhum recrutador encontrado
                    </TableCell>
                  </TableRow>
                ) : (
                  currentData.map((recruiter, index) => (
                    <TableRow
                      key={recruiter.id}
                      className={`
                        ${index === 0 ? "bg-yellow-50 border-yellow-200" : ""}
                        ${index === 1 ? "bg-gray-50 border-gray-200" : ""}
                        ${index === 2 ? "bg-orange-50 border-orange-200" : ""}
                      `}
                    >
                      <TableCell className="font-bold">
                        {index === 0 && <span className="text-yellow-600">🥇</span>}
                        {index === 1 && <span className="text-gray-500">🥈</span>}
                        {index === 2 && <span className="text-orange-600">🥉</span>}
                        {index > 2 && <span className="text-gray-400">{index + 1}º</span>}
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="font-medium">{recruiter.name}</span>
                          <span className="text-xs text-gray-500">{recruiter.email}</span>
                          {recruiter.phone && (
                            <span className="text-xs text-gray-400">{recruiter.phone}</span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge variant="outline" className="font-mono">
                          {recruiter.direct_referrals}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge className="bg-purple-500 font-mono">
                          {recruiter.total_network}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right font-semibold text-green-600">
                        {formatCurrency(recruiter.total_commissions)}
                      </TableCell>
                      <TableCell className="text-right font-medium text-blue-600">
                        {formatCurrency(recruiter.total_withdrawn)}
                      </TableCell>
                      <TableCell className="text-right font-medium text-orange-600">
                        {formatCurrency(recruiter.balance_withdrawn)}
                      </TableCell>
                      <TableCell className="text-center text-sm text-gray-600">
                        {formatDate(recruiter.created_at)}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

