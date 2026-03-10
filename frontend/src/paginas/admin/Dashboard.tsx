import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { nutricionistaServico } from '../../servicos/api';
import { Users, UserCheck, Calendar, TrendingUp, ArrowRight, Loader2, Apple, Dumbbell, ChefHat, FlaskConical } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useAuth } from '../../contextos/autenticacao';
import { useMemo } from 'react';

export default function DashboardAdmin() {
  const navigate = useNavigate();
  const { usuario } = useAuth();

  const primeiroNome = useMemo(() => usuario?.nome?.split(' ')[0] ?? 'Nutricionista', [usuario]);

  const saudacao = useMemo(() => {
    const hora = new Date().getHours();
    if (hora < 12) return 'Bom dia';
    if (hora < 18) return 'Boa tarde';
    return 'Boa noite';
  }, []);

  const bemVindo = useMemo(() => {
    const chave = 'nutri_visited';
    const jaVisitou = localStorage.getItem(chave);
    localStorage.setItem(chave, '1');
    return jaVisitou ? 'Bem-vindo de volta' : 'Bem-vindo';
  }, []);

  const { data: dashboard, isLoading } = useQuery({
    queryKey: ['dashboard-admin'],
    queryFn: () => nutricionistaServico.dashboard().then((r) => r.data),
  });

  const cards = [
    { label: 'Total de Pacientes',    valor: dashboard?.totalAlunos ?? 0,               icone: Users,     gradiente: 'from-blue-500 to-indigo-600',  sombra: 'shadow-blue-500/20',   rota: '/admin/pacientes'   },
    { label: 'Pacientes Ativos',      valor: dashboard?.alunosAtivos ?? 0,              icone: UserCheck,  gradiente: 'from-emerald-500 to-teal-600', sombra: 'shadow-emerald-500/20', rota: '/admin/pacientes'   },
    { label: 'Consultas Hoje',     valor: dashboard?.consultasHoje ?? 0,             icone: Calendar,   gradiente: 'from-amber-500 to-orange-600', sombra: 'shadow-amber-500/20',  rota: '/admin/consultas'},
    { label: 'Próximas 7 dias',    valor: dashboard?.proximasConsultas?.length ?? 0, icone: TrendingUp, gradiente: 'from-violet-500 to-purple-600',sombra: 'shadow-violet-500/20', rota: '/admin/consultas'},
  ];

  return (
    <div className="space-y-8 max-w-7xl">
      <div>
        <h1 className="text-3xl font-black text-white">{saudacao}, {primeiroNome}!</h1>
        <p className="text-sm font-medium text-emerald-400 mt-1">{bemVindo}!</p>
        <p className="text-gray-500 text-sm mt-1">
          {'Aqui está o resumo de hoje \u2014 '}
          <span className="text-gray-400 capitalize">
            {format(new Date(), "EEEE, dd 'de' MMMM", { locale: ptBR })}
          </span>
        </p>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center h-40">
          <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
        </div>
      ) : (
        <>
          {/* Cards de resumo */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {cards.map((card) => {
              const Icone = card.icone;
              return (
                <button
                  key={card.label}
                  onClick={() => navigate(card.rota)}
                  className={`relative overflow-hidden bg-gradient-to-br ${card.gradiente} p-5 rounded-2xl shadow-lg ${card.sombra} hover:scale-[1.02] transition-all duration-200 text-left group`}
                >
                  <div className="absolute -top-4 -right-4 w-24 h-24 bg-white/10 rounded-full" />
                  <div className="absolute bottom-0 right-2 w-16 h-16 bg-white/5 rounded-full" />
                  <div className="relative">
                    <div className="inline-flex p-2.5 rounded-xl bg-white/20 mb-3">
                      <Icone className="w-5 h-5 text-white" />
                    </div>
                    <p className="text-3xl font-black text-white">{card.valor}</p>
                    <p className="text-sm text-white/70 mt-0.5 font-medium">{card.label}</p>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Próximas consultas */}
          <div className="bg-gray-900 rounded-2xl border border-gray-800 p-6">
            <div className="flex items-center justify-between mb-5">
              <h2 className="font-bold text-white">Próximas Consultas</h2>
              <button
                onClick={() => navigate('/admin/consultas')}
                className="text-sm text-emerald-400 hover:text-emerald-300 flex items-center gap-1.5 transition-colors"
              >
                Ver todas <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {!dashboard?.proximasConsultas?.length ? (
              <p className="text-gray-600 text-sm py-6 text-center">Nenhuma consulta agendada</p>
            ) : (
              <div className="divide-y divide-gray-800">
                {dashboard.proximasConsultas.map((c: any) => (
                  <div key={c.id} className="py-3.5 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center flex-shrink-0">
                        <span className="text-white font-bold text-xs">{c.aluno?.nome?.[0] ?? '?'}</span>
                      </div>
                      <div>
                        <p className="font-semibold text-white text-sm">{c.aluno?.nome}</p>
                        <p className="text-xs text-gray-500">{c.tipo ?? 'Consulta'}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-gray-300">
                        {format(parseISO(c.dataHora), "dd MMM 'às' HH:mm", { locale: ptBR })}
                      </p>
                      <span className={`inline-block mt-1 px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                        c.status === 'AGENDADA'  ? 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
                        : c.status === 'REALIZADA' ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                        : 'bg-red-500/15 text-red-400 border border-red-500/30'
                      }`}>
                        {c.status ? c.status.charAt(0) + c.status.slice(1).toLowerCase() : 'Agendada'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Atalhos */}
          <div>
            <h2 className="font-bold text-white mb-4">Acesso Rápido</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {[
                { label: 'Gerenciar Pacientes', rota: '/admin/pacientes',     icone: Users,         cor: 'text-blue-400',    fundo: 'bg-blue-500/10 border-blue-500/20'    },
                { label: 'Banco de Alimentos',  rota: '/admin/alimentos',  icone: Apple,         cor: 'text-emerald-400', fundo: 'bg-emerald-500/10 border-emerald-500/20'},
                { label: 'Banco de Exercícios', rota: '/admin/exercicios', icone: Dumbbell,      cor: 'text-orange-400',  fundo: 'bg-orange-500/10 border-orange-500/20'  },
                { label: 'Receitas',            rota: '/admin/receitas',   icone: ChefHat,       cor: 'text-pink-400',    fundo: 'bg-pink-500/10 border-pink-500/20'      },
                { label: 'Consultas',           rota: '/admin/consultas',  icone: Calendar,      cor: 'text-amber-400',   fundo: 'bg-amber-500/10 border-amber-500/20'    },
                { label: 'Fórmulas',            rota: '/admin/formulas',   icone: FlaskConical,  cor: 'text-violet-400',  fundo: 'bg-violet-500/10 border-violet-500/20'  },
              ].map((item) => (
                <button
                  key={item.rota}
                  onClick={() => navigate(item.rota)}
                  className={`${item.fundo} border rounded-2xl p-4 text-left hover:scale-[1.02] transition-all duration-200 group`}
                >
                  <item.icone className={`w-6 h-6 ${item.cor} mb-3`} />
                  <p className="font-semibold text-gray-300 text-sm group-hover:text-white transition-colors">{item.label}</p>
                </button>
              ))}
            </div>
          </div>

        </>
      )}
    </div>
  );
}
