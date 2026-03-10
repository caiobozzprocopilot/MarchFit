import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contextos/autenticacao';
import { consultasServico } from '../../servicos/api';
import { Calendar, Utensils, Dumbbell, TrendingUp, ChevronRight } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import type { Consulta } from '../../tipos';

export default function DashboardAluno() {
  const { usuario } = useAuth();
  const navigate = useNavigate();
  const alunoId = (usuario as any)?.id;

  const { data: consultas = [], isLoading: loadConsultas } = useQuery<Consulta[]>({
    queryKey: ['consultas', alunoId],
    queryFn: () => consultasServico.listar({ alunoId }).then((r) => r.data),
    enabled: !!alunoId,
  });

  const proximaConsulta = consultas
    .filter((c) => c.status === 'AGENDADA' && new Date(c.dataHora) > new Date())
    .sort((a, b) => new Date(a.dataHora).getTime() - new Date(b.dataHora).getTime())[0];

  const menus = [
    { label: 'Meu Plano Alimentar', rota: '/paciente/dieta',     icone: Utensils,   gradiente: 'from-emerald-500 to-teal-600',   sombra: 'shadow-emerald-500/20', desc: 'Veja suas refeições do dia'   },
    { label: 'Meus Treinos',        rota: '/paciente/treinos',   icone: Dumbbell,   gradiente: 'from-blue-500 to-indigo-600',    sombra: 'shadow-blue-500/20',    desc: 'Fichas de treino ativas'      },
    { label: 'Meu Progresso',       rota: '/paciente/progresso', icone: TrendingUp, gradiente: 'from-violet-500 to-purple-600',  sombra: 'shadow-violet-500/20',  desc: 'Evolução de peso e medidas'   },
    { label: 'Minhas Consultas',    rota: '/paciente/consultas', icone: Calendar,   gradiente: 'from-amber-500 to-orange-600',   sombra: 'shadow-amber-500/20',   desc: 'Histórico e agendamentos'     },
  ];

  const saudacao = () => {
    const h = new Date().getHours();
    if (h < 12) return 'Bom dia';
    if (h < 18) return 'Boa tarde';
    return 'Boa noite';
  };

  return (
    <div className="space-y-6">
      {/* Saudação */}
      <div>
        <h1 className="text-3xl font-black text-white">
          {saudacao()}, {(usuario as any)?.nome?.split(' ')[0] ?? 'Paciente'}!
        </h1>
        <p className="text-gray-500 text-sm mt-1 capitalize">
          {format(new Date(), "EEEE, dd 'de' MMMM", { locale: ptBR })}
        </p>
      </div>

      {/* Próxima consulta */}
      {proximaConsulta ? (
        <button
          type="button"
          onClick={() => navigate('/paciente/consultas')}
          className="w-full text-left bg-gradient-to-r from-emerald-500 to-teal-600 rounded-2xl p-5 text-white shadow-lg shadow-emerald-500/20 hover:from-emerald-400 hover:to-teal-500 transition-all"
        >
          <p className="text-xs font-semibold text-emerald-100 uppercase tracking-wider mb-1">Próxima consulta</p>
          <p className="text-xl font-bold">
            {format(parseISO(proximaConsulta.dataHora), "dd 'de' MMMM 'às' HH:mm", { locale: ptBR })}
          </p>
          {proximaConsulta.tipo && (
            <p className="text-sm text-emerald-100 mt-0.5">{proximaConsulta.tipo}</p>
          )}
        </button>
      ) : (
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5">
          <p className="text-sm text-gray-500">Nenhuma consulta agendada</p>
        </div>
      )}

      {/* Menu principal */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {menus.map((item) => {
          const Icone = item.icone;
          return (
            <button
              key={item.rota}
              type="button"
              onClick={() => navigate(item.rota)}
              className="bg-gray-900 border border-gray-800 hover:border-gray-700 hover:bg-gray-800 rounded-2xl p-5 text-left transition-all group flex items-center gap-4"
            >
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 bg-gradient-to-br ${item.gradiente} shadow-lg ${item.sombra}`}>
                <Icone className="w-5 h-5 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-white text-sm">{item.label}</p>
                <p className="text-xs text-gray-500 mt-0.5">{item.desc}</p>
              </div>
              <ChevronRight className="w-4 h-4 text-gray-600 group-hover:text-gray-400 flex-shrink-0 transition-colors" />
            </button>
          );
        })}
      </div>
    </div>
  );
}
