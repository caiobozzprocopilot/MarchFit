import { Router } from 'express';
import { autenticar, apenasNutricionista } from '../middlewares/autenticacao';
import { uploadFoto } from '../utils/upload';
import {
  listarProgresso,
  buscarRegistroProgresso,
  criarRegistroProgresso,
  atualizarRegistroProgresso,
  deletarRegistroProgresso,
} from '../controladores/progresso';

export const rotasProgresso = Router();

rotasProgresso.use(autenticar);

// Aluno e nutricionista podem ver o progresso
rotasProgresso.get('/aluno/:alunoId',       listarProgresso);
rotasProgresso.get('/:id',                  buscarRegistroProgresso);

// Criação/edição/deleção pelo nutricionista ou pelo próprio aluno
rotasProgresso.post('/aluno/:alunoId',      uploadFoto.single('foto'), criarRegistroProgresso);
rotasProgresso.put('/:id',                  apenasNutricionista, uploadFoto.single('foto'), atualizarRegistroProgresso);
rotasProgresso.delete('/:id',               apenasNutricionista, deletarRegistroProgresso);
