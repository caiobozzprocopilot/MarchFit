import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../../contextos/autenticacao';
import { consultasServico } from '../../servicos/api';
import { Loader2, Calendar, MessageSquare } from 'lucide-react';
import { format, parseISO, isFuture } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import type { Consulta } from '../../tipos';

const STATUS_COR: Record<string, string> = {
  AGENDADA: 'bg-amber-500/20 text-amber-300',
  REALIZADA: 'bg-emerald-500/20 text-emerald-300',
  CANCELADA: 'bg-red-500/20 text-red-300',
};

export default function MinhasConsultas() {
  const { usuario } = useAuth();
  const alunoId = (usuario as any)?.id;

  const { data: consultas = [], isLoading } = useQuery<Consulta[]>({
    queryKey: ['consultas', alunoId],
    queryFn: () => consultasServico.listar({ alunoId }).then((r) => r.data),
    enabled: !!alunoId,
  });

  const proximas = consultas
    .filter((c) => c.status === 'AGENDADA' && isFuture(parseISO(c.dataHora)))
    .sort((a, b) => new Date(a.dataHora).getTime() - new Date(b.dataHora).getTime());

  const historico = consultas
    .filter((c) => !proximas.includes(c))
    .sort((a, b) => new Date(b.dataHora).getTime() - new Date(a.dataHora).getTime());

  const whatsapp = (usuario as any)?.nutricionista?.whatsapp ?? '+55119999999999';
  const msgWpp = encodeURIComponent('Olá! Gostaria de agendar uma consulta.');

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-40">
        <Loader2 className="w-6 h-6 animate-spin text-green-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Minhas Consultas</h1>
        <p className="text-gray-500 text-sm mt-1">{consultas.length} consulta(s) no total</p>
      </div>

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
          <h2 className="font-semibold text-gray-300 mb-3">Próximas Consultas</h2>
          <div className="space-y-3">
            {proximas.map((c) => (
              <div
                key={c.id}
                className="bg-gray-900 border border-emerald-500/30 rounded-2xl px-5 py-4 flex items-center justify-between"
              >
                <div>
                  <p className="font-semibold text-white">
                    {format(parseISO(c.dataHora), "EEEE, dd 'de' MMMM", { locale: ptBR })}
                  </p>
                  <p className="text-sm text-gray-400">
                    {format(parseISO(c.dataHora), 'HH:mm')} h
                    {c.tipo ? ` · ${c.tipo}` : ''}
                  </p>
                </div>
                <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${STATUS_COR[c.status]}`}>
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
          <h2 className="font-semibold text-gray-300 mb-3">Histórico</h2>
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
                <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${STATUS_COR[c.status] ?? 'bg-gray-800 text-gray-400'}`}>
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
