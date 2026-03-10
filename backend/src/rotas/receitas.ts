import { Router } from 'express';
import { autenticar, apenasNutricionista } from '../middlewares/autenticacao';
import {
  listarReceitas,
  buscarReceita,
  criarReceita,
  atualizarReceita,
  deletarReceita,
  atribuirReceitaAluno,
  removerReceitaAluno,
} from '../controladores/receitas';

export const rotasReceitas = Router();

rotasReceitas.use(autenticar);

rotasReceitas.get('/',                              listarReceitas);
rotasReceitas.get('/:id',                           buscarReceita);
rotasReceitas.post('/',                             apenasNutricionista, criarReceita);
rotasReceitas.put('/:id',                           apenasNutricionista, atualizarReceita);
rotasReceitas.delete('/:id',                        apenasNutricionista, deletarReceita);
rotasReceitas.post('/:id/atribuir/:alunoId',        apenasNutricionista, atribuirReceitaAluno);
rotasReceitas.delete('/:id/remover/:alunoId',       apenasNutricionista, removerReceitaAluno);
