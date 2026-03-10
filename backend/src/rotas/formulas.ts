import { Router } from 'express';
import { autenticar, apenasNutricionista } from '../middlewares/autenticacao';
import {
  listarFormulas,
  buscarFormula,
  criarFormula,
  atualizarFormula,
  deletarFormula,
} from '../controladores/formulas';

export const rotasFormulas = Router();

rotasFormulas.use(autenticar, apenasNutricionista);

rotasFormulas.get('/',        listarFormulas);
rotasFormulas.get('/:id',     buscarFormula);
rotasFormulas.post('/',       criarFormula);
rotasFormulas.put('/:id',     atualizarFormula);
rotasFormulas.delete('/:id',  deletarFormula);
