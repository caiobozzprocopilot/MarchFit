import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { PDFDownloadLink } from '@react-pdf/renderer';
import { planosServico, receitasServico } from '../../servicos/api';
import { tacoAlimentos, categoriasTaco } from '../../dados/taco';
import type { TacoAlimento } from '../../dados/taco';
import type { IngredienteReceita } from '../../tipos';
import PlanoAlimentarPDF from './PlanoAlimentarPDF';
import {
  ArrowLeft, Plus, Trash2, Search, Loader2, Clock,
  X, ChevronDown, ChevronUp, Utensils, FileDown,
  Droplets, Dumbbell, Check, BookOpen,
} from 'lucide-react';

// ── Types ────────────────────────────────────────────────────────
type ItemLoaded = {
  id: string;
  refeicaoId: string;
  opcaoIndex: number;
  nome: string;
  quantidade: number;
  caloriasP100g: number;
  proteinasP100g: number;
  carboidratosP100g: number;
  gordurasP100g: number;
  fibrasP100g?: number | null;
};

type RefeicaoLoaded = {
  id: string;
  planoId: string;
  nome: string;
  horario?: string;
  ordem: number;
  ehPreTreino?: boolean;
  ehPosTreino?: boolean;
  itens: ItemLoaded[];
};

type AddingState = {
  refeicaoId: string;
  opcaoIndex: number;
};

// ── Templates ────────────────────────────────────────────────────
const TEMPLATES: Record<number, { nome: string; horario: string }[]> = {
  3: [
    { nome: 'Café da Manhã',   horario: '07:00' },
    { nome: 'Almoço',          horario: '12:00' },
    { nome: 'Jantar',          horario: '19:00' },
  ],
  4: [
    { nome: 'Café da Manhã',   horario: '07:00' },
    { nome: 'Almoço',          horario: '12:00' },
    { nome: 'Jantar',          horario: '19:00' },
    { nome: 'Ceia',            horario: '21:30' },
  ],
  5: [
    { nome: 'Café da Manhã',   horario: '07:00' },
    { nome: 'Almoço',          horario: '12:00' },
    { nome: 'Lanche da Tarde', horario: '15:30' },
    { nome: 'Jantar',          horario: '19:00' },
    { nome: 'Ceia',            horario: '21:30' },
  ],
  6: [
    { nome: 'Café da Manhã',   horario: '07:00' },
    { nome: 'Lanche da Manhã', horario: '10:00' },
    { nome: 'Almoço',          horario: '12:00' },
    { nome: 'Lanche da Tarde', horario: '15:30' },
    { nome: 'Jantar',          horario: '19:00' },
    { nome: 'Ceia',            horario: '21:30' },
  ],
};

const LETRAS = ['A', 'B', 'C', 'D', 'E'];

// ── Helpers ──────────────────────────────────────────────────────
function r1(v: number) { return Math.round(v * 10) / 10; }

function calcMacros(itens: ItemLoaded[]) {
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

function agruparOpcoes(itens: ItemLoaded[]): Map<number, ItemLoaded[]> {
  const map = new Map<number, ItemLoaded[]>();
  for (const it of itens) {
    const idx = it.opcaoIndex ?? 0;
    if (!map.has(idx)) map.set(idx, []);
    map.get(idx)!.push(it);
  }
  if (!map.has(0)) map.set(0, []);
  return map;
}

const inputCls =
  'w-full bg-gray-800 border border-gray-700 rounded-xl py-2.5 px-3 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/40 transition-all';

// ── Template Selector Screen ──────────────────────────────────────
function TemplateSelector({
  onAplicar,
  aplicando,
}: {
  onAplicar: (template: number, preTreino: boolean, posTreino: boolean) => void;
  aplicando: boolean;
}) {
  const [sel, setSel] = useState<number | null>(null);
  const [preTreino, setPreTreino] = useState(false);
  const [posTreino, setPosTreino] = useState(false);

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs font-display uppercase tracking-wider text-gray-500 mb-3">
          Escolha um template de refeições
        </p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {([3, 4, 5, 6] as const).map((n) => (
            <button
              key={n}
              onClick={() => setSel(n)}
              className={`rounded-2xl border p-4 text-left transition-all ${
                sel === n
                  ? 'border-emerald-500 bg-emerald-500/10'
                  : 'border-gray-800 bg-gray-900 hover:border-gray-700'
              }`}
            >
              <p className="text-3xl font-black text-white mb-1">{n}</p>
              <p className="text-xs font-display uppercase tracking-wider text-emerald-400 mb-2">refeições</p>
              <ul className="space-y-0.5">
                {TEMPLATES[n].map((r) => (
                  <li key={r.nome} className="text-xs text-gray-500 truncate">• {r.nome}</li>
                ))}
              </ul>
            </button>
          ))}
        </div>
      </div>

      <div>
        <p className="text-xs font-display uppercase tracking-wider text-gray-500 mb-3">
          Refeições extras (opcionais)
        </p>
        <div className="flex gap-3">
          <button
            onClick={() => setPreTreino(!preTreino)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border text-sm font-semibold transition-all ${
              preTreino
                ? 'border-orange-500 bg-orange-500/10 text-orange-400'
                : 'border-gray-800 bg-gray-900 text-gray-500 hover:border-gray-700'
            }`}
          >
            <Dumbbell className="w-4 h-4" />
            Pré-Treino
            {preTreino && <Check className="w-3.5 h-3.5" />}
          </button>
          <button
            onClick={() => setPosTreino(!posTreino)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border text-sm font-semibold transition-all ${
              posTreino
                ? 'border-violet-500 bg-violet-500/10 text-violet-400'
                : 'border-gray-800 bg-gray-900 text-gray-500 hover:border-gray-700'
            }`}
          >
            <Dumbbell className="w-4 h-4" />
            Pós-Treino
            {posTreino && <Check className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      <div className="flex gap-3">
        <button
          onClick={() => onAplicar(0, false, false)}
          disabled={aplicando}
          className="px-4 py-2.5 rounded-xl border border-gray-800 bg-gray-900 text-gray-400 text-sm hover:bg-gray-800 transition-all disabled:opacity-40"
        >
          Começar em branco
        </button>
        <button
          onClick={() => sel !== null && onAplicar(sel, preTreino, posTreino)}
          disabled={sel === null || aplicando}
          className="flex items-center gap-2 flex-1 justify-center bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 disabled:opacity-40 text-white px-4 py-2.5 rounded-xl text-sm font-bold transition-all"
        >
          {aplicando ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
          {sel ? `Usar template (${sel} refeições)` : 'Selecione um template'}
        </button>
      </div>
    </div>
  );
}

// ── Recipe Search Panel ──────────────────────────────────────────
type ReceitaSimples = {
  id: string;
  nome: string;
  categoria?: string;
  ingredientesEstruturados?: IngredienteReceita[];
};

function BuscaReceita({
  onInserir,
  onFechar,
  inserindo,
}: {
  onInserir: (ingredientes: IngredienteReceita[]) => void;
  onFechar: () => void;
  inserindo: boolean;
}) {
  const [receitaSel, setReceitaSel] = useState<ReceitaSimples | null>(null);

  const { data: receitas = [], isLoading } = useQuery<ReceitaSimples[]>({
    queryKey: ['receitas'],
    queryFn: () => receitasServico.listar().then((r: any) => r.data),
    staleTime: 1000 * 60 * 2,
  });

  const comIngredientes = receitas.filter(
    (r) => r.ingredientesEstruturados && r.ingredientesEstruturados.length > 0,
  );

  const totalMacros = receitaSel?.ingredientesEstruturados?.reduce(
    (acc, ing) => ({
      kcal: acc.kcal + ing.caloriasP100g * ing.quantidade / 100,
      prot: acc.prot + ing.proteinasP100g * ing.quantidade / 100,
    }),
    { kcal: 0, prot: 0 },
  ) ?? { kcal: 0, prot: 0 };

  if (receitaSel) {
    return (
      <div className="border-t border-gray-800 p-4 space-y-3">
        <div className="flex items-center gap-2">
          <button onClick={() => setReceitaSel(null)} className="text-xs text-gray-500 hover:text-white transition-colors">
            ← Voltar
          </button>
          <button onClick={onFechar} className="ml-auto p-1.5 text-gray-600 hover:text-white transition-colors rounded-lg hover:bg-gray-800">
            <X className="w-4 h-4" />
          </button>
        </div>
        <div>
          <p className="text-sm font-bold text-white">{receitaSel.nome}</p>
          <p className="text-xs text-gray-500">{r1(totalMacros.kcal)} kcal · {r1(totalMacros.prot)}g P</p>
        </div>
        <div className="space-y-0.5 max-h-48 overflow-y-auto">
          {(receitaSel.ingredientesEstruturados ?? []).map((ing, i) => (
            <div key={i} className="flex justify-between items-center text-xs py-1.5 border-b border-gray-800/60">
              <span className="text-gray-200">{ing.nome}</span>
              <span className="text-gray-500 ml-2 flex-shrink-0">
                {ing.quantidade}g · {r1(ing.caloriasP100g * ing.quantidade / 100)} kcal
              </span>
            </div>
          ))}
        </div>
        <button
          onClick={() => onInserir(receitaSel.ingredientesEstruturados ?? [])}
          disabled={inserindo || !receitaSel.ingredientesEstruturados?.length}
          className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-violet-500 to-purple-500 hover:from-violet-400 hover:to-purple-400 disabled:opacity-40 text-white px-4 py-2.5 rounded-xl text-sm font-bold transition-all"
        >
          {inserindo ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
          Inserir {receitaSel.ingredientesEstruturados?.length ?? 0} ingrediente(s)
        </button>
      </div>
    );
  }

  return (
    <div className="border-t border-gray-800 p-4 space-y-3">
      <div className="flex items-center gap-2">
        <BookOpen className="w-4 h-4 text-violet-400" />
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider flex-1">Inserir Receita</p>
        <button onClick={onFechar} className="p-1.5 text-gray-600 hover:text-white transition-colors rounded-lg hover:bg-gray-800">
          <X className="w-4 h-4" />
        </button>
      </div>
      {isLoading ? (
        <div className="flex justify-center py-4">
          <Loader2 className="w-5 h-5 animate-spin text-violet-400" />
        </div>
      ) : comIngredientes.length === 0 ? (
        <div className="text-center py-6 text-gray-600 text-xs space-y-1">
          <p>Nenhuma receita com ingredientes estruturados.</p>
          <p>Adicione ingredientes TACO nas receitas primeiro.</p>
        </div>
      ) : (
        <div className="space-y-1.5 max-h-56 overflow-y-auto">
          {comIngredientes.map((r) => (
            <button
              key={r.id}
              onClick={() => setReceitaSel(r)}
              className="w-full text-left flex items-center justify-between px-3 py-2.5 rounded-xl bg-gray-800 hover:bg-gray-700 transition-colors"
            >
              <div className="min-w-0">
                <p className="text-sm text-white font-medium truncate">{r.nome}</p>
                {r.categoria && <p className="text-xs text-gray-500 truncate">{r.categoria}</p>}
              </div>
              <span className="text-xs text-gray-600 ml-2 flex-shrink-0">
                {r.ingredientesEstruturados?.length} item(s)
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Food Search Panel ─────────────────────────────────────────────
function BuscaAlimento({
  onAdicionar,
  onFechar,
  adicionando,
}: {
  onAdicionar: (a: TacoAlimento | null, customNome: string, customKcal: number, qty: number) => void;
  onFechar: () => void;
  adicionando: boolean;
}) {
  const [busca, setBusca] = useState('');
  const [catFiltro, setCatFiltro] = useState('');
  const [alimentoSel, setAlimentoSel] = useState<TacoAlimento | null>(null);
  const [modoCustom, setModoCustom] = useState(false);
  const [qtd, setQtd] = useState('100');
  const [customNome, setCustomNome] = useState('');
  const [customKcal, setCustomKcal] = useState('');

  const tacoFiltrado = useMemo(() => {
    let lista = tacoAlimentos;
    if (catFiltro) lista = lista.filter((a) => a.categoria === catFiltro);
    if (busca.trim()) {
      const t = busca.toLowerCase();
      lista = lista.filter(
        (a) => a.nome.toLowerCase().includes(t) || a.categoria.toLowerCase().includes(t),
      );
    }
    return lista.slice(0, 8);
  }, [busca, catFiltro]);

  const previewKcal = alimentoSel
    ? r1(alimentoSel.caloriasP100g * (Number(qtd) || 0) / 100)
    : 0;

  const podeAdicionar = modoCustom
    ? customNome.trim() && Number(qtd) > 0
    : alimentoSel && Number(qtd) > 0;

  return (
    <div className="border-t border-gray-800 p-4 space-y-3">
      <div className="flex items-center gap-2">
        <button
          onClick={() => { setModoCustom(false); setAlimentoSel(null); }}
          className={`text-xs px-3 py-1.5 rounded-lg transition-colors ${!modoCustom ? 'bg-emerald-500/20 text-emerald-400' : 'text-gray-500 hover:text-gray-300'}`}
        >
          Tabela TACO
        </button>
        <button
          onClick={() => { setModoCustom(true); setAlimentoSel(null); }}
          className={`text-xs px-3 py-1.5 rounded-lg transition-colors ${modoCustom ? 'bg-emerald-500/20 text-emerald-400' : 'text-gray-500 hover:text-gray-300'}`}
        >
          Campo livre
        </button>
        <button onClick={onFechar} className="ml-auto p-1.5 text-gray-600 hover:text-white transition-colors rounded-lg hover:bg-gray-800">
          <X className="w-4 h-4" />
        </button>
      </div>

      {!modoCustom && (
        <>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-600" />
              <input
                autoFocus
                type="text"
                placeholder="Buscar na tabela TACO..."
                value={busca}
                onChange={(e) => { setBusca(e.target.value); setAlimentoSel(null); }}
                className="w-full bg-gray-800 border border-gray-700 rounded-xl py-2 pl-9 pr-3 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-emerald-500"
              />
            </div>
            <select
              value={catFiltro}
              onChange={(e) => setCatFiltro(e.target.value)}
              className="bg-gray-800 border border-gray-700 rounded-xl py-2 px-2 text-xs text-gray-300 focus:outline-none focus:border-emerald-500 hidden sm:block"
            >
              <option value="">Todas</option>
              {categoriasTaco.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>

          {!alimentoSel && busca.trim() && (
            <div className="bg-gray-800 rounded-xl overflow-hidden border border-gray-700 max-h-48 overflow-y-auto">
              {tacoFiltrado.length === 0 ? (
                <p className="text-center py-4 text-xs text-gray-600">Nenhum resultado</p>
              ) : (
                tacoFiltrado.map((a) => (
                  <button
                    key={a.tacoId}
                    onClick={() => { setAlimentoSel(a); setQtd('100'); setBusca(a.nome); }}
                    className="w-full flex items-center justify-between px-4 py-2.5 hover:bg-gray-700 transition-colors text-left border-b border-gray-700/50 last:border-0"
                  >
                    <div className="min-w-0">
                      <p className="text-sm text-white font-medium truncate">{a.nome}</p>
                      <p className="text-xs text-gray-500 truncate">{a.categoria}</p>
                    </div>
                    <span className="text-xs text-yellow-400 flex-shrink-0 ml-3">{a.caloriasP100g} kcal/100g</span>
                  </button>
                ))
              )}
            </div>
          )}
        </>
      )}

      {modoCustom && (
        <div className="space-y-2">
          <input
            autoFocus
            type="text"
            placeholder="Nome do alimento (ex: Shake de proteína)"
            value={customNome}
            onChange={(e) => setCustomNome(e.target.value)}
            className={inputCls}
          />
          <input
            type="number"
            placeholder="Calorias por 100g (pode deixar 0)"
            value={customKcal}
            onChange={(e) => setCustomKcal(e.target.value)}
            className={inputCls}
          />
        </div>
      )}

      {(alimentoSel || modoCustom) && (
        <div className="flex items-end gap-3">
          <div className="w-32 flex-shrink-0">
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Quantidade (g)</label>
            <input
              type="number"
              min="1"
              value={qtd}
              onChange={(e) => setQtd(e.target.value)}
              className={inputCls}
            />
          </div>
          {alimentoSel && (
            <div className="flex-1 pb-0.5">
              <p className="text-xs text-gray-600 mb-1">Preview</p>
              <p className="text-sm">
                <span className="text-yellow-400 font-bold">{previewKcal} kcal</span>
                <span className="text-gray-600 mx-1.5">·</span>
                <span className="text-blue-400">{r1(alimentoSel.proteinasP100g * (Number(qtd) || 0) / 100)}g P</span>
              </p>
            </div>
          )}
          <button
            onClick={() => {
              if (modoCustom) {
                onAdicionar(null, customNome, Number(customKcal) || 0, Number(qtd) || 100);
              } else if (alimentoSel) {
                onAdicionar(alimentoSel, '', 0, Number(qtd) || 100);
              }
            }}
            disabled={!podeAdicionar || adicionando}
            className="flex items-center gap-1.5 bg-gradient-to-r from-emerald-500 to-teal-500 disabled:opacity-40 text-white px-4 py-2.5 rounded-xl text-sm font-bold transition-all flex-shrink-0"
          >
            {adicionando ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
            Adicionar
          </button>
        </div>
      )}
    </div>
  );
}

// ── Main Editor ───────────────────────────────────────────────────
export default function EditorPlanoAlimentar({
  planoId,
  planoNome,
  alunoNome,
  onVoltar,
}: {
  planoId: string;
  planoNome: string;
  alunoNome: string;
  onVoltar: () => void;
}) {
  const qc = useQueryClient();

  const [expandida, setExpandida] = useState<string | null>(null);
  const [adding, setAdding] = useState<AddingState | null>(null);
  const [addingReceita, setAddingReceita] = useState<AddingState | null>(null);
  const [opcaoAtiva, setOpcaoAtiva] = useState<Record<string, number>>({});
  const [modalRf, setModalRf] = useState(false);
  const [nomeRf, setNomeRf] = useState('');
  const [horarioRf, setHorarioRf] = useState('');
  const [liquidosMl, setLiquidosMl] = useState('');
  const [liquidoSaving, setLiquidoSaving] = useState(false);
  const [editandoHorario, setEditandoHorario] = useState<string | null>(null);
  const [horarioTemp, setHorarioTemp] = useState('');

  const { data: refeicoes = [], isLoading } = useQuery<RefeicaoLoaded[]>({
    queryKey: ['editor', planoId],
    queryFn: () => planosServico.refeicoes.carregarEditor(planoId).then((r: any) => r.data),
  });

  // Load plan extra fields (liquidosMl)
  useQuery({
    queryKey: ['plano-extra', planoId],
    queryFn: async () => {
      const r: any = await planosServico.buscar(planoId);
      if (r.data?.liquidosMl) setLiquidosMl(String(r.data.liquidosMl));
      return r.data;
    },
  });

  const totais = useMemo(
    () => calcMacros(refeicoes.flatMap((rf) => rf.itens.filter((it) => (it.opcaoIndex ?? 0) === 0))),
    [refeicoes],
  );

  const totalItens = useMemo(
    () => refeicoes.reduce((acc, rf) => acc + rf.itens.length, 0),
    [refeicoes],
  );

  const invalidar = () => qc.invalidateQueries({ queryKey: ['editor', planoId] });

  // ── Mutations ─────────────────────────────────────────────────
  const mutTemplate = useMutation({
    mutationFn: async ({ template, preTreino, posTreino }: { template: number; preTreino: boolean; posTreino: boolean }) => {
      const lista = template > 0 ? [...TEMPLATES[template]] : [];
      if (preTreino) lista.push({ nome: 'Pré-Treino', horario: '17:00' });
      if (posTreino) lista.push({ nome: 'Pós-Treino', horario: '18:30' });
      await Promise.all(
        lista.map((rf, i) =>
          planosServico.refeicoes.adicionar(planoId, {
            planoId,
            nome: rf.nome,
            horario: rf.horario,
            ordem: i,
            ehPreTreino: rf.nome === 'Pré-Treino',
            ehPosTreino: rf.nome === 'Pós-Treino',
          }),
        ),
      );
    },
    onSuccess: invalidar,
  });

  const mutAddRf = useMutation({
    mutationFn: () =>
      planosServico.refeicoes.adicionar(planoId, {
        planoId,
        nome: nomeRf.trim(),
        horario: horarioRf || null,
        ordem: refeicoes.length,
        ehPreTreino: false,
        ehPosTreino: false,
      }),
    onSuccess: () => {
      invalidar();
      setModalRf(false);
      setNomeRf('');
      setHorarioRf('');
    },
  });

  const mutDelRf = useMutation({
    mutationFn: async (rf: RefeicaoLoaded) => {
      await Promise.all(rf.itens.map((it) => planosServico.refeicoes.deletarItem(it.id)));
      await planosServico.refeicoes.deletar(planoId, rf.id);
    },
    onSuccess: invalidar,
  });

  const mutToggleTreino = useMutation({
    mutationFn: ({ rfId, campo, valor }: { rfId: string; campo: 'ehPreTreino' | 'ehPosTreino'; valor: boolean }) =>
      planosServico.refeicoes.atualizar(planoId, rfId, { [campo]: valor }),
    onSuccess: invalidar,
  });

  const mutHorario = useMutation({
    mutationFn: ({ rfId, horario }: { rfId: string; horario: string }) =>
      planosServico.refeicoes.atualizar(planoId, rfId, { horario: horario || null }),
    onSuccess: () => { invalidar(); setEditandoHorario(null); },
  });

  const mutAddItem = useMutation({
    mutationFn: ({
      refeicaoId, opcaoIndex, alimento, customNome, customKcal, qty,
    }: {
      refeicaoId: string;
      opcaoIndex: number;
      alimento: TacoAlimento | null;
      customNome: string;
      customKcal: number;
      qty: number;
    }) => {
      if (alimento) {
        return planosServico.refeicoes.adicionarItem(planoId, refeicaoId, {
          opcaoIndex,
          tacoId: alimento.tacoId,
          nome: alimento.nome,
          quantidade: qty,
          caloriasP100g: alimento.caloriasP100g,
          proteinasP100g: alimento.proteinasP100g,
          carboidratosP100g: alimento.carboidratosP100g,
          gordurasP100g: alimento.gordurasP100g,
          fibrasP100g: alimento.fibrasP100g ?? null,
        });
      }
      return planosServico.refeicoes.adicionarItem(planoId, refeicaoId, {
        opcaoIndex,
        nome: customNome,
        quantidade: qty,
        caloriasP100g: customKcal,
        proteinasP100g: 0,
        carboidratosP100g: 0,
        gordurasP100g: 0,
        fibrasP100g: null,
      });
    },
    onSuccess: () => {
      invalidar();
      setAdding(null);
    },
  });

  const mutDelItem = useMutation({
    mutationFn: (itemId: string) => planosServico.refeicoes.deletarItem(itemId),
    onSuccess: invalidar,
  });

  const mutInsertReceita = useMutation({
    mutationFn: async ({ refeicaoId, opcaoIndex, ingredientes }: {
      refeicaoId: string;
      opcaoIndex: number;
      ingredientes: IngredienteReceita[];
    }) => {
      for (const ing of ingredientes) {
        await planosServico.refeicoes.adicionarItem(planoId, refeicaoId, {
          opcaoIndex,
          nome: ing.nome,
          quantidade: ing.quantidade,
          caloriasP100g: ing.caloriasP100g,
          proteinasP100g: ing.proteinasP100g,
          carboidratosP100g: ing.carboidratosP100g,
          gordurasP100g: ing.gordurasP100g,
          fibrasP100g: ing.fibrasP100g ?? null,
        });
      }
    },
    onSuccess: () => {
      invalidar();
      setAddingReceita(null);
    },
  });

  const salvarLiquido = async () => {
    if (!liquidosMl) return;
    setLiquidoSaving(true);
    await planosServico.atualizar(planoId, { liquidosMl: Number(liquidosMl) || null });
    setLiquidoSaving(false);
  };

  // ── Render helpers ────────────────────────────────────────────
  if (isLoading) {
    return (
      <div className="flex justify-center pt-20">
        <Loader2 className="w-7 h-7 animate-spin text-emerald-500" />
      </div>
    );
  }

  const pdfData = {
    planoNome,
    alunoNome,
    liquidosMl: Number(liquidosMl) || undefined,
    refeicoes: refeicoes.map((rf) => ({
      id: rf.id,
      nome: rf.nome,
      horario: rf.horario,
      ordem: rf.ordem,
      ehPreTreino: rf.ehPreTreino,
      ehPosTreino: rf.ehPosTreino,
      itens: rf.itens,
    })),
  };

  // Template selector when no meals yet
  if (refeicoes.length === 0 && !mutTemplate.isPending) {
    return (
      <div className="space-y-5">
        <div className="flex items-center gap-3">
          <button onClick={onVoltar} className="p-2 rounded-xl text-gray-500 hover:text-white hover:bg-gray-800 transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h2 className="text-xl font-black text-white">{planoNome}</h2>
            <p className="text-xs text-gray-500">{alunoNome}</p>
          </div>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
          <TemplateSelector
            onAplicar={(template, preTreino, posTreino) =>
              mutTemplate.mutate({ template, preTreino, posTreino })
            }
            aplicando={mutTemplate.isPending}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* ── Header ── */}
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-3">
          <button onClick={onVoltar} className="p-2 rounded-xl text-gray-500 hover:text-white hover:bg-gray-800 transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h2 className="text-xl font-black text-white">{planoNome}</h2>
            <p className="text-xs text-gray-500">
              {alunoNome} · {refeicoes.length} refeição(ões) · {totalItens} alimento(s)
            </p>
          </div>
        </div>

        <PDFDownloadLink
          document={<PlanoAlimentarPDF {...pdfData} />}
          fileName={`plano-${alunoNome.toLowerCase().replace(/\s+/g, '-')}.pdf`}
          className="flex items-center gap-2 bg-gray-900 hover:bg-gray-800 border border-gray-700 hover:border-gray-600 text-gray-300 hover:text-white px-4 py-2.5 rounded-xl text-sm font-semibold transition-all"
        >
          {({ loading }: { loading: boolean }) =>
            loading
              ? <><Loader2 className="w-4 h-4 animate-spin" /> Gerando...</>
              : <><FileDown className="w-4 h-4" /> Baixar PDF</>
          }
        </PDFDownloadLink>
      </div>

      {/* ── Macros totais ── */}
      {totalItens > 0 && (
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

      {/* ── Líquidos ── */}
      <div className="flex items-center gap-3 bg-gray-900 border border-gray-800 rounded-2xl px-5 py-3">
        <Droplets className="w-4 h-4 text-blue-400 flex-shrink-0" />
        <span className="text-sm text-gray-400 whitespace-nowrap">Ingestão de líquidos</span>
        <div className="flex items-center gap-2 flex-1 max-w-xs">
          <input
            type="number"
            placeholder="ex: 2500"
            value={liquidosMl}
            onChange={(e) => setLiquidosMl(e.target.value)}
            onBlur={salvarLiquido}
            className="flex-1 bg-gray-800 border border-gray-700 rounded-lg py-1.5 px-3 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-blue-500 transition-all"
          />
          <span className="text-xs text-gray-500 whitespace-nowrap">ml / dia</span>
          {liquidoSaving && <Loader2 className="w-3.5 h-3.5 animate-spin text-gray-600" />}
        </div>
        {Number(liquidosMl) >= 1000 && (
          <span className="text-xs text-blue-400 font-semibold">
            = {(Number(liquidosMl) / 1000).toFixed(1)}L
          </span>
        )}
      </div>

      {/* ── Nova refeição ── */}
      <div className="flex justify-end">
        <button
          onClick={() => setModalRf(true)}
          className="flex items-center gap-2 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-white px-4 py-2.5 rounded-xl text-sm font-bold shadow-lg shadow-emerald-500/20 transition-all"
        >
          <Plus className="w-4 h-4" /> Nova Refeição
        </button>
      </div>

      {/* ── Meal cards ── */}
      {refeicoes.map((rf) => {
        const grupos = agruparOpcoes(rf.itens);
        const opcoes = Array.from(grupos.keys()).sort();
        const ativa = opcaoAtiva[rf.id] ?? 0;
        const aberta = expandida === rf.id;
        const rfMacros = calcMacros(grupos.get(0) ?? []);
        const isAdding = adding?.refeicaoId === rf.id && adding.opcaoIndex === ativa;
        const isAddingReceita = addingReceita?.refeicaoId === rf.id && addingReceita.opcaoIndex === ativa;

        return (
          <div key={rf.id} className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden">
            {/* Header */}
            <div
              className="flex items-center justify-between px-5 py-4 cursor-pointer hover:bg-gray-800/50 transition-colors"
              onClick={() => setExpandida(aberta ? null : rf.id)}
            >
              <div className="flex items-center gap-3 min-w-0">
                {aberta
                  ? <ChevronUp className="w-4 h-4 text-gray-500 flex-shrink-0" />
                  : <ChevronDown className="w-4 h-4 text-gray-500 flex-shrink-0" />}
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-semibold text-white">{rf.nome}</p>
                    {rf.ehPreTreino && (
                      <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-orange-500/15 text-orange-400 border border-orange-500/30">
                        Pré-Treino
                      </span>
                    )}
                    {rf.ehPosTreino && (
                      <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-violet-500/15 text-violet-400 border border-violet-500/30">
                        Pós-Treino
                      </span>
                    )}
                    {opcoes.length > 1 && (
                      <span className="px-2 py-0.5 rounded-full text-xs text-gray-500 bg-gray-800 border border-gray-700">
                        {opcoes.length} opções
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-3 mt-0.5">
                    {editandoHorario === rf.id ? (
                      <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                        <Clock className="w-3 h-3 text-emerald-400 flex-shrink-0" />
                        <input
                          autoFocus
                          type="time"
                          value={horarioTemp}
                          onChange={(e) => setHorarioTemp(e.target.value)}
                          onBlur={() => mutHorario.mutate({ rfId: rf.id, horario: horarioTemp })}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') mutHorario.mutate({ rfId: rf.id, horario: horarioTemp });
                            if (e.key === 'Escape') setEditandoHorario(null);
                          }}
                          className="bg-gray-800 border border-emerald-500/60 rounded-lg py-0.5 px-2 text-xs text-white focus:outline-none focus:border-emerald-500 w-24"
                        />
                      </div>
                    ) : (
                      <button
                        onClick={(e) => { e.stopPropagation(); setEditandoHorario(rf.id); setHorarioTemp(rf.horario || ''); }}
                        className="flex items-center gap-1 text-xs text-gray-500 hover:text-emerald-400 transition-colors group"
                        title="Editar horário"
                      >
                        <Clock className="w-3 h-3" />
                        {rf.horario
                          ? rf.horario
                          : <span className="text-gray-700 group-hover:text-emerald-400/50">--:--</span>}
                      </button>
                    )}
                    <span className="text-xs text-gray-600">{rf.itens.length} item(s)</span>
                    {rf.itens.length > 0 && (
                      <span className="text-xs text-yellow-400/80">{r1(rfMacros.kcal)} kcal</span>
                    )}
                  </div>
                </div>
              </div>

              {/* Action buttons */}
              <div className="flex items-center gap-1 flex-shrink-0" onClick={(e) => e.stopPropagation()}>
                <button
                  onClick={() => mutToggleTreino.mutate({ rfId: rf.id, campo: 'ehPreTreino', valor: !rf.ehPreTreino })}
                  title={rf.ehPreTreino ? 'Remover Pré-Treino' : 'Marcar como Pré-Treino'}
                  className={`p-1.5 rounded-lg transition-all ${rf.ehPreTreino ? 'text-orange-400 bg-orange-500/10' : 'text-gray-700 hover:text-orange-400 hover:bg-orange-500/10'}`}
                >
                  <span className="text-xs font-bold">PRÉ</span>
                </button>
                <button
                  onClick={() => mutToggleTreino.mutate({ rfId: rf.id, campo: 'ehPosTreino', valor: !rf.ehPosTreino })}
                  title={rf.ehPosTreino ? 'Remover Pós-Treino' : 'Marcar como Pós-Treino'}
                  className={`p-1.5 rounded-lg transition-all ${rf.ehPosTreino ? 'text-violet-400 bg-violet-500/10' : 'text-gray-700 hover:text-violet-400 hover:bg-violet-500/10'}`}
                >
                  <span className="text-xs font-bold">PÓS</span>
                </button>
                <button
                  onClick={() => { if (confirm(`Excluir "${rf.nome}"?`)) mutDelRf.mutate(rf); }}
                  className="p-1.5 rounded-lg text-gray-700 hover:text-red-400 hover:bg-red-500/10 transition-all"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Expanded content */}
            {aberta && (
              <div className="border-t border-gray-800">
                {/* Opcao tabs */}
                {opcoes.length > 1 && (
                  <div className="flex border-b border-gray-800">
                    {opcoes.map((idx) => (
                      <button
                        key={idx}
                        onClick={() => setOpcaoAtiva((p) => ({ ...p, [rf.id]: idx }))}
                        className={`px-4 py-2.5 text-xs font-semibold transition-colors ${
                          ativa === idx
                            ? 'text-emerald-400 border-b-2 border-emerald-500 -mb-px bg-emerald-500/5'
                            : 'text-gray-500 hover:text-gray-300'
                        }`}
                      >
                        Opção {LETRAS[idx] ?? String(idx + 1)}
                        <span className="ml-1.5 text-gray-600">({grupos.get(idx)?.length ?? 0})</span>
                      </button>
                    ))}
                    <button
                      onClick={() => {
                        const nextIdx = Math.max(...opcoes) + 1;
                        setOpcaoAtiva((p) => ({ ...p, [rf.id]: nextIdx }));
                        setAdding({ refeicaoId: rf.id, opcaoIndex: nextIdx });
                      }}
                      className="px-3 py-2.5 text-xs text-gray-600 hover:text-emerald-400 transition-colors ml-auto"
                    >
                      + Alternativa
                    </button>
                  </div>
                )}

                {/* Items for active opcao */}
                {(grupos.get(ativa) ?? []).map((it, i, arr) => {
                  const f = it.quantidade / 100;
                  return (
                    <div
                      key={it.id}
                      className={`flex items-center gap-3 px-5 py-3 group ${i < arr.length - 1 ? 'border-b border-gray-800/60' : ''}`}
                    >
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-white truncate">{it.nome}</p>
                        <p className="text-xs text-gray-500 mt-0.5">{it.quantidade}g</p>
                      </div>
                      <div className="flex items-center gap-2 text-xs tabular-nums flex-shrink-0">
                        <span className="text-yellow-400">{r1(it.caloriasP100g * f)} kcal</span>
                        <span className="text-blue-400 hidden sm:inline">{r1(it.proteinasP100g * f)}g P</span>
                        <span className="text-orange-400 hidden md:inline">{r1(it.carboidratosP100g * f)}g C</span>
                        <span className="text-red-400 hidden md:inline">{r1(it.gordurasP100g * f)}g G</span>
                      </div>
                      <button
                        onClick={() => mutDelItem.mutate(it.id)}
                        className="p-1.5 rounded-lg text-gray-700 hover:text-red-400 hover:bg-red-500/10 transition-all opacity-0 group-hover:opacity-100"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  );
                })}

                {/* Empty state */}
                {(grupos.get(ativa) ?? []).length === 0 && !isAdding && (
                  <div className="px-5 py-6 text-center text-gray-600 text-sm">
                    <Utensils className="w-6 h-6 mx-auto mb-2 opacity-30" />
                    Nenhum alimento nesta opção
                  </div>
                )}

                {/* Food search, recipe, or add buttons */}
                {isAdding ? (
                  <BuscaAlimento
                    onAdicionar={(alimento, customNome, customKcal, qty) =>
                      mutAddItem.mutate({
                        refeicaoId: rf.id,
                        opcaoIndex: adding!.opcaoIndex,
                        alimento,
                        customNome,
                        customKcal,
                        qty,
                      })
                    }
                    onFechar={() => setAdding(null)}
                    adicionando={mutAddItem.isPending}
                  />
                ) : isAddingReceita ? (
                  <BuscaReceita
                    onInserir={(ingredientes) =>
                      mutInsertReceita.mutate({
                        refeicaoId: rf.id,
                        opcaoIndex: addingReceita!.opcaoIndex,
                        ingredientes,
                      })
                    }
                    onFechar={() => setAddingReceita(null)}
                    inserindo={mutInsertReceita.isPending}
                  />
                ) : (
                  <div className="flex items-center justify-between px-5 py-3 border-t border-gray-800">
                    <div className="flex items-center gap-4">
                      <button
                        onClick={() => { setAdding({ refeicaoId: rf.id, opcaoIndex: ativa }); setExpandida(rf.id); }}
                        className="flex items-center gap-1.5 text-sm text-emerald-400 hover:text-emerald-300 transition-colors"
                      >
                        <Plus className="w-4 h-4" /> Adicionar alimento
                      </button>
                      <button
                        onClick={() => { setAddingReceita({ refeicaoId: rf.id, opcaoIndex: ativa }); setExpandida(rf.id); }}
                        className="flex items-center gap-1.5 text-sm text-violet-400 hover:text-violet-300 transition-colors"
                      >
                        <BookOpen className="w-4 h-4" /> Inserir receita
                      </button>
                    </div>
                    {opcoes.length === 1 && (
                      <button
                        onClick={() => {
                          setOpcaoAtiva((p) => ({ ...p, [rf.id]: 1 }));
                          setAdding({ refeicaoId: rf.id, opcaoIndex: 1 });
                        }}
                        className="text-xs text-gray-600 hover:text-gray-400 transition-colors"
                      >
                        + Opção alternativa
                      </button>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        );
      })}

      {/* ── Modal Nova Refeição ── */}
      {modalRf && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="bg-gray-900 border border-gray-800 rounded-2xl shadow-2xl w-full max-w-sm p-6">
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-bold text-white">Nova Refeição</h3>
              <button onClick={() => setModalRf(false)} className="p-1.5 rounded-lg hover:bg-gray-800 text-gray-500">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">Nome</label>
                <input
                  autoFocus
                  value={nomeRf}
                  onChange={(e) => setNomeRf(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && nomeRf.trim() && mutAddRf.mutate()}
                  placeholder="Ex: Lanche, Pré-Treino..."
                  className={inputCls}
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">Horário (opcional)</label>
                <input type="time" value={horarioRf} onChange={(e) => setHorarioRf(e.target.value)} className={inputCls} />
              </div>
              <div className="flex gap-3 pt-1">
                <button onClick={() => setModalRf(false)} className="flex-1 bg-gray-800 hover:bg-gray-700 border border-gray-700 text-gray-300 py-2.5 rounded-xl text-sm transition-all">
                  Cancelar
                </button>
                <button
                  onClick={() => mutAddRf.mutate()}
                  disabled={!nomeRf.trim() || mutAddRf.isPending}
                  className="flex-1 bg-gradient-to-r from-emerald-500 to-teal-500 disabled:opacity-50 text-white py-2.5 rounded-xl text-sm font-bold flex items-center justify-center gap-1.5 transition-all"
                >
                  {mutAddRf.isPending && <Loader2 className="w-4 h-4 animate-spin" />} Criar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
