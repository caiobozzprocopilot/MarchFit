import { useState, useRef, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { nutricionistaServico } from '../../servicos/api';
import { useAuth } from '../../contextos/autenticacao';
import { Loader2, Upload, Save, CheckCircle2, Info } from 'lucide-react';
import type { Nutricionista } from '../../tipos';

const inputCls = 'w-full bg-gray-800 border border-gray-700 rounded-xl py-2.5 px-3 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/40 transition-all';
const labelCls = 'block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5';

export default function Config() {
  useAuth();
  const queryClient = useQueryClient();
  const fileRef = useRef<HTMLInputElement>(null);
  const [salvo, setSalvo] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [form, setForm] = useState({
    nome: '',
    email: '',
    telefone: '',
    cro: '',
    especialidade: '',
    bio: '',
    whatsapp: '',
  });

  const { data: perfil, isLoading } = useQuery<Nutricionista>({
    queryKey: ['nutricionista-perfil'],
    queryFn: () => nutricionistaServico.perfil().then((r) => r.data),
  });

  useEffect(() => {
    if (perfil) {
      setForm({
        nome: perfil.nome ?? '',
        email: perfil.email ?? '',
        telefone: perfil.telefone ?? '',
        cro: perfil.cro ?? '',
        especialidade: perfil.especialidade ?? '',
        bio: perfil.bio ?? '',
        whatsapp: perfil.whatsapp ?? '',
      });
    }
  }, [perfil]);

  const mutSalvar = useMutation({
    mutationFn: (d: any) => nutricionistaServico.atualizar(d),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['nutricionista-perfil'] });
      setSalvo(true);
      setTimeout(() => setSalvo(false), 3000);
    },
  });

  const mutFoto = useMutation({
    mutationFn: (file: File) => nutricionistaServico.atualizarFoto((() => { const fd = new FormData(); fd.append('foto', file); return fd; })()),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['nutricionista-perfil'] }),
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-40">
        <Loader2 className="w-6 h-6 animate-spin text-emerald-500" />
      </div>
    );
  }

  const campos: { key: keyof typeof form; label: string; tipo?: string; placeholder?: string }[] = [
    { key: 'nome',         label: 'Nome completo *' },
    { key: 'email',        label: 'Email *', tipo: 'email' },
    { key: 'telefone',     label: 'Telefone',    placeholder: '(11) 99999-0000' },
    { key: 'cro',          label: 'CRN / CRO',   placeholder: 'Ex: CRN3-12345' },
    { key: 'especialidade',label: 'Especialidade',placeholder: 'Ex: Nutrição esportiva' },
    { key: 'whatsapp',     label: 'WhatsApp (com DDD e código do país)', placeholder: '+5511999999999' },
  ];

  return (
    <div className="space-y-5 max-w-2xl">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-black text-white">Configurações</h1>
        <p className="text-gray-500 text-sm mt-0.5">Perfil do nutricionista</p>
      </div>

      {/* Foto de perfil */}
      <div className="relative bg-gray-900 border border-gray-800 rounded-3xl overflow-hidden">
        <div className="absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r from-emerald-500 to-teal-500" />
        <div className="p-6 flex items-center gap-5">
          <div className="relative flex-shrink-0">
            <div className="w-20 h-20 rounded-2xl overflow-hidden bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-lg shadow-emerald-500/25 ring-2 ring-emerald-500/20">
              {(previewUrl || perfil?.fotoPerfil) ? (
                <img
                  src={previewUrl ?? perfil!.fotoPerfil!}
                  alt="Perfil"
                  className="w-full h-full object-cover"
                />
              ) : (
                <span className="text-3xl font-black text-white">
                  {form.nome.charAt(0).toUpperCase() || 'N'}
                </span>
              )}
            </div>
            {mutFoto.isPending && (
              <div className="absolute inset-0 rounded-2xl bg-black/50 flex items-center justify-center">
                <Loader2 className="w-5 h-5 text-white animate-spin" />
              </div>
            )}
          </div>
          <div className="min-w-0">
            <p className="font-bold text-white text-lg truncate">{form.nome || 'Nutricionista'}</p>
            <p className="text-sm text-gray-500 truncate">{form.email}</p>
            <input ref={fileRef} type="file" accept="image/*" className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (!file) return;
                const url = URL.createObjectURL(file);
                setPreviewUrl(url);
                mutFoto.mutate(file);
              }}
            />
            <button onClick={() => fileRef.current?.click()}
              className="mt-2 flex items-center gap-1.5 text-xs text-emerald-400 hover:text-emerald-300 font-semibold transition-colors">
              <Upload className="w-3.5 h-3.5" /> Alterar foto
            </button>
          </div>
        </div>
      </div>

      {/* Formulário */}
      <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
        {salvo && (
          <div className="mb-5 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-sm rounded-xl px-4 py-3 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
            Perfil atualizado com sucesso!
          </div>
        )}

        <form onSubmit={(e) => { e.preventDefault(); mutSalvar.mutate(form); }} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {campos.map((c) => (
              <div key={c.key} className={c.key === 'whatsapp' ? 'sm:col-span-2' : ''}>
                <label className={labelCls}>{c.label}</label>
                <input
                  type={c.tipo ?? 'text'}
                  value={form[c.key]}
                  onChange={(e) => setForm({ ...form, [c.key]: e.target.value })}
                  placeholder={c.placeholder}
                  className={inputCls}
                />
              </div>
            ))}
            <div className="sm:col-span-2">
              <label className={labelCls}>Bio / Apresentação</label>
              <textarea
                value={form.bio}
                onChange={(e) => setForm({ ...form, bio: e.target.value })}
                rows={4}
                placeholder="Uma breve apresentação sobre você..."
                className={`${inputCls} resize-none`}
              />
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <button type="submit" disabled={mutSalvar.isPending}
              className="flex items-center gap-2 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 disabled:opacity-50 text-white px-6 py-2.5 rounded-xl text-sm font-bold shadow-lg shadow-emerald-500/20 transition-all">
              {mutSalvar.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              Salvar
            </button>
          </div>
        </form>
      </div>

      {/* Dica WhatsApp */}
      <div className="bg-blue-500/10 border border-blue-500/20 rounded-2xl px-5 py-4 flex gap-3">
        <Info className="w-4 h-4 text-blue-400 flex-shrink-0 mt-0.5" />
        <div className="text-sm">
          <p className="font-semibold text-blue-400 mb-0.5">Dica sobre WhatsApp</p>
          <p className="text-blue-300/70">O número de WhatsApp é usado nos botões de contato no portal dos alunos. Inclua o código do país (ex: +5511988887777).</p>
        </div>
      </div>
    </div>
  );
}
