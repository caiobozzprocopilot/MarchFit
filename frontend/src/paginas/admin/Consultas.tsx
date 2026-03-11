import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { consultasServico, alunosServico } from '../../servicos/api';
import {
  Plus, X, Loader2, ChevronLeft, ChevronRight,
  CheckCircle2, XCircle, Clock, CalendarDays, Sparkles,
} from 'lucide-react';
import {
  format, parseISO, startOfMonth, endOfMonth,
  addMonths, subMonths, getDaysInMonth,
  getDay, isSameDay, isToday, startOfYear, endOfYear,
} from 'date-fns';
import { ptBR } from 'date-fns/locale';
import type { Consulta, Aluno } from '../../tipos';

/* â”€â”€ Feriados nacionais Brasil 2026 â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
const FERIADOS_2026: Record<string, string> = {
  '2026-01-01': 'Confraternização Universal',
  '2026-02-16': 'Carnaval',
  '2026-02-17': 'Carnaval',
  '2026-04-03': 'Sexta-feira Santa',
  '2026-04-21': 'Tiradentes',
  '2026-05-01': 'Dia do Trabalho',
  '2026-06-04': 'Corpus Christi',
  '2026-09-07': 'Independência do Brasil',
  '2026-10-12': 'Nossa Senhora Aparecida',
  '2026-11-02': 'Finados',
  '2026-11-15': 'Proclamação da República',
  '2026-12-25': 'Natal',
};

const DIAS_SEMANA = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'S\u00e1b'];

const inputCls = 'w-full bg-gray-800 border border-gray-700 rounded-xl py-2.5 px-3 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/40 transition-all';
const labelCls = 'block text-xs font-display text-gray-400 uppercase tracking-wider mb-1.5';

const STATUS_COR: Record<string, string> = {
  AGENDADA:  'bg-amber-500/10 text-amber-400 border-amber-500/30',
  REALIZADA: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
  CANCELADA: 'bg-red-500/10 text-red-400 border-red-500/30',
};
const STATUS_DOT: Record<string, string> = {
  AGENDADA:  'bg-amber-400',
  REALIZADA: 'bg-emerald-400',
  CANCELADA: 'bg-red-400',
};

export default function Consultas() {
  const queryClient = useQueryClient();
  const [mesAtual, setMesAtual] = useState(new Date());
  const [diaSelecionado, setDiaSelecionado] = useState<Date | null>(new Date());
  const [mostrarModal, setMostrarModal] = useState(false);
  const [form, setForm] = useState({ alunoId: '', dataHora: '', tipo: '', observacoes: '' });

  /* Busca o ano inteiro para mostrar no calendÃ¡rio */
  const inicio = format(startOfYear(mesAtual), "yyyy-MM-dd'T'HH:mm:ss");
  const fim    = format(endOfYear(mesAtual),   "yyyy-MM-dd'T'HH:mm:ss");

  const { data: consultas = [], isLoading } = useQuery<Consulta[]>({
    queryKey: ['consultas-todas', mesAtual.getFullYear()],
    queryFn: () => consultasServico.listar({ inicio, fim }).then((r) => r.data),
  });

  const { data: alunos = [] } = useQuery<Aluno[]>({
    queryKey: ['alunos'],
    queryFn: () => alunosServico.listar().then((r) => r.data),
  });

  const mutCriar = useMutation({
    mutationFn: (d: any) => consultasServico.criar(d),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['consultas-todas'] });
      setMostrarModal(false);
      setForm({ alunoId: '', dataHora: '', tipo: '', observacoes: '' });
    },
  });

  const mutStatus = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      consultasServico.atualizar(id, { status }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['consultas-todas'] }),
  });

  /* Mapeia dia â†’ consultas */
  const consultasPorDia = useMemo(() => {
    const map: Record<string, Consulta[]> = {};
    for (const c of consultas) {
      const key = c.dataHora?.slice(0, 10);
      if (key) { map[key] = map[key] ?? []; map[key].push(c); }
    }
    return map;
  }, [consultas]);

  /* Dias do calendÃ¡rio atual */
  const diasDoMes = useMemo(() => {
    const total = getDaysInMonth(mesAtual);
    const primeiroDia = getDay(startOfMonth(mesAtual)); // 0=dom
    const dias: (Date | null)[] = Array(primeiroDia).fill(null);
    for (let d = 1; d <= total; d++) {
      dias.push(new Date(mesAtual.getFullYear(), mesAtual.getMonth(), d));
    }
    // preenche até múltiplo de 7
    while (dias.length % 7 !== 0) dias.push(null);
    return dias;
  }, [mesAtual]);

  const consultasDoDia = diaSelecionado
    ? (consultasPorDia[format(diaSelecionado, 'yyyy-MM-dd')] ?? [])
    : [];

  const feriadoDoDia = diaSelecionado
    ? FERIADOS_2026[format(diaSelecionado, 'yyyy-MM-dd')]
    : undefined;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-white">Consultas</h1>
          <p className="text-gray-500 text-sm mt-0.5">
            {format(mesAtual, "MMMM 'de' yyyy", { locale: ptBR })}
          </p>
        </div>
        <button
          onClick={() => setMostrarModal(true)}
          className="flex items-center gap-2 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-white px-4 py-2.5 rounded-xl text-sm font-bold shadow-lg shadow-emerald-500/20 transition-all"
        >
          <Plus className="w-4 h-4" /> Agendar
        </button>
      </div>

      {/* Layout: calendÃ¡rio + painel lateral */}
      <div className="flex flex-col xl:flex-row gap-5">

        {/* â”€â”€ CalendÃ¡rio â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
        <div className="relative flex-1 bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden">
          <div className="absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r from-emerald-500 to-teal-500" />

          {/* Cabeçalho do mês */}
          <div className="flex items-center justify-between px-6 pt-5 pb-4">
            <button
              onClick={() => setMesAtual((m) => subMonths(m, 1))}
              className="p-2 rounded-xl text-gray-400 hover:text-white hover:bg-gray-800 transition-colors"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <h2 className="text-base font-display uppercase tracking-wider text-white capitalize">
              {format(mesAtual, "MMMM yyyy", { locale: ptBR })}
            </h2>
            <button
              onClick={() => setMesAtual((m) => addMonths(m, 1))}
              className="p-2 rounded-xl text-gray-400 hover:text-white hover:bg-gray-800 transition-colors"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>

          {/* Dias da semana */}
          <div className="grid grid-cols-7 px-4 mb-1">
            {DIAS_SEMANA.map((d) => (
              <div key={d} className="text-center text-xs font-display text-gray-600 py-1.5 uppercase tracking-wider">
                {d}
              </div>
            ))}
          </div>

          {/* Grid de dias */}
          <div className="grid grid-cols-7 gap-0.5 px-4 pb-5">
            {isLoading
              ? Array(35).fill(null).map((_, i) => (
                  <div key={i} className="h-14 rounded-xl bg-gray-800/30 animate-pulse" />
                ))
              : diasDoMes.map((dia, i) => {
                  if (!dia) return <div key={i} />;
                  const key = format(dia, 'yyyy-MM-dd');
                  const consultas_dia = consultasPorDia[key] ?? [];
                  const feriado = FERIADOS_2026[key];
                  const ehHoje = isToday(dia);
                  const ehSelecionado = diaSelecionado ? isSameDay(dia, diaSelecionado) : false;
                  const ehDomingo = dia.getDay() === 0;
                  const ehSabado = dia.getDay() === 6;

                  return (
                    <button
                      key={key}
                      onClick={() => setDiaSelecionado(dia)}
                      className={`
                        relative flex flex-col items-center justify-start pt-2 pb-1.5 min-h-[4rem] rounded-xl
                        transition-all duration-150 group
                        ${ehSelecionado
                          ? 'bg-gradient-to-br from-emerald-500/30 to-teal-500/20 border border-emerald-500/50 shadow-lg shadow-emerald-500/10'
                          : feriado
                          ? 'bg-pink-500/5 border border-pink-500/20 hover:bg-pink-500/10'
                          : 'hover:bg-gray-800/80 border border-transparent hover:border-gray-700'}
                      `}
                    >
                      <span className={`
                        text-sm font-bold w-7 h-7 flex items-center justify-center rounded-full transition-all
                        ${ehHoje
                          ? 'bg-gradient-to-br from-emerald-500 to-teal-500 text-white shadow-md shadow-emerald-500/40'
                          : ehSelecionado
                          ? 'text-emerald-400'
                          : feriado
                          ? 'text-pink-400'
                          : ehDomingo || ehSabado
                          ? 'text-gray-500'
                          : 'text-gray-300 group-hover:text-white'}
                      `}>
                        {dia.getDate()}
                      </span>

                      {/* Dots de consultas */}
                      {consultas_dia.length > 0 && (
                        <div className="flex gap-0.5 mt-1 flex-wrap justify-center max-w-[40px]">
                          {consultas_dia.slice(0, 3).map((c, idx) => (
                            <span
                              key={idx}
                              className={`w-1.5 h-1.5 rounded-full ${STATUS_DOT[c.status] ?? 'bg-gray-500'}`}
                            />
                          ))}
                          {consultas_dia.length > 3 && (
                            <span className="text-[9px] text-gray-500 leading-none">+{consultas_dia.length - 3}</span>
                          )}
                        </div>
                      )}

                      {/* Indicador de feriado */}
                      {feriado && (
                        <span className="absolute bottom-0.5 right-1 text-[8px] text-pink-400 font-bold leading-none">
                          fer
                        </span>
                      )}
                    </button>
                  );
                })}
          </div>

          {/* Legenda */}
          <div className="flex flex-wrap gap-4 px-6 pb-4 border-t border-gray-800 pt-3">
            <div className="flex items-center gap-1.5 text-xs text-gray-500">
              <span className="w-2 h-2 rounded-full bg-amber-400" /> Agendada
            </div>
            <div className="flex items-center gap-1.5 text-xs text-gray-500">
              <span className="w-2 h-2 rounded-full bg-emerald-400" /> Realizada
            </div>
            <div className="flex items-center gap-1.5 text-xs text-gray-500">
              <span className="w-2 h-2 rounded-full bg-red-400" /> Cancelada
            </div>
            <div className="flex items-center gap-1.5 text-xs text-gray-500">
              <span className="w-2 h-2 rounded-full bg-pink-400" /> Feriado
            </div>
          </div>
        </div>

        {/* â”€â”€ Painel lateral: dia selecionado â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
        <div className="xl:w-80 bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden flex flex-col">
          <div className="px-5 pt-5 pb-3 border-b border-gray-800">
            <div className="flex items-center gap-2">
              <CalendarDays className="w-4 h-4 text-emerald-400" />
              <h3 className="font-display tracking-wide text-white text-sm">
                {diaSelecionado
                  ? format(diaSelecionado, "EEEE, dd 'de' MMMM", { locale: ptBR })
                  : 'Selecione um dia'}
              </h3>
            </div>
            {feriadoDoDia && (
              <p className="mt-1.5 flex items-center gap-1.5 text-xs text-pink-400 bg-pink-500/10 border border-pink-500/20 rounded-lg px-2.5 py-1.5">
                <Sparkles className="w-3 h-3 flex-shrink-0" /> {feriadoDoDia}
              </p>
            )}
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-2.5 min-h-[200px]">
            {consultasDoDia.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-32 text-gray-700">
                <Clock className="w-8 h-8 mb-2" />
                <p className="text-xs text-center">Nenhuma consulta<br />neste dia</p>
              </div>
            ) : (
              consultasDoDia
                .slice()
                .sort((a, b) => a.dataHora.localeCompare(b.dataHora))
                .map((c) => (
                  <div key={c.id} className="bg-gray-800/60 border border-gray-700/50 rounded-xl p-3.5 space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="font-display tracking-wide text-white text-sm leading-tight">
                          {(c as any).aluno?.nome ?? 'Paciente'}
                        </p>
                        <p className="text-xs text-gray-500 mt-0.5">
                          {format(parseISO(c.dataHora), 'HH:mm', { locale: ptBR })}
                          {c.tipo && ` \u00b7 ${c.tipo}`}
                        </p>
                      </div>
                      <span className={`flex-shrink-0 px-2 py-0.5 rounded-full text-xs font-display uppercase tracking-wider border ${STATUS_COR[c.status] ?? ''}`}>
                        {c.status}
                      </span>
                    </div>
                    {c.status === 'AGENDADA' && (
                      <div className="flex gap-2 pt-0.5">
                        <button
                          onClick={() => mutStatus.mutate({ id: c.id, status: 'REALIZADA' })}
                          className="flex items-center gap-1 text-xs text-emerald-400 hover:text-emerald-300 font-semibold transition-colors"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" /> Realizada
                        </button>
                        <button
                          onClick={() => mutStatus.mutate({ id: c.id, status: 'CANCELADA' })}
                          className="flex items-center gap-1 text-xs text-red-400 hover:text-red-300 font-semibold transition-colors"
                        >
                          <XCircle className="w-3.5 h-3.5" /> Cancelar
                        </button>
                      </div>
                    )}
                  </div>
                ))
            )}
          </div>

          <div className="p-4 border-t border-gray-800">
            <button
              onClick={() => {
                if (diaSelecionado) {
                  setForm((f) => ({
                    ...f,
                    dataHora: format(diaSelecionado, "yyyy-MM-dd") + 'T08:00',
                  }));
                }
                setMostrarModal(true);
              }}
              className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-white py-2.5 rounded-xl text-sm font-bold shadow-lg shadow-emerald-500/20 transition-all"
            >
              <Plus className="w-4 h-4" /> Agendar neste dia
            </button>
          </div>
        </div>
      </div>

      {/* Modal */}
      {mostrarModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="relative bg-gray-900 border border-gray-800 rounded-2xl shadow-2xl w-full max-w-sm p-6">
            <div className="absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-t-2xl" />
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-bold text-white text-lg">Nova Consulta</h3>
              <button
                onClick={() => setMostrarModal(false)}
                className="p-1.5 rounded-lg text-gray-500 hover:text-white hover:bg-gray-800 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <form
              onSubmit={(e) => { e.preventDefault(); mutCriar.mutate(form); }}
              className="space-y-4"
            >
              <div>
                <label className={labelCls}>Aluno *</label>
                <select
                  value={form.alunoId}
                  onChange={(e) => setForm({ ...form, alunoId: e.target.value })}
                  required
                  className={inputCls}
                >
                  <option value="">Selecionar...</option>
                  {alunos.map((a) => <option key={a.id} value={a.id}>{a.nome}</option>)}
                </select>
              </div>
              <div>
                <label className={labelCls}>Data e Hora *</label>
                <input
                  type="datetime-local"
                  value={form.dataHora}
                  onChange={(e) => setForm({ ...form, dataHora: e.target.value })}
                  required
                  className={inputCls}
                />
              </div>
              <div>
                <label className={labelCls}>Tipo</label>
                <input
                  value={form.tipo}
                  onChange={(e) => setForm({ ...form, tipo: e.target.value })}
                  placeholder="Ex: Avaliação, Retorno..."
                  className={inputCls}
                />
              </div>
              <div>
                <label className={labelCls}>Observações</label>
                <textarea
                  value={form.observacoes}
                  onChange={(e) => setForm({ ...form, observacoes: e.target.value })}
                  rows={3}
                  className={`${inputCls} resize-none`}
                />
              </div>
              <div className="flex gap-3 pt-1">
                <button
                  type="button"
                  onClick={() => setMostrarModal(false)}
                  className="flex-1 bg-gray-800 hover:bg-gray-700 text-gray-300 py-2.5 rounded-xl text-sm font-semibold transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={mutCriar.isPending}
                  className="flex-1 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 disabled:opacity-50 text-white py-2.5 rounded-xl text-sm font-bold shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2 transition-all"
                >
                  {mutCriar.isPending && <Loader2 className="w-4 h-4 animate-spin" />}
                  Agendar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
