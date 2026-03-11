import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { exerciciosServico } from '../../servicos/api';
import { Search, Plus, X, Loader2, Trash2, Dumbbell, ChevronLeft, ChevronRight } from 'lucide-react';
import type { Exercicio } from '../../tipos';

const POR_PAGINA = 20;

const GRUPOS = [
  'Peito', 'Costas', 'Ombros', 'Bíceps', 'Tríceps', 'Antebraços',
  'Abdômen', 'Glúteos', 'Quadríceps', 'Isquiotibiais', 'Panturrilha',
  'Corpo Todo', 'Cardio',
];

const NIVEIS = ['INICIANTE', 'INTERMEDIARIO', 'AVANCADO'] as const;

interface FormExercicio {
  nome: string; grupoMuscular: string; nivel: string;
  descricao: string; equipamento: string; urlVideo: string;
}

const formVazio: FormExercicio = { nome: '', grupoMuscular: '', nivel: 'INICIANTE', descricao: '', equipamento: '', urlVideo: '' };
const inputCls = 'w-full bg-gray-800 border border-gray-700 rounded-xl py-2.5 px-3 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/40 transition-all';
const labelCls = 'block text-xs font-display text-gray-400 uppercase tracking-wider mb-1.5';
const selectCls = 'w-full bg-gray-800 border border-gray-700 rounded-xl py-2.5 px-3 text-sm text-white focus:outline-none focus:border-emerald-500 transition-all';

function Paginacao({ total, pagina, setPagina }: { total: number; pagina: number; setPagina: (p: number) => void }) {
  const totalPaginas = Math.ceil(total / POR_PAGINA);
  if (totalPaginas <= 1) return null;
  const inicio = Math.max(1, pagina - 2);
  const fim = Math.min(totalPaginas, pagina + 2);
  const paginas = Array.from({ length: fim - inicio + 1 }, (_, i) => inicio + i);
  return (
    <div className="flex items-center justify-between px-4 py-3 border-t border-gray-800">
      <p className="text-xs text-gray-600">
        {(pagina - 1) * POR_PAGINA + 1}–{Math.min(pagina * POR_PAGINA, total)} de {total}
      </p>
      <div className="flex items-center gap-1">
        <button disabled={pagina === 1} onClick={() => setPagina(pagina - 1)}
          className="p-1.5 rounded-lg text-gray-500 hover:text-white hover:bg-gray-800 disabled:opacity-30 disabled:cursor-not-allowed transition-colors">
          <ChevronLeft className="w-4 h-4" />
        </button>
        {inicio > 1 && <><button onClick={() => setPagina(1)} className="w-8 h-8 rounded-lg text-xs text-gray-500 hover:text-white hover:bg-gray-800 transition-colors">1</button><span className="text-gray-600 text-xs px-1">…</span></>}
        {paginas.map((p) => (
          <button key={p} onClick={() => setPagina(p)}
            className={`w-8 h-8 rounded-lg text-xs font-semibold transition-colors ${p === pagina ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-lg shadow-emerald-500/20' : 'text-gray-500 hover:text-white hover:bg-gray-800'}`}>
            {p}
          </button>
        ))}
        {fim < totalPaginas && <><span className="text-gray-600 text-xs px-1">…</span><button onClick={() => setPagina(totalPaginas)} className="w-8 h-8 rounded-lg text-xs text-gray-500 hover:text-white hover:bg-gray-800 transition-colors">{totalPaginas}</button></>}
        <button disabled={pagina === totalPaginas} onClick={() => setPagina(pagina + 1)}
          className="p-1.5 rounded-lg text-gray-500 hover:text-white hover:bg-gray-800 disabled:opacity-30 disabled:cursor-not-allowed transition-colors">
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

const corNivel: Record<string, string> = {
  INICIANTE:     'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30',
  INTERMEDIARIO: 'bg-amber-500/15  text-amber-400  border border-amber-500/30',
  AVANCADO:      'bg-red-500/15    text-red-400    border border-red-500/30',
};

export default function Exercicios() {
  const queryClient = useQueryClient();
  const [busca, setBusca] = useState('');
  const [grupoFiltro, setGrupoFiltro] = useState('');
  const [pagina, setPagina] = useState(1);
  const [mostrarModal, setMostrarModal] = useState(false);
  const [form, setForm] = useState<FormExercicio>(formVazio);

  const { data: exercicios = [], isLoading } = useQuery<Exercicio[]>({
    queryKey: ['exercicios'],
    queryFn: () => exerciciosServico.listar().then((r) => r.data),
  });

  const mutCriar = useMutation({
    mutationFn: (d: any) => exerciciosServico.criar(d),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['exercicios'] }); setMostrarModal(false); setForm(formVazio); },
  });

  const mutDeletar = useMutation({
    mutationFn: (id: string) => exerciciosServico.deletar(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['exercicios'] }),
  });

  const filtrados = exercicios.filter((e) => {
    const matchBusca = e.nome.toLowerCase().includes(busca.toLowerCase());
    const matchGrupo = !grupoFiltro || e.grupoMuscular === grupoFiltro;
    return matchBusca && matchGrupo;
  });

  const pagFiltrados = filtrados.slice((pagina - 1) * POR_PAGINA, pagina * POR_PAGINA);

  const onFiltro = (b: string, g: string) => { setBusca(b); setGrupoFiltro(g); setPagina(1); };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-black text-white">Banco de Exercícios</h1>
          <p className="text-gray-500 text-sm mt-0.5">{exercicios.length} exercício(s) cadastrado(s)</p>
        </div>
        <button onClick={() => { setForm(formVazio); setMostrarModal(true); }}
          className="flex items-center gap-1.5 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-white px-4 py-2.5 rounded-xl text-sm font-bold shadow-lg shadow-emerald-500/20 transition-all self-start">
          <Plus className="w-4 h-4" /> Novo Exercício
        </button>
      </div>

      {/* Filtros */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-600" />
          <input type="text" placeholder="Buscar exercício..." value={busca}
            onChange={(e) => onFiltro(e.target.value, grupoFiltro)}
            className="w-full bg-gray-900 border border-gray-800 text-white placeholder-gray-600 pl-10 pr-4 py-2.5 rounded-xl text-sm focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/40 transition-all" />
        </div>
        <select value={grupoFiltro} onChange={(e) => onFiltro(busca, e.target.value)}
          className="bg-gray-900 border border-gray-800 text-gray-300 rounded-xl py-2.5 px-3 text-sm focus:outline-none focus:border-emerald-500 transition-all sm:w-48">
          <option value="">Todos os grupos</option>
          {GRUPOS.map((g) => <option key={g} value={g}>{g}</option>)}
        </select>
      </div>

      {/* Lista */}
      {isLoading ? (
        <div className="flex items-center justify-center h-40">
          <Loader2 className="w-7 h-7 animate-spin text-emerald-500" />
        </div>
      ) : (
        <div className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden">
          {pagFiltrados.length === 0 ? (
            <div className="text-center py-16 text-gray-600">
              <Dumbbell className="w-8 h-8 mx-auto mb-2 opacity-30" />
              Nenhum exercício encontrado
            </div>
          ) : (
            pagFiltrados.map((e, i) => (
              <div key={e.id} className={`flex items-center justify-between px-5 py-4 hover:bg-gray-800/60 transition-colors group ${i !== pagFiltrados.length - 1 ? 'border-b border-gray-800/60' : ''}`}>
                <div className="min-w-0">
                  <p className="font-display tracking-wide text-white truncate">{e.nome}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <p className="text-xs text-gray-500">{e.grupoMuscular}</p>
                    {e.equipamento && <><span className="text-gray-700">·</span><p className="text-xs text-gray-600 truncate">{e.equipamento}</p></>}
                  </div>
                </div>
                <div className="flex items-center gap-3 flex-shrink-0 ml-3">
                  <span className={`px-2.5 py-1 rounded-full text-xs font-display uppercase tracking-wider whitespace-nowrap ${corNivel[e.nivel] ?? 'bg-gray-800 text-gray-500 border border-gray-700'}`}>
                    {e.nivel?.charAt(0) + e.nivel?.slice(1).toLowerCase()}
                  </span>
                  <button onClick={() => { if (confirm('Excluir exercício?')) mutDeletar.mutate(e.id); }}
                    className="p-1.5 rounded-lg text-gray-600 hover:text-red-400 hover:bg-red-500/10 transition-all opacity-0 group-hover:opacity-100">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))
          )}
          <Paginacao total={filtrados.length} pagina={pagina} setPagina={setPagina} />
        </div>
      )}

      {/* Modal */}
      {mostrarModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="bg-gray-900 border border-gray-800 rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-800">
              <h2 className="font-bold text-white">Novo Exercício</h2>
              <button onClick={() => setMostrarModal(false)} className="p-1.5 rounded-lg hover:bg-gray-800 text-gray-500 transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={(e) => { e.preventDefault(); mutCriar.mutate(form); }} className="p-6 space-y-4">
              <div>
                <label className={labelCls}>Nome *</label>
                <input value={form.nome} onChange={(e) => setForm({ ...form, nome: e.target.value })} required className={inputCls} autoFocus />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelCls}>Grupo Muscular *</label>
                  <select value={form.grupoMuscular} onChange={(e) => setForm({ ...form, grupoMuscular: e.target.value })} required className={selectCls}>
                    <option value="">Selecionar</option>
                    {GRUPOS.map((g) => <option key={g} value={g}>{g}</option>)}
                  </select>
                </div>
                <div>
                  <label className={labelCls}>Nível *</label>
                  <select value={form.nivel} onChange={(e) => setForm({ ...form, nivel: e.target.value })} className={selectCls}>
                    {NIVEIS.map((n) => <option key={n} value={n}>{n.charAt(0) + n.slice(1).toLowerCase()}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className={labelCls}>Equipamento</label>
                <input value={form.equipamento} onChange={(e) => setForm({ ...form, equipamento: e.target.value })}
                  placeholder="Ex: Barra, Halteres, Máquina..." className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>Descrição</label>
                <textarea value={form.descricao} onChange={(e) => setForm({ ...form, descricao: e.target.value })}
                  rows={3} className={`${inputCls} resize-none`} />
              </div>
              <div>
                <label className={labelCls}>URL do Vídeo (YouTube)</label>
                <input value={form.urlVideo} onChange={(e) => setForm({ ...form, urlVideo: e.target.value })}
                  placeholder="https://youtube.com/watch?v=..." className={inputCls} />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setMostrarModal(false)}
                  className="flex-1 bg-gray-800 hover:bg-gray-700 border border-gray-700 text-gray-300 py-2.5 rounded-xl text-sm transition-all">
                  Cancelar
                </button>
                <button type="submit" disabled={mutCriar.isPending}
                  className="flex-1 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 disabled:opacity-50 text-white py-2.5 rounded-xl text-sm font-bold flex items-center justify-center gap-1.5 transition-all">
                  {mutCriar.isPending && <Loader2 className="w-4 h-4 animate-spin" />} Cadastrar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
