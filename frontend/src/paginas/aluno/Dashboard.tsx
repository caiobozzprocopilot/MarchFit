import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contextos/autenticacao';
import { consultasServico, progressoServico, alunosServico } from '../../servicos/api';
import { Calendar, Utensils, Dumbbell, TrendingUp, ChevronRight, Scale, CheckCircle, AlertTriangle, Droplets } from 'lucide-react';
import { format, parseISO, differenceInDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import type { Consulta, RegistroProgresso } from '../../tipos';

export default function DashboardAluno() {
  const { usuario } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const alunoId = (usuario as any)?.id;

  const [pesoInput, setPesoInput] = useState('');
  const [pesoSalvo, setPesoSalvo] = useState(false);

  const { data: consultas = [], isLoading: loadConsultas } = useQuery<Consulta[]>({
    queryKey: ['consultas', alunoId],
    queryFn: () => consultasServico.listar({ alunoId }).then((r) => r.data),
    enabled: !!alunoId,
  });

  const { data: progressos = [] } = useQuery<RegistroProgresso[]>({
    queryKey: ['progresso', alunoId],
    queryFn: () => progressoServico.listar(alunoId!).then((r) => r.data),
    enabled: !!alunoId,
  });

  const historicoPeso = progressos
    .filter((p) => p.peso != null)
    .sort((a, b) => new Date(b.registradoEm).getTime() - new Date(a.registradoEm).getTime())
    .slice(0, 5);

  const ultimoPeso = historicoPeso[0];

  const mutPeso = useMutation({
    mutationFn: (peso: number) =>
      progressoServico.criar(alunoId!, { peso, registradoEm: new Date().toISOString() }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['progresso', alunoId] });
      setPesoInput('');
      setPesoSalvo(true);
      setTimeout(() => setPesoSalvo(false), 3000);
    },
  });

  const proximaConsulta = consultas
    .filter((c) => c.status === 'AGENDADA' && new Date(c.dataHora) > new Date())
    .sort((a, b) => new Date(a.dataHora).getTime() - new Date(b.dataHora).getTime())[0];

  const { data: alunoData } = useQuery({
    queryKey: ['aluno-dados', alunoId],
    queryFn: () => alunosServico.buscar(alunoId!).then((r) => r.data),
    enabled: !!alunoId,
  });
  const dataExpiracao = (alunoData as any)?.dataExpiracao as string | undefined;

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
          <p className="font-display uppercase tracking-wider text-xs text-emerald-100 mb-1">Próxima consulta</p>
          <p className="text-xl font-bold">
            {format(parseISO(proximaConsulta.dataHora), "dd 'de' MMMM 'às' HH:mm", { locale: ptBR })}
          </p>
          {proximaConsulta.tipo && (
            <p className="text-sm text-emerald-100 mt-0.5">{proximaConsulta.tipo}</p>
          )}
          {(() => {
            const dias = differenceInDays(parseISO(proximaConsulta.dataHora), new Date());
            if (dias > 1) return null;
            return (
              <span className={`inline-block mt-2 text-xs font-bold py-0.5 px-2.5 rounded-full ${
                dias <= 0 ? 'bg-red-500/40 text-red-100' : 'bg-amber-500/40 text-amber-100'
              }`}>
                {dias <= 0 ? '⏰ Hoje!' : '⏰ Amanhã'}
              </span>
            );
          })()}
        </button>
      ) : (
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5">
          <p className="text-sm text-gray-500">Nenhuma consulta agendada</p>
        </div>
      )}

      {/* Registro rápido de peso */}
      <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-8 h-8 rounded-lg bg-violet-500/15 flex items-center justify-center flex-shrink-0">
            <Scale className="w-4 h-4 text-violet-400" />
          </div>
          <div>
            <p className="font-display uppercase tracking-wider text-xs text-gray-400">Peso de hoje</p>
            {ultimoPeso && (
              <p className="text-xs text-gray-600">
                Último: <span className="text-gray-400 font-semibold">{ultimoPeso.peso} kg</span>
                {' '}em {format(parseISO(ultimoPeso.registradoEm), 'dd/MM', { locale: ptBR })}
              </p>
            )}
          </div>
        </div>
        {pesoSalvo ? (
          <div className="flex items-center gap-2 justify-center py-2 text-emerald-400">
            <CheckCircle className="w-4 h-4" />
            <span className="text-sm font-semibold">Peso registrado!</span>
          </div>
        ) : (
          <div className="flex gap-2">
            <input
              type="number"
              step="0.1"
              min="30"
              max="300"
              value={pesoInput}
              onChange={(e) => setPesoInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && pesoInput && !mutPeso.isPending) {
                  mutPeso.mutate(parseFloat(pesoInput));
                }
              }}
              placeholder="ex: 72.5"
              className="flex-1 bg-gray-800 border border-gray-700 rounded-xl py-2.5 px-3 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500/40 transition-all"
            />
            <button
              onClick={() => { if (pesoInput) mutPeso.mutate(parseFloat(pesoInput)); }}
              disabled={!pesoInput || mutPeso.isPending}
              className="px-4 py-2.5 bg-violet-500 hover:bg-violet-400 disabled:opacity-50 text-white rounded-xl text-sm font-bold transition-colors"
            >
              {mutPeso.isPending ? '…' : 'Salvar'}
            </button>
          </div>
        )}
        {/* Histórico de peso */}
        {historicoPeso.length > 1 && (
          <div className="mt-3 pt-3 border-t border-gray-800 space-y-1.5">
            {historicoPeso.map((r) => (
              <div key={r.id ?? r.registradoEm} className="flex items-center justify-between">
                <span className="text-xs text-gray-600">{format(parseISO(r.registradoEm), "dd/MM/yy", { locale: ptBR })}</span>
                <span className="text-xs font-semibold text-gray-400">{r.peso} kg</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Aviso de expiração do plano */}
      {dataExpiracao && (() => {
        const dias = differenceInDays(new Date(dataExpiracao), new Date());
        if (dias > 30) return null;
        return (
          <div className={`rounded-2xl border px-5 py-4 flex items-center gap-3 ${dias < 0 ? 'bg-red-500/10 border-red-500/30' : 'bg-amber-500/10 border-amber-500/30'}`}>
            <AlertTriangle className={`w-5 h-5 flex-shrink-0 ${dias < 0 ? 'text-red-400' : 'text-amber-400'}`} />
            <div>
              <p className="text-sm font-bold text-white">
                {dias < 0 ? 'Plano expirado' : `Plano expira em ${dias} dia${dias !== 1 ? 's' : ''}`}
              </p>
              <p className="text-xs text-gray-500">
                {dias < 0
                  ? 'Entre em contato com seu nutricionista'
                  : `Válido até ${format(new Date(dataExpiracao), 'dd/MM/yyyy')}`}
              </p>
            </div>
          </div>
        );
      })()}

      {/* Meta de água */}
      {(alunoData as any)?.metaAgua > 0 && (
        <div className="bg-blue-500/10 border border-blue-500/20 rounded-2xl px-5 py-3 flex items-center gap-3">
          <Droplets className="w-4 h-4 text-blue-400 flex-shrink-0" />
          <p className="text-sm text-blue-300">
            Beba pelo menos{' '}
            <span className="font-bold">{(alunoData as any).metaAgua >= 1000
              ? `${((alunoData as any).metaAgua / 1000).toFixed(1)}L`
              : `${(alunoData as any).metaAgua}ml`}
            </span>{' '}
            de água hoje
          </p>
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
                <p className="font-display uppercase tracking-wider text-sm text-white">{item.label}</p>
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
