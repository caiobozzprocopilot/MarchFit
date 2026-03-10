// Tipos compartilhados do NutriSistema

export interface Nutricionista {
  id: string;
  nome: string;
  email: string;
  crn?: string;
  cro?: string;
  telefone?: string;
  especialidade?: string;
  bio?: string;
  whatsapp?: string;
  fotoPerfil?: string | null;
  ativo: boolean;
  criadoEm: string;
}

export interface Aluno {
  id: string;
  nome: string;
  email: string;
  telefone?: string;
  dataNascimento?: string;
  sexo?: string;
  altura?: number;
  pesoInicial?: number;
  fotoPerfil?: string | null;
  objetivos?: string;
  observacoes?: string;
  ativo: boolean;
  criadoEm: string;
  nutricionistaId: string;
  _count?: {
    planosAlimentares: number;
    fichasTreino: number;
    registrosProgresso: number;
    consultas: number;
  };
}

export interface Alimento {
  id: string;
  nome: string;
  nomePopular?: string;
  caloriasP100g: number;
  proteinasP100g: number;
  carboidratosP100g: number;
  gordurasP100g: number;
  fibrasP100g?: number;
  sodioP100g?: number;
  unidadePadrao: TipoMedida;
  pesoUnidade?: number;
  categoria?: string;
  personalizado: boolean;
  criadoEm: string;
}

export type TipoMedida = 'GRAMAS' | 'MILILITROS' | 'UNIDADE' | 'COLHER_SOPA' | 'COLHER_CHA' | 'XICARA';

export interface ItemRefeicao {
  id: string;
  quantidade: number;
  unidade: TipoMedida;
  alimento: Alimento;
  refeicaoId: string;
}

export interface Refeicao {
  id: string;
  nome: string;
  horario?: string;
  ordem: number;
  itens: ItemRefeicao[];
  totais?: MacroPorRefeicao;
}

export interface MetaMacro {
  id: string;
  caloriasAlvo: number;
  proteinasAlvo: number;
  carboidratosAlvo: number;
  gordurasAlvo: number;
  fibrasAlvo?: number;
  planoId: string;
}

export interface PlanoAlimentar {
  id: string;
  nome: string;
  descricao?: string;
  ativo: boolean;
  dataInicio: string;
  dataFim?: string;
  alunoId: string;
  metaMacro?: MetaMacro;
  refeicoes: Refeicao[];
  criadoEm: string;
}

export interface MacroPorRefeicao {
  calorias: number;
  proteinas: number;
  carboidratos: number;
  gorduras: number;
  fibras: number;
}

export interface Exercicio {
  id: string;
  nome: string;
  grupoMuscular: string;
  grupoSecundario?: string;
  equipamento?: string;
  descricao?: string;
  instrucoes?: string;
  nivel: 'INICIANTE' | 'INTERMEDIARIO' | 'AVANCADO';
  videoUrl?: string;
  personalizado: boolean;
  criadoEm: string;
}

export interface ExercicioFicha {
  id: string;
  series: number;
  repeticoes: string;
  carga?: number;
  tempoDescanso?: number;
  observacoes?: string;
  ordem: number;
  exercicio: Exercicio;
}

export interface FichaTreino {
  id: string;
  nome: string;
  descricao?: string;
  ativo: boolean;
  ordem: number;
  alunoId: string;
  exercicios: ExercicioFicha[];
  criadoEm: string;
  _count?: { exercicios: number };
}

export interface Receita {
  id: string;
  nome: string;
  descricao?: string;
  youtubeUrl: string;
  youtubeVideoId: string;
  categoria?: string;
  ingredientes?: string;
  modoPreparo?: string;
  tempoPreparo?: number;
  porcoes?: number;
  criadoEm: string;
  _count?: { alunos: number };
}

export interface RegistroProgresso {
  id: string;
  peso?: number;
  altura?: number;
  percentualGordura?: number;
  massaMuscular?: number;
  imc?: number;
  cintura?: number;
  quadril?: number;
  pescoco?: number;
  braco?: number;
  perna?: number;
  // dobras cutâneas (mm)
  dobraPeitoral?: number;
  dobraAxilar?: number;
  dobraTriciptal?: number;
  dobraSubescapular?: number;
  dobraAbdominal?: number;
  dobraSuprailiaca?: number;
  dobraCoxa?: number;
  dobraPanturrilha?: number;
  foto?: string | null;
  fotoFrente?: string | null;
  fotoLado?: string | null;
  fotoCostas?: string | null;
  observacoes?: string;
  registradoEm: string;
  alunoId: string;
}

export interface Consulta {
  id: string;
  dataHora: string;
  duracao: number;
  tipo?: string;
  status: 'AGENDADA' | 'REALIZADA' | 'CANCELADA';
  observacoes?: string;
  anotacoesPriv?: string;
  alunoId: string;
  nutricionistaId: string;
  aluno?: Pick<Aluno, 'id' | 'nome' | 'email' | 'telefone'>;
  criadoEm: string;
}

export interface FormulaCalculo {
  id: string;
  nome: string;
  descricao?: string;
  formula: string;
  variaveis: string;
  nutricionistaId: string;
  criadoEm: string;
}

export interface DashboardAdmin {
  totais: {
    totalAlunos: number;
    alunosAtivos: number;
    consultasHoje: number;
    totalReceitas: number;
  };
  proximasConsultas: Consulta[];
  ultimosProgressos: RegistroProgresso[];
}

// Auth
export type TipoPerfil = 'NUTRICIONISTA' | 'PACIENTE';

export interface UsuarioAutenticado {
  id: string;
  nome: string;
  email: string;
  perfil: TipoPerfil;
  crn?: string;
}

export interface RespostaLogin {
  token: string;
  usuario: UsuarioAutenticado;
}
