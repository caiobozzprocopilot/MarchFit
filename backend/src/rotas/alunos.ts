import { Router } from 'express';
import { autenticar, apenasNutricionista } from '../middlewares/autenticacao';
import { uploadFoto } from '../utils/upload';
import {
  listarAlunos,
  buscarAluno,
  criarAluno,
  atualizarAluno,
  deletarAluno,
  fotoPerfil,
} from '../controladores/alunos';

export const rotasAlunos = Router();

rotasAlunos.use(autenticar, apenasNutricionista);

rotasAlunos.get('/',                    listarAlunos);
rotasAlunos.get('/:id',                 buscarAluno);
rotasAlunos.post('/',                   criarAluno);
rotasAlunos.put('/:id',                 atualizarAluno);
rotasAlunos.delete('/:id',              deletarAluno);
rotasAlunos.put('/:id/foto',            uploadFoto.single('foto'), fotoPerfil);
