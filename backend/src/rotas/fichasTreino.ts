import { Router } from 'express';
import { autenticar, apenasNutricionista } from '../middlewares/autenticacao';
import {
  listarFichas,
  buscarFicha,
  criarFicha,
  atualizarFicha,
  deletarFicha,
  adicionarExercicioFicha,
  atualizarExercicioFicha,
  deletarExercicioFicha,
  reordenarExercicios,
} from '../controladores/fichasTreino';

export const rotasFichasTreino = Router();

rotasFichasTreino.use(autenticar);

rotasFichasTreino.get('/',                                  listarFichas);
rotasFichasTreino.get('/:id',                               buscarFicha);
rotasFichasTreino.post('/',                                 apenasNutricionista, criarFicha);
rotasFichasTreino.put('/:id',                               apenasNutricionista, atualizarFicha);
rotasFichasTreino.delete('/:id',                            apenasNutricionista, deletarFicha);
rotasFichasTreino.post('/:fichaId/exercicios',              apenasNutricionista, adicionarExercicioFicha);
rotasFichasTreino.put('/:fichaId/exercicios/:itemId',       apenasNutricionista, atualizarExercicioFicha);
rotasFichasTreino.delete('/:fichaId/exercicios/:itemId',    apenasNutricionista, deletarExercicioFicha);
rotasFichasTreino.patch('/:fichaId/reordenar',              apenasNutricionista, reordenarExercicios);
