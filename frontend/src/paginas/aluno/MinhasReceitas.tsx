import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../../contextos/autenticacao';
import { receitasServico } from '../../servicos/api';
import { Loader2, Youtube, X, Clock, ChefHat } from 'lucide-react';
import type { Receita } from '../../tipos';

function ModalVideo({ receita, onFechar }: { receita: Receita; onFechar: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80" onClick={onFechar}>
      <div className="w-full max-w-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-white font-semibold">{receita.nome}</h2>
          <button onClick={onFechar} className="text-white/70 hover:text-white">
            <X className="w-6 h-6" />
          </button>
        </div>
        {receita.youtubeVideoId ? (
          <div className="relative pt-[56.25%] bg-black rounded-xl overflow-hidden">
            <iframe
              className="absolute inset-0 w-full h-full"
              src={`https://www.youtube.com/embed/${receita.youtubeVideoId}?autoplay=1`}
              allow="autoplay; encrypted-media"
              allowFullScreen
              title={receita.nome}
            />
          </div>
        ) : (
          <div className="bg-gray-900 rounded-xl flex items-center justify-center h-64">
            <p className="text-gray-400">Vídeo não disponível</p>
          </div>
        )}
      </div>
    </div>
  );
}

function CardReceita({ receita, aoClicar }: { receita: Receita; aoClicar: () => void }) {
  const thumbUrl = receita.youtubeVideoId
    ? `https://img.youtube.com/vi/${receita.youtubeVideoId}/hqdefault.jpg`
    : null;

  return (
    <div
      className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden cursor-pointer hover:border-gray-700 transition-all"
      onClick={aoClicar}
    >
      {thumbUrl ? (
        <div className="relative">
          <img src={thumbUrl} alt={receita.nome} className="w-full h-44 object-cover" />
          <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
            <div className="w-12 h-12 rounded-full bg-red-600/90 flex items-center justify-center">
              <Youtube className="w-6 h-6 text-white" />
            </div>
          </div>
        </div>
      ) : (
        <div className="w-full h-44 bg-gray-800 flex items-center justify-center">
          <ChefHat className="w-10 h-10 text-gray-600" />
        </div>
      )}

      <div className="p-4">
        <h3 className="font-display tracking-wide text-white text-sm line-clamp-2 mb-2">
          {receita.nome}
        </h3>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3 text-xs text-gray-500">
            {receita.tempoPreparo && (
              <span className="flex items-center gap-1">
                <Clock className="w-3.5 h-3.5" /> {receita.tempoPreparo} min
              </span>
            )}
          </div>
          {receita.categoria && (
            <span className="text-xs bg-gray-800 text-gray-400 px-2 py-0.5 rounded-full">
              {receita.categoria}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

export default function MinhasReceitas() {
  const { usuario } = useAuth();
  const alunoId = (usuario as any)?.id;
  const [receitaAberta, setReceitaAberta] = useState<Receita | null>(null);
  const [filtro, setFiltro] = useState('');

  const { data: receitas = [], isLoading } = useQuery<Receita[]>({
    queryKey: ['receitas-aluno', alunoId],
    queryFn: () => receitasServico.listarPorAluno(alunoId).then((r) => r.data),
    enabled: !!alunoId,
  });

  const categorias = [...new Set(receitas.map((r) => r.categoria).filter(Boolean))];
  const filtradas = receitas.filter((r) => !filtro || r.categoria === filtro);

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
        <h1 className="text-2xl font-black text-white">Minhas Receitas</h1>
        <p className="text-gray-500 text-sm mt-1">{receitas.length} receita(s)</p>
      </div>

      {/* Filtro por categoria */}
      {categorias.length > 0 && (
        <div className="flex gap-2 flex-wrap">
          <button
            onClick={() => setFiltro('')}
            className={`px-3 py-1.5 rounded-full text-xs font-display uppercase tracking-wider border transition-colors ${
              !filtro ? 'bg-emerald-500 text-white border-emerald-500' : 'bg-gray-900 text-gray-400 border-gray-700'
            }`}
          >
            Todas
          </button>
          {categorias.map((cat) => (
            <button
              key={cat}
              onClick={() => setFiltro(cat!)}
              className={`px-3 py-1.5 rounded-full text-xs font-display uppercase tracking-wider border transition-colors ${
                filtro === cat ? 'bg-emerald-500 text-white border-emerald-500' : 'bg-gray-900 text-gray-400 border-gray-700'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      )}

      {filtradas.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <ChefHat className="w-12 h-12 text-gray-700 mx-auto mb-3" />
          <p className="font-medium">Nenhuma receita disponível</p>
          <p className="text-sm mt-1">Seu nutricionista ainda não atribuiu receitas</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {filtradas.map((r) => (
            <CardReceita key={r.id} receita={r} aoClicar={() => setReceitaAberta(r)} />
          ))}
        </div>
      )}

      {receitaAberta && (
        <ModalVideo receita={receitaAberta} onFechar={() => setReceitaAberta(null)} />
      )}
    </div>
  );
}
