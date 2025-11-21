import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Users, TrendingDown, TrendingUp, Wallet, AlertCircle } from 'lucide-react';
import { AdminHeader } from '@/components/AdminHeader';
import api from '@/lib/api';
import { formatCurrency } from '@/lib/format';

interface DashboardStats {
  total_users: number;
  new_users_today: number;
  total_deposited: number;
  pending_deposits: number;
  total_withdrawn: number;
  pending_withdrawals: number;
  total_balance: number;
  total_invested: number;
}

interface RecentDeposit {
  id: number;
  user_name: string;
  amount: number;
  status: string;
  created_at: string;
}

const AdminDashboard: React.FC = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentDeposits, setRecentDeposits] = useState<RecentDeposit[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      console.log('🔄 Carregando dados do dashboard...');
      
      const [statsRes, depositsRes] = await Promise.all([
        api.get('/admin/dashboard/stats'),
        api.get('/admin/dashboard/recent-deposits'),
      ]);

      console.log('📊 Stats recebidas:', statsRes.data);
      console.log('💰 Depósitos recebidos:', depositsRes.data.data);

      setStats(statsRes.data);
      setRecentDeposits(depositsRes.data.data);
      
      console.log('✅ Dashboard carregado com sucesso!');
    } catch (error: any) {
      console.error('❌ Erro ao carregar dashboard:', error);
      console.error('Response:', error.response?.data);
      console.error('Status:', error.response?.status);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { label: string; className: string }> = {
      PENDING: { label: 'Pendente', className: 'bg-yellow-500 hover:bg-yellow-600' },
      PAID: { label: 'Confirmado', className: 'bg-green-500 hover:bg-green-600' },
      EXPIRED: { label: 'Expirado', className: 'bg-red-500 hover:bg-red-600' },
      CANCELLED: { label: 'Cancelado', className: 'bg-gray-500 hover:bg-gray-600' },
    };

    const config = statusConfig[status] || { label: status, className: 'bg-gray-500' };
    return (
      <Badge className={`${config.className} text-white`}>
        {config.label}
      </Badge>
    );
  };

  const censorName = (name: string) => {
    if (name.length <= 3) return '***';
    const visible = name.substring(0, 3);
    return visible + '•'.repeat(Math.min(name.length - 3, 15));
  };

  if (loading) {
    return (
      <>
        <AdminHeader title="Dashboard" subtitle="Visão geral do sistema" />
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
        </div>
      </>
    );
  }

  return (
    <>
      <AdminHeader title="Dashboard" subtitle="Visão geral do sistema em tempo real" />
      <div className="p-6 bg-gray-50 min-h-screen">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {/* Total de Usuários */}
        <Card className="relative overflow-hidden bg-gradient-to-br from-purple-500 to-purple-600 text-white shadow-lg hover:shadow-xl transition-shadow">
          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-white/20 rounded-full">
                <Users className="w-6 h-6" />
              </div>
            </div>
            <div>
              <p className="text-3xl font-bold mb-1">
                {stats?.total_users.toLocaleString('pt-BR') || '0'}
              </p>
              <p className="text-sm opacity-90 mb-2">Total de Usuários</p>
              <div className="flex items-center text-xs">
                <span className="opacity-75">
                  ✨ {stats?.new_users_today || 0} novos hoje
                </span>
              </div>
            </div>
          </div>
        </Card>

        {/* Total Depositado */}
        <Card className="relative overflow-hidden bg-gradient-to-br from-green-500 to-green-600 text-white shadow-lg hover:shadow-xl transition-shadow">
          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-white/20 rounded-full">
                <TrendingDown className="w-6 h-6" />
              </div>
            </div>
            <div>
              <p className="text-3xl font-bold mb-1">
                {formatCurrency(stats?.total_deposited || 0)}
              </p>
              <p className="text-sm opacity-90 mb-2">Total Depositado</p>
              <div className="flex items-center text-xs">
                <span className="opacity-75">
                  ⚠️ {stats?.pending_deposits || 0} pendentes
                </span>
              </div>
            </div>
          </div>
        </Card>

        {/* Total Sacado */}
        <Card className="relative overflow-hidden bg-gradient-to-br from-orange-500 to-orange-600 text-white shadow-lg hover:shadow-xl transition-shadow">
          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-white/20 rounded-full">
                <TrendingUp className="w-6 h-6" />
              </div>
            </div>
            <div>
              <p className="text-3xl font-bold mb-1">
                {formatCurrency(stats?.total_withdrawn || 0)}
              </p>
              <p className="text-sm opacity-90 mb-2">Total Sacado</p>
              <div className="flex items-center text-xs">
                <span className="opacity-75">
                  ⚠️ {stats?.pending_withdrawals || 0} pendentes
                </span>
              </div>
            </div>
          </div>
        </Card>

        {/* Saldo Total */}
        <Card className="relative overflow-hidden bg-gradient-to-br from-yellow-500 to-yellow-600 text-white shadow-lg hover:shadow-xl transition-shadow">
          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-white/20 rounded-full">
                <Wallet className="w-6 h-6" />
              </div>
            </div>
            <div>
              <p className="text-3xl font-bold mb-1">
                {formatCurrency(stats?.total_balance || 0)}
              </p>
              <p className="text-sm opacity-90 mb-2">Saldo Total</p>
              <div className="flex items-center text-xs">
                <span className="opacity-75">
                  💰 + {formatCurrency(stats?.total_invested || 0)} investidos
                </span>
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* Bottom Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Depósitos Recentes */}
        <Card className="lg:col-span-2 shadow-lg">
          <div className="bg-gradient-to-r from-purple-600 to-purple-700 p-4 text-white">
            <h3 className="text-lg font-semibold">📥 Depósitos Recentes</h3>
          </div>
          <div className="p-6">
            {recentDeposits.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                Nenhum depósito recente
              </div>
            ) : (
              <div className="space-y-3">
                {recentDeposits.map((deposit) => (
                  <div
                    key={deposit.id}
                    className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                  >
                    <div className="flex items-center gap-4 flex-1">
                      <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg flex items-center justify-center text-white font-bold">
                        {deposit.user_name.charAt(0).toUpperCase()}
                      </div>
                      <div className="flex-1">
                        <p className="font-medium text-gray-900">
                          {censorName(deposit.user_name)}
                        </p>
                        <p className="text-xs text-gray-500">
                          {new Date(deposit.created_at).toLocaleString('pt-BR')}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <p className="font-bold text-gray-900">
                          {formatCurrency(deposit.amount)}
                        </p>
                      </div>
                      <div>
                        {getStatusBadge(deposit.status)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </Card>

        {/* Ações Pendentes */}
        <Card className="shadow-lg">
          <div className="bg-gradient-to-r from-purple-600 to-purple-700 p-4 text-white">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <AlertCircle className="w-5 h-5" />
              Ações Pendentes
            </h3>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              {/* Depósitos Pendentes */}
              <div 
                onClick={() => navigate('/admin/deposits')}
                className="flex items-center justify-between p-4 bg-gradient-to-r from-blue-50 to-blue-100 rounded-lg hover:shadow-md transition-all hover:scale-[1.02] cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center text-white">
                    <TrendingDown className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">Depósitos Pendentes</p>
                    <p className="text-xs text-gray-600">Clique para visualizar</p>
                  </div>
                </div>
                <Badge className="bg-blue-500 hover:bg-blue-600 text-white text-lg px-4 py-2">
                  {stats?.pending_deposits || 0}
                </Badge>
              </div>

              {/* Saques Pendentes */}
              <div 
                onClick={() => navigate('/admin/withdrawals')}
                className="flex items-center justify-between p-4 bg-gradient-to-r from-orange-50 to-orange-100 rounded-lg hover:shadow-md transition-all hover:scale-[1.02] cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-orange-500 rounded-full flex items-center justify-center text-white">
                    <TrendingUp className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">Saques Pendentes</p>
                    <p className="text-xs text-gray-600">Clique para processar</p>
                  </div>
                </div>
                <Badge className="bg-orange-500 hover:bg-orange-600 text-white text-lg px-4 py-2">
                  {stats?.pending_withdrawals || 0}
                </Badge>
              </div>

              {/* Usuários Novos Hoje */}
              <div 
                onClick={() => navigate('/admin/users')}
                className="flex items-center justify-between p-4 bg-gradient-to-r from-green-50 to-green-100 rounded-lg hover:shadow-md transition-all hover:scale-[1.02] cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center text-white">
                    <Users className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">Novos Usuários</p>
                    <p className="text-xs text-gray-600">Clique para gerenciar</p>
                  </div>
                </div>
                <Badge className="bg-green-500 hover:bg-green-600 text-white text-lg px-4 py-2">
                  {stats?.new_users_today || 0}
                </Badge>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
    </>
  );
};

export default AdminDashboard;

