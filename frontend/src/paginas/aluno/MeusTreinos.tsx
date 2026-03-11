import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../../contextos/autenticacao';
import { fichasServico } from '../../servicos/api';
import { Loader2, Dumbbell, ExternalLink } from 'lucide-react';
import type { FichaTreino, ExercicioFicha } from '../../tipos';

const corNivel: Record<string, string> = {
  INICIANTE: 'bg-emerald-500/20 text-emerald-300',
  INTERMEDIARIO: 'bg-amber-500/20 text-amber-300',
  AVANCADO: 'bg-red-500/20 text-red-300',
};

function CardFicha({ ficha }: { ficha: FichaTreino }) {
  return (
    <div className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden">
      <div className="px-5 py-4 border-b border-gray-800 flex items-center justify-between">
        <div>
          <p className="font-display tracking-wide text-white">{ficha.nome}</p>
          {ficha.descricao && (
            <p className="text-xs text-gray-500 mt-0.5">{ficha.descricao}</p>
          )}
        </div>
        <span className="text-xs text-gray-500">{ficha.exercicios?.length ?? 0} ex.</span>
      </div>

      {(ficha.exercicios ?? []).length === 0 ? (
        <p className="px-5 py-4 text-sm text-gray-400">Nenhum exercício nesta ficha</p>
      ) : (
        <div className="divide-y divide-gray-800">
          {(ficha.exercicios ?? []).map((ef: ExercicioFicha, idx: number) => (
            <div key={ef.id} className="px-5 py-3">
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-start gap-3">
                  <span className="w-6 h-6 rounded-full bg-gray-800 text-gray-400 text-xs flex items-center justify-center flex-shrink-0 mt-0.5">
                    {idx + 1}
                  </span>
                  <div>
                    <p className="text-sm font-semibold text-white">
                      {ef.exercicio?.nome ?? '—'}
                    </p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {ef.series}x{ef.repeticoes}
                      {ef.carga ? ` · ${ef.carga}kg` : ''}
                      {ef.tempoDescanso ? ` · ${ef.tempoDescanso}s descanso` : ''}
                    </p>
                    {ef.observacoes && (
                      <p className="text-xs text-gray-400 italic mt-0.5">{ef.observacoes}</p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  {ef.exercicio?.nivel && (
                    <span className={`text-xs font-display uppercase tracking-wider px-2 py-0.5 rounded-full ${corNivel[ef.exercicio.nivel] ?? 'bg-gray-800 text-gray-400'}`}>
                      {ef.exercicio.nivel.charAt(0) + ef.exercicio.nivel.slice(1).toLowerCase()}
                    </span>
                  )}
                  {ef.exercicio?.videoUrl && (
                    <a
                      href={ef.exercicio.videoUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-gray-400 hover:text-red-500 transition-colors"
                      title="Ver vídeo"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </a>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function MeusTreinos() {
  const { usuario } = useAuth();
  const alunoId = (usuario as any)?.id;

  const { data: fichas = [], isLoading } = useQuery<FichaTreino[]>({
    queryKey: ['fichas', alunoId],
    queryFn: () => fichasServico.listar({ alunoId }).then((r) => r.data),
    enabled: !!alunoId,
  });

  const fichasAtivas = fichas.filter((f) => f.ativo);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-40">
        <Loader2 className="w-6 h-6 animate-spin text-emerald-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-black text-white">Meus Treinos</h1>
        <p className="text-gray-500 text-sm mt-1">
          {fichasAtivas.length} ficha(s) ativa(s)
        </p>
      </div>

      {fichasAtivas.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <Dumbbell className="w-12 h-12 text-gray-700 mx-auto mb-3" />
          <p className="font-medium">Nenhuma ficha de treino disponível</p>
          <p className="text-sm mt-1">Entre em contato com seu nutricionista</p>
        </div>
      ) : (
        <div className="space-y-4">
          {fichasAtivas.map((f) => (
            <CardFicha key={f.id} ficha={f} />
          ))}
        </div>
      )}
    </div>
  );
}
