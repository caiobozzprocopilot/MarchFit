import { Document, Page, View, Text, StyleSheet, Font } from '@react-pdf/renderer';

// ── Types ────────────────────────────────────────────────────────
export type ItemPDF = {
  id: string;
  nome: string;
  quantidade: number;
  opcaoIndex: number;
  caloriasP100g: number;
  proteinasP100g: number;
  carboidratosP100g: number;
  gordurasP100g: number;
  fibrasP100g?: number | null;
};

export type RefeicaoPDF = {
  id: string;
  nome: string;
  horario?: string;
  ordem: number;
  ehPreTreino?: boolean;
  ehPosTreino?: boolean;
  itens: ItemPDF[];
};

export type PlanoAlimentarPDFProps = {
  planoNome: string;
  alunoNome: string;
  liquidosMl?: number;
  refeicoes: RefeicaoPDF[];
};

// ── Helpers ──────────────────────────────────────────────────────
const r1 = (v: number) => Math.round(v * 10) / 10;

function calcMacros(itens: ItemPDF[]) {
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

function agruparOpcoes(itens: ItemPDF[]): Map<number, ItemPDF[]> {
  const map = new Map<number, ItemPDF[]>();
  for (const it of itens) {
    const idx = it.opcaoIndex ?? 0;
    if (!map.has(idx)) map.set(idx, []);
    map.get(idx)!.push(it);
  }
  return map;
}

const LETRAS = ['A', 'B', 'C', 'D', 'E'];

// ── Styles ───────────────────────────────────────────────────────
const S = StyleSheet.create({
  page: {
    backgroundColor: '#ffffff',
    fontFamily: 'Helvetica',
    paddingBottom: 40,
  },

  // Header gradient band
  header: {
    backgroundColor: '#059669',
    paddingVertical: 18,
    paddingHorizontal: 28,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  headerBrand: {
    color: '#ffffff',
    fontSize: 22,
    fontFamily: 'Helvetica-Bold',
    letterSpacing: 3,
  },
  headerSub: {
    color: '#a7f3d0',
    fontSize: 8,
    letterSpacing: 2,
    marginTop: 2,
  },
  headerRight: {
    alignItems: 'flex-end',
  },
  headerPaciente: {
    color: '#ffffff',
    fontSize: 11,
    fontFamily: 'Helvetica-Bold',
  },
  headerPlano: {
    color: '#a7f3d0',
    fontSize: 8,
    marginTop: 2,
  },

  // Accent stripe below header
  stripe: {
    height: 3,
    backgroundColor: '#14b8a6',
  },

  // Body padding
  body: {
    paddingHorizontal: 28,
    paddingTop: 16,
  },

  // Macros summary row
  macrosRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  macroBox: {
    flex: 1,
    backgroundColor: '#f0fdf4',
    borderRadius: 6,
    paddingVertical: 8,
    paddingHorizontal: 6,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#bbf7d0',
  },
  macroLabel: {
    fontSize: 7,
    color: '#6b7280',
    letterSpacing: 1,
    fontFamily: 'Helvetica-Bold',
    marginBottom: 3,
  },
  macroValue: {
    fontSize: 13,
    fontFamily: 'Helvetica-Bold',
    color: '#065f46',
  },

  // Liquid info
  liquidRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#eff6ff',
    borderRadius: 6,
    paddingVertical: 6,
    paddingHorizontal: 10,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#bfdbfe',
  },
  liquidText: {
    fontSize: 9,
    color: '#1e40af',
    fontFamily: 'Helvetica-Bold',
  },
  liquidSub: {
    fontSize: 8,
    color: '#3b82f6',
    marginLeft: 4,
  },

  // Meal card
  mealCard: {
    marginBottom: 12,
    borderRadius: 8,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  mealHeader: {
    backgroundColor: '#064e3b',
    paddingVertical: 8,
    paddingHorizontal: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  mealName: {
    color: '#ffffff',
    fontSize: 10,
    fontFamily: 'Helvetica-Bold',
    letterSpacing: 0.5,
  },
  mealMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  mealTime: {
    color: '#6ee7b7',
    fontSize: 8,
  },
  mealBadge: {
    backgroundColor: '#065f46',
    color: '#6ee7b7',
    fontSize: 7,
    paddingVertical: 2,
    paddingHorizontal: 5,
    borderRadius: 3,
    fontFamily: 'Helvetica-Bold',
  },
  mealMacros: {
    color: '#a7f3d0',
    fontSize: 7,
  },

  // Opcao section
  opcaoHeader: {
    backgroundColor: '#f9fafb',
    paddingVertical: 5,
    paddingHorizontal: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  opcaoLabel: {
    fontSize: 8,
    fontFamily: 'Helvetica-Bold',
    color: '#374151',
    letterSpacing: 0.5,
  },
  opcaoMacros: {
    fontSize: 7,
    color: '#6b7280',
  },

  // Item row
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 5,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
    backgroundColor: '#ffffff',
  },
  itemName: {
    flex: 1,
    fontSize: 8.5,
    color: '#111827',
  },
  itemQty: {
    fontSize: 7.5,
    color: '#6b7280',
    width: 40,
    textAlign: 'right',
  },
  itemKcal: {
    fontSize: 7.5,
    color: '#b45309',
    width: 44,
    textAlign: 'right',
    fontFamily: 'Helvetica-Bold',
  },
  itemProt: {
    fontSize: 7.5,
    color: '#1d4ed8',
    width: 36,
    textAlign: 'right',
  },
  itemCarb: {
    fontSize: 7.5,
    color: '#c2410c',
    width: 36,
    textAlign: 'right',
  },
  itemGord: {
    fontSize: 7.5,
    color: '#dc2626',
    width: 36,
    textAlign: 'right',
  },

  // Columns header row
  colHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 3,
    paddingHorizontal: 12,
    backgroundColor: '#f9fafb',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  colLabel: {
    fontSize: 6.5,
    color: '#9ca3af',
    fontFamily: 'Helvetica-Bold',
    letterSpacing: 0.5,
  },

  // OU divider
  ouRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 5,
    paddingHorizontal: 12,
    backgroundColor: '#fefce8',
  },
  ouLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#fde68a',
  },
  ouText: {
    fontSize: 7,
    color: '#92400e',
    fontFamily: 'Helvetica-Bold',
    marginHorizontal: 8,
    letterSpacing: 1,
  },

  // Footer
  footer: {
    position: 'absolute',
    bottom: 16,
    left: 28,
    right: 28,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    paddingTop: 8,
  },
  footerText: {
    fontSize: 7,
    color: '#9ca3af',
  },
  footerBrand: {
    fontSize: 7,
    color: '#059669',
    fontFamily: 'Helvetica-Bold',
    letterSpacing: 1,
  },

  // Section title
  sectionTitle: {
    fontSize: 7.5,
    fontFamily: 'Helvetica-Bold',
    color: '#6b7280',
    letterSpacing: 1,
    marginBottom: 8,
    marginTop: 4,
  },
});

// ── PDF Document ──────────────────────────────────────────────────
export default function PlanoAlimentarPDF({ planoNome, alunoNome, liquidosMl, refeicoes }: PlanoAlimentarPDFProps) {
  const todosItens = refeicoes.flatMap((rf) => rf.itens.filter((it) => it.opcaoIndex === 0));
  const totais = calcMacros(todosItens);
  const hoje = new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' });

  return (
    <Document title={`Plano Alimentar - ${alunoNome}`} author="MarchFit" subject="Plano Alimentar">
      <Page size="A4" style={S.page}>
        {/* ── Header ── */}
        <View style={S.header}>
          <View>
            <Text style={S.headerBrand}>MARCHFIT</Text>
            <Text style={S.headerSub}>PLANO ALIMENTAR</Text>
          </View>
          <View style={S.headerRight}>
            <Text style={S.headerPaciente}>{alunoNome.toUpperCase()}</Text>
            <Text style={S.headerPlano}>{planoNome.toUpperCase()}</Text>
          </View>
        </View>
        <View style={S.stripe} />

        <View style={S.body}>
          {/* ── Macros totais ── */}
          {todosItens.length > 0 && (
            <>
              <Text style={S.sectionTitle}>RESUMO DO PLANO (OPÇÃO A)</Text>
              <View style={S.macrosRow}>
                {[
                  { label: 'CALORIAS', valor: `${r1(totais.kcal)} kcal` },
                  { label: 'PROTEÍNAS', valor: `${r1(totais.prot)}g` },
                  { label: 'CARBOIDRATOS', valor: `${r1(totais.carb)}g` },
                  { label: 'GORDURAS', valor: `${r1(totais.gord)}g` },
                ].map((m) => (
                  <View key={m.label} style={S.macroBox}>
                    <Text style={S.macroLabel}>{m.label}</Text>
                    <Text style={S.macroValue}>{m.valor}</Text>
                  </View>
                ))}
              </View>
            </>
          )}

          {/* ── Liquid ── */}
          {liquidosMl && liquidosMl > 0 && (
            <View style={S.liquidRow}>
              <Text style={S.liquidText}>💧 INGESTÃO DE LÍQUIDOS RECOMENDADA:</Text>
              <Text style={S.liquidSub}>{liquidosMl >= 1000 ? `${(liquidosMl / 1000).toFixed(1)}L` : `${liquidosMl}ml`} ao longo do dia</Text>
            </View>
          )}

          {/* ── Refeições ── */}
          {refeicoes.map((rf) => {
            const grupos = agruparOpcoes(rf.itens);
            const opcoes = Array.from(grupos.entries()).sort(([a], [b]) => a - b);
            const mealMacros = calcMacros(grupos.get(0) ?? []);
            const hasOpcoes = opcoes.length > 1;

            return (
              <View key={rf.id} style={S.mealCard} wrap={false}>
                {/* Meal header */}
                <View style={S.mealHeader}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                    <Text style={S.mealName}>{rf.nome.toUpperCase()}</Text>
                    {rf.ehPreTreino && <Text style={S.mealBadge}>PRÉ-TREINO</Text>}
                    {rf.ehPosTreino && <Text style={S.mealBadge}>PÓS-TREINO</Text>}
                  </View>
                  <View style={S.mealMeta}>
                    {rf.horario && <Text style={S.mealTime}>{rf.horario}</Text>}
                    {grupos.get(0) && grupos.get(0)!.length > 0 && (
                      <Text style={S.mealMacros}>
                        {r1(mealMacros.kcal)} kcal · {r1(mealMacros.prot)}g P · {r1(mealMacros.carb)}g C · {r1(mealMacros.gord)}g G
                      </Text>
                    )}
                  </View>
                </View>

                {/* Column headers */}
                {rf.itens.length > 0 && (
                  <View style={S.colHeader}>
                    <Text style={[S.colLabel, { flex: 1 }]}>ALIMENTO</Text>
                    <Text style={[S.colLabel, { width: 40, textAlign: 'right' }]}>QTD</Text>
                    <Text style={[S.colLabel, { width: 44, textAlign: 'right' }]}>KCAL</Text>
                    <Text style={[S.colLabel, { width: 36, textAlign: 'right' }]}>PROT</Text>
                    <Text style={[S.colLabel, { width: 36, textAlign: 'right' }]}>CARB</Text>
                    <Text style={[S.colLabel, { width: 36, textAlign: 'right' }]}>GORD</Text>
                  </View>
                )}

                {/* Opcoes */}
                {opcoes.map(([opcaoIndex, itens], i) => (
                  <View key={opcaoIndex}>
                    {hasOpcoes && (
                      <>
                        {i > 0 && (
                          <View style={S.ouRow}>
                            <View style={S.ouLine} />
                            <Text style={S.ouText}>OU</Text>
                            <View style={S.ouLine} />
                          </View>
                        )}
                        <View style={S.opcaoHeader}>
                          <Text style={S.opcaoLabel}>OPÇÃO {LETRAS[i] ?? String(i + 1)}</Text>
                          <Text style={S.opcaoMacros}>
                            {(() => {
                              const m = calcMacros(itens);
                              return `${r1(m.kcal)} kcal · ${r1(m.prot)}g P · ${r1(m.carb)}g C · ${r1(m.gord)}g G`;
                            })()}
                          </Text>
                        </View>
                      </>
                    )}
                    {itens.map((it) => {
                      const f = it.quantidade / 100;
                      return (
                        <View key={it.id} style={S.itemRow}>
                          <Text style={S.itemName}>{it.nome}</Text>
                          <Text style={S.itemQty}>{it.quantidade}g</Text>
                          <Text style={S.itemKcal}>{r1(it.caloriasP100g * f)}</Text>
                          <Text style={S.itemProt}>{r1(it.proteinasP100g * f)}g</Text>
                          <Text style={S.itemCarb}>{r1(it.carboidratosP100g * f)}g</Text>
                          <Text style={S.itemGord}>{r1(it.gordurasP100g * f)}g</Text>
                        </View>
                      );
                    })}
                  </View>
                ))}

                {rf.itens.length === 0 && (
                  <View style={[S.itemRow, { justifyContent: 'center' }]}>
                    <Text style={{ fontSize: 8, color: '#9ca3af' }}>Nenhum alimento cadastrado</Text>
                  </View>
                )}
              </View>
            );
          })}
        </View>

        {/* ── Footer ── */}
        <View style={S.footer} fixed>
          <Text style={S.footerText}>Gerado em {hoje}</Text>
          <Text style={S.footerBrand}>MARCHFIT</Text>
          <Text style={S.footerText} render={({ pageNumber, totalPages }: { pageNumber: number; totalPages: number }) => `${pageNumber} / ${totalPages}`} />
        </View>
      </Page>
    </Document>
  );
}
