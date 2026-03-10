import { Router } from 'express';
import { autenticar, apenasNutricionista } from '../middlewares/autenticacao';
import {
  listarExercicios,
  buscarExercicio,
  criarExercicio,
  atualizarExercicio,
  deletarExercicio,
} from '../controladores/exercicios';

export const rotasExercicios = Router();

rotasExercicios.use(autenticar);

rotasExercicios.get('/',         listarExercicios);
rotasExercicios.get('/:id',      buscarExercicio);
rotasExercicios.post('/',        apenasNutricionista, criarExercicio);
rotasExercicios.put('/:id',      apenasNutricionista, atualizarExercicio);
rotasExercicios.delete('/:id',   apenasNutricionista, deletarExercicio);
