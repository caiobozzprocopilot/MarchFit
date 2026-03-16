import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Search, BookOpen, ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';
import { alimentosServico } from '../../servicos/api';

const POR_PAGINA = 30;

function Paginacao({ total, pagina, setPagina }: { total: number; pagina: number; setPagina: (p: number) => void }) {
  const totalPaginas = Math.ceil(total / POR_PAGINA);
  if (totalPaginas <= 1) return null;
  const inicio = Math.max(1, pagina - 2);
  const fim = Math.min(totalPaginas, pagina + 2);
  const paginas = Array.from({ length: fim - inicio + 1 }, (_, i) => inicio + i);
  return (
    <div className="flex items-center justify-between px-4 py-3">
      <p className="text-xs text-gray-600">
        {(pagina - 1) * POR_PAGINA + 1}&ndash;{Math.min(pagina * POR_PAGINA, total)} de {total}
      </p>
      <div className="flex items-center gap-1">
        <button disabled={pagina === 1} onClick={() => setPagina(pagina - 1)}
          className="p-1.5 rounded-lg text-gray-500 hover:text-white hover:bg-gray-800 disabled:opacity-30 disabled:cursor-not-allowed transition-colors">
          <ChevronLeft className="w-4 h-4" />
        </button>
        {inicio > 1 && <><button onClick={() => setPagina(1)} className="w-8 h-8 rounded-lg text-xs text-gray-500 hover:text-white hover:bg-gray-800 transition-colors">1</button><span className="text-gray-600 text-xs px-1">...</span></>}
        {paginas.map((p) => (
          <button key={p} onClick={() => setPagina(p)}
            className={`w-8 h-8 rounded-lg text-xs font-semibold transition-colors ${p === pagina ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-lg shadow-emerald-500/20' : 'text-gray-500 hover:text-white hover:bg-gray-800'}`}>
            {p}
          </button>
        ))}
        {fim < totalPaginas && <><span className="text-gray-600 text-xs px-1">...</span><button onClick={() => setPagina(totalPaginas)} className="w-8 h-8 rounded-lg text-xs text-gray-500 hover:text-white hover:bg-gray-800 transition-colors">{totalPaginas}</button></>}
        <button disabled={pagina === totalPaginas} onClick={() => setPagina(pagina + 1)}
          className="p-1.5 rounded-lg text-gray-500 hover:text-white hover:bg-gray-800 disabled:opacity-30 disabled:cursor-not-allowed transition-colors">
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

export default function Alimentos() {
  const [busca, setBusca] = useState('');
  const [catFiltro, setCatFiltro] = useState('');
  const [pagina, setPagina] = useState(1);

  const { data, isLoading } = useQuery({
    queryKey: ['alimentos'],
    queryFn: async () => {
      const res = await alimentosServico.listar();
      return (res.data as any[]).sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR'));
    },
    staleTime: 5 * 60 * 1000,
  });

  const todos = data ?? [];

  const categorias = useMemo(
    () => [...new Set(todos.map((a: any) => a.categoria).filter(Boolean))].sort((a: any, b: any) => a.localeCompare(b, 'pt-BR')),
    [todos],
  );

  const filtrado = useMemo(() => {
    let lista = todos;
    if (catFiltro) lista = lista.filter((a: any) => a.categoria === catFiltro);
    if (busca.trim()) {
      const t = busca.toLowerCase();
      lista = lista.filter((a: any) => a.nome?.toLowerCase().includes(t) || a.categoria?.toLowerCase().includes(t));
    }
    return lista;
  }, [todos, busca, catFiltro]);

  const naPagina = useMemo(
    () => filtrado.slice((pagina - 1) * POR_PAGINA, pagina * POR_PAGINA),
    [filtrado, pagina],
  );

  const onBusca = (v: string) => { setBusca(v); setPagina(1); };
  const onCategoria = (v: string) => { setCatFiltro(v); setPagina(1); };

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-black text-white flex items-center gap-2">
            <BookOpen className="w-6 h-6 text-emerald-400" /> Tabela TACO
          </h1>
          <p className="text-gray-500 text-sm mt-0.5">
            Tabela Brasileira de Composição de Alimentos - NEPA/UNICAMP
            {!isLoading && ` · ${todos.length} alimentos`}
          </p>
        </div>
      </div>

      <div className="flex gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-600" />
          <input
            type="text"
            placeholder="Buscar alimento..."
            value={busca}
            onChange={(e) => onBusca(e.target.value)}
            className="w-full bg-gray-900 border border-gray-800 text-white placeholder-gray-600 pl-10 pr-4 py-2.5 rounded-xl text-sm focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/40 transition-all"
          />
        </div>
        <select
          value={catFiltro}
          onChange={(e) => onCategoria(e.target.value)}
          className="bg-gray-900 border border-gray-800 rounded-xl py-2.5 px-3 text-sm text-gray-300 focus:outline-none focus:border-emerald-500 transition-all"
        >
          <option value="">Todas as categorias</option>
          {categorias.map((c: any) => <option key={c} value={c}>{c}</option>)}
        </select>
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-800">
                {['Alimento', 'Categoria', 'Kcal', 'Prot.', 'Carb.', 'Gord.', 'Fibra'].map((h) => (
                  <th key={h} className="text-left px-4 py-3.5 text-xs font-display text-gray-500 uppercase tracking-wider whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="text-center py-16 text-gray-600">
                    <Loader2 className="w-6 h-6 mx-auto mb-2 animate-spin opacity-40" />
                    Carregando alimentos...
                  </td>
                </tr>
              ) : naPagina.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-16 text-gray-600">
                    <Search className="w-8 h-8 mx-auto mb-2 opacity-30" />
                    Nenhum alimento encontrado
                  </td>
                </tr>
              ) : (
                naPagina.map((a: any, i: number) => (
                  <tr
                    key={a.id}
                    className={`transition-colors ${i !== naPagina.length - 1 ? 'border-b border-gray-800/60' : ''}`}
                  >
                    <td className="px-4 py-3 font-semibold text-white max-w-[220px] truncate">{a.nome}</td>
                    <td className="px-4 py-3 text-gray-500 text-xs max-w-[160px] truncate">{a.categoria}</td>
                    <td className="px-4 py-3 text-yellow-400 font-medium tabular-nums">{a.caloriasP100g}</td>
                    <td className="px-4 py-3 text-blue-400 tabular-nums">{a.proteinasP100g}g</td>
                    <td className="px-4 py-3 text-orange-400 tabular-nums">{a.carboidratosP100g}g</td>
                    <td className="px-4 py-3 text-red-400 tabular-nums">{a.gordurasP100g}g</td>
                    <td className="px-4 py-3 text-emerald-400 tabular-nums">
                      {a.fibrasP100g != null && a.fibrasP100g !== '' ? `${a.fibrasP100g}g` : '-'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        <div className="border-t border-gray-800">
          <Paginacao total={filtrado.length} pagina={pagina} setPagina={setPagina} />
        </div>
      </div>
    </div>
  );
}
