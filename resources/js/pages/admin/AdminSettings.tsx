import { ArrowLeft, Save, Clock, DollarSign, TrendingUp, Settings as SettingsIcon, Loader2, AlertCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import api from "@/lib/api";

interface WithdrawSettings {
  window: {
    days: string[];
    start: string;
    end: string;
  };
  min_amount: number;
  fee_percent: number;
  daily_limit_per_user: number;
}

const DAYS_OF_WEEK = [
  { value: 'Mon', label: 'Segunda' },
  { value: 'Tue', label: 'Terça' },
  { value: 'Wed', label: 'Quarta' },
  { value: 'Thu', label: 'Quinta' },
  { value: 'Fri', label: 'Sexta' },
  { value: 'Sat', label: 'Sábado' },
  { value: 'Sun', label: 'Domingo' },
];

export default function AdminSettings() {
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  // Configurações de Saque
  const [withdrawSettings, setWithdrawSettings] = useState<WithdrawSettings>({
    window: {
      days: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'],
      start: '10:00',
      end: '17:00',
    },
    min_amount: 50,
    fee_percent: 0.10,
    daily_limit_per_user: 1,
  });

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      setLoading(true);
      const response = await api.get("/admin/settings/withdraw");
      setWithdrawSettings(response.data.data);
    } catch (error: any) {
      console.error("Erro ao carregar configurações:", error);
      toast({
        title: "Erro",
        description: error.response?.data?.error?.message || "Não foi possível carregar as configurações.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSaveWithdrawSettings = async () => {
    try {
      setSaving(true);
      
      await api.put("/admin/settings/withdraw", withdrawSettings);
      
      toast({
        title: "Sucesso!",
        description: "Configurações de saque atualizadas.",
      });
    } catch (error: any) {
      console.error("Erro ao salvar:", error);
      toast({
        title: "Erro",
        description: error.response?.data?.error?.message || "Não foi possível salvar as configurações.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const toggleDay = (day: string) => {
    setWithdrawSettings(prev => ({
      ...prev,
      window: {
        ...prev.window,
        days: prev.window.days.includes(day)
          ? prev.window.days.filter(d => d !== day)
          : [...prev.window.days, day]
      }
    }));
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin mx-auto text-primary" />
          <p className="mt-4 text-muted-foreground">Carregando configurações...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white p-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center gap-4 mb-4">
            <button onClick={() => navigate("/admin/users")} className="p-2 hover:bg-white/10 rounded-full">
              <ArrowLeft className="w-6 h-6" />
            </button>
            <div>
              <h1 className="text-3xl font-bold flex items-center gap-2">
                <SettingsIcon className="w-8 h-8" />
                Configurações do Sistema
              </h1>
              <p className="text-purple-100 mt-1">Gerencie todas as configurações da plataforma</p>
            </div>
          </div>
        </div>
      </div>

      <div className="p-6 max-w-7xl mx-auto">
        <Alert className="mb-6 bg-blue-50 border-blue-200">
          <AlertCircle className="h-4 w-4 text-blue-600" />
          <AlertDescription className="text-blue-800">
            <strong>Horário do Sistema:</strong> Todas as configurações de horário utilizam o fuso horário de <strong>Brasília (America/Sao_Paulo)</strong>.
          </AlertDescription>
        </Alert>

        <Tabs defaultValue="withdraw" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="withdraw">
              <DollarSign className="w-4 h-4 mr-2" />
              Saques
            </TabsTrigger>
            <TabsTrigger value="deposits">
              <TrendingUp className="w-4 h-4 mr-2" />
              Depósitos
            </TabsTrigger>
            <TabsTrigger value="general">
              <SettingsIcon className="w-4 h-4 mr-2" />
              Geral
            </TabsTrigger>
          </TabsList>

          {/* Configurações de Saque */}
          <TabsContent value="withdraw" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Janela de Horário para Saques</CardTitle>
                <CardDescription>
                  Configure os dias da semana e horários permitidos para solicitação de saques
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Dias da Semana */}
                <div>
                  <Label className="text-base font-semibold mb-3 block">
                    <Clock className="w-4 h-4 inline mr-2" />
                    Dias Permitidos
                  </Label>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {DAYS_OF_WEEK.map((day) => (
                      <div key={day.value} className="flex items-center space-x-2">
                        <Checkbox
                          id={day.value}
                          checked={withdrawSettings.window.days.includes(day.value)}
                          onCheckedChange={() => toggleDay(day.value)}
                        />
                        <Label htmlFor={day.value} className="cursor-pointer font-normal">
                          {day.label}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Horários */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="start_time">Horário de Início</Label>
                    <Input
                      id="start_time"
                      type="time"
                      value={withdrawSettings.window.start}
                      onChange={(e) => setWithdrawSettings(prev => ({
                        ...prev,
                        window: { ...prev.window, start: e.target.value }
                      }))}
                      className="mt-1"
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Horário de Brasília
                    </p>
                  </div>
                  <div>
                    <Label htmlFor="end_time">Horário de Término</Label>
                    <Input
                      id="end_time"
                      type="time"
                      value={withdrawSettings.window.end}
                      onChange={(e) => setWithdrawSettings(prev => ({
                        ...prev,
                        window: { ...prev.window, end: e.target.value }
                      }))}
                      className="mt-1"
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Horário de Brasília
                    </p>
                  </div>
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <p className="text-sm text-blue-800">
                    <strong>Preview:</strong> Saques permitidos de{' '}
                    <strong>{withdrawSettings.window.start}</strong> às{' '}
                    <strong>{withdrawSettings.window.end}</strong> nos seguintes dias:{' '}
                    <strong>
                      {withdrawSettings.window.days
                        .map(d => DAYS_OF_WEEK.find(day => day.value === d)?.label)
                        .join(', ')}
                    </strong>
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Valores e Limites</CardTitle>
                <CardDescription>
                  Configure valores mínimos, taxas e limites de saques
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="min_amount">Valor Mínimo de Saque (R$)</Label>
                    <Input
                      id="min_amount"
                      type="number"
                      min="0"
                      step="0.01"
                      value={withdrawSettings.min_amount}
                      onChange={(e) => setWithdrawSettings(prev => ({
                        ...prev,
                        min_amount: parseFloat(e.target.value) || 0
                      }))}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="fee_percent">Taxa de Saque (%)</Label>
                    <Input
                      id="fee_percent"
                      type="number"
                      min="0"
                      max="1"
                      step="0.01"
                      value={(withdrawSettings.fee_percent * 100).toFixed(0)}
                      onChange={(e) => setWithdrawSettings(prev => ({
                        ...prev,
                        fee_percent: parseFloat(e.target.value) / 100 || 0
                      }))}
                      className="mt-1"
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      {(withdrawSettings.fee_percent * 100).toFixed(0)}% de taxa sobre o valor
                    </p>
                  </div>
                </div>

                <div>
                  <Label htmlFor="daily_limit">Limite de Saques por Usuário/Dia</Label>
                  <Input
                    id="daily_limit"
                    type="number"
                    min="1"
                    value={withdrawSettings.daily_limit_per_user}
                    onChange={(e) => setWithdrawSettings(prev => ({
                      ...prev,
                      daily_limit_per_user: parseInt(e.target.value) || 1
                    }))}
                    className="mt-1 max-w-xs"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Número máximo de saques que um usuário pode solicitar por dia
                  </p>
                </div>

                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <p className="text-sm text-yellow-800">
                    <strong>Exemplo:</strong> Um saque de R$ 1.000,00 com taxa de {(withdrawSettings.fee_percent * 100).toFixed(0)}%
                    resultará em R$ {(1000 * (1 - withdrawSettings.fee_percent)).toFixed(2)} líquido para o usuário.
                  </p>
                </div>
              </CardContent>
            </Card>

            <div className="flex justify-end gap-3">
              <Button
                variant="outline"
                onClick={() => loadSettings()}
                disabled={saving}
              >
                Cancelar
              </Button>
              <Button
                onClick={handleSaveWithdrawSettings}
                disabled={saving}
              >
                {saving ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Salvando...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-2" />
                    Salvar Configurações
                  </>
                )}
              </Button>
            </div>
          </TabsContent>

          {/* Depósitos - TODO */}
          <TabsContent value="deposits">
            <Card>
              <CardContent className="p-8 text-center text-muted-foreground">
                <TrendingUp className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>Configurações de depósito em breve...</p>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Geral - TODO */}
          <TabsContent value="general">
            <Card>
              <CardContent className="p-8 text-center text-muted-foreground">
                <SettingsIcon className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>Configurações gerais em breve...</p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

