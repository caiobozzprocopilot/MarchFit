import express from 'express';
import cors from 'cors';
import { rotasAutenticacao } from './rotas/autenticacao';
import { rotasAlunos } from './rotas/alunos';
import { rotasAlimentos } from './rotas/alimentos';
import { rotasExercicios } from './rotas/exercicios';
import { rotasPlanosAlimentares } from './rotas/planosAlimentares';
import { rotasFichasTreino } from './rotas/fichasTreino';
import { rotasReceitas } from './rotas/receitas';
import { rotasProgresso } from './rotas/progresso';
import { rotasConsultas } from './rotas/consultas';
import { rotasFormulas } from './rotas/formulas';
import { rotasNutricionista } from './rotas/nutricionista';
import { middlewareErros } from './middlewares/erros';

const app = express();

// ── Middlewares globais ──────────────────────────────────────────
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true,
}));
app.use(express.json({ limit: '20mb' }));
app.use(express.urlencoded({ extended: true, limit: '20mb' }));

// ── Health check ─────────────────────────────────────────────────
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ── Rotas da API ─────────────────────────────────────────────────
app.use('/api/auth',               rotasAutenticacao);
app.use('/api/nutricionista',      rotasNutricionista);
app.use('/api/alunos',             rotasAlunos);
app.use('/api/alimentos',          rotasAlimentos);
app.use('/api/exercicios',         rotasExercicios);
app.use('/api/planos-alimentares', rotasPlanosAlimentares);
app.use('/api/fichas-treino',      rotasFichasTreino);
app.use('/api/receitas',           rotasReceitas);
app.use('/api/progresso',          rotasProgresso);
app.use('/api/consultas',          rotasConsultas);
app.use('/api/formulas',           rotasFormulas);

// ── Handler de erros (deve ser o último) ─────────────────────────
app.use(middlewareErros);

export default app;
