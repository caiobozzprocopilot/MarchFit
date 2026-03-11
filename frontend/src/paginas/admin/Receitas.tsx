import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { receitasServico, alunosServico } from '../../servicos/api';
import { Search, Plus, X, Loader2, Trash2, Youtube, Users, ChevronDown } from 'lucide-react';
import type { Receita, Aluno } from '../../tipos';

const inputCls = 'w-full bg-gray-800 border border-gray-700 rounded-xl py-2.5 px-3 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/40 transition-all';
const labelCls = 'block text-xs font-display text-gray-400 uppercase tracking-wider mb-1.5';

interface FormReceita {
  nome: string;
  youtubeUrl: string;
  descricao: string;
  tempoPreparo: string;
  porcoes: string;
  categoria: string;
  ingredientes: string;
  modoPreparo: string;
}

const formVazio: FormReceita = {
  nome: '',
  youtubeUrl: '',
  descricao: '',
  tempoPreparo: '',
  porcoes: '',
  categoria: '',
  ingredientes: '',
  modoPreparo: '',
};

function Acordeon({ label, content }: { label: string; content: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div>
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between px-3.5 py-2.5 bg-gray-800/60 hover:bg-gray-800 border border-gray-800 rounded-xl transition-colors text-left"
      >
        <span className="font-display uppercase tracking-wider text-xs text-gray-300">{label}</span>
        <ChevronDown className={`w-3.5 h-3.5 text-gray-500 transition-transform duration-200 ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && (
        <div className="mt-1.5 px-3.5 py-3 bg-gray-800/40 border border-gray-800 rounded-xl">
          <p className="text-xs text-gray-400 leading-relaxed whitespace-pre-wrap">{content}</p>
        </div>
      )}
    </div>
  );
}

function CardReceita({ receita, onDeletar }: { receita: Receita; onDeletar: () => void }) {
  const [playing, setPlaying] = useState(false);
  const thumbUrl = receita.youtubeVideoId
    ? `https://img.youtube.com/vi/${receita.youtubeVideoId}/hqdefault.jpg`
    : null;

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden">
      {receita.youtubeVideoId ? (
        playing ? (
          <div className="relative w-full" style={{ paddingBottom: '56.25%' }}>
            <iframe
              className="absolute inset-0 w-full h-full"
              src={`https://www.youtube.com/embed/${receita.youtubeVideoId}?autoplay=1`}
              title={receita.nome}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          </div>
        ) : (
          <button onClick={() => setPlaying(true)} className="block relative w-full group/thumb">
            <img src={thumbUrl!} alt={receita.nome} className="w-full h-56 object-cover" />
            <div className="absolute inset-0 bg-black/40 flex items-center justify-center group-hover/thumb:bg-black/50 transition-colors">
              <div className="bg-red-600 hover:bg-red-500 rounded-full p-3.5 transition-colors shadow-lg">
                <Youtube className="w-7 h-7 text-white" />
              </div>
            </div>
          </button>
        )
      ) : (
        <div className="w-full h-56 bg-gray-800 flex items-center justify-center">
          <Youtube className="w-10 h-10 text-gray-700" />
        </div>
      )}
      <div className="p-4 space-y-3">
        <div>
          <h3 className="font-display tracking-wide text-white text-sm">{receita.nome}</h3>
          <div className="flex items-center gap-2 mt-1.5 flex-wrap">
            {receita.categoria && (
              <span className="text-xs font-display uppercase tracking-wider text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full">
                {receita.categoria}
              </span>
            )}
            {receita.tempoPreparo && (
              <span className="text-xs text-gray-500">{receita.tempoPreparo} min</span>
            )}
            {receita.porcoes && (
              <span className="text-xs text-gray-500">🍽 {receita.porcoes} porção(ões)</span>
            )}
          </div>
        </div>

        {(receita.descricao || receita.ingredientes || receita.modoPreparo) && (
          <div className="space-y-1.5">
            {receita.descricao && <Acordeon label="Descrição" content={receita.descricao} />}
            {receita.ingredientes && <Acordeon label="Ingredientes" content={receita.ingredientes} />}
            {receita.modoPreparo && <Acordeon label="Modo de Preparo" content={receita.modoPreparo} />}
          </div>
        )}

        <div className="flex justify-end">
          <button onClick={onDeletar} className="p-1 text-gray-700 hover:text-red-400 transition-colors">
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

export default function Receitas() {
  const queryClient = useQueryClient();
  const [busca, setBusca] = useState('');
  const [mostrarModal, setMostrarModal] = useState(false);
  const [mostrarAtribuir, setMostrarAtribuir] = useState<Receita | null>(null);
  const [form, setForm] = useState<FormReceita>(formVazio);
  const [alunoSelecionado, setAlunoSelecionado] = useState('');

  const { data: receitas = [], isLoading } = useQuery<Receita[]>({
    queryKey: ['receitas'],
    queryFn: () => receitasServico.listar().then((r) => r.data),
  });

  const { data: alunos = [] } = useQuery<Aluno[]>({
    queryKey: ['alunos'],
    queryFn: () => alunosServico.listar().then((r) => r.data),
    enabled: !!mostrarAtribuir,
  });

  const [erroModal, setErroModal] = useState('');

  const mutCriar = useMutation({
    mutationFn: (d: any) => receitasServico.criar(d),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['receitas'] });
      setMostrarModal(false);
      setForm(formVazio);
      setErroModal('');
    },
    onError: (e: any) => {
      console.error('[receitasServico.criar]', e);
      setErroModal(e?.message || 'Erro ao salvar receita.');
    },
  });

  const mutDeletar = useMutation({
    mutationFn: (id: string) => receitasServico.deletar(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['receitas'] }),
  });

  const mutAtribuir = useMutation({
    mutationFn: ({ receitaId, alunoId }: { receitaId: string; alunoId: string }) =>
      receitasServico.atribuir(receitaId, alunoId),
    onSuccess: () => {
      setMostrarAtribuir(null);
      setAlunoSelecionado('');
    },
  });

  const filtradas = receitas.filter((r) =>
    r.nome.toLowerCase().includes(busca.toLowerCase())
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    mutCriar.mutate({
      nome: form.nome,
      youtubeUrl: form.youtubeUrl,
      descricao: form.descricao || undefined,
      categoria: form.categoria || undefined,
      tempoPreparo: form.tempoPreparo ? parseInt(form.tempoPreparo) : undefined,
      porcoes: form.porcoes ? parseInt(form.porcoes) : undefined,
      ingredientes: form.ingredientes || undefined,
      modoPreparo: form.modoPreparo || undefined,
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-black text-white">Receitas</h1>
          <p className="text-gray-500 text-sm mt-0.5">{receitas.length} receita(s) cadastrada(s)</p>
        </div>
        <button
          onClick={() => { setForm(formVazio); setErroModal(''); setMostrarModal(true); }}
          className="flex items-center gap-2 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-white px-4 py-2.5 rounded-xl text-sm font-bold shadow-lg shadow-emerald-500/20 transition-all"
        >
          <Plus className="w-4 h-4" /> Nova Receita
        </button>
      </div>

      {/* Busca */}
      <div className="relative">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
        <input type="text" placeholder="Buscar receita..." value={busca} onChange={(e) => setBusca(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 bg-gray-900 border border-gray-800 rounded-xl text-sm text-white placeholder-gray-600 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/40 transition-all" />
      </div>

      {/* Grid de cards */}
      {isLoading ? (
        <div className="flex items-center justify-center h-32"><Loader2 className="w-6 h-6 animate-spin text-emerald-500" /></div>
      ) : filtradas.length === 0 ? (
        <div className="text-center py-16 text-gray-600">
          <Youtube className="w-10 h-10 mx-auto mb-3 opacity-30" />
          <p className="text-sm">Nenhuma receita encontrada</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtradas.map((r) => (
            <div key={r.id} className="relative group">
              <CardReceita receita={r} onDeletar={() => { if (confirm('Excluir receita?')) mutDeletar.mutate(r.id); }} />
              <button
                onClick={() => setMostrarAtribuir(r)}
                className="absolute top-2 right-10 opacity-0 group-hover:opacity-100 transition-opacity bg-gray-900 border border-gray-700 rounded-lg p-1.5 shadow-sm"
                title="Atribuir a aluno"
              >
                <Users className="w-4 h-4 text-gray-400" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Modal Novo */}
      {mostrarModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="bg-gray-900 border border-gray-800 rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-800">
              <h2 className="font-bold text-white">Nova Receita</h2>
              <button onClick={() => setMostrarModal(false)} className="p-1.5 rounded-lg hover:bg-gray-800 text-gray-500 transition-colors"><X className="w-4 h-4" /></button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {erroModal && (
                <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-sm rounded-xl px-4 py-3">{erroModal}</div>
              )}
              <div>
                <label className={labelCls}>Título *</label>
                <input value={form.nome} onChange={(e) => setForm({ ...form, nome: e.target.value })} required autoFocus className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>URL do YouTube *</label>
                <input value={form.youtubeUrl} onChange={(e) => setForm({ ...form, youtubeUrl: e.target.value })} required
                  placeholder="https://youtube.com/watch?v=..." className={inputCls} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelCls}>Categoria</label>
                  <input value={form.categoria} onChange={(e) => setForm({ ...form, categoria: e.target.value })}
                    placeholder="Ex: Café da manhã..." className={inputCls} />
                </div>
                <div>
                  <label className={labelCls}>Tempo (min)</label>
                  <input type="number" min="1" value={form.tempoPreparo}
                    onChange={(e) => setForm({ ...form, tempoPreparo: e.target.value })} className={inputCls} />
                </div>
              </div>
              <div>
                <label className={labelCls}>Descrição</label>
                <textarea value={form.descricao} onChange={(e) => setForm({ ...form, descricao: e.target.value })}
                  rows={2} className={`${inputCls} resize-none`} />
              </div>
              <div>
                <label className={labelCls}>Ingredientes</label>
                <textarea value={form.ingredientes} onChange={(e) => setForm({ ...form, ingredientes: e.target.value })}
                  rows={4} placeholder="Liste os ingredientes..." className={`${inputCls} resize-none`} />
              </div>
              <div>
                <label className={labelCls}>Modo de Preparo</label>
                <textarea value={form.modoPreparo} onChange={(e) => setForm({ ...form, modoPreparo: e.target.value })}
                  rows={4} placeholder="Descreva o passo a passo..." className={`${inputCls} resize-none`} />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setMostrarModal(false)} className="flex-1 bg-gray-800 hover:bg-gray-700 border border-gray-700 text-gray-300 py-2.5 rounded-xl text-sm transition-all">Cancelar</button>
                <button type="submit" disabled={mutCriar.isPending}
                  className="flex-1 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 disabled:opacity-50 text-white py-2.5 rounded-xl text-sm font-bold flex items-center justify-center gap-1.5 transition-all">
                  {mutCriar.isPending && <Loader2 className="w-4 h-4 animate-spin" />} Salvar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Atribuir */}
      {mostrarAtribuir && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="bg-gray-900 border border-gray-800 rounded-2xl shadow-2xl w-full max-w-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-white">Atribuir Receita</h3>
              <button onClick={() => setMostrarAtribuir(null)} className="p-1.5 rounded-lg hover:bg-gray-800 text-gray-500 transition-colors"><X className="w-4 h-4" /></button>
            </div>
            <p className="text-sm text-gray-400 mb-4">"{mostrarAtribuir.nome}"</p>
            <select value={alunoSelecionado} onChange={(e) => setAlunoSelecionado(e.target.value)}
              className="w-full bg-gray-800 border border-gray-700 rounded-xl py-2.5 px-3 text-sm text-white focus:outline-none focus:border-emerald-500 transition-all mb-4">
              <option value="">Selecionar aluno...</option>
              {alunos.map((a) => <option key={a.id} value={a.id}>{a.nome}</option>)}
            </select>
            <div className="flex gap-3">
              <button onClick={() => setMostrarAtribuir(null)} className="flex-1 bg-gray-800 hover:bg-gray-700 border border-gray-700 text-gray-300 py-2.5 rounded-xl text-sm transition-all">Cancelar</button>
              <button
                onClick={() => mutAtribuir.mutate({ receitaId: mostrarAtribuir.id, alunoId: alunoSelecionado })}
                disabled={!alunoSelecionado || mutAtribuir.isPending}
                className="flex-1 bg-gradient-to-r from-emerald-500 to-teal-500 disabled:opacity-50 text-white py-2.5 rounded-xl text-sm font-bold flex items-center justify-center gap-1.5 transition-all">
                {mutAtribuir.isPending && <Loader2 className="w-4 h-4 animate-spin" />} Atribuir
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
