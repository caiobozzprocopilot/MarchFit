import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contextos/autenticacao';
import { autenticacaoServico } from '../servicos/api';
import { Lock, Mail, Loader2, Leaf, Zap, User } from 'lucide-react';

type TipoLogin = 'nutricionista' | 'aluno';
type Modo = 'login' | 'cadastro';

function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" className="w-4 h-4" xmlns="http://www.w3.org/2000/svg">
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
    </svg>
  );
}

export default function PaginaLogin() {
  const [tipo, setTipo] = useState<TipoLogin>('nutricionista');
  const [modo, setModo] = useState<Modo>('login');
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [nome, setNome] = useState('');
  const [confirmarSenha, setConfirmarSenha] = useState('');
  const [erro, setErro] = useState('');
  const [carregando, setCarregando] = useState(false);
  const [carregandoGoogle, setCarregandoGoogle] = useState(false);
  const { login, estaAutenticado, usuario } = useAuth();
  const navigate = useNavigate();
  const jaNavegouRef = useRef(false);

  // Redireciona quando autenticado (guarda contra múltiplos disparos)
  useEffect(() => {
    if (estaAutenticado && usuario && !jaNavegouRef.current) {
      jaNavegouRef.current = true;
      navigate(usuario.perfil === 'NUTRICIONISTA' ? '/admin' : '/paciente', { replace: true });
    }
  }, [estaAutenticado, usuario, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErro('');
    if (modo === 'cadastro') {
      if (senha !== confirmarSenha) { setErro('As senhas n\u00e3o coincidem.'); return; }
      if (senha.length < 6) { setErro('A senha deve ter pelo menos 6 caracteres.'); return; }
      setCarregando(true);
      try {
        const { data } = await autenticacaoServico.registrarAluno({ nome, email, senha });
        login(data.token, data.usuario);
        navigate('/paciente', { replace: true });
      } catch (e: any) {
        setErro(e?.response?.data?.mensagem || 'Erro ao criar conta.');
      } finally { setCarregando(false); }
      return;
    }
    setCarregando(true);
    try {
      const fn = tipo === 'nutricionista' ? autenticacaoServico.loginNutricionista : autenticacaoServico.loginAluno;
      const { data } = await fn(email, senha);
      login(data.token, data.usuario);
      navigate(tipo === 'nutricionista' ? '/admin' : '/paciente', { replace: true });
    } catch (e: any) {
      setErro(e?.response?.data?.mensagem || 'Erro ao fazer login. Verifique suas credenciais.');
    } finally { setCarregando(false); }
  };

  const handleGoogle = async () => {
    setErro('');
    setCarregandoGoogle(true);
    try {
      await autenticacaoServico.loginGoogle();
      // onAuthStateChanged em autenticacao.tsx trata o estado; useEffect acima navega
    } catch (e: any) {
      const msg = e?.response?.data?.mensagem || '';
      if (msg) setErro(msg);
      setCarregandoGoogle(false);
    }
  };

  const inputCls = 'w-full pl-11 pr-4 py-3.5 bg-gray-900 border border-gray-800 rounded-xl text-white text-sm placeholder-gray-600 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/50 transition-all';

  return (
    <div className="min-h-screen flex">
      {/* Painel esquerdo */}
      <div className="hidden lg:flex lg:w-1/2 relative items-center justify-center overflow-hidden">
        {/* Foto de fundo em full quality */}
        <img
          src="/Adult Training Hero-3.webp"
          alt="Training"
          className="absolute inset-0 w-full h-full object-cover object-center"
        />
        {/* Overlay mínimo só para legibilidade do texto */}
        <div className="absolute inset-0 bg-black/20" />
        {/* Funde suavemente com o painel de login */}
        <div className="absolute inset-y-0 right-0 w-36 bg-gradient-to-r from-transparent to-gray-950" />

        {/* Nome centrado */}
        <div className="relative z-10 text-center select-none -translate-y-[30%]">
          <h1
            className="text-9xl text-white leading-none tracking-wide drop-shadow-[0_4px_24px_rgba(0,0,0,0.9)]"
            style={{ fontFamily: "'Barlow Condensed', sans-serif", fontStyle: 'italic', fontWeight: 800 }}
          >
            MarchFit
          </h1>
        </div>
      </div>

      {/* Painel direito */}
      <div className="flex-1 flex items-center justify-center bg-gray-950 p-6">
        <div className="w-full max-w-md">
          <div className="flex items-center gap-3 mb-10 lg:hidden">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-lg">
              <Leaf className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-black text-white">MarchFit</span>
          </div>

          <div className="mb-8">
            <h2 className="text-3xl font-black text-white">
              {modo === 'cadastro' ? 'Criar conta' : 'Bem-vindo de volta'}
            </h2>
            <p className="text-gray-400 mt-1.5 text-sm">
              {modo === 'cadastro' ? 'Crie sua conta de aluno gratuitamente' : 'Entre com sua conta para continuar'}
            </p>
          </div>

          {/* Entrar / Cadastrar */}
          <div className="flex gap-2 mb-6 bg-gray-900 rounded-2xl p-1.5">
            {([['login', 'Entrar'], ['cadastro', 'Cadastrar']] as [Modo, string][]).map(([m, label]) => (
              <button key={m} type="button" onClick={() => { setModo(m); if (m === 'cadastro') setTipo('aluno'); setErro(''); }}
                className={`flex-1 py-2.5 rounded-xl text-sm font-display uppercase tracking-wider transition-all duration-200 ${modo === m ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-lg shadow-emerald-500/25' : 'text-gray-500 hover:text-gray-300'}`}>
                {label}
              </button>
            ))}
          </div>

          {/* Nutricionista / Aluno (apenas login) */}
          {modo === 'login' && (
            <div className="flex gap-2 mb-6 bg-gray-900 rounded-2xl p-1.5">
              {(['nutricionista', 'aluno'] as TipoLogin[]).map((t) => (
                <button key={t} type="button" onClick={() => setTipo(t)}
                  className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-display uppercase tracking-wider transition-all duration-200 ${tipo === t ? 'bg-gray-800 text-white' : 'text-gray-500 hover:text-gray-300'}`}>
                  {t === 'nutricionista' ? <Leaf className="w-3.5 h-3.5" /> : <Zap className="w-3.5 h-3.5" />}
                  {t === 'nutricionista' ? 'Nutricionista' : 'Paciente'}
                </button>
              ))}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {modo === 'cadastro' && (
              <div>
                <label className="block text-xs font-display text-gray-400 uppercase tracking-wider mb-2">Nome completo</label>
                <div className="relative">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                  <input type="text" value={nome} onChange={(e) => setNome(e.target.value)} required placeholder="Seu nome" className={inputCls} />
                </div>
              </div>
            )}
            <div>
              <label className="block text-xs font-display text-gray-400 uppercase tracking-wider mb-2">Email</label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required placeholder="seu@email.com" className={inputCls} />
              </div>
            </div>
            <div>
              <label className="block text-xs font-display text-gray-400 uppercase tracking-wider mb-2">Senha</label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                <input type="password" value={senha} onChange={(e) => setSenha(e.target.value)} required placeholder="&#8226;&#8226;&#8226;&#8226;&#8226;&#8226;&#8226;&#8226;" className={inputCls} />
              </div>
            </div>
            {modo === 'cadastro' && (
              <div>
                <label className="block text-xs font-display text-gray-400 uppercase tracking-wider mb-2">Confirmar senha</label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                  <input type="password" value={confirmarSenha} onChange={(e) => setConfirmarSenha(e.target.value)} required placeholder="&#8226;&#8226;&#8226;&#8226;&#8226;&#8226;&#8226;&#8226;" className={inputCls} />
                </div>
              </div>
            )}
            {erro && (
              <div className="flex items-start gap-3 bg-red-500/10 border border-red-500/30 text-red-400 text-sm rounded-xl px-4 py-3">
                <span className="shrink-0 mt-0.5">&#9888;</span>
                <span>{erro}</span>
              </div>
            )}
            <button type="submit" disabled={carregando}
              className="w-full bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 disabled:opacity-60 text-white font-bold py-3.5 rounded-xl transition-all duration-200 flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/25 mt-2">
              {carregando && <Loader2 className="w-5 h-5 animate-spin" />}
              {carregando ? (modo === 'cadastro' ? 'Criando conta...' : 'Entrando...') : (modo === 'cadastro' ? 'Criar conta' : 'Entrar')}
            </button>
          </form>

          <div className="flex items-center gap-3 my-5">
            <div className="flex-1 h-px bg-gray-800" />
            <span className="text-xs text-gray-600 font-medium">ou</span>
            <div className="flex-1 h-px bg-gray-800" />
          </div>

          <button type="button" onClick={handleGoogle} disabled={carregandoGoogle}
            className="w-full flex items-center justify-center gap-3 bg-gray-900 hover:bg-gray-800 border border-gray-700 hover:border-gray-600 text-white font-semibold py-3.5 rounded-xl transition-all duration-200 disabled:opacity-60">
            {carregandoGoogle ? <Loader2 className="w-4 h-4 animate-spin" /> : <GoogleIcon />}
            {carregandoGoogle ? 'Aguarde...' : 'Continuar com Google'}
          </button>

          {import.meta.env.DEV && (
            <div className="mt-6 pt-6 border-t border-gray-800">
              <p className="text-xs text-gray-600 text-center mb-3">Acesso rápido (dev)</p>
              <button type="button"
                onClick={() => { setEmail('admin@nutrisistema.com'); setSenha('nutri123'); setTipo('nutricionista'); setModo('login'); }}
                className="w-full text-xs text-emerald-500 hover:text-emerald-400 py-2 bg-gray-900 rounded-xl border border-gray-800 transition-colors">
                Preencher credenciais de admin
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}