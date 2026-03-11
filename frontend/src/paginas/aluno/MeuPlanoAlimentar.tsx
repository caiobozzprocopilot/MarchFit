import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../../contextos/autenticacao';
import { planosServico } from '../../servicos/api';
import { Loader2, Utensils } from 'lucide-react';
import type { PlanoAlimentar, Refeicao, ItemRefeicao } from '../../tipos';

function ItemMacro({ label, valor, cor }: { label: string; valor: number; cor: string }) {
  return (
    <div className={`rounded-xl px-3 py-2 ${cor} text-center`}>
      <p className="font-display uppercase tracking-wider text-xs opacity-70">{label}</p>
      <p className="font-black text-sm">{valor.toFixed(0)}g</p>
    </div>
  );
}

function CardRefeicao({ refeicao }: { refeicao: Refeicao }) {
  const totais = (refeicao.itens ?? []).reduce(
    (acc, item: ItemRefeicao) => {
      const fator = (item.quantidade ?? 100) / 100;
      return {
        calorias: acc.calorias + (item.alimento?.caloriasP100g ?? 0) * fator,
        proteinas: acc.proteinas + (item.alimento?.proteinasP100g ?? 0) * fator,
        carboidratos: acc.carboidratos + (item.alimento?.carboidratosP100g ?? 0) * fator,
        gorduras: acc.gorduras + (item.alimento?.gordurasP100g ?? 0) * fator,
      };
    },
    { calorias: 0, proteinas: 0, carboidratos: 0, gorduras: 0 }
  );

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden">
      <div className="px-5 py-4 border-b border-gray-800 flex items-center justify-between">
        <div>
        <p className="font-display tracking-wide text-white">{refeicao.nome}</p>
          {refeicao.horario && (
            <p className="text-xs text-gray-500 mt-0.5">{refeicao.horario}</p>
          )}
        </div>
        {totais.calorias > 0 && (
          <span className="text-sm font-semibold text-gray-400">{totais.calorias.toFixed(0)} kcal</span>
        )}
      </div>

      {(refeicao.itens ?? []).length > 0 ? (
        <div className="divide-y divide-gray-800">
          {(refeicao.itens ?? []).map((item: ItemRefeicao) => (
            <div key={item.id} className="px-5 py-3 flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-white">{item.alimento?.nome ?? '—'}</p>
              </div>
              <span className="text-sm text-gray-500">
                {item.quantidade}{item.unidade ?? 'g'}
              </span>
            </div>
          ))}
        </div>
      ) : (
        <p className="px-5 py-4 text-sm text-gray-400">Nenhum item nesta refeição</p>
      )}

      {totais.calorias > 0 && (
        <div className="px-5 py-3 bg-gray-800/60 grid grid-cols-3 gap-2">
          <ItemMacro label="Prot." valor={totais.proteinas} cor="bg-blue-500/20 text-blue-300" />
          <ItemMacro label="Carb." valor={totais.carboidratos} cor="bg-amber-500/20 text-amber-300" />
          <ItemMacro label="Gord." valor={totais.gorduras} cor="bg-red-500/20 text-red-300" />
        </div>
      )}
    </div>
  );
}

export default function MeuPlanoAlimentar() {
  const { usuario } = useAuth();
  const alunoId = (usuario as any)?.id;

  const { data: planos = [], isLoading } = useQuery<PlanoAlimentar[]>({
    queryKey: ['planos', alunoId],
    queryFn: () => planosServico.listar({ alunoId }).then((r) => r.data),
    enabled: !!alunoId,
  });

  const planoAtivo = planos.find((p) => p.ativo) ?? planos[0];

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
        <h1 className="text-2xl font-black text-white">Meu Plano Alimentar</h1>
        {planoAtivo && (
          <p className="text-gray-500 text-sm mt-1">{planoAtivo.nome}</p>
        )}
      </div>

      {!planoAtivo ? (
        <div className="text-center py-16 text-gray-400">
          <Utensils className="w-12 h-12 text-gray-700 mx-auto mb-3" />
          <p className="font-medium">Nenhum plano alimentar disponível</p>
          <p className="text-sm mt-1">Entre em contato com seu nutricionista</p>
        </div>
      ) : (
        <>
          {/* Metas de macros */}
          {planoAtivo.metaMacro && (
            <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-2xl p-5">
              <p className="font-display uppercase tracking-wider text-sm text-emerald-400 mb-3">Meta Diária</p>
              <div className="grid grid-cols-4 gap-2 text-center">
                <div>
                  <p className="font-display uppercase tracking-wider text-xs text-emerald-500">Kcal</p>
                  <p className="font-black text-white">{(planoAtivo.metaMacro as any).calorias ?? '—'}</p>
                </div>
                <div>
                  <p className="font-display uppercase tracking-wider text-xs text-emerald-500">Prot.</p>
                  <p className="font-black text-white">{(planoAtivo.metaMacro as any).proteinas ?? '—'}g</p>
                </div>
                <div>
                  <p className="font-display uppercase tracking-wider text-xs text-emerald-500">Carb.</p>
                  <p className="font-black text-white">{(planoAtivo.metaMacro as any).carboidratos ?? '—'}g</p>
                </div>
                <div>
                  <p className="font-display uppercase tracking-wider text-xs text-emerald-500">Gord.</p>
                  <p className="font-black text-white">{(planoAtivo.metaMacro as any).gorduras ?? '—'}g</p>
                </div>
              </div>
            </div>
          )}

          {/* Refeições */}
          {(planoAtivo.refeicoes ?? []).length === 0 ? (
            <p className="text-center text-gray-400 py-8">Nenhuma refeição cadastrada neste plano</p>
          ) : (
            <div className="space-y-4">
              {(planoAtivo.refeicoes ?? []).map((r: Refeicao) => (
                <CardRefeicao key={r.id} refeicao={r} />
              ))}
            </div>
          )}

        </>
      )}
    </div>
  );
}
