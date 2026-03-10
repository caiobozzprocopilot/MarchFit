import { Router } from 'express';
import { autenticar, apenasNutricionista } from '../middlewares/autenticacao';
import {
  listarConsultas,
  buscarConsulta,
  criarConsulta,
  atualizarConsulta,
  deletarConsulta,
} from '../controladores/consultas';

export const rotasConsultas = Router();

rotasConsultas.use(autenticar);

rotasConsultas.get('/',         listarConsultas);
rotasConsultas.get('/:id',      buscarConsulta);
rotasConsultas.post('/',        apenasNutricionista, criarConsulta);
rotasConsultas.put('/:id',      apenasNutricionista, atualizarConsulta);
rotasConsultas.delete('/:id',   apenasNutricionista, deletarConsulta);
