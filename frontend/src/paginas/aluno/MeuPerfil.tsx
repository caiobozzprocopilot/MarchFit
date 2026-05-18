import { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../../contextos/autenticacao';
import { alunosServico, autenticacaoServico } from '../../servicos/api';
import { User, Phone, Mail, Lock, CheckCircle, Loader2, ArrowLeft, Camera } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import type { Aluno } from '../../tipos';

const inputCls =
  'w-full bg-gray-800 border border-gray-700 rounded-xl py-2.5 px-3 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/40 transition-all';
const labelCls = 'block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5';

const maskTelefone = (v: string) => {
  const d = v.replace(/\D/g, '').slice(0, 11);
  if (!d.length) return '';
  if (d.length <= 2) return `(${d}`;
  if (d.length <= 7) return `(${d.slice(0, 2)}) ${d.slice(2)}`;
  return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
};

export default function MeuPerfil() {
  const { usuario, token, login } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const alunoId = usuario?.id!;
  const fileRef = useRef<HTMLInputElement>(null);

  const [nome, setNome] = useState('');
  const [telefone, setTelefone] = useState('');
  const [salvo, setSalvo] = useState(false);
  const [emailEnviado, setEmailEnviado] = useState(false);

  const { data: aluno, isLoading } = useQuery<Aluno>({
    queryKey: ['aluno-meu-perfil', alunoId],
    queryFn: () => alunosServico.buscar(alunoId).then((r) => r.data),
    enabled: !!alunoId,
  });

  useEffect(() => {
    if (aluno) {
      setNome((aluno as any).nome ?? '');
      setTelefone((aluno as any).telefone ?? '');
    }
  }, [aluno]);

  const mutAtualizar = useMutation({
    mutationFn: () => alunosServico.atualizar(alunoId, { nome, telefone }),
    onSuccess: () => {
      login(token!, { ...usuario!, nome });
      setSalvo(true);
      setTimeout(() => setSalvo(false), 3000);
    },
  });

  const mutFoto = useMutation({
    mutationFn: (file: File) => {
      const fd = new FormData();
      fd.append('foto', file);
      return alunosServico.atualizarFoto(alunoId, fd);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['aluno-meu-perfil', alunoId] }),
  });

  const mutSenha = useMutation({
    mutationFn: () => autenticacaoServico.esqueceuSenha(usuario!.email),
    onSuccess: () => setEmailEnviado(true),
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-40">
        <Loader2 className="w-6 h-6 animate-spin text-emerald-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => navigate(-1)}
          className="p-2 rounded-xl bg-gray-800 hover:bg-gray-700 text-gray-400 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div>
          <h1 className="text-2xl font-black text-white">Meu Perfil</h1>
          <p className="text-gray-500 text-sm mt-0.5">Edite suas informações pessoais</p>
        </div>
      </div>

      {/* Avatar */}
      <div className="flex items-center gap-4 bg-gray-900 border border-gray-800 rounded-2xl p-5">
        <div className="relative flex-shrink-0">
          {(aluno as any)?.fotoPerfil ? (
            <img
              src={(aluno as any).fotoPerfil}
              alt={nome}
              className="w-16 h-16 rounded-2xl object-cover shadow-lg"
            />
          ) : (
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center shadow-lg shadow-emerald-500/20">
              <span className="text-white font-black text-2xl">{nome?.[0]?.toUpperCase() ?? '?'}</span>
            </div>
          )}
          <button
            onClick={() => fileRef.current?.click()}
            disabled={mutFoto.isPending}
            className="absolute -bottom-1.5 -right-1.5 w-7 h-7 rounded-full bg-emerald-500 hover:bg-emerald-400 border-2 border-gray-900 flex items-center justify-center transition-colors"
            title="Alterar foto"
          >
            {mutFoto.isPending
              ? <Loader2 className="w-3 h-3 text-white animate-spin" />
              : <Camera className="w-3 h-3 text-white" />}
          </button>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) mutFoto.mutate(file);
              e.target.value = '';
            }}
          />
        </div>
        <div>
          <p className="font-bold text-white text-lg leading-tight">{nome || '—'}</p>
          <p className="text-gray-500 text-sm">{usuario?.email}</p>
          <p className="text-xs text-gray-600 mt-1">Toque na câmera para alterar a foto</p>
        </div>
      </div>

      {/* Dados pessoais */}
      <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5 space-y-4">
        <h2 className="font-display uppercase tracking-wider text-xs text-gray-500">Dados pessoais</h2>

        <div>
          <label className={labelCls}>
            <User className="w-3 h-3 inline mr-1" /> Nome completo
          </label>
          <input
            value={nome}
            onChange={(e) => setNome(e.target.value)}
            className={inputCls}
            placeholder="Seu nome"
          />
        </div>

        <div>
          <label className={labelCls}>
            <Mail className="w-3 h-3 inline mr-1" /> E-mail
          </label>
          <input
            value={usuario?.email ?? ''}
            disabled
            className={`${inputCls} opacity-50 cursor-not-allowed`}
          />
          <p className="text-[11px] text-gray-600 mt-1">O e-mail não pode ser alterado.</p>
        </div>

        <div>
          <label className={labelCls}>
            <Phone className="w-3 h-3 inline mr-1" /> Telefone / WhatsApp
          </label>
          <input
            value={telefone}
            onChange={(e) => setTelefone(maskTelefone(e.target.value))}
            className={inputCls}
            placeholder="(00) 00000-0000"
            inputMode="numeric"
          />
        </div>

        <button
          onClick={() => mutAtualizar.mutate()}
          disabled={mutAtualizar.isPending || !nome.trim()}
          className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 disabled:opacity-50 text-white py-3 rounded-xl text-sm font-bold transition-all shadow-lg shadow-emerald-500/20"
        >
          {mutAtualizar.isPending ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : salvo ? (
            <CheckCircle className="w-4 h-4" />
          ) : null}
          {mutAtualizar.isPending ? 'Salvando...' : salvo ? 'Salvo!' : 'Salvar alterações'}
        </button>
      </div>

      {/* Segurança */}
      <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5 space-y-4">
        <h2 className="font-display uppercase tracking-wider text-xs text-gray-500">Segurança</h2>
        <div>
          <p className="text-sm text-gray-300 mb-1">Alterar senha</p>
          <p className="text-xs text-gray-600 mb-3">
            Enviaremos um e-mail para <span className="text-gray-500">{usuario?.email}</span> com um link para redefinir sua senha.
          </p>
          {emailEnviado ? (
            <div className="flex items-center gap-2 text-emerald-400 text-sm font-semibold">
              <CheckCircle className="w-4 h-4" />
              E-mail enviado! Verifique sua caixa de entrada.
            </div>
          ) : (
            <button
              onClick={() => mutSenha.mutate()}
              disabled={mutSenha.isPending}
              className="flex items-center gap-2 px-4 py-2.5 bg-gray-800 hover:bg-gray-700 border border-gray-700 text-gray-300 rounded-xl text-sm font-medium transition-all"
            >
              {mutSenha.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Lock className="w-4 h-4" />}
              Enviar link de redefinição
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
