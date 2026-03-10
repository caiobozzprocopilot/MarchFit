import { Router } from 'express';
import { autenticar, apenasNutricionista } from '../middlewares/autenticacao';
import { uploadCsv } from '../utils/upload';
import {
  listarAlimentos,
  buscarAlimento,
  criarAlimento,
  atualizarAlimento,
  deletarAlimento,
  importarCsv,
  downloadTemplateCsv,
} from '../controladores/alimentos';

export const rotasAlimentos = Router();

rotasAlimentos.use(autenticar);

// Acessível por nutricionista e aluno (leitura)
rotasAlimentos.get('/',                     listarAlimentos);
rotasAlimentos.get('/template-csv',         downloadTemplateCsv);
rotasAlimentos.get('/:id',                  buscarAlimento);

// Somente nutricionista pode criar/editar/deletar
rotasAlimentos.post('/',                    apenasNutricionista, criarAlimento);
rotasAlimentos.post('/importar-csv',        apenasNutricionista, uploadCsv.single('arquivo'), importarCsv);
rotasAlimentos.put('/:id',                  apenasNutricionista, atualizarAlimento);
rotasAlimentos.delete('/:id',               apenasNutricionista, deletarAlimento);
