import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  alunosServico,
  planosServico,
  fichasServico,
  exerciciosServico,
  progressoServico,
  consultasServico,
} from '../../servicos/api';
import {
  ArrowLeft,
  Loader2,
  User,
  Utensils,
  Dumbbell,
  TrendingUp,
  Calendar,
  Plus,
  X,
  Trash2,
  BarChart2,
  Mail,
  Phone,
  Target,
  Clock,
} from 'lucide-react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from 'recharts';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import type { Aluno, PlanoAlimentar, FichaTreino, Exercicio, RegistroProgresso, Consulta } from '../../tipos';

type Aba = 'dados' | 'plano' | 'treino' | 'progresso' | 'consultas';

const abas: { key: Aba; label: string; icone: React.FC<{ className?: string }> }[] = [
  { key: 'dados',     label: 'Dados',           icone: User       },
  { key: 'plano',     label: 'Plano Alimentar',  icone: Utensils   },
  { key: 'treino',    label: 'Treino',           icone: Dumbbell   },
  { key: 'progresso', label: 'Progresso',        icone: TrendingUp },
  { key: 'consultas', label: 'Consultas',         icone: Calendar   },
];

// ── Shared helpers ────────────────────────────────────────────────
function Modal({ titulo, onClose, children }: { titulo: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div className="bg-gray-900 border border-gray-800 rounded-2xl shadow-2xl w-full max-w-sm p-6">
        <div className="flex items-center justify-between mb-5">
          <h3 className="font-bold text-white">{titulo}</h3>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-800 text-gray-500 transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

const inputCls = 'w-full bg-gray-800 border border-gray-700 rounded-xl py-2.5 px-3 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/40 transition-all';
const labelCls = 'block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5';
const btnPrimary = 'flex-1 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 disabled:opacity-50 text-white py-2.5 rounded-xl text-sm font-bold flex items-center justify-center gap-1.5 transition-all';
const btnSecondary = 'flex-1 bg-gray-800 hover:bg-gray-700 border border-gray-700 text-gray-300 py-2.5 rounded-xl text-sm transition-all';
const addBtn = 'flex items-center gap-2 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-white px-4 py-2.5 rounded-xl text-sm font-bold shadow-lg shadow-emerald-500/20 transition-all';

/* ------------------------------------------------------------------ */

function AbaDados({ aluno }: { aluno: Aluno }) {
  const idade = aluno.dataNascimento
    ? Math.floor((Date.now() - new Date(aluno.dataNascimento).getTime()) / (1000 * 60 * 60 * 24 * 365.25))
    : null;

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {[
          { icone: Mail,   label: 'Email',    valor: aluno.email,                   cor: 'text-blue-400',    fundo: 'bg-blue-500/10 border-blue-500/20'    },
          { icone: Phone,  label: 'Telefone', valor: aluno.telefone || '—',         cor: 'text-emerald-400', fundo: 'bg-emerald-500/10 border-emerald-500/20'},
          { icone: Clock,  label: 'Idade',    valor: idade ? `${idade} anos` : '—', cor: 'text-amber-400',   fundo: 'bg-amber-500/10 border-amber-500/20'   },
          { icone: Target, label: 'Objetivo', valor: aluno.objetivos || '—',        cor: 'text-violet-400',  fundo: 'bg-violet-500/10 border-violet-500/20' },
        ].map((c) => (
          <div key={c.label} className={`${c.fundo} border rounded-2xl px-5 py-4 flex items-center gap-4`}>
            <div className={`p-2.5 rounded-xl ${c.fundo} border flex-shrink-0`}>
              <c.icone className={`w-4 h-4 ${c.cor}`} />
            </div>
            <div className="min-w-0">
              <p className="font-display uppercase tracking-wider text-xs text-gray-500">{c.label}</p>
              <p className={`text-sm font-semibold mt-0.5 truncate ${c.valor === '—' ? 'text-gray-600' : 'text-white'}`}>{c.valor}</p>
            </div>
          </div>
        ))}
      </div>
      <div className={`rounded-2xl border px-5 py-4 flex items-center gap-4 ${aluno.ativo ? 'bg-emerald-500/10 border-emerald-500/20' : 'bg-gray-800 border-gray-700'}`}>
        <div className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${aluno.ativo ? 'bg-emerald-400 shadow-lg shadow-emerald-500/50' : 'bg-gray-600'}`} />
        <div>
          <p className="font-display uppercase tracking-wider text-xs text-gray-500">Status</p>
          <p className={`text-sm font-bold mt-0.5 ${aluno.ativo ? 'text-emerald-400' : 'text-gray-500'}`}>{aluno.ativo ? 'Ativo' : 'Inativo'}</p>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */

function AbaPlanoAlimentar({ alunoId }: { alunoId: string }) {
  const queryClient = useQueryClient();
  const [mostrarModal, setMostrarModal] = useState(false);
  const [novoNome, setNovoNome] = useState('');

  const { data: planos = [], isLoading } = useQuery<PlanoAlimentar[]>({
    queryKey: ['planos', alunoId],
    queryFn: () => planosServico.listar({ alunoId }).then((r) => r.data),
  });

  const mutCriar = useMutation({
    mutationFn: () => planosServico.criar({ alunoId, nome: novoNome }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['planos', alunoId] });
      setMostrarModal(false);
      setNovoNome('');
    },
  });

  const mutDeletar = useMutation({
    mutationFn: (id: string) => planosServico.deletar(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['planos', alunoId] }),
  });

  if (isLoading) return <div className="flex justify-center pt-10"><Loader2 className="w-6 h-6 animate-spin text-emerald-500" /></div>;

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <button onClick={() => setMostrarModal(true)} className={addBtn}>
          <Plus className="w-4 h-4" /> Novo Plano
        </button>
      </div>

      {planos.length === 0 ? (
        <div className="text-center py-16 text-gray-600">
          <Utensils className="w-10 h-10 mx-auto mb-3 opacity-30" />
          <p className="text-sm">Nenhum plano alimentar cadastrado.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {planos.map((p) => (
            <div key={p.id} className="bg-gray-900 border border-gray-800 hover:border-gray-700 rounded-2xl px-5 py-4 flex items-center justify-between transition-colors group">
              <div>
                <p className="font-semibold text-white">{p.nome}</p>
                <p className="text-xs text-gray-500 mt-0.5">{p.refeicoes?.length ?? 0} refeição(ões)</p>
              </div>
              <div className="flex items-center gap-3">
                <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${p.ativo ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30' : 'bg-gray-800 text-gray-500 border border-gray-700'}`}>
                  {p.ativo ? 'Ativo' : 'Inativo'}
                </span>
                <button onClick={() => { if (confirm('Excluir este plano?')) mutDeletar.mutate(p.id); }} className="p-1.5 rounded-lg text-gray-600 hover:text-red-400 hover:bg-red-500/10 transition-all opacity-0 group-hover:opacity-100">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {mostrarModal && (
        <Modal titulo="Novo Plano Alimentar" onClose={() => setMostrarModal(false)}>
          <div className="space-y-4">
            <div>
              <label className={labelCls}>Nome do plano</label>
              <input value={novoNome} onChange={(e) => setNovoNome(e.target.value)} placeholder="Ex: Cutting, Bulking..." className={inputCls} autoFocus />
            </div>
            <div className="flex gap-3 pt-1">
              <button onClick={() => setMostrarModal(false)} className={btnSecondary}>Cancelar</button>
              <button onClick={() => mutCriar.mutate()} disabled={!novoNome.trim() || mutCriar.isPending} className={btnPrimary}>
                {mutCriar.isPending && <Loader2 className="w-4 h-4 animate-spin" />} Criar
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */

type ItemFicha = {
  id: string;
  fichaId: string;
  exercicioId: string;
  exercicioNome: string;
  grupoMuscular?: string;
  series: number;
  repeticoes: string;
  carga?: string;
  observacoes?: string;
  ordem: number;
};

const formExInit = { exercicioId: '', exercicioNome: '', grupoMuscular: '', series: 3, repeticoes: '12', carga: '', observacoes: '' };

function AbaFichaTreino({ alunoId }: { alunoId: string }) {
  const queryClient = useQueryClient();

  // ── Level 1 state ──────────────────────────────────────────────
  const [mostrarModalNova, setMostrarModalNova] = useState(false);
  const [novoNome, setNovoNome] = useState('');
  const [fichaAberta, setFichaAberta] = useState<FichaTreino | null>(null);

  // ── Level 2 state ──────────────────────────────────────────────
  const [mostrarModalAdd, setMostrarModalAdd] = useState(false);
  const [buscaEx, setBuscaEx] = useState('');
  const [formEx, setFormEx] = useState(formExInit);

  // ── Queries ────────────────────────────────────────────────────
  const { data: fichas = [], isLoading } = useQuery<FichaTreino[]>({
    queryKey: ['fichas', alunoId],
    queryFn: () => fichasServico.listar({ alunoId }).then((r) => r.data),
  });

  const { data: itens = [] } = useQuery<ItemFicha[]>({
    queryKey: ['exercicios-ficha', fichaAberta?.id],
    queryFn: () => fichasServico.exercicios.listar(fichaAberta!.id).then((r) => r.data),
    enabled: !!fichaAberta,
  });

  const { data: banco = [] } = useQuery<Exercicio[]>({
    queryKey: ['exercicios'],
    queryFn: () => exerciciosServico.listar().then((r) => r.data),
    enabled: mostrarModalAdd,
  });

  // ── Mutations ──────────────────────────────────────────────────
  const mutCriar = useMutation({
    mutationFn: () => fichasServico.criar({ alunoId, nome: novoNome }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['fichas', alunoId] });
      setMostrarModalNova(false);
      setNovoNome('');
    },
  });

  const mutDeletar = useMutation({
    mutationFn: (id: string) => fichasServico.deletar(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['fichas', alunoId] });
      if (fichaAberta) setFichaAberta(null);
    },
  });

  const mutAddEx = useMutation({
    mutationFn: () =>
      fichasServico.exercicios.adicionar(fichaAberta!.id, {
        exercicioId: formEx.exercicioId,
        exercicioNome: formEx.exercicioNome,
        grupoMuscular: formEx.grupoMuscular,
        series: formEx.series,
        repeticoes: formEx.repeticoes,
        carga: formEx.carga || null,
        observacoes: formEx.observacoes || null,
        ordem: itens.length,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['exercicios-ficha', fichaAberta?.id] });
      setMostrarModalAdd(false);
      setFormEx(formExInit);
      setBuscaEx('');
    },
  });

  const mutDelItem = useMutation({
    mutationFn: (itemId: string) => fichasServico.exercicios.deletar(fichaAberta!.id, itemId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['exercicios-ficha', fichaAberta?.id] }),
  });

  const closeAddModal = () => { setMostrarModalAdd(false); setFormEx(formExInit); setBuscaEx(''); };
  const bancFiltrado = banco.filter((e) =>
    !buscaEx || e.nome.toLowerCase().includes(buscaEx.toLowerCase()) || (e.grupoMuscular ?? '').toLowerCase().includes(buscaEx.toLowerCase()),
  );

  if (isLoading) return <div className="flex justify-center pt-10"><Loader2 className="w-6 h-6 animate-spin text-emerald-500" /></div>;

  // ── Level 2: Ficha editor ──────────────────────────────────────
  if (fichaAberta) {
    const itensSorted = [...itens].sort((a, b) => a.ordem - b.ordem);
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <button onClick={() => setFichaAberta(null)} className="flex items-center gap-2 text-sm text-gray-400 hover:text-white transition-colors">
            <ArrowLeft className="w-4 h-4" /> Voltar
          </button>
          <button onClick={() => setMostrarModalAdd(true)} className={addBtn}>
            <Plus className="w-4 h-4" /> Adicionar Exercício
          </button>
        </div>

        <div className="bg-gray-900 border border-gray-800 rounded-2xl px-5 py-3 flex items-center justify-between">
          <div>
            <h3 className="font-bold text-white">{fichaAberta.nome}</h3>
            <p className="text-xs text-gray-500">{itensSorted.length} exercício(s)</p>
          </div>
          <button onClick={() => { if (confirm('Excluir esta ficha?')) mutDeletar.mutate(fichaAberta.id); }} className="p-1.5 rounded-lg text-gray-600 hover:text-red-400 hover:bg-red-500/10 transition-all">
            <Trash2 className="w-4 h-4" />
          </button>
        </div>

        {itensSorted.length === 0 ? (
          <div className="text-center py-12 text-gray-600">
            <Dumbbell className="w-8 h-8 mx-auto mb-2 opacity-30" />
            <p className="text-sm">Nenhum exercício adicionado. Clique em "Adicionar Exercício".</p>
          </div>
        ) : (
          <div className="space-y-2">
            {itensSorted.map((item, idx) => (
              <div key={item.id} className="bg-gray-900 border border-gray-800 hover:border-gray-700 rounded-2xl px-5 py-4 flex items-center justify-between group transition-colors">
                <div className="flex items-center gap-4 min-w-0">
                  <span className="text-xl font-black text-gray-700 w-6 text-center flex-shrink-0">{idx + 1}</span>
                  <div className="min-w-0">
                    <p className="font-semibold text-white truncate">{item.exercicioNome}</p>
                    {item.grupoMuscular && <p className="text-xs text-gray-500">{item.grupoMuscular}</p>}
                  </div>
                </div>
                <div className="flex items-center gap-3 flex-shrink-0 ml-3">
                  <div className="text-center min-w-[2.5rem]">
                    <p className="text-lg font-bold text-emerald-400 leading-tight">{item.series}</p>
                    <p className="font-display uppercase tracking-wider text-[10px] text-gray-600">séries</p>
                  </div>
                  <span className="text-gray-700 font-bold">×</span>
                  <div className="text-center min-w-[2.5rem]">
                    <p className="text-lg font-bold text-teal-400 leading-tight">{item.repeticoes}</p>
                    <p className="font-display uppercase tracking-wider text-[10px] text-gray-600">reps</p>
                  </div>
                  {item.carga && (
                    <>
                      <span className="text-gray-700">·</span>
                      <div className="text-center">
                        <p className="text-sm font-semibold text-gray-300 leading-tight">{item.carga}</p>
                        <p className="font-display uppercase tracking-wider text-[10px] text-gray-600">carga</p>
                      </div>
                    </>
                  )}
                  <button onClick={() => { if (confirm('Remover exercício?')) mutDelItem.mutate(item.id); }} className="p-1.5 rounded-lg text-gray-600 hover:text-red-400 hover:bg-red-500/10 transition-all opacity-0 group-hover:opacity-100 ml-1">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {mostrarModalAdd && (
          <Modal titulo="Adicionar Exercício" onClose={closeAddModal}>
            <div className="space-y-4">
              {!formEx.exercicioId ? (
                <>
                  <div>
                    <label className={labelCls}>Buscar exercício</label>
                    <input value={buscaEx} onChange={(e) => setBuscaEx(e.target.value)} placeholder="Nome ou grupo muscular..." className={inputCls} autoFocus />
                  </div>
                  <div className="max-h-52 overflow-y-auto space-y-0.5 -mx-1 px-1">
                    {bancFiltrado.length === 0 ? (
                      <p className="text-center text-sm text-gray-600 py-6">Nenhum exercício encontrado</p>
                    ) : (
                      bancFiltrado.map((e) => (
                        <button key={e.id} onClick={() => setFormEx((f) => ({ ...f, exercicioId: e.id, exercicioNome: e.nome, grupoMuscular: e.grupoMuscular ?? '' }))} className="w-full text-left px-3 py-2.5 rounded-xl hover:bg-gray-800 transition-colors group">
                          <p className="text-sm font-semibold text-white group-hover:text-emerald-400 transition-colors">{e.nome}</p>
                          {e.grupoMuscular && <p className="text-xs text-gray-500">{e.grupoMuscular}</p>}
                        </button>
                      ))
                    )}
                  </div>
                </>
              ) : (
                <>
                  <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl px-4 py-3 flex items-center justify-between">
                    <div>
                      <p className="text-sm font-bold text-emerald-400">{formEx.exercicioNome}</p>
                      {formEx.grupoMuscular && <p className="text-xs text-gray-500">{formEx.grupoMuscular}</p>}
                    </div>
                    <button onClick={() => setFormEx((f) => ({ ...f, exercicioId: '', exercicioNome: '', grupoMuscular: '' }))} className="text-gray-600 hover:text-gray-400 transition-colors">
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className={labelCls}>Séries</label>
                      <input type="number" min={1} value={formEx.series} onChange={(e) => setFormEx((f) => ({ ...f, series: Number(e.target.value) }))} className={inputCls} />
                    </div>
                    <div>
                      <label className={labelCls}>Repetições</label>
                      <input value={formEx.repeticoes} onChange={(e) => setFormEx((f) => ({ ...f, repeticoes: e.target.value }))} placeholder="12 ou 8-12" className={inputCls} />
                    </div>
                  </div>
                  <div>
                    <label className={labelCls}>Carga (opcional)</label>
                    <input value={formEx.carga} onChange={(e) => setFormEx((f) => ({ ...f, carga: e.target.value }))} placeholder="Ex: 20kg, 50%" className={inputCls} />
                  </div>
                  <div>
                    <label className={labelCls}>Observações (opcional)</label>
                    <textarea value={formEx.observacoes} onChange={(e) => setFormEx((f) => ({ ...f, observacoes: e.target.value }))} rows={2} className={`${inputCls} resize-none`} placeholder="Cadência, técnica especial..." />
                  </div>
                  <div className="flex gap-3 pt-1">
                    <button onClick={() => setFormEx((f) => ({ ...f, exercicioId: '', exercicioNome: '', grupoMuscular: '' }))} className={btnSecondary}>Voltar</button>
                    <button onClick={() => mutAddEx.mutate()} disabled={mutAddEx.isPending} className={btnPrimary}>
                      {mutAddEx.isPending && <Loader2 className="w-4 h-4 animate-spin" />} Adicionar
                    </button>
                  </div>
                </>
              )}
            </div>
          </Modal>
        )}
      </div>
    );
  }

  // ── Level 1: Ficha list ────────────────────────────────────────
  const fichasAtivas = fichas.filter((f) => f.ativo);
  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <button onClick={() => setMostrarModalNova(true)} className={addBtn}>
          <Plus className="w-4 h-4" /> Nova Ficha
        </button>
      </div>

      {fichasAtivas.length === 0 ? (
        <div className="text-center py-16 text-gray-600">
          <Dumbbell className="w-10 h-10 mx-auto mb-3 opacity-30" />
          <p className="text-sm">Nenhuma ficha de treino cadastrada.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {fichasAtivas.map((f) => (
            <div key={f.id} className="bg-gray-900 border border-gray-800 hover:border-gray-700 rounded-2xl px-5 py-4 flex items-center justify-between transition-colors group">
              <div className="min-w-0">
                <p className="font-semibold text-white truncate">{f.nome}</p>
                <p className="text-xs text-gray-500 mt-0.5">{f.exercicios?.length ?? 0} exercício(s)</p>
              </div>
              <div className="flex items-center gap-3 flex-shrink-0 ml-3">
                <button onClick={() => setFichaAberta(f)} className="px-4 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold hover:bg-emerald-500/20 transition-all">
                  Editar
                </button>
                <button onClick={() => { if (confirm('Excluir ficha?')) mutDeletar.mutate(f.id); }} className="p-1.5 rounded-lg text-gray-600 hover:text-red-400 hover:bg-red-500/10 transition-all opacity-0 group-hover:opacity-100">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {mostrarModalNova && (
        <Modal titulo="Nova Ficha de Treino" onClose={() => setMostrarModalNova(false)}>
          <div className="space-y-4">
            <div>
              <label className={labelCls}>Nome da ficha</label>
              <input value={novoNome} onChange={(e) => setNovoNome(e.target.value)} placeholder="Ex: Treino A – Peito e Tríceps" className={inputCls} autoFocus />
            </div>
            <div className="flex gap-3 pt-1">
              <button onClick={() => setMostrarModalNova(false)} className={btnSecondary}>Cancelar</button>
              <button onClick={() => mutCriar.mutate()} disabled={!novoNome.trim() || mutCriar.isPending} className={btnPrimary}>
                {mutCriar.isPending && <Loader2 className="w-4 h-4 animate-spin" />} Criar
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */

function AbaProgresso({ alunoId }: { alunoId: string }) {
  const { data: registros = [], isLoading } = useQuery<RegistroProgresso[]>({
    queryKey: ['progresso', alunoId],
    queryFn: () => progressoServico.listar(alunoId).then((r) => r.data),
  });

  if (isLoading) return <div className="flex justify-center pt-10"><Loader2 className="w-6 h-6 animate-spin text-emerald-500" /></div>;

  if (!registros.length) return (
    <div className="text-center py-16 text-gray-600">
      <TrendingUp className="w-10 h-10 mx-auto mb-3 opacity-30" />
      <p className="text-sm">Nenhum registro de progresso.</p>
    </div>
  );

  const dados = registros
    .slice()
    .sort((a, b) => new Date(a.registradoEm).getTime() - new Date(b.registradoEm).getTime())
    .map((r) => ({ data: format(parseISO(r.registradoEm), 'dd/MM', { locale: ptBR }), Peso: r.peso, IMC: r.imc }));

  const ultimo = registros[registros.length - 1];

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl p-4 relative overflow-hidden">
          <div className="absolute -top-3 -right-3 w-16 h-16 bg-white/10 rounded-full" />
          <p className="font-display uppercase tracking-wider text-xs text-white/70">Peso atual</p>
          <p className="text-3xl font-black text-white mt-1">{ultimo?.peso ?? '—'}<span className="text-base font-medium ml-1">kg</span></p>
        </div>
        <div className="bg-gradient-to-br from-violet-500 to-purple-600 rounded-2xl p-4 relative overflow-hidden">
          <div className="absolute -top-3 -right-3 w-16 h-16 bg-white/10 rounded-full" />
          <p className="font-display uppercase tracking-wider text-xs text-white/70">IMC</p>
          <p className="text-3xl font-black text-white mt-1">{ultimo?.imc?.toFixed(1) ?? '—'}</p>
        </div>
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5">
        <p className="font-display uppercase tracking-wider text-sm text-white mb-4 flex items-center gap-2">
          <BarChart2 className="w-4 h-4 text-emerald-400" /> Evolução do Peso (kg)
        </p>
        <ResponsiveContainer width="100%" height={200}>
          <LineChart data={dados}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
            <XAxis dataKey="data" tick={{ fontSize: 11, fill: '#6b7280' }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 11, fill: '#6b7280' }} axisLine={false} tickLine={false} domain={['auto', 'auto']} />
            <Tooltip contentStyle={{ backgroundColor: '#111827', border: '1px solid #1f2937', borderRadius: '12px', color: '#fff' }} labelStyle={{ color: '#9ca3af', fontSize: 11 }} />
            <Line type="monotone" dataKey="Peso" stroke="#10b981" strokeWidth={2.5} dot={{ r: 4, fill: '#10b981', strokeWidth: 0 }} activeDot={{ r: 6 }} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-2xl divide-y divide-gray-800 overflow-hidden">
        {registros.slice().reverse().map((r) => (
          <div key={r.id} className="px-5 py-3.5 flex items-center justify-between">
            <p className="text-sm text-gray-300">{format(parseISO(r.registradoEm), "dd 'de' MMMM yyyy", { locale: ptBR })}</p>
            <div className="flex gap-4 text-sm">
              {r.peso && <span className="font-semibold text-white">{r.peso} kg</span>}
              {r.imc && <span className="text-gray-500">IMC {r.imc.toFixed(1)}</span>}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */

function AbaConsultas({ alunoId }: { alunoId: string }) {
  const queryClient = useQueryClient();
  const [mostrarModal, setMostrarModal] = useState(false);
  const [form, setForm] = useState({ dataHora: '', tipo: '', observacoes: '' });

  const { data: consultas = [], isLoading } = useQuery<Consulta[]>({
    queryKey: ['consultas', alunoId],
    queryFn: () => consultasServico.listar({ alunoId }).then((r) => r.data),
  });

  const mutCriar = useMutation({
    mutationFn: () => consultasServico.criar({ alunoId, ...form }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['consultas', alunoId] });
      setMostrarModal(false);
      setForm({ dataHora: '', tipo: '', observacoes: '' });
    },
  });

  const corStatus: Record<string, string> = {
    AGENDADA:  'bg-amber-500/15 text-amber-400 border border-amber-500/30',
    REALIZADA: 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30',
    CANCELADA: 'bg-red-500/15 text-red-400 border border-red-500/30',
  };

  if (isLoading) return <div className="flex justify-center pt-10"><Loader2 className="w-6 h-6 animate-spin text-emerald-500" /></div>;

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <button onClick={() => setMostrarModal(true)} className={addBtn}>
          <Plus className="w-4 h-4" /> Agendar Consulta
        </button>
      </div>

      {consultas.length === 0 ? (
        <div className="text-center py-16 text-gray-600">
          <Calendar className="w-10 h-10 mx-auto mb-3 opacity-30" />
          <p className="text-sm">Nenhuma consulta registrada.</p>
        </div>
      ) : (
        <div className="bg-gray-900 border border-gray-800 rounded-2xl divide-y divide-gray-800 overflow-hidden">
          {consultas.map((c) => (
            <div key={c.id} className="px-5 py-4 flex items-center justify-between">
              <div>
                <p className="text-sm font-display tracking-wide text-white">
                  {format(parseISO(c.dataHora), "dd 'de' MMM 'de' yyyy 'às' HH:mm", { locale: ptBR })}
                </p>
                {c.tipo && <p className="text-xs text-gray-500 mt-0.5">{c.tipo}</p>}
              </div>
              <span className={`px-2.5 py-1 rounded-full text-xs font-display uppercase tracking-wider ${corStatus[c.status] ?? 'bg-gray-800 text-gray-500 border border-gray-700'}`}>
                {c.status}
              </span>
            </div>
          ))}
        </div>
      )}

      {mostrarModal && (
        <Modal titulo="Agendar Consulta" onClose={() => setMostrarModal(false)}>
          <div className="space-y-3">
            <div>
              <label className={labelCls}>Data e hora *</label>
              <input type="datetime-local" value={form.dataHora} onChange={(e) => setForm({ ...form, dataHora: e.target.value })} className={inputCls} required />
            </div>
            <div>
              <label className={labelCls}>Tipo</label>
              <input value={form.tipo} onChange={(e) => setForm({ ...form, tipo: e.target.value })} placeholder="Ex: Avaliação inicial, Retorno..." className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Observações</label>
              <textarea value={form.observacoes} onChange={(e) => setForm({ ...form, observacoes: e.target.value })} rows={2} className={`${inputCls} resize-none`} />
            </div>
            <div className="flex gap-3 pt-1">
              <button onClick={() => setMostrarModal(false)} className={btnSecondary}>Cancelar</button>
              <button onClick={() => mutCriar.mutate()} disabled={!form.dataHora || mutCriar.isPending} className={btnPrimary}>
                {mutCriar.isPending && <Loader2 className="w-4 h-4 animate-spin" />} Agendar
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */

export default function PerfilAluno() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [abaAtiva, setAbaAtiva] = useState<Aba>('dados');

  const { data: aluno, isLoading } = useQuery<Aluno>({
    queryKey: ['aluno', id],
    queryFn: () => alunosServico.buscar(id!).then((r) => r.data),
    enabled: !!id,
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-40">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
      </div>
    );
  }

  if (!aluno) {
    return (
      <div className="text-center py-16">
        <p className="text-gray-500">Aluno não encontrado.</p>
        <button onClick={() => navigate('/admin/pacientes')} className="mt-4 text-emerald-400 text-sm hover:underline">
          Voltar para pacientes
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl">
      {/* ── Hero Header ── */}
      <div className="relative bg-gray-900 border border-gray-800 rounded-3xl overflow-hidden">
        <div className="absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r from-emerald-500 to-teal-500" />
        <div className="p-6 flex items-center gap-5">
          <button onClick={() => navigate('/admin/pacientes')} className="p-2 rounded-xl hover:bg-gray-800 transition-colors text-gray-500 hover:text-white flex-shrink-0">
            <ArrowLeft className="w-5 h-5" />
          </button>
          {aluno.fotoPerfil ? (
            <img src={`data:image/jpeg;base64,${aluno.fotoPerfil}`} alt={aluno.nome} className="w-16 h-16 rounded-2xl object-cover flex-shrink-0 ring-2 ring-emerald-500/30" />
          ) : (
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center flex-shrink-0 shadow-lg shadow-emerald-500/25">
              <span className="text-white font-black text-2xl">{aluno.nome.charAt(0).toUpperCase()}</span>
            </div>
          )}
          <div className="min-w-0 flex-1">
            <h1 className="text-xl font-black text-white truncate">{aluno.nome}</h1>
            <p className="text-sm text-gray-500 mt-0.5 truncate">{aluno.email}</p>
          </div>
          <span className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-bold ${
            aluno.ativo
              ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
              : 'bg-gray-800 text-gray-500 border border-gray-700'
          }`}>
            {aluno.ativo ? 'Ativo' : 'Inativo'}
          </span>
        </div>
      </div>

      {/* ── Tab Bar ── */}
      <div className="flex gap-1 overflow-x-auto pb-0.5">
        {abas.map((aba) => {
          const Icone = aba.icone;
          const ativo = abaAtiva === aba.key;
          return (
            <button
              key={aba.key}
              onClick={() => setAbaAtiva(aba.key)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-display uppercase tracking-wider text-sm whitespace-nowrap transition-all duration-200 flex-shrink-0 border ${
                ativo
                  ? 'bg-gradient-to-r from-emerald-500/20 to-teal-500/10 text-emerald-400 border-emerald-500/30'
                  : 'text-gray-500 hover:text-gray-300 hover:bg-gray-900 border-transparent'
              }`}
            >
              <Icone className="w-4 h-4" />
              {aba.label}
            </button>
          );
        })}
      </div>

      {/* ── Tab Content ── */}
      <div>
        {abaAtiva === 'dados'     && <AbaDados aluno={aluno} />}
        {abaAtiva === 'plano'     && <AbaPlanoAlimentar alunoId={id!} />}
        {abaAtiva === 'treino'    && <AbaFichaTreino alunoId={id!} />}
        {abaAtiva === 'progresso' && <AbaProgresso alunoId={id!} />}
        {abaAtiva === 'consultas' && <AbaConsultas alunoId={id!} />}
      </div>
    </div>
  );
}
