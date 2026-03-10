import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../../contextos/autenticacao';
import { progressoServico } from '../../servicos/api';
import {
  LineChart, Line, XAxis, YAxis, Tooltip as ChartTooltip,
  ResponsiveContainer, CartesianGrid,
} from 'recharts';
import { Plus, X, Loader2, TrendingUp, Info, ChevronRight, Camera, Pencil, Images } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import type { RegistroProgresso } from '../../tipos';

/* ─── Tooltip de informação ──────────────────────────────────────── */
function InfoTooltip({ texto }: { texto: string }) {
  const [aberto, setAberto] = useState(false);
  return (
    <span className="relative inline-flex items-center">
      <button
        onMouseEnter={() => setAberto(true)}
        onMouseLeave={() => setAberto(false)}
        onFocus={() => setAberto(true)}
        onBlur={() => setAberto(false)}
        className="text-gray-500 hover:text-emerald-400 transition-colors ml-1"
        aria-label="informação"
      >
        <Info className="w-3.5 h-3.5" />
      </button>
      {aberto && (
        <span className="absolute bottom-full left-0 mb-2 w-60 bg-gray-800 border border-gray-700 rounded-xl px-3 py-2 text-xs text-gray-300 shadow-xl z-50 leading-relaxed pointer-events-none">
          {texto}
          <span className="absolute top-full left-4 border-4 border-transparent border-t-gray-700" />
        </span>
      )}
    </span>
  );
}

/* ─── Linha de métrica ───────────────────────────────────────────── */
function MetricaLinha({ label, valor, tooltip }: { label: string; valor: string; tooltip?: string }) {
  return (
    <div className="flex items-center justify-between py-2.5 border-b border-gray-800/60 last:border-0">
      <span className="text-sm text-gray-400 flex items-center gap-0.5">
        {label}
        {tooltip && <InfoTooltip texto={tooltip} />}:
      </span>
      <span className="text-sm font-semibold text-white">{valor}</span>
    </div>
  );
}

/* ─── Drawer "Ver medidas completas" ─────────────────────────────── */
function DrawerMedidas({ registro, onClose }: { registro: RegistroProgresso; onClose: () => void }) {
  const circunferencias = [
    { label: 'Cintura', val: registro.cintura, unidade: 'cm' },
    { label: 'Quadril', val: registro.quadril, unidade: 'cm' },
    { label: 'Pescoço', val: registro.pescoco, unidade: 'cm' },
    { label: 'Braço', val: registro.braco, unidade: 'cm' },
    { label: 'Perna', val: registro.perna, unidade: 'cm' },
  ].filter((c) => c.val != null);

  const dobras = [
    { label: 'Peitoral', val: registro.dobraPeitoral },
    { label: 'Axilar média', val: registro.dobraAxilar },
    { label: 'Triciptal', val: registro.dobraTriciptal },
    { label: 'Subescapular', val: registro.dobraSubescapular },
    { label: 'Abdominal', val: registro.dobraAbdominal },
    { label: 'Suprailíaca', val: registro.dobraSuprailiaca },
    { label: 'Coxa', val: registro.dobraCoxa },
    { label: 'Panturrilha', val: registro.dobraPanturrilha },
  ].filter((d) => d.val != null);

  return (
    <div className="fixed inset-0 z-50 flex justify-end" onClick={onClose}>
      <div className="w-full max-w-sm bg-gray-950 h-full overflow-y-auto shadow-2xl border-l border-gray-800" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-800 sticky top-0 bg-gray-950">
          <div>
            <h2 className="font-bold text-white">Medidas Completas</h2>
            <p className="text-xs text-gray-500 mt-0.5">
              {format(parseISO(registro.registradoEm), "dd 'de' MMMM yyyy", { locale: ptBR })}
            </p>
          </div>
          <button onClick={onClose} className="text-gray-500 hover:text-white transition-colors p-1">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="p-5 space-y-6">
          {circunferencias.length > 0 && (
            <div>
              <h3 className="text-xs font-semibold text-emerald-400 uppercase tracking-wider mb-3">Circunferências</h3>
              <div className="bg-gray-900 rounded-2xl px-4 divide-y divide-gray-800">
                {circunferencias.map((c) => (
                  <div key={c.label} className="flex justify-between py-2.5">
                    <span className="text-sm text-gray-400">{c.label}</span>
                    <span className="text-sm font-semibold text-white">{c.val} {c.unidade}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
          {dobras.length > 0 && (
            <div>
              <h3 className="text-xs font-semibold text-emerald-400 uppercase tracking-wider mb-3">Dobras Cutâneas (mm)</h3>
              <div className="bg-gray-900 rounded-2xl px-4 divide-y divide-gray-800">
                {dobras.map((d) => (
                  <div key={d.label} className="flex justify-between py-2.5">
                    <span className="text-sm text-gray-400">{d.label}</span>
                    <span className="text-sm font-semibold text-white">{d.val} mm</span>
                  </div>
                ))}
              </div>
            </div>
          )}
          {registro.observacoes && (
            <div>
              <h3 className="text-xs font-semibold text-emerald-400 uppercase tracking-wider mb-3">Observações</h3>
              <p className="text-sm text-gray-300 bg-gray-900 rounded-2xl px-4 py-3 leading-relaxed">{registro.observacoes}</p>
            </div>
          )}
          {circunferencias.length === 0 && dobras.length === 0 && !registro.observacoes && (
            <p className="text-sm text-gray-500 text-center py-8">Nenhuma medida adicional registrada.</p>
          )}
        </div>
      </div>
    </div>
  );
}

/* ─── Comparador de fotos ────────────────────────────────────────── */
type AnguloFoto = 'frente' | 'lado' | 'costas';

function ComparadorFotos({ registros }: { registros: RegistroProgresso[] }) {
  const comFoto = registros.filter((r) => r.fotoFrente || r.fotoLado || r.fotoCostas);
  const [idA, setIdA] = useState(comFoto[comFoto.length - 1]?.id ?? '');
  const [idB, setIdB] = useState(comFoto[comFoto.length - 2]?.id ?? comFoto[comFoto.length - 1]?.id ?? '');
  const [angulo, setAngulo] = useState<AnguloFoto>('frente');

  if (comFoto.length < 1) return null;

  const regA = comFoto.find((r) => r.id === idA);
  const regB = comFoto.find((r) => r.id === idB);
  const fmtData = (r: RegistroProgresso) => format(parseISO(r.registradoEm), 'dd/MM/yyyy', { locale: ptBR });
  const getFoto = (r: RegistroProgresso, a: AnguloFoto) =>
    a === 'frente' ? r.fotoFrente : a === 'lado' ? r.fotoLado : r.fotoCostas;

  const selectCls = 'flex-1 bg-gray-800 border border-gray-700 text-white text-xs rounded-lg px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-emerald-500';

  return (
    <div>
      <p className="text-xs text-gray-500 uppercase tracking-wider font-semibold mb-3 flex items-center gap-2">
        <Images className="w-3.5 h-3.5" /> Comparar fotos
      </p>
      <div className="bg-gray-900 border border-gray-800 rounded-2xl p-4 space-y-3">
        {/* Seletores de data */}
        <div className="flex gap-3 items-center">
          <select value={idA} onChange={(e) => setIdA(e.target.value)} className={selectCls}>
            {comFoto.map((r) => <option key={r.id} value={r.id}>{fmtData(r)}</option>)}
          </select>
          <span className="text-gray-600 text-sm font-bold">vs</span>
          <select value={idB} onChange={(e) => setIdB(e.target.value)} className={selectCls}>
            {comFoto.map((r) => <option key={r.id} value={r.id}>{fmtData(r)}</option>)}
          </select>
        </div>

        {/* Selector de ângulo */}
        <div className="flex gap-2">
          {(['frente', 'lado', 'costas'] as AnguloFoto[]).map((a) => (
            <button key={a} onClick={() => setAngulo(a)}
              className={`flex-1 py-1.5 rounded-lg text-xs font-medium capitalize transition-colors ${
                angulo === a ? 'bg-emerald-500 text-white' : 'bg-gray-800 text-gray-400 hover:text-white'
              }`}>
              {a.charAt(0).toUpperCase() + a.slice(1)}
            </button>
          ))}
        </div>

        {/* Fotos lado a lado */}
        <div className="grid grid-cols-2 gap-3">
          {[regA, regB].map((r, i) => {
            const src = r ? getFoto(r, angulo) : null;
            return r ? (
              <div key={`side-${i}-${r.id}`} className="space-y-2">
                <p className="text-xs text-center text-gray-500 font-medium">{fmtData(r)}</p>
                {src ? (
                  <img src={src} alt={`${angulo} ${i + 1}`}
                    className="w-full aspect-[3/4] object-cover rounded-xl bg-gray-800" />
                ) : (
                  <div className="aspect-[3/4] rounded-xl bg-gray-800 flex items-center justify-center">
                    <p className="text-xs text-gray-600">Sem foto de {angulo}</p>
                  </div>
                )}
                {(r.peso || r.percentualGordura) && (
                  <div className="text-center space-y-0.5">
                    {r.peso && <p className="text-xs text-gray-400">Peso: <b className="text-white">{r.peso} kg</b></p>}
                    {r.percentualGordura && <p className="text-xs text-gray-400">Gordura: <b className="text-white">{r.percentualGordura}%</b></p>}
                    {r.peso && r.percentualGordura && (
                      <p className="text-xs text-gray-400">M. Livre: <b className="text-emerald-400">{+(r.peso * (1 - r.percentualGordura / 100)).toFixed(1)} kg</b></p>
                    )}
                  </div>
                )}
              </div>
            ) : (
              <div key={i} className="aspect-[3/4] rounded-xl bg-gray-800 flex items-center justify-center">
                <p className="text-xs text-gray-600">Sem foto</p>
              </div>
            );
          })}
        </div>

        {comFoto.length < 2 && (
          <p className="text-xs text-gray-600 text-center">Adicione mais registros com foto para comparar</p>
        )}
      </div>
    </div>
  );
}


interface FormProgresso {
  data: string; peso: string; altura: string; gorduraCorporal: string;
  cintura: string; quadril: string; pescoco: string; braco: string; perna: string;
  observacoes: string;
}
const formVazio: FormProgresso = {
  data: format(new Date(), 'yyyy-MM-dd'), peso: '', altura: '', gorduraCorporal: '',
  cintura: '', quadril: '', pescoco: '', braco: '', perna: '', observacoes: '',
};

/* ─── Página principal ───────────────────────────────────────────── */
export default function MeuProgresso() {
  const { usuario } = useAuth();
  const alunoId = (usuario as any)?.id;
  const queryClient = useQueryClient();
  const [mostrarModal, setMostrarModal] = useState(false);
  const [mostrarDrawer, setMostrarDrawer] = useState(false);
  const [form, setForm] = useState<FormProgresso>(formVazio);
  const [fotos, setFotos] = useState<{ frente: File|null; lado: File|null; costas: File|null }>({ frente: null, lado: null, costas: null });
  const fotosVazio = { frente: null, lado: null, costas: null };
  const urlsVazio = { frente: null as string|null, lado: null as string|null, costas: null as string|null };
  const [fotosUrls, setFotosUrls] = useState(urlsVazio);
  const [grafico, setGrafico] = useState<'peso' | 'gordura' | 'imc'>('peso');
  const [registroEditando, setRegistroEditando] = useState<RegistroProgresso | null>(null);

  const abrirEdicao = (r: RegistroProgresso) => {
    setRegistroEditando(r);
    setForm({
      data: r.registradoEm.slice(0, 10),
      peso: r.peso?.toString() ?? '',
      altura: r.altura?.toString() ?? '',
      gorduraCorporal: r.percentualGordura?.toString() ?? '',
      cintura: r.cintura?.toString() ?? '',
      quadril: r.quadril?.toString() ?? '',
      pescoco: r.pescoco?.toString() ?? '',
      braco: r.braco?.toString() ?? '',
      perna: r.perna?.toString() ?? '',
      observacoes: r.observacoes ?? '',
    });
    setFotos(fotosVazio);
    setFotosUrls({ frente: r.fotoFrente ?? null, lado: r.fotoLado ?? null, costas: r.fotoCostas ?? null });
    setMostrarModal(true);
  };

  const { data: registros = [], isLoading } = useQuery<RegistroProgresso[]>({
    queryKey: ['progresso', alunoId],
    queryFn: () => progressoServico.listar(alunoId).then((r) => r.data),
    enabled: !!alunoId,
  });

  const mutCriar = useMutation({
    mutationFn: async (dados: any) => {
      const { alunoId: aid, fotos: fs, ...resto } = dados;
      return progressoServico.criar(aid, resto, fs);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['progresso', alunoId] });
      setMostrarModal(false);
      setForm(formVazio);
      setFotos(fotosVazio);
      setFotosUrls(urlsVazio);
    },
    onError: (e: any) => console.error('[Progresso] erro ao criar:', e),
  });

  const mutAtualizar = useMutation({
    mutationFn: async ({ id, dados, fotos: fs }: { id: string; dados: any; fotos: typeof fotosVazio }) =>
      progressoServico.atualizar(id, dados, fs),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['progresso', alunoId] });
      setMostrarModal(false);
      setRegistroEditando(null);
      setForm(formVazio);
      setFotos(fotosVazio);
      setFotosUrls(urlsVazio);
    },
    onError: (e: any) => console.error('[Progresso] erro ao atualizar:', e),
  });

  const ordenados = registros.slice().sort((a, b) => new Date(a.registradoEm).getTime() - new Date(b.registradoEm).getTime());
  const ultimo = ordenados[ordenados.length - 1];
  const massaGorda = ultimo?.peso && ultimo?.percentualGordura ? +(ultimo.peso * (ultimo.percentualGordura / 100)).toFixed(1) : null;
  const massaLivre = ultimo?.peso && ultimo?.percentualGordura ? +(ultimo.peso * (1 - ultimo.percentualGordura / 100)).toFixed(1) : null;

  const dadosGrafico = ordenados.map((r) => ({
    data: format(parseISO(r.registradoEm), 'dd/MM', { locale: ptBR }),
    Peso: r.peso ?? null,
    Gordura: r.percentualGordura ?? null,
    IMC: r.imc ? +r.imc.toFixed(1) : null,
  }));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const n = (v: string) => (v !== '' ? parseFloat(v) : null);
    const payload: Record<string, any> = {
      registradoEm: form.data,
    };
    // só inclui campos com valor
    const campos: [string, any][] = [
      ['peso', n(form.peso)], ['altura', n(form.altura)],
      ['percentualGordura', n(form.gorduraCorporal)],
      ['cintura', n(form.cintura)], ['quadril', n(form.quadril)],
      ['pescoco', n(form.pescoco)], ['braco', n(form.braco)], ['perna', n(form.perna)],
      ['observacoes', form.observacoes || null],
    ];
    campos.forEach(([k, v]) => { if (v !== null) payload[k] = v; });
    if (registroEditando) {
      // Inclui estado actual das URLs (null = remover, string = manter)
      payload.fotoFrente = fotosUrls.frente;
      payload.fotoLado = fotosUrls.lado;
      payload.fotoCostas = fotosUrls.costas;
      mutAtualizar.mutate({ id: registroEditando.id, dados: payload, fotos });
    } else {
      mutCriar.mutate({ alunoId, fotos, ...payload });
    }
  };

  const isPending = mutCriar.isPending || mutAtualizar.isPending;

  const inputCls = 'w-full border border-gray-700 rounded-lg py-2 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-gray-800 text-white placeholder-gray-600';

  return (
    <div className="space-y-5 pb-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Avaliação Física</h1>
          <p className="text-gray-500 text-sm mt-0.5">{registros.length} registro(s)</p>
        </div>
        <button
          onClick={() => { setRegistroEditando(null); setForm(formVazio); setFotos(fotosVazio); setMostrarModal(true); }}
          className="flex items-center gap-2 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white px-4 py-2 rounded-xl text-sm font-medium shadow-lg shadow-emerald-500/25 transition-all"
        >
          <Plus className="w-4 h-4" /> Registrar
        </button>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center h-40"><Loader2 className="w-6 h-6 animate-spin text-emerald-500" /></div>
      ) : !ultimo ? (
        <div className="text-center py-20">
          <TrendingUp className="w-12 h-12 text-gray-700 mx-auto mb-3" />
          <p className="font-medium text-gray-400">Nenhum registro ainda</p>
          <p className="text-sm text-gray-600 mt-1">Registe o seu primeiro progresso</p>
        </div>
      ) : (
        <>
          {/* Painel avaliação */}
          <div className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden">
            <div className="px-5 pt-4 pb-3 border-b border-gray-800">
              <p className="text-xs text-emerald-400 font-semibold uppercase tracking-wider">Última avaliação</p>
              <p className="text-white font-bold mt-0.5">
                {format(parseISO(ultimo.registradoEm), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
              </p>
            </div>
            <div className="px-5 py-1">
              {ultimo.altura && <MetricaLinha label="Altura" valor={`${ultimo.altura} cm`} />}
              {ultimo.peso && <MetricaLinha label="Peso" valor={`${ultimo.peso} kg`} />}
              {ultimo.imc && (
                <MetricaLinha label="IMC" valor={`${ultimo.imc.toFixed(1)} kg/m²`}
                  tooltip="O Índice de Massa Corporal (IMC) é calculado dividindo o peso (kg) pela altura ao quadrado (m²). Valores entre 18,5 e 24,9 são considerados normais para adultos." />
              )}
              {ultimo.percentualGordura != null && (
                <MetricaLinha label="Percentual de gordura" valor={`${ultimo.percentualGordura}%`}
                  tooltip="Indica a proporção de gordura em relação ao peso corporal total. Valores saudáveis variam conforme sexo e idade." />
              )}
              {massaGorda != null && (
                <MetricaLinha label="Quantidade de massa gorda" valor={`${massaGorda} kg`}
                  tooltip="Calculada como: Peso × (% Gordura ÷ 100). Representa o total de tecido adiposo no corpo." />
              )}
              {massaLivre != null && (
                <MetricaLinha label="Quantidade de massa livre de gordura" valor={`${massaLivre} kg`}
                  tooltip="Calculada como: Peso − Massa Gorda. Inclui músculos, ossos, órgãos e fluidos corporais." />
              )}
            </div>
            {(ultimo.cintura || ultimo.quadril || ultimo.pescoco || ultimo.braco || ultimo.perna || ultimo.dobraAbdominal) && (
              <div className="px-5 pb-4 pt-2 border-t border-gray-800 mt-1">
                <button onClick={() => setMostrarDrawer(true)}
                  className="w-full flex items-center justify-between bg-gray-800/60 hover:bg-gray-800 transition-colors rounded-xl px-4 py-3 text-sm text-gray-300 hover:text-white">
                  <span className="font-medium">Ver medidas completas</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>

          {/* Comparador de fotos */}
          {ordenados.filter((r) => r.foto).length >= 1 && (
            <ComparadorFotos registros={ordenados} />
          )}

          {/* Gráfico */}
          <div>
            <p className="text-xs text-gray-500 uppercase tracking-wider font-semibold mb-3">Gráfico de evolução</p>
            <div className="flex gap-2 mb-4">
              {(['peso', 'gordura', 'imc'] as const).map((g) => (
                <button key={g} onClick={() => setGrafico(g)}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${grafico === g ? 'bg-emerald-500 text-white border-emerald-500' : 'bg-gray-900 text-gray-400 border-gray-700'}`}>
                  {g === 'peso' ? 'Peso (kg)' : g === 'gordura' ? 'Gordura (%)' : 'IMC'}
                </button>
              ))}
            </div>
            <div className="bg-gray-900 border border-gray-800 rounded-2xl p-4">
              <ResponsiveContainer width="100%" height={200}>
                <LineChart data={dadosGrafico}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
                  <XAxis dataKey="data" tick={{ fontSize: 11, fill: '#6b7280' }} />
                  <YAxis tick={{ fontSize: 11, fill: '#6b7280' }} domain={['auto', 'auto']} />
                  <ChartTooltip contentStyle={{ backgroundColor: '#111827', border: '1px solid #374151', borderRadius: '10px', color: '#f9fafb', fontSize: 12 }} />
                  <Line type="monotone" dataKey={grafico === 'peso' ? 'Peso' : grafico === 'gordura' ? 'Gordura' : 'IMC'}
                    stroke="#10b981" strokeWidth={2} dot={{ r: 3, fill: '#10b981' }} connectNulls />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Histórico */}
          <div>
            <p className="text-xs text-gray-500 uppercase tracking-wider font-semibold mb-3">Histórico</p>
            <div className="bg-gray-900 border border-gray-800 rounded-2xl divide-y divide-gray-800">
              {ordenados.slice().reverse().map((r) => (
                <div key={r.id} className="px-5 py-3.5 flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-gray-200">
                      {format(parseISO(r.registradoEm), "dd 'de' MMMM yyyy", { locale: ptBR })}
                    </p>
                    <div className="flex gap-4 mt-1 text-xs text-gray-500 flex-wrap">
                      {r.peso && <span>Peso: <b className="text-gray-400">{r.peso} kg</b></span>}
                      {r.percentualGordura && <span>Gordura: <b className="text-gray-400">{r.percentualGordura}%</b></span>}
                      {r.imc && <span>IMC: <b className="text-gray-400">{r.imc.toFixed(1)}</b></span>}
                      {r.cintura && <span>Cintura: <b className="text-gray-400">{r.cintura} cm</b></span>}
                    </div>
                  </div>
                  <button
                    onClick={() => abrirEdicao(r)}
                    className="shrink-0 p-2 rounded-lg text-gray-600 hover:text-emerald-400 hover:bg-gray-800 transition-colors"
                    title="Editar"
                  >
                    <Pencil className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </>
      )}

      {/* Drawer medidas completas */}
      {mostrarDrawer && ultimo && <DrawerMedidas registro={ultimo} onClose={() => setMostrarDrawer(false)} />}

      {/* Modal novo registro */}
      {mostrarModal && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 p-4">
          <div className="bg-gray-900 border border-gray-800 rounded-2xl shadow-2xl w-full max-w-sm max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-800 sticky top-0 bg-gray-900">
              <h3 className="font-bold text-white">{registroEditando ? 'Editar Registro' : 'Novo Registro'}</h3>
              <button onClick={() => { setMostrarModal(false); setRegistroEditando(null); }} className="text-gray-500 hover:text-white transition-colors"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleSubmit} className="p-5 space-y-3">
              <div>
                <label className="block text-xs font-semibold text-gray-400 mb-1">Data *</label>
                <input type="date" value={form.data} onChange={(e) => setForm({ ...form, data: e.target.value })} required className={inputCls} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                {([['peso','Peso (kg)'],['altura','Altura (cm)'],['gorduraCorporal','Gordura (%)'],['cintura','Cintura (cm)'],['quadril','Quadril (cm)'],['pescoco','Pescoço (cm)'],['braco','Braço (cm)'],['perna','Perna (cm)']] as [keyof FormProgresso, string][]).map(([key, label]) => (
                  <div key={key}>
                    <label className="block text-xs font-semibold text-gray-400 mb-1">{label}</label>
                    <input type="number" step="0.1" min="0" value={form[key]} onChange={(e) => setForm({ ...form, [key]: e.target.value })} className={inputCls} />
                  </div>
                ))}
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-400 mb-1">Observações</label>
                <textarea value={form.observacoes} onChange={(e) => setForm({ ...form, observacoes: e.target.value })} rows={2} className={`${inputCls} resize-none`} />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-400 mb-2">Fotos (opcional)</label>
                <div className="space-y-2">
                  {([['frente','Frente'],['lado','Lado'],['costas','Costas']] as ['frente'|'lado'|'costas', string][]).map(([key, label]) => {
                    const hasFile = !!fotos[key];
                    const hasUrl = !!fotosUrls[key];
                    return (
                      <div key={key} className={`flex items-center gap-2 border rounded-lg py-2 px-3 transition-colors ${
                        hasFile ? 'border-emerald-500 bg-emerald-500/5' : hasUrl ? 'border-gray-600 bg-gray-800/40' : 'border-dashed border-gray-700'
                      }`}>
                        {/* Thumbnail ou ícone */}
                        {hasUrl && !hasFile
                          ? <img src={fotosUrls[key]!} className="w-7 h-9 object-cover rounded shrink-0" />
                          : <Camera className={`w-4 h-4 shrink-0 ${hasFile ? 'text-emerald-400' : 'text-gray-500'}`} />
                        }
                        <span className="text-xs text-gray-500 w-12 shrink-0">{label}</span>
                        {/* Área clicável para selecionar ficheiro */}
                        <label className="flex-1 cursor-pointer min-w-0">
                          <span className={`text-sm truncate block ${
                            hasFile ? 'text-emerald-400' : hasUrl ? 'text-gray-300' : 'text-gray-500 hover:text-gray-300'
                          }`}>
                            {hasFile ? fotos[key]!.name : hasUrl ? 'Trocar foto' : 'Selecionar'}
                          </span>
                          <input type="file" accept="image/*" className="hidden"
                            onChange={(e) => setFotos({ ...fotos, [key]: e.target.files?.[0] ?? null })} />
                        </label>
                        {/* Botão remover */}
                        {(hasFile || hasUrl) && (
                          <button type="button" title={hasFile ? 'Limpar seleção' : 'Remover foto'}
                            onClick={() => {
                              if (hasFile) {
                                setFotos({ ...fotos, [key]: null });
                              } else {
                                setFotosUrls({ ...fotosUrls, [key]: null });
                              }
                            }}
                            className="p-1 text-gray-600 hover:text-red-400 transition-colors shrink-0">
                            <X className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => { setMostrarModal(false); setRegistroEditando(null); }} className="flex-1 border border-gray-700 text-gray-400 hover:text-white py-2.5 rounded-xl text-sm transition-colors">Cancelar</button>
                <button type="submit" disabled={isPending} className="flex-1 bg-emerald-500 hover:bg-emerald-600 disabled:bg-emerald-300 text-white py-2.5 rounded-xl text-sm font-bold flex items-center justify-center gap-1">
                  {isPending && <Loader2 className="w-4 h-4 animate-spin" />}
                  {registroEditando ? 'Salvar' : 'Registrar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
