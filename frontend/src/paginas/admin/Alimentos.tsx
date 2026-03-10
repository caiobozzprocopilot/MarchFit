import { useState, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { alimentosServico } from '../../servicos/api';
import { Search, Plus, Upload, Download, X, Loader2, Trash2, ChevronLeft, ChevronRight } from 'lucide-react';
import type { Alimento } from '../../tipos';

const POR_PAGINA = 20;

function Paginacao({ total, pagina, setPagina }: { total: number; pagina: number; setPagina: (p: number) => void }) {
  const totalPaginas = Math.ceil(total / POR_PAGINA);
  if (totalPaginas <= 1) return null;
  const inicio = Math.max(1, pagina - 2);
  const fim = Math.min(totalPaginas, pagina + 2);
  const paginas = Array.from({ length: fim - inicio + 1 }, (_, i) => inicio + i);
  return (
    <div className="flex items-center justify-between px-4 py-3">
      <p className="text-xs text-gray-600">
        {(pagina - 1) * POR_PAGINA + 1}–{Math.min(pagina * POR_PAGINA, total)} de {total}
      </p>
      <div className="flex items-center gap-1">
        <button disabled={pagina === 1} onClick={() => setPagina(pagina - 1)}
          className="p-1.5 rounded-lg text-gray-500 hover:text-white hover:bg-gray-800 disabled:opacity-30 disabled:cursor-not-allowed transition-colors">
          <ChevronLeft className="w-4 h-4" />
        </button>
        {inicio > 1 && <><button onClick={() => setPagina(1)} className="w-8 h-8 rounded-lg text-xs text-gray-500 hover:text-white hover:bg-gray-800 transition-colors">1</button><span className="text-gray-600 text-xs px-1">…</span></>}
        {paginas.map((p) => (
          <button key={p} onClick={() => setPagina(p)}
            className={`w-8 h-8 rounded-lg text-xs font-semibold transition-colors ${p === pagina ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-lg shadow-emerald-500/20' : 'text-gray-500 hover:text-white hover:bg-gray-800'}`}>
            {p}
          </button>
        ))}
        {fim < totalPaginas && <><span className="text-gray-600 text-xs px-1">…</span><button onClick={() => setPagina(totalPaginas)} className="w-8 h-8 rounded-lg text-xs text-gray-500 hover:text-white hover:bg-gray-800 transition-colors">{totalPaginas}</button></>}
        <button disabled={pagina === totalPaginas} onClick={() => setPagina(pagina + 1)}
          className="p-1.5 rounded-lg text-gray-500 hover:text-white hover:bg-gray-800 disabled:opacity-30 disabled:cursor-not-allowed transition-colors">
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

interface FormAlimento {
  nome: string; calorias: string; proteinas: string; carboidratos: string;
  gorduras: string; fibras: string; porcao: string; unidadePorcao: string; grupo: string;
}

const formVazio: FormAlimento = { nome: '', calorias: '', proteinas: '', carboidratos: '', gorduras: '', fibras: '', porcao: '100', unidadePorcao: 'g', grupo: '' };
const inputCls = 'w-full bg-gray-800 border border-gray-700 rounded-xl py-2.5 px-3 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/40 transition-all';
const labelCls = 'block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5';

export default function Alimentos() {
  const queryClient = useQueryClient();
  const [busca, setBusca] = useState('');
  const [pagina, setPagina] = useState(1);
  const [mostrarModal, setMostrarModal] = useState(false);
  const [form, setForm] = useState<FormAlimento>(formVazio);
  const [importando, setImportando] = useState(false);
  const [msgImport, setMsgImport] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);

  const { data: alimentos = [], isLoading } = useQuery<Alimento[]>({
    queryKey: ['alimentos'],
    queryFn: () => alimentosServico.listar().then((r) => r.data),
  });

  const mutCriar = useMutation({
    mutationFn: (d: any) => alimentosServico.criar(d),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['alimentos'] }); setMostrarModal(false); setForm(formVazio); },
  });

  const mutDeletar = useMutation({
    mutationFn: (id: string) => alimentosServico.deletar(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['alimentos'] }),
  });

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImportando(true); setMsgImport('');
    try {
      const formData = new FormData();
      formData.append('csv', file);
      const { data } = await alimentosServico.importarCsv(formData);
      setMsgImport(`✅ ${data.importados} alimentos importados com sucesso.`);
      queryClient.invalidateQueries({ queryKey: ['alimentos'] });
    } catch (e: any) {
      setMsgImport(`❌ ${e?.response?.data?.mensagem || 'Erro ao importar CSV.'}`);
    } finally {
      setImportando(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  const handleDownloadTemplate = async () => {
    const { data } = await alimentosServico.downloadTemplate();
    const url = window.URL.createObjectURL(new Blob([data]));
    const a = document.createElement('a'); a.href = url; a.download = 'template_alimentos.csv'; a.click();
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    mutCriar.mutate({ ...form, calorias: parseFloat(form.calorias), proteinas: parseFloat(form.proteinas), carboidratos: parseFloat(form.carboidratos), gorduras: parseFloat(form.gorduras), fibras: form.fibras ? parseFloat(form.fibras) : undefined, porcao: parseFloat(form.porcao) });
  };

  const alsFiltrados = alimentos.filter((a) => a.nome.toLowerCase().includes(busca.toLowerCase()));
  const alsPagina = alsFiltrados.slice((pagina - 1) * POR_PAGINA, pagina * POR_PAGINA);

  const onBusca = (v: string) => { setBusca(v); setPagina(1); };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-black text-white">Banco de Alimentos</h1>
          <p className="text-gray-500 text-sm mt-0.5">{alimentos.length} alimento(s) cadastrado(s)</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <input ref={fileRef} type="file" accept=".csv" className="hidden" onChange={handleImport} />
          <button onClick={handleDownloadTemplate}
            className="flex items-center gap-1.5 bg-gray-800 hover:bg-gray-700 border border-gray-700 text-gray-300 px-3 py-2.5 rounded-xl text-sm font-semibold transition-colors">
            <Download className="w-4 h-4" /> Template
          </button>
          <button onClick={() => fileRef.current?.click()} disabled={importando}
            className="flex items-center gap-1.5 bg-gray-800 hover:bg-gray-700 border border-gray-700 text-gray-300 px-3 py-2.5 rounded-xl text-sm font-semibold disabled:opacity-50 transition-colors">
            {importando ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />} Importar CSV
          </button>
          <button onClick={() => { setForm(formVazio); setMostrarModal(true); }}
            className="flex items-center gap-1.5 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-white px-4 py-2.5 rounded-xl text-sm font-bold shadow-lg shadow-emerald-500/20 transition-all">
            <Plus className="w-4 h-4" /> Novo
          </button>
        </div>
      </div>

      {msgImport && (
        <div className={`rounded-xl px-4 py-3 text-sm border ${msgImport.startsWith('✅') ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' : 'bg-red-500/10 border-red-500/30 text-red-400'}`}>
          {msgImport}
        </div>
      )}

      {/* Busca */}
      <div className="relative">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-600" />
        <input type="text" placeholder="Buscar alimento..." value={busca} onChange={(e) => onBusca(e.target.value)}
          className="w-full bg-gray-900 border border-gray-800 text-white placeholder-gray-600 pl-10 pr-4 py-2.5 rounded-xl text-sm focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/40 transition-all" />
      </div>

      {/* Tabela */}
      {isLoading ? (
        <div className="flex items-center justify-center h-40">
          <Loader2 className="w-7 h-7 animate-spin text-emerald-500" />
        </div>
      ) : (
        <div className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-800">
                  {['Nome', 'Kcal', 'Prot.', 'Carb.', 'Gord.', 'Porção', ''].map((h) => (
                    <th key={h} className="text-left px-5 py-3.5 text-xs font-bold text-gray-500 uppercase tracking-wider whitespace-nowrap">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {alsPagina.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center py-16 text-gray-600">
                      <Search className="w-8 h-8 mx-auto mb-2 opacity-30" />
                      Nenhum alimento encontrado
                    </td>
                  </tr>
                ) : (
                  alsPagina.map((a, i) => (
                    <tr key={a.id} className={`group hover:bg-gray-800/60 transition-colors ${i !== alsPagina.length - 1 ? 'border-b border-gray-800/60' : ''}`}>
                      <td className="px-5 py-3.5 font-semibold text-white max-w-[220px] truncate">{a.nome}</td>
                      <td className="px-5 py-3.5 text-gray-300 font-medium">{a.caloriasP100g}</td>
                      <td className="px-5 py-3.5 text-gray-400">{a.proteinasP100g}g</td>
                      <td className="px-5 py-3.5 text-gray-400">{a.carboidratosP100g}g</td>
                      <td className="px-5 py-3.5 text-gray-400">{a.gordurasP100g}g</td>
                      <td className="px-5 py-3.5 text-gray-600">{a.pesoUnidade != null ? `${a.pesoUnidade} ${a.unidadePadrao}` : '—'}</td>
                      <td className="px-5 py-3.5 text-right">
                        <button onClick={() => { if (confirm('Excluir alimento?')) mutDeletar.mutate(a.id); }}
                          className="p-1.5 rounded-lg text-gray-700 hover:text-red-400 hover:bg-red-500/10 transition-all opacity-0 group-hover:opacity-100">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          <div className="border-t border-gray-800">
            <Paginacao total={alsFiltrados.length} pagina={pagina} setPagina={setPagina} />
          </div>
        </div>
      )}

      {/* Modal */}
      {mostrarModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="bg-gray-900 border border-gray-800 rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-800">
              <h2 className="font-bold text-white">Novo Alimento</h2>
              <button onClick={() => setMostrarModal(false)} className="p-1.5 rounded-lg hover:bg-gray-800 text-gray-500 transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className={labelCls}>Nome *</label>
                <input value={form.nome} onChange={(e) => setForm({ ...form, nome: e.target.value })} required className={inputCls} autoFocus />
              </div>
              <div className="grid grid-cols-2 gap-3">
                {([['calorias', 'Calorias (kcal) *'], ['proteinas', 'Proteínas (g) *'], ['carboidratos', 'Carboidratos (g) *'], ['gorduras', 'Gorduras (g) *'], ['fibras', 'Fibras (g)']] as [keyof FormAlimento, string][]).map(([key, label]) => (
                  <div key={key}>
                    <label className={labelCls}>{label}</label>
                    <input type="number" step="0.01" min="0" value={form[key]} onChange={(e) => setForm({ ...form, [key]: e.target.value })}
                      required={!['fibras', 'grupo'].includes(key)} className={inputCls} />
                  </div>
                ))}
                <div>
                  <label className={labelCls}>Porção</label>
                  <input type="number" min="1" value={form.porcao} onChange={(e) => setForm({ ...form, porcao: e.target.value })} className={inputCls} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelCls}>Unidade</label>
                  <select value={form.unidadePorcao} onChange={(e) => setForm({ ...form, unidadePorcao: e.target.value })}
                    className="w-full bg-gray-800 border border-gray-700 rounded-xl py-2.5 px-3 text-sm text-white focus:outline-none focus:border-emerald-500 transition-all">
                    {['g', 'ml', 'unidade', 'colher de sopa', 'xícara'].map((u) => <option key={u} value={u}>{u}</option>)}
                  </select>
                </div>
                <div>
                  <label className={labelCls}>Grupo</label>
                  <input value={form.grupo} onChange={(e) => setForm({ ...form, grupo: e.target.value })} placeholder="Ex: Carnes, Frutas..." className={inputCls} />
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setMostrarModal(false)}
                  className="flex-1 bg-gray-800 hover:bg-gray-700 border border-gray-700 text-gray-300 py-2.5 rounded-xl text-sm transition-all">
                  Cancelar
                </button>
                <button type="submit" disabled={mutCriar.isPending}
                  className="flex-1 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 disabled:opacity-50 text-white py-2.5 rounded-xl text-sm font-bold flex items-center justify-center gap-1.5 transition-all">
                  {mutCriar.isPending && <Loader2 className="w-4 h-4 animate-spin" />} Cadastrar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
