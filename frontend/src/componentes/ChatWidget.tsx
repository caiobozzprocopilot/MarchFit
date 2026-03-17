import { useState, useEffect, useRef } from 'react';
import { MessageSquare, X, Send, Loader2 } from 'lucide-react';
import { useAuth } from '../contextos/autenticacao';
import { chatServico } from '../servicos/api';
import { useQuery } from '@tanstack/react-query';
import type { MensagemChat } from '../tipos';
import { format, parseISO, isToday, isYesterday } from 'date-fns';
import { ptBR } from 'date-fns/locale';

// ── Helpers ───────────────────────────────────────────────────────
function formatHora(iso: string) {
  try {
    const d = parseISO(iso);
    if (isToday(d)) return format(d, 'HH:mm');
    if (isYesterday(d)) return `Ontem ${format(d, 'HH:mm')}`;
    return format(d, "dd/MM 'às' HH:mm", { locale: ptBR });
  } catch {
    return '';
  }
}

// ── Bubble ────────────────────────────────────────────────────────
function BolhaMensagem({ msg }: { msg: MensagemChat }) {
  const ehAluno = msg.remetente === 'aluno';
  return (
    <div className={`flex ${ehAluno ? 'justify-end' : 'justify-start'} mb-2`}>
      <div
        className={`max-w-[80%] rounded-2xl px-3.5 py-2.5 ${
          ehAluno
            ? 'bg-emerald-500 text-white rounded-br-sm'
            : 'bg-gray-800 border border-gray-700 text-white rounded-bl-sm'
        }`}
      >
        <p className="text-sm leading-relaxed whitespace-pre-wrap break-words">{msg.texto}</p>
        <p className={`text-[10px] mt-1 text-right ${ehAluno ? 'text-emerald-200' : 'text-gray-500'}`}>
          {formatHora(msg.criadoEm)}
          {msg.fonte === 'whatsapp' && ' · WhatsApp'}
        </p>
      </div>
    </div>
  );
}

// ── ChatWidget (aluno-side) ───────────────────────────────────────
export default function ChatWidget() {
  const { usuario } = useAuth();
  const alunoId = usuario?.id ?? '';

  const [aberto, setAberto] = useState(false);
  const [mensagens, setMensagens] = useState<MensagemChat[]>([]);
  const [texto, setTexto] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [naoLidas, setNaoLidas] = useState(0);

  const fimRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Load nutricionista info for the header
  const { data: nutriInfo } = useQuery({
    queryKey: ['nutri-do-aluno', alunoId],
    queryFn: () => chatServico.buscarNutriDoAluno(alunoId).then((r) => r.data),
    enabled: !!alunoId,
    staleTime: 10 * 60 * 1000,
  });

  // Real-time messages listener
  useEffect(() => {
    if (!alunoId) return;
    const unsub = chatServico.ouvirMensagens(alunoId, (msgs) => {
      setMensagens(msgs);
      if (!aberto) {
        setNaoLidas(msgs.filter((m) => !m.lida && m.remetente === 'nutricionista').length);
      }
    });
    return unsub;
  }, [alunoId]); // eslint-disable-line react-hooks/exhaustive-deps

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    if (aberto) fimRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [mensagens, aberto]);

  // Mark messages as read & focus input when chat opens
  useEffect(() => {
    if (aberto && alunoId && naoLidas > 0) {
      chatServico.marcarLidas(alunoId, 'aluno').catch(() => {});
      setNaoLidas(0);
    }
    if (aberto) setTimeout(() => inputRef.current?.focus(), 300);
  }, [aberto]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleEnviar = async () => {
    if (!texto.trim() || !alunoId || enviando) return;
    const t = texto.trim();
    setTexto('');
    setEnviando(true);
    try {
      await chatServico.enviarMensagem(alunoId, t, 'aluno', {
        alunoNome: (usuario as any)?.nome ?? '',
        nutricionistaId: (nutriInfo as any)?.id ?? '',
      });
    } finally {
      setEnviando(false);
    }
  };

  if (!alunoId) return null;

  return (
    <>
      {/* Floating button */}
      {!aberto && (
        <button
          onClick={() => setAberto(true)}
          title="Chat com Nutricionista"
          aria-label="Abrir chat"
          className="fixed bottom-24 right-4 z-20 w-12 h-12 bg-gradient-to-br from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 rounded-full flex items-center justify-center shadow-xl shadow-emerald-500/30 transition-all hover:scale-110"
        >
          <MessageSquare className="w-5 h-5 text-white" />
          {naoLidas > 0 && (
            <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] bg-red-500 rounded-full text-white text-[10px] font-bold flex items-center justify-center px-1 leading-none">
              {naoLidas > 9 ? '9+' : naoLidas}
            </span>
          )}
        </button>
      )}

      {/* Full-screen chat panel */}
      {aberto && (
        <div className="fixed inset-0 z-50 bg-gray-950 flex flex-col">
          {/* Header */}
          <header className="bg-gray-900 border-b border-gray-800 px-4 py-3 flex items-center gap-3 flex-shrink-0">
            <button
              onClick={() => setAberto(false)}
              aria-label="Fechar chat"
              className="p-2 rounded-xl text-gray-500 hover:text-white hover:bg-gray-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center flex-shrink-0 overflow-hidden">
              {(nutriInfo as any)?.fotoPerfil ? (
                <img
                  src={(nutriInfo as any).fotoPerfil}
                  alt=""
                  className="w-full h-full object-cover"
                />
              ) : (
                <span className="text-white font-bold text-sm">
                  {((nutriInfo as any)?.nome ?? 'N')[0].toUpperCase()}
                </span>
              )}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-white truncate">
                {(nutriInfo as any)?.nome ?? 'Nutricionista'}
              </p>
              <p className="text-xs text-emerald-400 truncate">
                {(nutriInfo as any)?.especialidade ?? 'Sua nutricionista'}
              </p>
            </div>
          </header>

          {/* Messages area */}
          <main className="flex-1 overflow-y-auto p-4">
            {mensagens.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center pb-8">
                <div className="w-16 h-16 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mb-4">
                  <MessageSquare className="w-7 h-7 text-emerald-500/50" />
                </div>
                <p className="text-gray-400 text-sm font-semibold">Nenhuma mensagem ainda</p>
                <p className="text-gray-600 text-xs mt-1 max-w-[220px]">
                  Envie uma mensagem para{' '}
                  {(nutriInfo as any)?.nome?.split(' ')[0] ?? 'seu nutricionista'}
                </p>
              </div>
            ) : (
              mensagens.map((m) => <BolhaMensagem key={m.id} msg={m} />)
            )}
            <div ref={fimRef} />
          </main>

          {/* Input bar */}
          <div className="flex-shrink-0 bg-gray-900 border-t border-gray-800 px-3 py-3 flex items-center gap-2 safe-area-pb">
            <input
              ref={inputRef}
              type="text"
              value={texto}
              onChange={(e) => setTexto(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleEnviar();
                }
              }}
              placeholder="Digite sua mensagem..."
              className="flex-1 bg-gray-800 border border-gray-700 rounded-xl py-2.5 px-4 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-emerald-500 transition-all"
            />
            <button
              onClick={handleEnviar}
              disabled={!texto.trim() || enviando}
              aria-label="Enviar mensagem"
              className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 disabled:opacity-40 rounded-xl flex items-center justify-center flex-shrink-0 transition-all"
            >
              {enviando ? (
                <Loader2 className="w-4 h-4 text-white animate-spin" />
              ) : (
                <Send className="w-4 h-4 text-white" />
              )}
            </button>
          </div>
        </div>
      )}
    </>
  );
}
