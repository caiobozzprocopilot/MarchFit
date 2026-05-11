import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../../contextos/autenticacao';
import { fichasServico, treinosRealizadosServico } from '../../servicos/api';
import { Loader2, Dumbbell, ExternalLink, CheckCircle2, History, ChevronDown } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import type { FichaTreino, ExercicioFicha } from '../../tipos';

const corNivel: Record<string, string> = {
  INICIANTE: 'bg-emerald-500/20 text-emerald-300',
  INTERMEDIARIO: 'bg-amber-500/20 text-amber-300',
  AVANCADO: 'bg-red-500/20 text-red-300',
};

function CardFicha({ ficha, realizadoHoje, onMarcar }: { ficha: FichaTreino; realizadoHoje: boolean; onMarcar: () => void }) {
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

      {/* Marcar como feito */}
      <div className="px-5 py-3 border-t border-gray-800">
        {realizadoHoje ? (
          <div className="flex items-center gap-2 text-emerald-400">
            <CheckCircle2 className="w-4 h-4" />
            <span className="text-sm font-semibold">Treino feito hoje!</span>
          </div>
        ) : (
          <button
            onClick={onMarcar}
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm font-semibold hover:bg-emerald-500/20 transition-all"
          >
            <CheckCircle2 className="w-4 h-4" /> Marcar como feito hoje
          </button>
        )}
      </div>
    </div>
  );
}

export default function MeusTreinos() {
  const { usuario } = useAuth();
  const queryClient = useQueryClient();
  const alunoId = (usuario as any)?.id;

  const hoje = format(new Date(), 'yyyy-MM-dd');

  const { data: fichas = [], isLoading } = useQuery<FichaTreino[]>({
    queryKey: ['fichas', alunoId],
    queryFn: () => fichasServico.listar({ alunoId }).then((r) => r.data),
    enabled: !!alunoId,
  });

  const { data: realizados = [] } = useQuery<any[]>({
    queryKey: ['treinos-realizados', alunoId],
    queryFn: () => treinosRealizadosServico.listar(alunoId!).then((r) => r.data),
    enabled: !!alunoId,
  });

  const mutRealizar = useMutation({
    mutationFn: ({ fichaId, fichaNome }: { fichaId: string; fichaNome: string }) =>
      treinosRealizadosServico.criar(alunoId!, fichaId, fichaNome),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['treinos-realizados', alunoId] }),
  });

  const realizadosHoje = new Set(
    realizados
      .filter((r) => {
        const data = r.realizadoEm?.toDate?.()?.toISOString?.()?.slice(0, 10) ?? r.realizadoEm?.slice?.(0, 10);
        return data === hoje;
      })
      .map((r) => r.fichaId),
  );

  const [historicoAberto, setHistoricoAberto] = useState(false);
  const historicoOrdenado = [...realizados]
    .sort((a, b) => {
      const getTime = (r: any) => r.realizadoEm?.toDate?.()?.getTime?.() ?? new Date(r.realizadoEm ?? 0).getTime();
      return getTime(b) - getTime(a);
    })
    .slice(0, 30);

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
            <CardFicha
              key={f.id}
              ficha={f}
              realizadoHoje={realizadosHoje.has(f.id)}
              onMarcar={() => mutRealizar.mutate({ fichaId: f.id, fichaNome: f.nome })}
            />
          ))}
        </div>
      )}

      {/* Histórico de realizações */}
      {realizados.length > 0 && (
        <div className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden">
          <button
            onClick={() => setHistoricoAberto((v) => !v)}
            className="w-full flex items-center justify-between px-5 py-4"
          >
            <div className="flex items-center gap-2">
              <History className="w-4 h-4 text-violet-400" />
              <span className="font-display uppercase tracking-wider text-sm text-white">Histórico</span>
              <span className="text-xs bg-violet-500/20 text-violet-400 px-2 py-0.5 rounded-full">{realizados.length}</span>
            </div>
            <ChevronDown className={`w-4 h-4 text-gray-500 transition-transform ${historicoAberto ? 'rotate-180' : ''}`} />
          </button>
          {historicoAberto && (
            <div className="border-t border-gray-800 divide-y divide-gray-800">
              {historicoOrdenado.map((r, i) => {
                const dataObj = r.realizadoEm?.toDate?.() ?? new Date(r.realizadoEm ?? 0);
                return (
                  <div key={r.id ?? i} className="px-5 py-3 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                      <span className="text-sm text-white">{r.fichaNome ?? '—'}</span>
                    </div>
                    <span className="text-xs text-gray-500">
                      {format(dataObj, "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
