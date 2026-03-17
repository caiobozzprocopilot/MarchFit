import { useState, useEffect, useRef } from 'react';
import {
  MessageSquare, X, Send, Loader2, ChevronLeft, Users,
} from 'lucide-react';
import { useAuth } from '../contextos/autenticacao';
import { chatServico } from '../servicos/api';
import type { MensagemChat, Conversa } from '../tipos';
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

function inicialNome(nome: string) {
  return nome?.trim()[0]?.toUpperCase() ?? '?';
}

// ── Bubble ────────────────────────────────────────────────────────
function BolhaMensagem({ msg }: { msg: MensagemChat }) {
  const ehNutri = msg.remetente === 'nutricionista';
  return (
    <div className={`flex ${ehNutri ? 'justify-end' : 'justify-start'} mb-2`}>
      <div
        className={`max-w-[80%] rounded-2xl px-3.5 py-2.5 ${
          ehNutri
            ? 'bg-emerald-500 text-white rounded-br-sm'
            : 'bg-gray-800 border border-gray-700 text-white rounded-bl-sm'
        }`}
      >
        <p className="text-sm leading-relaxed whitespace-pre-wrap break-words">{msg.texto}</p>
        <p className={`text-[10px] mt-1 text-right ${ehNutri ? 'text-emerald-200' : 'text-gray-500'}`}>
          {formatHora(msg.criadoEm)}
          {msg.fonte === 'whatsapp' && ' · WhatsApp'}
        </p>
      </div>
    </div>
  );
}

// ── Conversation list item ────────────────────────────────────────
function ItemConversa({
  conv,
  onClick,
}: {
  conv: Conversa;
  onClick: () => void;
}) {
  const temNaoLidas = (conv.naoLidasAdmin ?? 0) > 0;
  return (
    <button
      onClick={onClick}
      className="w-full text-left flex items-center gap-3 px-4 py-3.5 hover:bg-gray-800/60 transition-colors border-b border-gray-800/60 last:border-0"
    >
      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-indigo-500 flex items-center justify-center flex-shrink-0">
        <span className="text-white font-bold text-sm">{inicialNome(conv.alunoNome)}</span>
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2">
          <p className={`text-sm truncate ${temNaoLidas ? 'font-bold text-white' : 'font-medium text-gray-200'}`}>
            {conv.alunoNome}
          </p>
          {conv.ultimaMensagemEm && (
            <span className="text-[10px] text-gray-600 flex-shrink-0">{formatHora(conv.ultimaMensagemEm)}</span>
          )}
        </div>
        <div className="flex items-center justify-between gap-2 mt-0.5">
          <p className={`text-xs truncate ${temNaoLidas ? 'text-gray-300' : 'text-gray-600'}`}>
            {conv.ultimaMensagem ?? 'Nenhuma mensagem'}
          </p>
          {temNaoLidas && (
            <span className="min-w-[18px] h-[18px] bg-emerald-500 rounded-full text-white text-[10px] font-bold flex items-center justify-center px-1 flex-shrink-0 leading-none">
              {conv.naoLidasAdmin > 9 ? '9+' : conv.naoLidasAdmin}
            </span>
          )}
        </div>
      </div>
    </button>
  );
}

// ── ChatAdmin ─────────────────────────────────────────────────────
export default function ChatAdmin() {
  const { usuario } = useAuth();
  const nutriId = usuario?.id ?? '';

  const [aberto, setAberto] = useState(false);
  const [conversas, setConversas] = useState<Conversa[]>([]);
  const [conversaSelecionada, setConversaSelecionada] = useState<Conversa | null>(null);
  const [mensagens, setMensagens] = useState<MensagemChat[]>([]);
  const [texto, setTexto] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [totalNaoLidas, setTotalNaoLidas] = useState(0);

  const fimRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Subscribe to all conversations for this nutritionist
  useEffect(() => {
    if (!nutriId) return;
    const unsub = chatServico.ouvirConversas(nutriId, (convs) => {
      const sorted = [...convs].sort((a, b) => {
        const ta = a.ultimaMensagemEm ?? '';
        const tb = b.ultimaMensagemEm ?? '';
        return tb.localeCompare(ta);
      });
      setConversas(sorted);
      setTotalNaoLidas(convs.reduce((acc, c) => acc + (c.naoLidasAdmin ?? 0), 0));
    });
    return unsub;
  }, [nutriId]);

  // Subscribe to messages of selected conversation
  useEffect(() => {
    if (!conversaSelecionada) { setMensagens([]); return; }
    const unsub = chatServico.ouvirMensagens(conversaSelecionada.id, (msgs) => {
      setMensagens(msgs);
    });
    return unsub;
  }, [conversaSelecionada?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  // Auto-scroll when messages update
  useEffect(() => {
    if (conversaSelecionada) fimRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [mensagens, conversaSelecionada]);

  // Focus input when conversation opens
  useEffect(() => {
    if (conversaSelecionada) setTimeout(() => inputRef.current?.focus(), 300);
  }, [conversaSelecionada]);

  const abrirConversa = (conv: Conversa) => {
    setConversaSelecionada(conv);
    // Mark admin's unread as 0
    if ((conv.naoLidasAdmin ?? 0) > 0) {
      chatServico.marcarLidas(conv.id, 'nutricionista').catch(() => {});
    }
  };

  const voltarLista = () => setConversaSelecionada(null);

  const handleEnviar = async () => {
    if (!texto.trim() || !conversaSelecionada || enviando) return;
    const t = texto.trim();
    setTexto('');
    setEnviando(true);
    try {
      await chatServico.enviarMensagem(conversaSelecionada.id, t, 'nutricionista', {
        alunoNome: conversaSelecionada.alunoNome,
        nutricionistaId: nutriId,
      });
    } finally {
      setEnviando(false);
    }
  };

  if (!nutriId) return null;

  return (
    <>
      {/* Floating button */}
      {!aberto && (
        <button
          onClick={() => setAberto(true)}
          title="Mensagens dos pacientes"
          aria-label="Abrir mensagens"
          className="fixed bottom-6 right-6 z-20 w-13 h-13 w-12 h-12 bg-gradient-to-br from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 rounded-full flex items-center justify-center shadow-xl shadow-emerald-500/30 transition-all hover:scale-110"
        >
          <MessageSquare className="w-5 h-5 text-white" />
          {totalNaoLidas > 0 && (
            <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] bg-red-500 rounded-full text-white text-[10px] font-bold flex items-center justify-center px-1 leading-none">
              {totalNaoLidas > 9 ? '9+' : totalNaoLidas}
            </span>
          )}
        </button>
      )}

      {/* Chat panel */}
      {aberto && (
        <div className="fixed bottom-6 right-6 z-50 w-[360px] max-w-[calc(100vw-2rem)] h-[560px] max-h-[calc(100vh-5rem)] bg-gray-900 border border-gray-700 rounded-2xl shadow-2xl flex flex-col overflow-hidden">

          {/* ── Conversation list view ── */}
          {!conversaSelecionada && (
            <>
              <header className="flex items-center justify-between px-4 py-3.5 border-b border-gray-800 flex-shrink-0">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-emerald-500/15 border border-emerald-500/20 flex items-center justify-center">
                    <MessageSquare className="w-4 h-4 text-emerald-400" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-white">Mensagens</p>
                    {totalNaoLidas > 0 && (
                      <p className="text-xs text-emerald-400">{totalNaoLidas} não lida{totalNaoLidas !== 1 && 's'}</p>
                    )}
                  </div>
                </div>
                <button
                  onClick={() => setAberto(false)}
                  aria-label="Fechar"
                  className="p-1.5 rounded-lg text-gray-500 hover:text-white hover:bg-gray-800 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </header>

              <div className="flex-1 overflow-y-auto">
                {conversas.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-center px-6 pb-8">
                    <Users className="w-10 h-10 text-gray-700 mb-3" />
                    <p className="text-gray-500 text-sm font-semibold">Nenhuma conversa ainda</p>
                    <p className="text-gray-700 text-xs mt-1">
                      As mensagens dos pacientes aparecerão aqui
                    </p>
                  </div>
                ) : (
                  conversas.map((conv) => (
                    <ItemConversa key={conv.id} conv={conv} onClick={() => abrirConversa(conv)} />
                  ))
                )}
              </div>
            </>
          )}

          {/* ── Individual conversation view ── */}
          {conversaSelecionada && (
            <>
              <header className="flex items-center gap-2.5 px-3 py-3 border-b border-gray-800 flex-shrink-0">
                <button
                  onClick={voltarLista}
                  aria-label="Voltar à lista"
                  className="p-1.5 rounded-lg text-gray-500 hover:text-white hover:bg-gray-800 transition-colors flex-shrink-0"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-400 to-indigo-500 flex items-center justify-center flex-shrink-0">
                  <span className="text-white font-bold text-xs">
                    {inicialNome(conversaSelecionada.alunoNome)}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-white truncate">
                    {conversaSelecionada.alunoNome}
                  </p>
                  <p className="text-xs text-gray-500">Paciente</p>
                </div>
                <button
                  onClick={() => setAberto(false)}
                  aria-label="Fechar"
                  className="p-1.5 rounded-lg text-gray-500 hover:text-white hover:bg-gray-800 transition-colors flex-shrink-0"
                >
                  <X className="w-4 h-4" />
                </button>
              </header>

              {/* Messages */}
              <main className="flex-1 overflow-y-auto p-3">
                {mensagens.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-center">
                    <MessageSquare className="w-8 h-8 text-gray-700 mb-2" />
                    <p className="text-gray-600 text-xs">Nenhuma mensagem ainda</p>
                  </div>
                ) : (
                  mensagens.map((m) => <BolhaMensagem key={m.id} msg={m} />)
                )}
                <div ref={fimRef} />
              </main>

              {/* Input */}
              <div className="flex-shrink-0 border-t border-gray-800 px-3 py-2.5 flex items-center gap-2">
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
                  placeholder="Responder..."
                  className="flex-1 bg-gray-800 border border-gray-700 rounded-xl py-2 px-3 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-emerald-500 transition-all"
                />
                <button
                  onClick={handleEnviar}
                  disabled={!texto.trim() || enviando}
                  aria-label="Enviar"
                  className="w-9 h-9 bg-gradient-to-br from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 disabled:opacity-40 rounded-xl flex items-center justify-center flex-shrink-0 transition-all"
                >
                  {enviando ? (
                    <Loader2 className="w-3.5 h-3.5 text-white animate-spin" />
                  ) : (
                    <Send className="w-3.5 h-3.5 text-white" />
                  )}
                </button>
              </div>
            </>
          )}
        </div>
      )}
    </>
  );
}
