import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../../contextos/autenticacao';
import { consultasServico, nutricionistaServico } from '../../servicos/api';
import { Loader2, Calendar, MessageSquare, Plus, X, Send } from 'lucide-react';
import { format, parseISO, isFuture } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import type { Consulta } from '../../tipos';

const STATUS_COR: Record<string, string> = {
  AGENDADA:   'bg-amber-500/20 text-amber-300',
  REALIZADA:  'bg-emerald-500/20 text-emerald-300',
  CANCELADA:  'bg-red-500/20 text-red-300',
  SOLICITADA: 'bg-blue-500/20 text-blue-300',
};

export default function MinhasConsultas() {
  const { usuario } = useAuth();
  const queryClient = useQueryClient();
  const alunoId = (usuario as any)?.id;
  const nutricionistaId = usuario?.nutricionistaId;

  const { data: nutri } = useQuery({
    queryKey: ['nutri-perfil', nutricionistaId],
    queryFn: () => nutricionistaServico.buscarPorId(nutricionistaId!).then((r) => r.data),
    enabled: !!nutricionistaId,
  });

  const [showModal, setShowModal] = useState(false);
  const [dataDesejada, setDataDesejada] = useState('');
  const [tipo, setTipo] = useState('');
  const [observacoes, setObservacoes] = useState('');
  const [erroSolicitar, setErroSolicitar] = useState('');

  const { data: consultas = [], isLoading } = useQuery<Consulta[]>({
    queryKey: ['consultas', alunoId],
    queryFn: () => consultasServico.listar({ alunoId }).then((r) => r.data),
    enabled: !!alunoId,
  });

  const mutSolicitar = useMutation({
    mutationFn: () => consultasServico.solicitarConsulta({
      dataHora: dataDesejada,
      tipo,
      observacoes,
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['consultas', alunoId] });
      setShowModal(false);
      setDataDesejada(''); setTipo(''); setObservacoes(''); setErroSolicitar('');
    },
    onError: (e: any) => {
      setErroSolicitar(e?.message || 'Erro ao solicitar consulta.');
    },
  });

  const proximas = consultas
    .filter((c) => c.status === 'AGENDADA' && isFuture(parseISO(c.dataHora)))
    .sort((a, b) => new Date(a.dataHora).getTime() - new Date(b.dataHora).getTime());

  const historico = consultas
    .filter((c) => !proximas.includes(c))
    .sort((a, b) => new Date(b.dataHora).getTime() - new Date(a.dataHora).getTime());

  const whatsapp = (nutri as any)?.whatsapp ?? '';
  const msgWpp = encodeURIComponent('Olá! Gostaria de agendar uma consulta.');

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-40">
        <Loader2 className="w-6 h-6 animate-spin text-emerald-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-white">Minhas Consultas</h1>
          <p className="text-gray-500 text-sm mt-1">{consultas.length} consulta(s) no total</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-white px-4 py-2.5 rounded-xl text-sm font-bold shadow-lg shadow-emerald-500/20 transition-all"
        >
          <Plus className="w-4 h-4" /> Solicitar
        </button>
      </div>

      {/* Modal de solicitação */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="bg-gray-900 border border-gray-800 rounded-2xl shadow-2xl w-full max-w-sm p-6">
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-bold text-white">Solicitar Consulta</h3>
              <button onClick={() => setShowModal(false)} className="p-1.5 rounded-lg hover:bg-gray-800 text-gray-500 transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">Data e horário desejado</label>
                <input
                  type="datetime-local"
                  value={dataDesejada}
                  onChange={(e) => setDataDesejada(e.target.value)}
                  min={new Date().toISOString().slice(0, 16)}
                  className="w-full bg-gray-800 border border-gray-700 rounded-xl py-2.5 px-3 text-sm text-white focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/40 transition-all"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">Tipo de consulta</label>
                <select
                  value={tipo}
                  onChange={(e) => setTipo(e.target.value)}
                  className="w-full bg-gray-800 border border-gray-700 rounded-xl py-2.5 px-3 text-sm text-white focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/40 transition-all"
                >
                  <option value="">Selecione...</option>
                  <option value="Consulta inicial">Consulta inicial</option>
                  <option value="Retorno">Retorno</option>
                  <option value="Avaliação antropométrica">Avaliação antropométrica</option>
                  <option value="Revisão de plano">Revisão de plano</option>
                  <option value="Online">Online</option>
                  <option value="Outro">Outro</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">Observações (opcional)</label>
                <textarea
                  value={observacoes}
                  onChange={(e) => setObservacoes(e.target.value)}
                  rows={3}
                  placeholder="Ex: prefiro horário da manhã..."
                  className="w-full bg-gray-800 border border-gray-700 rounded-xl py-2.5 px-3 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/40 transition-all resize-none"
                />
              </div>
              {erroSolicitar && (
                <p className="text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded-xl px-3 py-2">{erroSolicitar}</p>
              )}
              <div className="flex gap-3 pt-1">
                <button onClick={() => setShowModal(false)} className="flex-1 bg-gray-800 hover:bg-gray-700 border border-gray-700 text-gray-300 py-2.5 rounded-xl text-sm transition-all">
                  Cancelar
                </button>
                <button
                  onClick={() => { setErroSolicitar(''); if (!dataDesejada) { setErroSolicitar('Informe a data desejada.'); return; } mutSolicitar.mutate(); }}
                  disabled={mutSolicitar.isPending}
                  className="flex-1 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 disabled:opacity-50 text-white py-2.5 rounded-xl text-sm font-bold flex items-center justify-center gap-1.5 transition-all"
                >
                  <Send className="w-3.5 h-3.5" />
                  {mutSolicitar.isPending ? 'Enviando…' : 'Solicitar'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Botão de contato */}
      <a
        href={`https://wa.me/${whatsapp.replace(/\D/g, '')}?text=${msgWpp}`}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center gap-3 bg-green-600 hover:bg-green-700 text-white rounded-2xl px-5 py-4 transition-colors"
      >
        <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0">
          <MessageSquare className="w-5 h-5" />
        </div>
        <div>
          <p className="font-semibold">Falar com nutricionista</p>
          <p className="text-sm text-green-100">Agendar ou tirar dúvidas pelo WhatsApp</p>
        </div>
      </a>

      {/* Próximas */}
      {proximas.length > 0 && (
        <div>
          <h2 className="font-display uppercase tracking-wider text-gray-300 mb-3">Próximas Consultas</h2>
          <div className="space-y-3">
            {proximas.map((c) => (
              <div
                key={c.id}
                className="bg-gray-900 border border-emerald-500/30 rounded-2xl px-5 py-4 flex items-center justify-between"
              >
                <div>
                  <p className="font-display tracking-wide text-white">
                    {format(parseISO(c.dataHora), "EEEE, dd 'de' MMMM", { locale: ptBR })}
                  </p>
                  <p className="text-sm text-gray-400">
                    {format(parseISO(c.dataHora), 'HH:mm')} h
                    {c.tipo ? ` · ${c.tipo}` : ''}
                  </p>
                </div>
                <span className={`px-2.5 py-1 rounded-full text-xs font-display uppercase tracking-wider ${STATUS_COR[c.status]}`}>
                  {c.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Histórico */}
      {historico.length > 0 && (
        <div>
          <h2 className="font-display uppercase tracking-wider text-gray-300 mb-3">Histórico</h2>
          <div className="bg-gray-900 border border-gray-800 rounded-2xl divide-y divide-gray-800">
            {historico.map((c) => (
              <div key={c.id} className="px-5 py-4 flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-200">
                    {format(parseISO(c.dataHora), "dd 'de' MMM 'de' yyyy", { locale: ptBR })}
                  </p>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {format(parseISO(c.dataHora), 'HH:mm')} h
                    {c.tipo ? ` · ${c.tipo}` : ''}
                  </p>
                  {c.observacoes && (
                    <p className="text-xs text-gray-500 mt-1 italic">{c.observacoes}</p>
                  )}
                </div>
                <span className={`px-2.5 py-1 rounded-full text-xs font-display uppercase tracking-wider ${STATUS_COR[c.status] ?? 'bg-gray-800 text-gray-400'}`}>
                  {c.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {consultas.length === 0 && (
        <div className="text-center py-16 text-gray-400">
          <Calendar className="w-12 h-12 text-gray-700 mx-auto mb-3" />
          <p className="font-medium">Nenhuma consulta registrada</p>
          <p className="text-sm mt-1">Entre em contato para agendar</p>
        </div>
      )}
    </div>
  );
}
