import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { anamneseServico } from '../servicos/api';
import { ClipboardList, ChevronRight, ChevronLeft, Check, Loader2 } from 'lucide-react';

type FormAnamnese = {
  dataNascimento: string;
  sexo: string;
  pesoAtual: string;
  altura: string;
  objetivo: string;
  praticaExercicio: string;
  tipoExercicio: string;
  frequenciaExercicio: string;
  nivelAtividade: string;
  doencas: string;
  medicamentos: string;
  alergias: string;
  restricoes: string;
  consumoAgua: string;
  intestino: string;
  qualidadeSono: number;
  nivelEstresse: number;
  preferenciasAlimentares: string;
  observacoes: string;
};

const INITIAL: FormAnamnese = {
  dataNascimento: '', sexo: '', pesoAtual: '', altura: '',
  objetivo: '', praticaExercicio: '', tipoExercicio: '', frequenciaExercicio: '',
  nivelAtividade: '', doencas: '', medicamentos: '', alergias: '', restricoes: '',
  consumoAgua: '', intestino: '', qualidadeSono: 3, nivelEstresse: 3,
  preferenciasAlimentares: '', observacoes: '',
};

const inputCls = 'w-full bg-gray-800 border border-gray-700 rounded-xl py-2.5 px-3 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/40 transition-all';
const labelCls = 'block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5';
const textareaCls = `${inputCls} resize-none`;

function PillGroup({
  valor,
  opcoes,
  onChange,
}: {
  valor: string;
  opcoes: { key: string; label: string }[];
  onChange: (v: string) => void;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {opcoes.map((o) => (
        <button
          key={o.key}
          type="button"
          onClick={() => onChange(o.key)}
          className={`px-3.5 py-1.5 rounded-xl text-sm font-medium transition-all border ${
            valor === o.key
              ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40'
              : 'bg-gray-800 text-gray-400 border-gray-700 hover:border-gray-600'
          }`}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

function RatingPills({
  valor,
  onChange,
  lowLabel,
  highLabel,
}: {
  valor: number;
  onChange: (v: number) => void;
  lowLabel: string;
  highLabel: string;
}) {
  return (
    <div className="w-fit">
      <div className="flex gap-2">
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            type="button"
            onClick={() => onChange(n)}
            className={`w-10 h-10 rounded-xl text-sm font-bold transition-all border ${
              valor === n
                ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40'
                : 'bg-gray-800 text-gray-400 border-gray-700 hover:border-gray-600'
            }`}
          >
            {n}
          </button>
        ))}
      </div>
      <div className="flex justify-between mt-1.5 px-1">
        <span className="text-[10px] text-gray-600">{lowLabel}</span>
        <span className="text-[10px] text-gray-600">{highLabel}</span>
      </div>
    </div>
  );
}

const TOTAL_STEPS = 4;
const STEP_TITLES = ['Dados Pessoais', 'Atividade Física', 'Histórico de Saúde', 'Hábitos de Vida'];

export default function AnamneseModal({
  alunoId,
  onComplete,
  onSkip,
}: {
  alunoId: string;
  onComplete: () => void;
  onSkip: () => void;
}) {
  const [step, setStep] = useState(1);
  const [form, setForm] = useState<FormAnamnese>(INITIAL);
  const queryClient = useQueryClient();

  const set = (field: keyof FormAnamnese, value: string | number) =>
    setForm((f) => ({ ...f, [field]: value }));

  const mutation = useMutation({
    mutationFn: () =>
      anamneseServico.salvar(alunoId, {
        ...form,
        pesoAtual: form.pesoAtual ? Number(form.pesoAtual) : null,
        altura: form.altura ? Number(form.altura) : null,
      }),
    onSuccess: (res) => {
      queryClient.setQueryData(['anamnese', alunoId], res.data);
      onComplete();
    },
  });

  const canNext = () => {
    if (step === 1) return !!(form.sexo && form.pesoAtual && form.altura);
    if (step === 2) return !!(form.objetivo && form.nivelAtividade && form.praticaExercicio);
    return true;
  };

  return (
    <div className="fixed inset-0 z-50 bg-gray-950 overflow-y-auto">
      <div className="min-h-full flex flex-col">
        <div className="max-w-lg mx-auto w-full px-4 py-8 flex-1 flex flex-col">

          {/* ── Header ── */}
          <div className="text-center mb-6">
            <div className="w-14 h-14 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-emerald-500/25">
              <ClipboardList className="w-7 h-7 text-white" />
            </div>
            <h1 className="text-2xl font-black text-white">Anamnese</h1>
            <p className="text-gray-500 text-sm mt-1 max-w-xs mx-auto">
              Nos conte um pouco sobre você para que seu nutricionista possa personalizar seu plano
            </p>
          </div>

          {/* ── Progress bar ── */}
          <div className="flex gap-1.5 mb-2">
            {Array.from({ length: TOTAL_STEPS }, (_, i) => (
              <div
                key={i}
                className={`flex-1 h-1.5 rounded-full transition-all duration-300 ${
                  i + 1 <= step ? 'bg-emerald-500' : 'bg-gray-800'
                }`}
              />
            ))}
          </div>
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-5">
            Etapa {step} de {TOTAL_STEPS} · {STEP_TITLES[step - 1]}
          </p>

          {/* ── Step content ── */}
          <div className="flex-1 space-y-4">

            {/* Step 1 — Dados Pessoais */}
            {step === 1 && (
              <>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className={labelCls}>Data de nascimento</label>
                    <input
                      type="date"
                      value={form.dataNascimento}
                      onChange={(e) => set('dataNascimento', e.target.value)}
                      className={inputCls}
                    />
                  </div>
                  <div>
                    <label className={labelCls}>Sexo *</label>
                    <PillGroup
                      valor={form.sexo}
                      onChange={(v) => set('sexo', v)}
                      opcoes={[
                        { key: 'M', label: 'Masculino' },
                        { key: 'F', label: 'Feminino' },
                        { key: 'O', label: 'Outro' },
                      ]}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className={labelCls}>Peso atual (kg) *</label>
                    <input
                      type="number"
                      min={20}
                      max={300}
                      step={0.1}
                      value={form.pesoAtual}
                      onChange={(e) => set('pesoAtual', e.target.value)}
                      className={inputCls}
                      placeholder="Ex: 70"
                    />
                  </div>
                  <div>
                    <label className={labelCls}>Altura (cm) *</label>
                    <input
                      type="number"
                      min={100}
                      max={250}
                      value={form.altura}
                      onChange={(e) => set('altura', e.target.value)}
                      className={inputCls}
                      placeholder="Ex: 170"
                    />
                  </div>
                </div>
              </>
            )}

            {/* Step 2 — Atividade Física */}
            {step === 2 && (
              <>
                <div>
                  <label className={labelCls}>Objetivo principal *</label>
                  <PillGroup
                    valor={form.objetivo}
                    onChange={(v) => set('objetivo', v)}
                    opcoes={[
                      { key: 'emagrecer',       label: 'Emagrecer'       },
                      { key: 'hipertrofia',     label: 'Hipertrofia'     },
                      { key: 'condicionamento', label: 'Condicionamento' },
                      { key: 'saude',           label: 'Saúde'           },
                      { key: 'manter',          label: 'Manter peso'     },
                    ]}
                  />
                </div>
                <div>
                  <label className={labelCls}>Nível de atividade geral *</label>
                  <PillGroup
                    valor={form.nivelAtividade}
                    onChange={(v) => set('nivelAtividade', v)}
                    opcoes={[
                      { key: 'sedentario', label: 'Sedentário' },
                      { key: 'leve',       label: 'Leve'        },
                      { key: 'moderado',   label: 'Moderado'    },
                      { key: 'ativo',      label: 'Muito ativo' },
                    ]}
                  />
                </div>
                <div>
                  <label className={labelCls}>Pratica exercício físico? *</label>
                  <PillGroup
                    valor={form.praticaExercicio}
                    onChange={(v) => set('praticaExercicio', v)}
                    opcoes={[
                      { key: 'sim', label: 'Sim' },
                      { key: 'nao', label: 'Não' },
                    ]}
                  />
                </div>
                {form.praticaExercicio === 'sim' && (
                  <>
                    <div>
                      <label className={labelCls}>Quais atividades?</label>
                      <input
                        value={form.tipoExercicio}
                        onChange={(e) => set('tipoExercicio', e.target.value)}
                        placeholder="Ex: Musculação, corrida, natação..."
                        className={inputCls}
                      />
                    </div>
                    <div>
                      <label className={labelCls}>Frequência semanal</label>
                      <PillGroup
                        valor={form.frequenciaExercicio}
                        onChange={(v) => set('frequenciaExercicio', v)}
                        opcoes={[
                          { key: '1-2x',   label: '1–2×/sem'    },
                          { key: '3-4x',   label: '3–4×/sem'    },
                          { key: '5-6x',   label: '5–6×/sem'    },
                          { key: 'diario', label: 'Diariamente' },
                        ]}
                      />
                    </div>
                  </>
                )}
              </>
            )}

            {/* Step 3 — Histórico de Saúde */}
            {step === 3 && (
              <>
                <div>
                  <label className={labelCls}>Doenças ou condições de saúde</label>
                  <textarea
                    value={form.doencas}
                    onChange={(e) => set('doencas', e.target.value)}
                    rows={2}
                    className={textareaCls}
                    placeholder="Ex: Diabetes, hipertensão, hipotireoidismo... ou 'nenhuma'"
                  />
                </div>
                <div>
                  <label className={labelCls}>Medicamentos em uso</label>
                  <textarea
                    value={form.medicamentos}
                    onChange={(e) => set('medicamentos', e.target.value)}
                    rows={2}
                    className={textareaCls}
                    placeholder="Ex: Metformina, levotiroxina... ou 'nenhum'"
                  />
                </div>
                <div>
                  <label className={labelCls}>Alergias alimentares</label>
                  <input
                    value={form.alergias}
                    onChange={(e) => set('alergias', e.target.value)}
                    className={inputCls}
                    placeholder="Ex: nozes, camarão, leite... ou 'nenhuma'"
                  />
                </div>
                <div>
                  <label className={labelCls}>Restrições alimentares</label>
                  <input
                    value={form.restricoes}
                    onChange={(e) => set('restricoes', e.target.value)}
                    className={inputCls}
                    placeholder="Ex: vegetariano, sem glúten, sem lactose..."
                  />
                </div>
              </>
            )}

            {/* Step 4 — Hábitos de Vida */}
            {step === 4 && (
              <>
                <div>
                  <label className={labelCls}>Consumo diário de água</label>
                  <PillGroup
                    valor={form.consumoAgua}
                    onChange={(v) => set('consumoAgua', v)}
                    opcoes={[
                      { key: 'menos2l', label: 'Menos de 2L' },
                      { key: '2-3l',    label: '2 – 3L'      },
                      { key: 'mais3l',  label: 'Mais de 3L'  },
                    ]}
                  />
                </div>
                <div>
                  <label className={labelCls}>Funcionamento intestinal</label>
                  <PillGroup
                    valor={form.intestino}
                    onChange={(v) => set('intestino', v)}
                    opcoes={[
                      { key: 'regular',    label: 'Regular'           },
                      { key: 'irregular',  label: 'Irregular'         },
                      { key: 'constipado', label: 'Constipado'        },
                      { key: 'diarreia',   label: 'Diarreia frequente'},
                    ]}
                  />
                </div>
                <div>
                  <label className={labelCls}>Qualidade do sono</label>
                  <RatingPills
                    valor={form.qualidadeSono}
                    onChange={(v) => set('qualidadeSono', v)}
                    lowLabel="Péssima"
                    highLabel="Ótima"
                  />
                </div>
                <div>
                  <label className={labelCls}>Nível de estresse</label>
                  <RatingPills
                    valor={form.nivelEstresse}
                    onChange={(v) => set('nivelEstresse', v)}
                    lowLabel="Baixo"
                    highLabel="Muito alto"
                  />
                </div>
                <div>
                  <label className={labelCls}>Preferências ou aversões alimentares</label>
                  <textarea
                    value={form.preferenciasAlimentares}
                    onChange={(e) => set('preferenciasAlimentares', e.target.value)}
                    rows={2}
                    className={textareaCls}
                    placeholder="Ex: adoro frutas, não gosto de peixe..."
                  />
                </div>
                <div>
                  <label className={labelCls}>Algo mais que seu nutricionista deveria saber?</label>
                  <textarea
                    value={form.observacoes}
                    onChange={(e) => set('observacoes', e.target.value)}
                    rows={2}
                    className={textareaCls}
                    placeholder="Qualquer informação adicional relevante..."
                  />
                </div>
              </>
            )}
          </div>

          {/* ── Navigation ── */}
          <div className="flex gap-3 mt-8 pb-4">
            {step === 1 ? (
              <button
                type="button"
                onClick={onSkip}
                className="flex-1 bg-transparent border border-gray-700 text-gray-500 hover:text-gray-400 hover:border-gray-600 py-3 rounded-xl text-sm font-medium transition-all"
              >
                Preencher depois
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setStep((s) => s - 1)}
                className="flex-1 bg-gray-800 hover:bg-gray-700 border border-gray-700 text-gray-300 py-3 rounded-xl text-sm font-medium transition-all flex items-center justify-center gap-1.5"
              >
                <ChevronLeft className="w-4 h-4" /> Voltar
              </button>
            )}

            {step < TOTAL_STEPS ? (
              <button
                type="button"
                onClick={() => setStep((s) => s + 1)}
                disabled={!canNext()}
                className="flex-1 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 disabled:opacity-40 text-white py-3 rounded-xl text-sm font-bold flex items-center justify-center gap-1.5 transition-all shadow-lg shadow-emerald-500/20"
              >
                Próximo <ChevronRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                type="button"
                onClick={() => mutation.mutate()}
                disabled={mutation.isPending}
                className="flex-1 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 disabled:opacity-50 text-white py-3 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-all shadow-lg shadow-emerald-500/20"
              >
                {mutation.isPending ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Check className="w-4 h-4" />
                )}
                {mutation.isPending ? 'Salvando...' : 'Concluir anamnese'}
              </button>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}
