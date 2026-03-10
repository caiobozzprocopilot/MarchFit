import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { formulasServico } from '../../servicos/api';
import { Plus, X, Loader2, Trash2, FlaskConical } from 'lucide-react';
import type { FormulaCalculo } from '../../tipos';

interface FormFormula {
  nome: string;
  descricao: string;
  formula: string;
  variaveis: string;
}

const formVazio: FormFormula = {
  nome: '',
  descricao: '',
  formula: '',
  variaveis: '',
};

const EXEMPLOS = [
  {
    nome: 'Harris-Benedict (Homem)',
    formula: '88.362 + (13.397 * peso) + (4.799 * altura) - (5.677 * idade)',
    variaveis: JSON.stringify([
      { chave: 'peso', rotulo: 'Peso (kg)' },
      { chave: 'altura', rotulo: 'Altura (cm)' },
      { chave: 'idade', rotulo: 'Idade (anos)' },
    ], null, 2),
    descricao: 'Taxa metabólica basal masculina',
  },
  {
    nome: 'Harris-Benedict (Mulher)',
    formula: '447.593 + (9.247 * peso) + (3.098 * altura) - (4.330 * idade)',
    variaveis: JSON.stringify([
      { chave: 'peso', rotulo: 'Peso (kg)' },
      { chave: 'altura', rotulo: 'Altura (cm)' },
      { chave: 'idade', rotulo: 'Idade (anos)' },
    ], null, 2),
    descricao: 'Taxa metabólica basal feminina',
  },
  {
    nome: 'IMC',
    formula: 'peso / ((altura / 100) * (altura / 100))',
    variaveis: JSON.stringify([
      { chave: 'peso', rotulo: 'Peso (kg)' },
      { chave: 'altura', rotulo: 'Altura (cm)' },
    ], null, 2),
    descricao: 'Índice de Massa Corporal',
  },
];

export default function Formulas() {
  const queryClient = useQueryClient();
  const [mostrarModal, setMostrarModal] = useState(false);
  const [form, setForm] = useState<FormFormula>(formVazio);
  const [erroForm, setErroForm] = useState('');
  const [calculando, setCalculando] = useState<FormulaCalculo | null>(null);
  const [valoresCalc, setValoresCalc] = useState<Record<string, string>>({});
  const [resultado, setResultado] = useState<number | null>(null);

  const { data: formulas = [], isLoading } = useQuery<FormulaCalculo[]>({
    queryKey: ['formulas'],
    queryFn: () => formulasServico.listar().then((r) => r.data),
  });

  const mutCriar = useMutation({
    mutationFn: (d: any) => formulasServico.criar(d),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['formulas'] });
      setMostrarModal(false);
      setForm(formVazio);
    },
    onError: (e: any) => setErroForm(e?.response?.data?.mensagem || 'Erro ao salvar.'),
  });

  const mutDeletar = useMutation({
    mutationFn: (id: string) => formulasServico.deletar(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['formulas'] }),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErroForm('');
    try {
      JSON.parse(form.variaveis || '[]');
    } catch {
      setErroForm('O campo "Variáveis" deve ser um JSON válido.');
      return;
    }
    mutCriar.mutate({ ...form, variaveis: form.variaveis });
  };

  const calcularResultado = (formula: FormulaCalculo) => {
    try {
      const variaveis = typeof formula.variaveis === 'string'
        ? JSON.parse(formula.variaveis)
        : formula.variaveis;
      const fn = new Function(...variaveis.map((v: any) => v.chave), `return ${formula.formula}`);
      const valores = variaveis.map((v: any) => parseFloat(valoresCalc[v.chave] || '0'));
      const res = fn(...valores);
      setResultado(res);
    } catch {
      setResultado(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Fórmulas de Cálculo</h1>
          <p className="text-gray-500 text-sm mt-0.5">FCR, IMC, Harris-Benedict e outras</p>
        </div>
        <button
          onClick={() => { setForm(formVazio); setErroForm(''); setMostrarModal(true); }}
          className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm font-medium"
        >
          <Plus className="w-4 h-4" /> Nova Fórmula
        </button>
      </div>

      {/* Lista */}
      {isLoading ? (
        <div className="flex items-center justify-center h-32"><Loader2 className="w-6 h-6 animate-spin text-green-600" /></div>
      ) : formulas.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <FlaskConical className="w-12 h-12 text-gray-200 mx-auto mb-3" />
          <p>Nenhuma fórmula cadastrada</p>
        </div>
      ) : (
        <div className="space-y-3">
          {formulas.map((f) => {
            const vars = (() => {
              try { return JSON.parse(typeof f.variaveis === 'string' ? f.variaveis : JSON.stringify(f.variaveis)); }
              catch { return []; }
            })();
            return (
              <div key={f.id} className="bg-white border border-gray-200 rounded-xl p-5">
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div>
                    <h3 className="font-semibold text-gray-900">{f.nome}</h3>
                    {f.descricao && <p className="text-sm text-gray-400 mt-0.5">{f.descricao}</p>}
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => { setCalculando(f); setValoresCalc({}); setResultado(null); }}
                      className="px-3 py-1.5 rounded-lg bg-blue-50 text-blue-600 text-xs font-medium hover:bg-blue-100"
                    >
                      Calcular
                    </button>
                    <button
                      onClick={() => { if (confirm('Excluir fórmula?')) mutDeletar.mutate(f.id); }}
                      className="p-1.5 text-gray-300 hover:text-red-400"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                <code className="block bg-gray-50 text-gray-700 text-xs rounded-lg px-3 py-2 font-mono">
                  {f.formula}
                </code>
                {vars.length > 0 && (
                  <p className="text-xs text-gray-400 mt-2">
                    Variáveis: {vars.map((v: any) => v.rotulo ?? v.chave).join(', ')}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Modal Calculadora */}
      {calculando && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-900">{calculando.nome}</h3>
              <button onClick={() => setCalculando(null)}><X className="w-5 h-5 text-gray-400" /></button>
            </div>
            <div className="space-y-3">
              {(() => {
                try { return JSON.parse(typeof calculando.variaveis === 'string' ? calculando.variaveis : JSON.stringify(calculando.variaveis)); }
                catch { return []; }
              })().map((v: any) => (
                <div key={v.chave}>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{v.rotulo ?? v.chave}</label>
                  <input
                    type="number"
                    value={valoresCalc[v.chave] ?? ''}
                    onChange={(e) => setValoresCalc({ ...valoresCalc, [v.chave]: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg py-2.5 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                </div>
              ))}
            </div>
            <button
              onClick={() => calcularResultado(calculando)}
              className="w-full mt-4 bg-green-600 hover:bg-green-700 text-white py-2.5 rounded-lg text-sm font-semibold"
            >
              Calcular
            </button>
            {resultado !== null && (
              <div className="mt-4 bg-green-50 border border-green-200 rounded-xl px-4 py-3 text-center">
                <p className="text-xs text-green-600 mb-1">Resultado</p>
                <p className="text-2xl font-bold text-green-700">{resultado.toFixed(2)}</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Modal Nova Fórmula */}
      {mostrarModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <h2 className="font-semibold text-gray-900">Nova Fórmula</h2>
              <button onClick={() => setMostrarModal(false)}><X className="w-5 h-5 text-gray-400" /></button>
            </div>
            <div className="px-6 pt-4">
              <p className="text-xs text-gray-500 mb-2">Usar modelo:</p>
              <div className="flex flex-wrap gap-2 mb-4">
                {EXEMPLOS.map((ex) => (
                  <button
                    key={ex.nome}
                    type="button"
                    onClick={() => setForm({ nome: ex.nome, descricao: ex.descricao, formula: ex.formula, variaveis: ex.variaveis })}
                    className="px-3 py-1 rounded-full border border-gray-200 text-xs text-gray-600 hover:border-green-400 hover:text-green-700"
                  >
                    {ex.nome}
                  </button>
                ))}
              </div>
            </div>
            <form onSubmit={handleSubmit} className="px-6 pb-6 space-y-4">
              {erroForm && <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3">{erroForm}</div>}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nome *</label>
                <input value={form.nome} onChange={(e) => setForm({ ...form, nome: e.target.value })} required
                  className="w-full border border-gray-300 rounded-lg py-2.5 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-green-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Descrição</label>
                <input value={form.descricao} onChange={(e) => setForm({ ...form, descricao: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg py-2.5 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-green-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Fórmula *</label>
                <input value={form.formula} onChange={(e) => setForm({ ...form, formula: e.target.value })} required
                  placeholder="Ex: peso / ((altura/100) * (altura/100))"
                  className="w-full border border-gray-300 rounded-lg py-2.5 px-3 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-green-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Variáveis (JSON)</label>
                <textarea value={form.variaveis} onChange={(e) => setForm({ ...form, variaveis: e.target.value })} rows={5}
                  placeholder={'[\n  { "chave": "peso", "rotulo": "Peso (kg)" }\n]'}
                  className="w-full border border-gray-300 rounded-lg py-2.5 px-3 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-green-500 resize-none" />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setMostrarModal(false)} className="flex-1 border border-gray-200 text-gray-600 py-2.5 rounded-lg text-sm">Cancelar</button>
                <button type="submit" disabled={mutCriar.isPending}
                  className="flex-1 bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white py-2.5 rounded-lg text-sm font-semibold flex items-center justify-center gap-1">
                  {mutCriar.isPending && <Loader2 className="w-4 h-4 animate-spin" />}
                  Salvar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
