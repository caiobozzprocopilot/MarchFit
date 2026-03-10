import { Router } from 'express';
import { autenticar, apenasNutricionista } from '../middlewares/autenticacao';
import {
  listarPlanos,
  buscarPlano,
  criarPlano,
  atualizarPlano,
  deletarPlano,
  adicionarRefeicao,
  atualizarRefeicao,
  deletarRefeicao,
  adicionarItemRefeicao,
  atualizarItemRefeicao,
  deletarItemRefeicao,
  calcularTotaisPlano,
} from '../controladores/planosAlimentares';

export const rotasPlanosAlimentares = Router();

rotasPlanosAlimentares.use(autenticar);

// Planos
rotasPlanosAlimentares.get('/',                                         listarPlanos);
rotasPlanosAlimentares.get('/:id',                                      buscarPlano);
rotasPlanosAlimentares.get('/:id/totais',                               calcularTotaisPlano);
rotasPlanosAlimentares.post('/',                                        apenasNutricionista, criarPlano);
rotasPlanosAlimentares.put('/:id',                                      apenasNutricionista, atualizarPlano);
rotasPlanosAlimentares.delete('/:id',                                   apenasNutricionista, deletarPlano);

// Refeições
rotasPlanosAlimentares.post('/:planoId/refeicoes',                      apenasNutricionista, adicionarRefeicao);
rotasPlanosAlimentares.put('/:planoId/refeicoes/:refeicaoId',           apenasNutricionista, atualizarRefeicao);
rotasPlanosAlimentares.delete('/:planoId/refeicoes/:refeicaoId',        apenasNutricionista, deletarRefeicao);

// Itens da Refeição
rotasPlanosAlimentares.post('/:planoId/refeicoes/:refeicaoId/itens',    apenasNutricionista, adicionarItemRefeicao);
rotasPlanosAlimentares.put('/itens/:itemId',                            apenasNutricionista, atualizarItemRefeicao);
rotasPlanosAlimentares.delete('/itens/:itemId',                         apenasNutricionista, deletarItemRefeicao);
