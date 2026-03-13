import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { alunosServico } from '../../servicos/api';
import { Search, Plus, ChevronRight, Loader2, X, Lock, LockOpen, Trash2, AlertTriangle } from 'lucide-react';
import type { Aluno } from '../../tipos';

// Máscara telefone: (11) 91234-5678 ou (11) 1234-5678
function maskTelefone(v: string): string {
  const d = v.replace(/\D/g, '').slice(0, 11);
  if (d.length === 0) return '';
  if (d.length <= 2) return `(${d}`;
  if (d.length <= 6) return `(${d.slice(0,2)}) ${d.slice(2)}`;
  if (d.length <= 10) return `(${d.slice(0,2)}) ${d.slice(2,6)}-${d.slice(6)}`;
  return `(${d.slice(0,2)}) ${d.slice(2,7)}-${d.slice(7)}`;
}

// Máscara data DD/MM/AAAA → valor interno YYYY-MM-DD
function maskData(v: string): string {
  const d = v.replace(/\D/g, '').slice(0, 8);
  if (d.length <= 2) return d;
  if (d.length <= 4) return `${d.slice(0,2)}/${d.slice(2)}`;
  return `${d.slice(0,2)}/${d.slice(2,4)}/${d.slice(4)}`;
}
function displayToIso(display: string): string {
  const parts = display.split('/');
  if (parts.length === 3 && parts[2].length === 4) return `${parts[2]}-${parts[1]}-${parts[0]}`;
  return '';
}
function isoToDisplay(iso: string): string {
  if (!iso) return '';
  const parts = iso.split('-');
  if (parts.length === 3) return `${parts[2]}/${parts[1]}/${parts[0]}`;
  return iso;
}

interface FormAluno {
  nome: string;
  email: string;
  senha: string;
  telefone: string;
  dataNascimento: string;
  objetivos: string;
}

const formVazio: FormAluno = {
  nome: '',
  email: '',
  senha: '',
  telefone: '',
  dataNascimento: '',
  objetivos: '',
};

export default function Alunos() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [busca, setBusca] = useState('');
  const [mostrarModal, setMostrarModal] = useState(false);
  const [form, setForm] = useState<FormAluno>(formVazio);
  const [dataDisplay, setDataDisplay] = useState('');
  const [erroForm, setErroForm] = useState('');
  const [confirmarRemover, setConfirmarRemover] = useState<Aluno | null>(null);

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

  const mutToggleAtivo = useMutation({
    mutationFn: ({ id, ativo }: { id: string; ativo: boolean }) => alunosServico.toggleAtivo(id, ativo),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['alunos'] }),
  });

  const mutRemover = useMutation({
    mutationFn: (id: string) => alunosServico.remover(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['alunos'] });
      setConfirmarRemover(null);
    },
  });

  const alunosFiltrados = alunos.filter((a) =>
    a.nome.toLowerCase().includes(busca.toLowerCase()) ||
    a.email?.toLowerCase().includes(busca.toLowerCase())
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErroForm('');
    if (!form.nome || !form.email || !form.senha) {
      setErroForm('Nome, email e senha são obrigatórios.');
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
          onClick={() => { setForm(formVazio); setDataDisplay(''); setErroForm(''); setMostrarModal(true); }}
          className="flex items-center gap-2 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-white px-4 py-2.5 rounded-xl text-sm font-bold shadow-lg shadow-emerald-500/20 transition-all"
        >
          <Plus className="w-4 h-4" /> Novo Paciente
        </button>
      </div>

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
            <button
              key={aluno.id}
              onClick={() => navigate(`/admin/pacientes/${aluno.id}`)}
              className={`w-full flex items-center justify-between px-5 py-4 hover:bg-gray-800/60 transition-colors text-left group ${i !== alunosFiltrados.length - 1 ? 'border-b border-gray-800/60' : ''}`}
            >
              <div className="flex items-center gap-3">
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
                <div>
                  <p className="font-display tracking-wide text-white text-sm">{aluno.nome}</p>
                  <p className="text-xs text-gray-500">{aluno.email}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
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
                  onClick={(e) => { e.stopPropagation(); mutToggleAtivo.mutate({ id: aluno.id, ativo: !aluno.ativo }); }}
                  className={`p-1.5 rounded-lg border transition-colors ${
                    aluno.ativo
                      ? 'border-amber-500/30 text-amber-400 hover:bg-amber-500/10'
                      : 'border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10'
                  }`}
                >
                  {aluno.ativo ? <Lock className="w-3.5 h-3.5" /> : <LockOpen className="w-3.5 h-3.5" />}
                </button>
                <button
                  type="button"
                  title="Remover paciente"
                  onClick={(e) => { e.stopPropagation(); setConfirmarRemover(aluno); }}
                  className="p-1.5 rounded-lg border border-red-500/30 text-red-400 hover:bg-red-500/10 transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
                <ChevronRight className="w-4 h-4 text-gray-700 group-hover:text-gray-400 transition-colors" />
              </div>
            </button>
          ))}
        </div>
      )}

      {/* Modal Confirmar Remoção */}
      {confirmarRemover && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="bg-gray-900 border border-gray-800 rounded-2xl shadow-2xl w-full max-w-sm p-6 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-red-500/15 flex items-center justify-center">
                <AlertTriangle className="w-5 h-5 text-red-400" />
              </div>
              <div>
                <p className="font-bold text-white text-sm">Remover paciente</p>
                <p className="text-xs text-gray-500">Esta ação não pode ser desfeita</p>
              </div>
            </div>
            <p className="text-sm text-gray-300">
              Tem certeza que deseja remover <span className="text-white font-semibold">{confirmarRemover.nome}</span>? Todos os dados do paciente serão excluídos permanentemente.
            </p>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setConfirmarRemover(null)}
                className="flex-1 bg-gray-800 hover:bg-gray-700 border border-gray-700 text-gray-300 py-2.5 rounded-xl text-sm transition-all"
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={mutRemover.isPending}
                onClick={() => mutRemover.mutate(confirmarRemover.id)}
                className="flex-1 bg-red-600 hover:bg-red-500 disabled:opacity-50 text-white py-2.5 rounded-xl text-sm font-bold flex items-center justify-center gap-1.5 transition-all"
              >
                {mutRemover.isPending && <Loader2 className="w-4 h-4 animate-spin" />}
                Remover
              </button>
            </div>
          </div>
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
                  <input type="password" value={form.senha} onChange={(e) => setForm({ ...form, senha: e.target.value })} className={inputCls} required />
                </div>

                <div>
                  <label className={labelCls}>Telefone</label>
                  <input
                    value={form.telefone}
                    onChange={(e) => setForm({ ...form, telefone: maskTelefone(e.target.value) })}
                    placeholder="(11) 99999-0000"
                    inputMode="numeric"
                    className={inputCls}
                  />
                </div>

                <div>
                  <label className={labelCls}>Data de Nascimento</label>
                  <input
                    value={dataDisplay}
                    onChange={(e) => {
                      const masked = maskData(e.target.value);
                      setDataDisplay(masked);
                      const iso = displayToIso(masked);
                      setForm((f) => ({ ...f, dataNascimento: iso }));
                    }}
                    placeholder="DD/MM/AAAA"
                    inputMode="numeric"
                    maxLength={10}
                    className={inputCls}
                  />
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
    </div>
  );
}
