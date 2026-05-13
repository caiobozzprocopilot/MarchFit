import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { alunosServico } from '../../servicos/api';
import { Search, Plus, ChevronRight, Loader2, X, Lock, Unlock, Trash2, AlertTriangle, Filter, UserCheck } from 'lucide-react';
import { differenceInDays } from 'date-fns';
import type { Aluno } from '../../tipos';

interface FormAluno {
  nome: string;
  email: string;
  senha: string;
  telefone: string;
  objetivos: string;
}

const maskTelefone = (v: string) => {
  const d = v.replace(/\D/g, '').slice(0, 11);
  if (!d.length) return '';
  if (d.length <= 2) return `(${d}`;
  if (d.length <= 7) return `(${d.slice(0, 2)}) ${d.slice(2)}`;
  return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
};

const formVazio: FormAluno = {
  nome: '',
  email: '',
  senha: '',
  telefone: '',
  objetivos: '',
};

export default function Alunos() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [busca, setBusca] = useState('');
  const [filtroAtivo, setFiltroAtivo] = useState<'todos' | 'expirando' | 'expirados' | 'inativos'>('todos');
  const [mostrarModal, setMostrarModal] = useState(false);
  const [form, setForm] = useState<FormAluno>(formVazio);
  const [erroForm, setErroForm] = useState('');
  const [alunoParaDeletar, setAlunoParaDeletar] = useState<{ id: string; nome: string } | null>(null);

  const { data: alunos = [], isLoading } = useQuery<Aluno[]>({
    queryKey: ['alunos'],
    queryFn: () => alunosServico.listar().then((r) => r.data),
  });

  const mutCriar = useMutation({
    mutationFn: (d: FormAluno) => alunosServico.criar(d),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['alunos'] });
      setMostrarModal(false);
      setForm(formVazio);
    },
    onError: (e: any) => {
      setErroForm(e?.response?.data?.mensagem || 'Erro ao criar aluno.');
    },
  });

  const mutToggle = useMutation({
    mutationFn: ({ id, ativo }: { id: string; ativo: boolean }) => alunosServico.toggleAtivo(id, ativo),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['alunos'] }),
  });

  const mutRemover = useMutation({
    mutationFn: (id: string) => alunosServico.remover(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['alunos'] });
      setAlunoParaDeletar(null);
    },
  });

  const { data: alunosPendentes = [] } = useQuery<Aluno[]>({
    queryKey: ['alunos-pendentes'],
    queryFn: () => alunosServico.listarPendentes().then((r) => r.data),
  });

  const mutAprovar = useMutation({
    mutationFn: (id: string) => alunosServico.aprovarAluno(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['alunos'] });
      queryClient.invalidateQueries({ queryKey: ['alunos-pendentes'] });
    },
  });

  const hoje = useMemo(() => new Date(), []);

  const alunosFiltrados = useMemo(() => {
    let lista = alunos.filter((a) =>
      a.nome.toLowerCase().includes(busca.toLowerCase()) ||
      a.email?.toLowerCase().includes(busca.toLowerCase())
    );
    if (filtroAtivo === 'expirando') {
      lista = lista.filter((a) => {
        if (!a.dataExpiracao) return false;
        const dias = differenceInDays(new Date(a.dataExpiracao), hoje);
        return dias >= 0 && dias <= 30;
      });
    } else if (filtroAtivo === 'expirados') {
      lista = lista.filter((a) => {
        if (!a.dataExpiracao) return false;
        return differenceInDays(new Date(a.dataExpiracao), hoje) < 0;
      });
    } else if (filtroAtivo === 'inativos') {
      lista = lista.filter((a) => !a.ativo);
    }
    return lista;
  }, [alunos, busca, filtroAtivo, hoje]);

  const contagens = useMemo(() => ({
    expirando: alunos.filter((a) => {
      if (!a.dataExpiracao) return false;
      const d = differenceInDays(new Date(a.dataExpiracao), hoje);
      return d >= 0 && d <= 30;
    }).length,
    expirados: alunos.filter((a) => a.dataExpiracao && differenceInDays(new Date(a.dataExpiracao), hoje) < 0).length,
    inativos: alunos.filter((a) => !a.ativo).length,
  }), [alunos, hoje]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErroForm('');
    if (!form.nome || !form.email || !form.senha) {
      setErroForm('Nome, email e senha são obrigatórios.');
      return;
    }
    if (form.senha.length < 6) {
      setErroForm('A senha deve ter pelo menos 6 caracteres.');
      return;
    }
    mutCriar.mutate(form);
  };

  const inputCls = 'w-full bg-gray-800 border border-gray-700 rounded-xl py-2.5 px-3 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/40 transition-all';
  const labelCls = 'block text-xs font-display text-gray-400 uppercase tracking-wider mb-1.5';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-black text-white">Pacientes</h1>
          <p className="text-gray-500 text-sm mt-0.5">{alunos.length} aluno{alunos.length !== 1 && 's'} cadastrado{alunos.length !== 1 && 's'}</p>
        </div>
        <button
          onClick={() => { setForm(formVazio); setErroForm(''); setMostrarModal(true); }}
          className="flex items-center gap-2 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-white px-4 py-2.5 rounded-xl text-sm font-bold shadow-lg shadow-emerald-500/20 transition-all"
        >
          <Plus className="w-4 h-4" /> Novo Paciente
        </button>
      </div>

      {/* Solicitações via Google */}
      {alunosPendentes.length > 0 && (
        <div className="bg-amber-500/10 border border-amber-500/30 rounded-2xl overflow-hidden">
          <div className="flex items-center gap-2 px-5 py-3 border-b border-amber-500/20">
            <UserCheck className="w-4 h-4 text-amber-400" />
            <span className="text-sm font-bold text-amber-400">Solicitações de acesso ({alunosPendentes.length})</span>
          </div>
          {alunosPendentes.map((aluno, i) => (
            <div
              key={aluno.id}
              className={`flex items-center justify-between px-5 py-3.5 ${i !== alunosPendentes.length - 1 ? 'border-b border-amber-500/10' : ''}`}
            >
              <div className="flex items-center gap-3 min-w-0">
                {aluno.fotoPerfil ? (
                  <img src={`data:image/jpeg;base64,${aluno.fotoPerfil}`} alt={aluno.nome} className="w-9 h-9 rounded-full object-cover" />
                ) : (
                  <div className="w-9 h-9 rounded-full bg-amber-500/15 flex items-center justify-center text-amber-400 font-bold text-sm border border-amber-500/20">
                    {aluno.nome.charAt(0).toUpperCase()}
                  </div>
                )}
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-white truncate">{aluno.nome}</p>
                  <p className="text-xs text-gray-500 truncate">{aluno.email}</p>
                </div>
              </div>
              <div className="flex items-center gap-2 ml-3 shrink-0">
                <button
                  type="button"
                  onClick={() => mutAprovar.mutate(aluno.id)}
                  disabled={mutAprovar.isPending}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 border border-emerald-500/30 rounded-lg text-xs font-bold transition-all disabled:opacity-50"
                >
                  {mutAprovar.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <UserCheck className="w-3.5 h-3.5" />}
                  Aprovar
                </button>
                <button
                  type="button"
                  onClick={() => setAlunoParaDeletar({ id: aluno.id, nome: aluno.nome })}
                  className="p-1.5 rounded-lg text-gray-500 hover:text-red-400 hover:bg-red-400/10 transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Busca */}
      <div className="relative">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
        <input
          type="text"
          placeholder="Buscar por nome ou email..."
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 bg-gray-900 border border-gray-800 rounded-xl text-sm text-white placeholder-gray-600 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/40 transition-all"
        />
      </div>

      {/* Filtros */}
      <div className="flex gap-2 flex-wrap">
        {([
          { key: 'todos',      label: 'Todos',      count: alunos.length,           cor: 'emerald' },
          { key: 'expirando',  label: 'Expirando',  count: contagens.expirando,     cor: 'amber'   },
          { key: 'expirados',  label: 'Expirados',  count: contagens.expirados,     cor: 'red'     },
          { key: 'inativos',   label: 'Inativos',   count: contagens.inativos,      cor: 'gray'    },
        ] as const).map((f) => (
          <button
            key={f.key}
            onClick={() => setFiltroAtivo(f.key)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border transition-all ${
              filtroAtivo === f.key
                ? f.cor === 'emerald' ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40'
                  : f.cor === 'amber' ? 'bg-amber-500/20 text-amber-400 border-amber-500/40'
                  : f.cor === 'red'   ? 'bg-red-500/20 text-red-400 border-red-500/40'
                  : 'bg-gray-700 text-gray-300 border-gray-600'
                : 'bg-gray-900 text-gray-500 border-gray-800 hover:border-gray-700'
            }`}
          >
            {f.label}
            {f.count > 0 && <span className="bg-gray-800 rounded-full px-1.5">{f.count}</span>}
          </button>
        ))}
      </div>

      {/* Lista */}
      {isLoading ? (
        <div className="flex items-center justify-center h-40">
          <Loader2 className="w-7 h-7 animate-spin text-emerald-500" />
        </div>
      ) : alunosFiltrados.length === 0 ? (
        <div className="text-center py-16 text-gray-600">
          <p className="text-base font-medium">Nenhum paciente encontrado</p>
          <p className="text-sm mt-1">Cadastre o primeiro aluno para começar</p>
        </div>
      ) : (
        <div className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden">
          {alunosFiltrados.map((aluno, i) => (
            <div
              key={aluno.id}
              className={`w-full flex items-center justify-between px-5 py-4 hover:bg-gray-800/60 transition-colors group ${i !== alunosFiltrados.length - 1 ? 'border-b border-gray-800/60' : ''}`}
            >
              <button
                type="button"
                onClick={() => navigate(`/admin/pacientes/${aluno.id}`)}
                className="flex items-center gap-3 flex-1 text-left min-w-0"
              >
                {aluno.fotoPerfil ? (
                  <img
                    src={`data:image/jpeg;base64,${aluno.fotoPerfil}`}
                    alt={aluno.nome}
                    className="w-10 h-10 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-emerald-500/15 flex items-center justify-center text-emerald-400 font-bold text-sm border border-emerald-500/20">
                    {aluno.nome.charAt(0).toUpperCase()}
                  </div>
                )}
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <p className="font-display tracking-wide text-white text-sm truncate">{aluno.nome}</p>
                    {(() => {
                      if (!aluno.dataExpiracao) return null;
                      const dias = differenceInDays(new Date(aluno.dataExpiracao), new Date());
                      if (dias < 0) return <AlertTriangle className="w-3.5 h-3.5 text-red-400 flex-shrink-0" title="Plano expirado" />;
                      if (dias <= 7) return <AlertTriangle className="w-3.5 h-3.5 text-orange-400 flex-shrink-0" title={`Expira em ${dias} dias`} />;
                      return null;
                    })()}
                  </div>
                  <p className="text-xs text-gray-500 truncate">{aluno.email}</p>
                </div>
              </button>
              <div className="flex items-center gap-2 ml-3 shrink-0">
                <span className={`px-2.5 py-1 rounded-full text-xs font-display uppercase tracking-wider ${
                  aluno.ativo
                    ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                    : 'bg-gray-800 text-gray-500 border border-gray-700'
                }`}>
                  {aluno.ativo ? 'Ativo' : 'Inativo'}
                </span>
                <button
                  type="button"
                  title={aluno.ativo ? 'Bloquear acesso' : 'Liberar acesso'}
                  onClick={() => mutToggle.mutate({ id: aluno.id, ativo: !aluno.ativo })}
                  className="p-1.5 rounded-lg text-gray-500 hover:text-amber-400 hover:bg-amber-400/10 transition-colors"
                >
                  {aluno.ativo ? <Lock className="w-3.5 h-3.5" /> : <Unlock className="w-3.5 h-3.5" />}
                </button>
                <button
                  type="button"
                  title="Remover paciente"
                  onClick={() => setAlunoParaDeletar({ id: aluno.id, nome: aluno.nome })}
                  className="p-1.5 rounded-lg text-gray-500 hover:text-red-400 hover:bg-red-400/10 transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
                <ChevronRight className="w-4 h-4 text-gray-700 group-hover:text-gray-400 transition-colors" />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal Novo Paciente */}
      {mostrarModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="bg-gray-900 border border-gray-800 rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-800">
              <h2 className="font-bold text-white">Novo Paciente</h2>
              <button onClick={() => setMostrarModal(false)} className="p-1.5 rounded-lg hover:bg-gray-800 text-gray-500 transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {erroForm && (
                <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-sm rounded-xl px-4 py-3">
                  {erroForm}
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <label className={labelCls}>Nome *</label>
                  <input value={form.nome} onChange={(e) => setForm({ ...form, nome: e.target.value })} className={inputCls} required autoFocus />
                </div>

                <div>
                  <label className={labelCls}>Email *</label>
                  <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className={inputCls} required />
                </div>

                <div>
                  <label className={labelCls}>Senha *</label>
                  <input type="password" value={form.senha} onChange={(e) => setForm({ ...form, senha: e.target.value })} className={inputCls} minLength={6} required />
                </div>

                <div>
                  <label className={labelCls}>Telefone</label>
                  <input value={form.telefone} onChange={(e) => setForm({ ...form, telefone: maskTelefone(e.target.value) })} placeholder="(11) 99999-0000" className={inputCls} />
                </div>

                <div className="sm:col-span-2">
                  <label className={labelCls}>Objetivo</label>
                  <textarea value={form.objetivos} onChange={(e) => setForm({ ...form, objetivos: e.target.value })} rows={2} placeholder="Ex: Emagrecimento, Hipertrofia..." className={`${inputCls} resize-none`} />
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setMostrarModal(false)} className="flex-1 bg-gray-800 hover:bg-gray-700 border border-gray-700 text-gray-300 py-2.5 rounded-xl text-sm transition-all">
                  Cancelar
                </button>
                <button type="submit" disabled={mutCriar.isPending} className="flex-1 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 disabled:opacity-50 text-white py-2.5 rounded-xl text-sm font-bold flex items-center justify-center gap-1.5 transition-all">
                  {mutCriar.isPending && <Loader2 className="w-4 h-4 animate-spin" />} Cadastrar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal de confirmação de exclusão */}
      {alunoParaDeletar && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="bg-gray-900 border border-gray-800 rounded-2xl shadow-2xl w-full max-w-sm p-6">
            <h2 className="font-bold text-white mb-2">Remover paciente?</h2>
            <p className="text-sm text-gray-400 mb-6">
              Tem certeza que deseja remover <span className="text-white font-semibold">{alunoParaDeletar.nome}</span>?{' '}
              Esta ação não pode ser desfeita.
            </p>
            <div className="flex gap-3">
              <button type="button" onClick={() => setAlunoParaDeletar(null)}
                className="flex-1 bg-gray-800 hover:bg-gray-700 border border-gray-700 text-gray-300 py-2.5 rounded-xl text-sm transition-all">
                Cancelar
              </button>
              <button type="button" onClick={() => mutRemover.mutate(alunoParaDeletar.id)}
                disabled={mutRemover.isPending}
                className="flex-1 bg-red-600 hover:bg-red-500 disabled:opacity-50 text-white py-2.5 rounded-xl text-sm font-bold flex items-center justify-center gap-1.5 transition-all">
                {mutRemover.isPending && <Loader2 className="w-4 h-4 animate-spin" />}
                Remover
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
