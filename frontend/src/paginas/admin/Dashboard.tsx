import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { nutricionistaServico } from '../../servicos/api';
import { Users, UserCheck, Calendar, TrendingUp, ArrowRight, Loader2, Apple, Dumbbell, ChefHat, FlaskConical, AlertTriangle, Clock } from 'lucide-react';
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
    { label: 'Total de Pacientes', valor: dashboard?.totalAlunos ?? 0,               icone: Users,         fundo: 'bg-blue-950/60 border-blue-900/50',        cor: 'text-blue-400',    iconeFundo: 'bg-blue-900/50',    rota: '/admin/pacientes' },
    { label: 'Pacientes Ativos',   valor: dashboard?.alunosAtivos ?? 0,              icone: UserCheck,     fundo: 'bg-teal-950/60 border-teal-900/50',        cor: 'text-teal-400',    iconeFundo: 'bg-teal-900/50',    rota: '/admin/pacientes' },
    { label: 'Consultas Hoje',     valor: dashboard?.consultasHoje ?? 0,             icone: Calendar,      fundo: 'bg-indigo-950/60 border-indigo-900/50',    cor: 'text-indigo-400',  iconeFundo: 'bg-indigo-900/50',  rota: '/admin/consultas' },
    { label: 'Próximas 7 dias',    valor: dashboard?.proximasConsultas?.length ?? 0, icone: TrendingUp,    fundo: 'bg-slate-800/60 border-slate-700/50',      cor: 'text-slate-400',   iconeFundo: 'bg-slate-700/50',   rota: '/admin/consultas' },
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
                  className={`${card.fundo} border p-5 rounded-2xl hover:brightness-110 transition-all duration-200 text-left`}
                >
                  <div className={`inline-flex p-2.5 rounded-xl ${card.iconeFundo} mb-3`}>
                    <Icone className={`w-5 h-5 ${card.cor}`} />
                  </div>
                  <p className="text-3xl font-black text-white">{card.valor}</p>
                  <p className={`font-display uppercase tracking-wider text-xs mt-0.5 ${card.cor} opacity-80`}>{card.label}</p>
                </button>
              );
            })}
          </div>

          {/* Cards de alertas */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <button
              onClick={() => navigate('/admin/pacientes')}
              className="bg-amber-950/40 border border-amber-900/40 p-5 rounded-2xl hover:brightness-110 transition-all duration-200 text-left flex items-center gap-4"
            >
              <div className="inline-flex p-3 rounded-xl bg-amber-900/40 flex-shrink-0">
                <Clock className="w-5 h-5 text-amber-400" />
              </div>
              <div>
                <p className="text-3xl font-black text-white">{dashboard?.expirando ?? 0}</p>
                <p className="font-display uppercase tracking-wider text-xs mt-0.5 text-amber-400 opacity-80">Expirando em 30 dias</p>
              </div>
            </button>
            <button
              onClick={() => navigate('/admin/pacientes')}
              className="bg-red-950/40 border border-red-900/40 p-5 rounded-2xl hover:brightness-110 transition-all duration-200 text-left flex items-center gap-4"
            >
              <div className="inline-flex p-3 rounded-xl bg-red-900/40 flex-shrink-0">
                <AlertTriangle className="w-5 h-5 text-red-400" />
              </div>
              <div>
                <p className="text-3xl font-black text-white">{dashboard?.expirados ?? 0}</p>
                <p className="font-display uppercase tracking-wider text-xs mt-0.5 text-red-400 opacity-80">Planos Expirados</p>
              </div>
            </button>
          </div>

          {/* Distribuição de pacientes */}
          {dashboard && (
            <div className="bg-gray-900 rounded-2xl border border-gray-800 p-6">
              <h2 className="font-display uppercase tracking-wider text-white mb-5 flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-emerald-400" /> Distribuição de Pacientes
              </h2>
              <div className="space-y-3">
                {[
                  { label: 'Ativos e em dia',  count: Math.max(0, (dashboard.alunosAtivos ?? 0) - (dashboard.expirando ?? 0)), cor: 'bg-emerald-500', textCor: 'text-emerald-400' },
                  { label: 'Expirando (30d)',   count: dashboard.expirando ?? 0,                                                cor: 'bg-amber-500',  textCor: 'text-amber-400'  },
                  { label: 'Plano expirado',    count: dashboard.expirados ?? 0,                                                cor: 'bg-red-500',    textCor: 'text-red-400'    },
                  { label: 'Inativos',          count: Math.max(0, (dashboard.totalAlunos ?? 0) - (dashboard.alunosAtivos ?? 0)), cor: 'bg-gray-600', textCor: 'text-gray-500'  },
                ].map(({ label, count, cor, textCor }) => (
                  <div key={label}>
                    <div className="flex justify-between text-xs mb-1.5">
                      <span className="text-gray-400">{label}</span>
                      <span className={`font-bold ${textCor}`}>{count}</span>
                    </div>
                    <div className="w-full bg-gray-800 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full ${cor} transition-all duration-700`}
                        style={{ width: (dashboard.totalAlunos ?? 0) > 0 ? `${Math.round((count / dashboard.totalAlunos) * 100)}%` : '0%' }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Próximas consultas */}
          <div className="bg-gray-900 rounded-2xl border border-gray-800 p-6">
            <div className="flex items-center justify-between mb-5">
              <h2 className="font-display uppercase tracking-wider text-white">Próximas Consultas</h2>
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
            <h2 className="font-display uppercase tracking-wider text-white mb-4">Acesso Rápido</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {[
                { label: 'Gerenciar Pacientes', rota: '/admin/pacientes',  icone: Users,        fundo: 'bg-blue-950/50 border-blue-900/40',     cor: 'text-blue-400'   },
                { label: 'Banco de Alimentos',  rota: '/admin/alimentos', icone: Apple,        fundo: 'bg-teal-950/50 border-teal-900/40',     cor: 'text-teal-400'   },
                { label: 'Banco de Exercícios', rota: '/admin/exercicios',icone: Dumbbell,     fundo: 'bg-cyan-950/50 border-cyan-900/40',     cor: 'text-cyan-400'   },
                { label: 'Receitas',            rota: '/admin/receitas',  icone: ChefHat,      fundo: 'bg-indigo-950/50 border-indigo-900/40', cor: 'text-indigo-400' },
                { label: 'Consultas',           rota: '/admin/consultas', icone: Calendar,     fundo: 'bg-slate-800/50 border-slate-700/40',   cor: 'text-slate-400'  },
                { label: 'Fórmulas',            rota: '/admin/formulas',  icone: FlaskConical, fundo: 'bg-violet-950/50 border-violet-900/40', cor: 'text-violet-400' },
              ].map((item) => (
                <button
                  key={item.rota}
                  onClick={() => navigate(item.rota)}
                  className={`${item.fundo} border rounded-2xl p-4 text-left hover:brightness-110 transition-all duration-200 group`}
                >
                  <item.icone className={`w-5 h-5 ${item.cor} mb-3`} />
                  <p className={`font-display uppercase tracking-wider text-xs ${item.cor} opacity-80 group-hover:opacity-100 transition-opacity`}>{item.label}</p>
                </button>
              ))}
            </div>
          </div>

        </>
      )}
    </div>
  );
}
