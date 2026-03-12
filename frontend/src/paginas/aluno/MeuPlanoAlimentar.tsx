import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../../contextos/autenticacao';
import { planosServico } from '../../servicos/api';
import { Loader2, Utensils, Clock, Droplets, Dumbbell } from 'lucide-react';

// ── Types (matching what carregarEditor returns)
type Item = {
  id: string;
  opcaoIndex: number;
  nome: string;
  quantidade: number;
  caloriasP100g: number;
  proteinasP100g: number;
  carboidratosP100g: number;
  gordurasP100g: number;
};
type Refeicao = {
  id: string;
  nome: string;
  horario?: string;
  ordem: number;
  ehPreTreino?: boolean;
  ehPosTreino?: boolean;
  itens: Item[];
};
type Plano = { id: string; nome: string; ativo?: boolean; liquidosMl?: number };

const r1 = (v: number) => Math.round(v * 10) / 10;
const LETRAS = ['A', 'B', 'C', 'D', 'E'];

function calcMacros(itens: Item[]) {
  return itens.reduce(
    (acc, it) => {
      const f = it.quantidade / 100;
      return {
        kcal: acc.kcal + it.caloriasP100g * f,
        prot: acc.prot + it.proteinasP100g * f,
        carb: acc.carb + it.carboidratosP100g * f,
        gord: acc.gord + it.gordurasP100g * f,
      };
    },
    { kcal: 0, prot: 0, carb: 0, gord: 0 },
  );
}

function agruparOpcoes(itens: Item[]): Map<number, Item[]> {
  const map = new Map<number, Item[]>();
  for (const it of itens) {
    const idx = it.opcaoIndex ?? 0;
    if (!map.has(idx)) map.set(idx, []);
    map.get(idx)!.push(it);
  }
  if (!map.has(0)) map.set(0, []);
  return map;
}

// ── Meal card
function CardRefeicao({ refeicao }: { refeicao: Refeicao }) {
  const grupos = agruparOpcoes(refeicao.itens);
  const opcoes = Array.from(grupos.keys()).sort();
  const [opcaoAtiva, setOpcaoAtiva] = useState(0);
  const itensAtivos = grupos.get(opcaoAtiva) ?? [];
  const macros = useMemo(() => calcMacros(itensAtivos), [itensAtivos]);

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden">
      {/* Header */}
      <div className="px-5 py-4 border-b border-gray-800">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <p className="font-display tracking-wide text-white">{refeicao.nome}</p>
              {refeicao.ehPreTreino && (
                <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-orange-500/15 text-orange-400 border border-orange-500/30">
                  Pré-Treino
                </span>
              )}
              {refeicao.ehPosTreino && (
                <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-violet-500/15 text-violet-400 border border-violet-500/30">
                  Pós-Treino
                </span>
              )}
            </div>
            {refeicao.horario && (
              <p className="flex items-center gap-1 text-xs text-gray-500 mt-1">
                <Clock className="w-3 h-3" /> {refeicao.horario}
              </p>
            )}
          </div>
          {macros.kcal > 0 && (
            <span className="text-sm font-bold text-yellow-400 flex-shrink-0">{r1(macros.kcal)} kcal</span>
          )}
        </div>

        {/* Opcao tabs */}
        {opcoes.length > 1 && (
          <div className="flex gap-1 mt-3">
            {opcoes.map((idx) => (
              <button
                key={idx}
                onClick={() => setOpcaoAtiva(idx)}
                className={`px-3 py-1 rounded-lg text-xs font-semibold transition-colors ${
                  opcaoAtiva === idx
                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                    : 'bg-gray-800 text-gray-500 hover:text-gray-300 border border-transparent'
                }`}
              >
                Opção {LETRAS[idx] ?? String(idx + 1)}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Items */}
      {itensAtivos.length === 0 ? (
        <p className="px-5 py-4 text-sm text-gray-600">Nenhum item nesta opção</p>
      ) : (
        <div className="divide-y divide-gray-800/60">
          {itensAtivos.map((it) => {
            const f = it.quantidade / 100;
            return (
              <div key={it.id} className="px-5 py-3 flex items-center justify-between gap-3">
                <p className="text-sm font-semibold text-white flex-1 min-w-0 truncate">{it.nome}</p>
                <div className="flex items-center gap-3 text-xs tabular-nums flex-shrink-0">
                  <span className="text-gray-500">{it.quantidade}g</span>
                  {it.caloriasP100g > 0 && (
                    <span className="text-yellow-400/80">{r1(it.caloriasP100g * f)} kcal</span>
                  )}
                  {it.proteinasP100g > 0 && (
                    <span className="text-blue-400/80 hidden sm:inline">{r1(it.proteinasP100g * f)}g P</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Per-opcao macros footer */}
      {macros.kcal > 0 && (
        <div className="px-5 py-3 bg-gray-800/40 grid grid-cols-3 gap-2">
          {[
            { label: 'Proteínas', valor: r1(macros.prot), cor: 'bg-blue-500/15 text-blue-300' },
            { label: 'Carboidratos', valor: r1(macros.carb), cor: 'bg-amber-500/15 text-amber-300' },
            { label: 'Gorduras', valor: r1(macros.gord), cor: 'bg-red-500/15 text-red-300' },
          ].map((m) => (
            <div key={m.label} className={`rounded-xl px-2 py-2 ${m.cor} text-center`}>
              <p className="font-display uppercase tracking-wider text-xs opacity-70 truncate">{m.label}</p>
              <p className="font-black text-sm">{m.valor}g</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Main component
export default function MeuPlanoAlimentar() {
  const { usuario } = useAuth();
  const alunoId = (usuario as any)?.id;
  const [planoSelecionadoId, setPlanoSelecionadoId] = useState<string | null>(null);

  // 1. Load plan list
  const { data: planos = [], isLoading: loadingPlanos } = useQuery<Plano[]>({
    queryKey: ['planos-aluno', alunoId],
    queryFn: () => planosServico.listar({ alunoId }).then((r: any) => r.data),
    enabled: !!alunoId,
  });

  const planoId = planoSelecionadoId ?? planos[0]?.id ?? null;
  const planoAtivo = planos.find((p) => p.id === planoId) ?? planos[0] ?? null;

  // 2. Load refeições + itens from subcollection for the selected plan
  const { data: refeicoes = [], isLoading: loadingRefeicoes } = useQuery<Refeicao[]>({
    queryKey: ['editor', planoId],
    queryFn: () => planosServico.refeicoes.carregarEditor(planoId!).then((r: any) => r.data),
    enabled: !!planoId,
  });

  // 3. Load plan extra (liquidosMl)
  const { data: planoExtra } = useQuery<any>({
    queryKey: ['plano-extra', planoId],
    queryFn: () => planosServico.buscar(planoId!).then((r: any) => r.data),
    enabled: !!planoId,
  });

  const totais = useMemo(
    () => calcMacros(refeicoes.flatMap((rf) => rf.itens.filter((it) => (it.opcaoIndex ?? 0) === 0))),
    [refeicoes],
  );

  const isLoading = loadingPlanos || (!!planoId && loadingRefeicoes);

  if (loadingPlanos) {
    return (
      <div className="flex items-center justify-center h-40">
        <Loader2 className="w-6 h-6 animate-spin text-emerald-500" />
      </div>
    );
  }

  if (!planoAtivo) {
    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-black text-white">Meu Plano Alimentar</h1>
        <div className="text-center py-16 text-gray-400">
          <Utensils className="w-12 h-12 text-gray-700 mx-auto mb-3" />
          <p className="font-medium">Nenhum plano alimentar disponível</p>
          <p className="text-sm mt-1">Entre em contato com seu nutricionista</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* ── Header */}
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-2xl font-black text-white">Meu Plano Alimentar</h1>
          <p className="text-gray-500 text-sm mt-0.5">{planoAtivo.nome}</p>
        </div>
        {/* Plan selector (if multiple) */}
        {planos.length > 1 && (
          <select
            value={planoId ?? ''}
            onChange={(e) => setPlanoSelecionadoId(e.target.value)}
            className="bg-gray-900 border border-gray-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"
          >
            {planos.map((p) => (
              <option key={p.id} value={p.id}>{p.nome}</option>
            ))}
          </select>
        )}
      </div>

      {/* ── Macros totais */}
      {totais.kcal > 0 && (
        <div className="bg-gray-900 border border-gray-800 rounded-2xl px-5 py-4 grid grid-cols-4 gap-3">
          {[
            { label: 'Kcal',  valor: String(r1(totais.kcal)),  cor: 'text-yellow-400' },
            { label: 'Prot.', valor: `${r1(totais.prot)}g`,    cor: 'text-blue-400'   },
            { label: 'Carb.', valor: `${r1(totais.carb)}g`,    cor: 'text-orange-400' },
            { label: 'Gord.', valor: `${r1(totais.gord)}g`,    cor: 'text-red-400'    },
          ].map((m) => (
            <div key={m.label} className="text-center">
              <p className="font-display text-xs uppercase tracking-wider text-gray-500">{m.label}</p>
              <p className={`text-lg font-black mt-0.5 ${m.cor}`}>{m.valor}</p>
            </div>
          ))}
        </div>
      )}

      {/* ── Liquid recommendation */}
      {planoExtra?.liquidosMl > 0 && (
        <div className="flex items-center gap-3 bg-blue-500/10 border border-blue-500/20 rounded-2xl px-5 py-3">
          <Droplets className="w-4 h-4 text-blue-400 flex-shrink-0" />
          <p className="text-sm text-blue-300">
            <span className="font-bold">{planoExtra.liquidosMl}ml</span>
            <span className="text-blue-400/70 ml-1">de líquidos ao longo do dia</span>
            {planoExtra.liquidosMl >= 1000 && (
              <span className="ml-1 text-blue-400/70">
                (= {(planoExtra.liquidosMl / 1000).toFixed(1)}L)
              </span>
            )}
          </p>
        </div>
      )}

      {/* ── Refeições */}
      {isLoading ? (
        <div className="flex justify-center py-8">
          <Loader2 className="w-5 h-5 animate-spin text-emerald-500" />
        </div>
      ) : refeicoes.length === 0 ? (
        <div className="text-center py-12 text-gray-600">
          <Dumbbell className="w-8 h-8 mx-auto mb-2 opacity-30" />
          <p className="text-sm">Nenhuma refeição cadastrada neste plano</p>
        </div>
      ) : (
        <div className="space-y-4">
          {refeicoes.map((rf) => (
            <CardRefeicao key={rf.id} refeicao={rf} />
          ))}
        </div>
      )}
    </div>
  );
}
