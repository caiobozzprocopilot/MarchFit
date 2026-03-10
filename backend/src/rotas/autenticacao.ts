import { Router } from 'express';
import {
  loginNutricionista,
  loginAluno,
  registrarNutricionista,
} from '../controladores/autenticacao';

export const rotasAutenticacao = Router();

// POST /api/auth/login/nutricionista
rotasAutenticacao.post('/login/nutricionista', loginNutricionista);

// POST /api/auth/login/aluno
rotasAutenticacao.post('/login/aluno', loginAluno);

// POST /api/auth/registrar/nutricionista (apenas em DEV ou primeiro acesso)
rotasAutenticacao.post('/registrar/nutricionista', registrarNutricionista);
