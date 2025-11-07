import { Users, ChevronRight, Loader2, CheckCircle2, XCircle } from "lucide-react";
import { Card } from "@/components/ui/card";
import { useState, useEffect } from "react";
import { networkAPI } from "@/lib/api";

const MembersList = () => {
  const [members, setMembers] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadMembers = async () => {
      try {
        setIsLoading(true);
        const response = await networkAPI.getTree();
        setMembers(response.data.data);
      } catch (error) {
        console.error("Failed to load members:", error);
      } finally {
        setIsLoading(false);
      }
    };

    loadMembers();
  }, []);

  if (isLoading) {
    return (
      <div className="px-4 py-12 text-center">
        <Loader2 className="w-8 h-8 animate-spin mx-auto text-primary mb-2" />
        <p className="text-sm text-muted-foreground">Carregando membros...</p>
      </div>
    );
  }

  if (members.length === 0) {
    return (
      <div className="px-4 py-12 text-center">
        <div className="flex justify-center mb-4">
          <Users className="w-16 h-16 text-muted-foreground/40" />
        </div>
        <h3 className="text-lg font-semibold text-foreground mb-2">Nenhum membro</h3>
        <p className="text-sm text-muted-foreground">Ainda não há membros neste nível</p>
      </div>
    );
  }

  const getLevelColor = (level: string) => {
    switch (level) {
      case "A": return "bg-yellow-100 text-yellow-700 border-yellow-300";
      case "B": return "bg-green-100 text-green-700 border-green-300";
      case "C": return "bg-red-100 text-red-700 border-red-300";
      default: return "bg-gray-100 text-gray-700 border-gray-300";
    }
  };

  const handleWhatsAppClick = (phone: string | null, name: string) => {
    if (!phone) {
      alert(`Telefone não cadastrado para ${name}`);
      return;
    }

    // Remover caracteres especiais e espaços do telefone
    const cleanPhone = phone.replace(/\D/g, '');
    
    // Verificar se tem o código do país (55 para Brasil)
    const phoneWithCountryCode = cleanPhone.startsWith('55') ? cleanPhone : `55${cleanPhone}`;
    
    // Abrir WhatsApp
    const whatsappUrl = `https://wa.me/${phoneWithCountryCode}`;
    window.open(whatsappUrl, '_blank');
  };

  return (
    <div className="px-4 space-y-3">
      <h2 className="text-sm font-semibold text-muted-foreground mb-3">Membros da Rede</h2>
      {members.map((member) => (
        <Card key={member.id} className="p-4 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2 flex-wrap">
                <h3 className="font-semibold text-foreground">{member.name}</h3>
                <span className={`text-xs px-2 py-0.5 rounded-full border ${getLevelColor(member.level_name)}`}>
                  Nível {member.level_name}
                </span>
                {/* Badge de Status: Sempre exibido */}
                <span className={`text-xs px-2 py-0.5 rounded-full border flex items-center gap-1 ${
                  member.is_active 
                    ? 'bg-green-100 text-green-700 border-green-300' 
                    : 'bg-red-100 text-red-700 border-red-300'
                }`}>
                  {member.is_active ? (
                    <>
                      <CheckCircle2 className="w-3 h-3" />
                      Ativo
                    </>
                  ) : (
                    <>
                      <XCircle className="w-3 h-3" />
                      Inativo
                    </>
                  )}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
                <div>
                  <p className="font-medium">Total Investido</p>
                  <p className="text-foreground font-semibold">R$ {(member.total_invested || 0).toFixed(2)}</p>
                </div>
                <div>
                  <p className="font-medium">Ganhos Totais</p>
                  <p className="text-green-600 font-semibold">R$ {(member.total_earned || 0).toFixed(2)}</p>
                </div>
              </div>
              <div className="mt-2 flex items-center gap-4 text-xs text-muted-foreground">
                <span>📧 {member.email}</span>
                <span>📅 {new Date(member.created_at).toLocaleDateString('pt-BR')}</span>
              </div>
            </div>
            <button
              onClick={() => handleWhatsAppClick(member.phone, member.name)}
              className="p-2 hover:bg-green-100 rounded-full transition-colors group"
              title="Abrir WhatsApp"
            >
              <ChevronRight className="w-5 h-5 text-green-600 group-hover:scale-110 transition-transform" />
            </button>
          </div>
        </Card>
      ))}
    </div>
  );
};

export default MembersList;
