import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { anamneseServico } from '../servicos/api';
import { ClipboardList, X, ChevronRight, Loader2 } from 'lucide-react';

type Pergunta = { id: string; pergunta: string };

interface Props {
  alunoId: string;
  perguntas: Pergunta[];
  respostasExistentes?: Record<string, string>;
  onComplete: () => void;
  onSkip: () => void;
}

const inputCls =
  'w-full bg-gray-800 border border-gray-700 rounded-xl py-2.5 px-3 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/40 transition-all';

export default function ModalPerguntasNutri({ alunoId, perguntas, respostasExistentes = {}, onComplete, onSkip }: Props) {
  const queryClient = useQueryClient();
  const [respostas, setRespostas] = useState<Record<string, string>>(respostasExistentes);

  const mut = useMutation({
    mutationFn: () => anamneseServico.salvarRespostasAluno(alunoId, respostas),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['anamnese', alunoId] });
      onComplete();
    },
  });

  const totalRespondidas = perguntas.filter((q) => (respostas[q.id] || '').trim()).length;
  const podeEnviar = totalRespondidas === perguntas.length;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-gray-900 border border-gray-800 rounded-2xl shadow-2xl w-full max-w-sm flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 pt-6 pb-4 border-b border-gray-800 flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/15 border border-emerald-500/20 flex items-center justify-center flex-shrink-0">
              <ClipboardList className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <h2 className="font-display tracking-wide text-white text-base">Questionário adicional</h2>
              <p className="text-xs text-gray-500 mt-0.5">Seu nutricionista tem perguntas para você</p>
            </div>
          </div>
          <button
            onClick={onSkip}
            className="p-1.5 rounded-lg hover:bg-gray-800 text-gray-600 transition-colors flex-shrink-0 mt-0.5"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Progress */}
        <div className="px-6 pt-4">
          <div className="flex items-center justify-between text-xs text-gray-500 mb-1.5">
            <span>{totalRespondidas} de {perguntas.length} respondidas</span>
          </div>
          <div className="w-full h-1 bg-gray-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-emerald-500 to-teal-500 transition-all duration-500 rounded-full"
              style={{ width: `${(totalRespondidas / perguntas.length) * 100}%` }}
            />
          </div>
        </div>

        {/* Questions */}
        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-5">
          {perguntas.map((q, i) => (
            <div key={q.id}>
              <label className="block text-sm font-semibold text-white mb-2">
                <span className="text-emerald-400 mr-1.5">{i + 1}.</span>
                {q.pergunta}
              </label>
              <textarea
                value={respostas[q.id] ?? ''}
                onChange={(e) => setRespostas((r) => ({ ...r, [q.id]: e.target.value }))}
                rows={2}
                className={`${inputCls} resize-none`}
                placeholder="Sua resposta…"
              />
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="px-6 pb-6 pt-3 border-t border-gray-800 flex gap-3">
          <button
            onClick={onSkip}
            className="flex-1 bg-gray-800 hover:bg-gray-700 border border-gray-700 text-gray-400 py-3 rounded-xl text-sm transition-all"
          >
            Responder depois
          </button>
          <button
            onClick={() => mut.mutate()}
            disabled={!podeEnviar || mut.isPending}
            className="flex-1 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 disabled:opacity-50 text-white py-3 rounded-xl text-sm font-bold flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 transition-all"
          >
            {mut.isPending
              ? <Loader2 className="w-4 h-4 animate-spin" />
              : <ChevronRight className="w-4 h-4" />
            }
            Enviar respostas
          </button>
        </div>
      </div>
    </div>
  );
}
