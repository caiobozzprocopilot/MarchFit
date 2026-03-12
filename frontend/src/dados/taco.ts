// Tabela Brasileira de Composição de Alimentos (TACO) — versão embutida
// Fonte: NEPA/UNICAMP – Tabela TACO, 4ª edição.
// Valores por 100g da porção comestível.

export interface TacoAlimento {
  tacoId: number;
  nome: string;
  categoria: string;
  caloriasP100g: number;
  proteinasP100g: number;
  carboidratosP100g: number;
  gordurasP100g: number;
  fibrasP100g: number | null;
  sodioP100g: number | null;
}

export const tacoAlimentos: TacoAlimento[] = [
  // ── Carnes e derivados ────────────────────────────────────────
  { tacoId: 1,  nome: 'Frango, peito, grelhado',          categoria: 'Carnes e derivados',   caloriasP100g: 163, proteinasP100g: 31.5, carboidratosP100g: 0,    gordurasP100g: 3.7,  fibrasP100g: 0,   sodioP100g: 74  },
  { tacoId: 2,  nome: 'Frango, coxa, grelhada',           categoria: 'Carnes e derivados',   caloriasP100g: 196, proteinasP100g: 27.0, carboidratosP100g: 0,    gordurasP100g: 9.7,  fibrasP100g: 0,   sodioP100g: 67  },
  { tacoId: 3,  nome: 'Frango, asa, grelhada',            categoria: 'Carnes e derivados',   caloriasP100g: 210, proteinasP100g: 24.2, carboidratosP100g: 0,    gordurasP100g: 12.4, fibrasP100g: 0,   sodioP100g: 72  },
  { tacoId: 4,  nome: 'Frango, inteiro, assado',          categoria: 'Carnes e derivados',   caloriasP100g: 178, proteinasP100g: 25.6, carboidratosP100g: 0,    gordurasP100g: 8.1,  fibrasP100g: 0,   sodioP100g: 78  },
  { tacoId: 5,  nome: 'Bife bovino, chã de fora, grelhado', categoria: 'Carnes e derivados', caloriasP100g: 219, proteinasP100g: 22.4, carboidratosP100g: 0,    gordurasP100g: 14.2, fibrasP100g: 0,   sodioP100g: 57  },
  { tacoId: 6,  nome: 'Carne bovina, acém, cozido',       categoria: 'Carnes e derivados',   caloriasP100g: 210, proteinasP100g: 27.4, carboidratosP100g: 0,    gordurasP100g: 11.1, fibrasP100g: 0,   sodioP100g: 60  },
  { tacoId: 7,  nome: 'Carne bovina, músculo, cozido',    categoria: 'Carnes e derivados',   caloriasP100g: 192, proteinasP100g: 28.8, carboidratosP100g: 0,    gordurasP100g: 8.4,  fibrasP100g: 0,   sodioP100g: 62  },
  { tacoId: 8,  nome: 'Patinho bovino, grelhado',         categoria: 'Carnes e derivados',   caloriasP100g: 182, proteinasP100g: 25.6, carboidratosP100g: 0,    gordurasP100g: 8.9,  fibrasP100g: 0,   sodioP100g: 55  },
  { tacoId: 9,  nome: 'Carne suína, lombo, grelhado',     categoria: 'Carnes e derivados',   caloriasP100g: 196, proteinasP100g: 22.0, carboidratosP100g: 0,    gordurasP100g: 11.7, fibrasP100g: 0,   sodioP100g: 55  },
  { tacoId: 10, nome: 'Linguiça suína, cozida',           categoria: 'Carnes e derivados',   caloriasP100g: 255, proteinasP100g: 15.2, carboidratosP100g: 3.4,  gordurasP100g: 20.4, fibrasP100g: 0,   sodioP100g: 698 },
  { tacoId: 11, nome: 'Tilápia, filé, grelhado',          categoria: 'Pescados e frutos do mar', caloriasP100g: 128, proteinasP100g: 26.1, carboidratosP100g: 0, gordurasP100g: 2.7,  fibrasP100g: 0,   sodioP100g: 52  },
  { tacoId: 12, nome: 'Salmão, filé, grelhado',           categoria: 'Pescados e frutos do mar', caloriasP100g: 208, proteinasP100g: 20.0, carboidratosP100g: 0, gordurasP100g: 13.4, fibrasP100g: 0,   sodioP100g: 59  },
  { tacoId: 13, nome: 'Sardinha, enlatada em óleo',       categoria: 'Pescados e frutos do mar', caloriasP100g: 208, proteinasP100g: 23.8, carboidratosP100g: 0, gordurasP100g: 11.5, fibrasP100g: 0,   sodioP100g: 430 },
  { tacoId: 14, nome: 'Atum, enlatado em água',           categoria: 'Pescados e frutos do mar', caloriasP100g: 119, proteinasP100g: 25.7, carboidratosP100g: 0, gordurasP100g: 1.0,  fibrasP100g: 0,   sodioP100g: 330 },
  { tacoId: 15, nome: 'Camarão, cozido',                  categoria: 'Pescados e frutos do mar', caloriasP100g: 99,  proteinasP100g: 20.3, carboidratosP100g: 0, gordurasP100g: 1.5,  fibrasP100g: 0,   sodioP100g: 232 },
  // ── Ovos e derivados ──────────────────────────────────────────
  { tacoId: 16, nome: 'Ovo de galinha, inteiro, cozido',  categoria: 'Ovos e derivados',     caloriasP100g: 152, proteinasP100g: 13.1, carboidratosP100g: 1.6,  gordurasP100g: 10.0, fibrasP100g: 0,   sodioP100g: 131 },
  { tacoId: 17, nome: 'Ovo de galinha, clara, crua',      categoria: 'Ovos e derivados',     caloriasP100g: 49,  proteinasP100g: 10.8, carboidratosP100g: 0.7,  gordurasP100g: 0.0,  fibrasP100g: 0,   sodioP100g: 166 },
  { tacoId: 18, nome: 'Ovo de galinha, gema, crua',       categoria: 'Ovos e derivados',     caloriasP100g: 358, proteinasP100g: 16.0, carboidratosP100g: 0.6,  gordurasP100g: 31.9, fibrasP100g: 0,   sodioP100g: 51  },
  { tacoId: 19, nome: 'Ovo de codorna, cozido',           categoria: 'Ovos e derivados',     caloriasP100g: 158, proteinasP100g: 13.0, carboidratosP100g: 1.2,  gordurasP100g: 11.1, fibrasP100g: 0,   sodioP100g: 141 },
  // ── Cereais e derivados ───────────────────────────────────────
  { tacoId: 20, nome: 'Arroz branco, polido, cozido',     categoria: 'Cereais e derivados',  caloriasP100g: 129, proteinasP100g: 2.5,  carboidratosP100g: 28.1, gordurasP100g: 0.2,  fibrasP100g: 1.6, sodioP100g: 1   },
  { tacoId: 21, nome: 'Arroz integral, cozido',           categoria: 'Cereais e derivados',  caloriasP100g: 124, proteinasP100g: 2.6,  carboidratosP100g: 27.1, gordurasP100g: 1.0,  fibrasP100g: 2.7, sodioP100g: 1   },
  { tacoId: 22, nome: 'Macarrão, parafuso, cozido',       categoria: 'Cereais e derivados',  caloriasP100g: 131, proteinasP100g: 4.2,  carboidratosP100g: 26.3, gordurasP100g: 0.8,  fibrasP100g: 1.4, sodioP100g: 2   },
  { tacoId: 23, nome: 'Aveia, flocos',                    categoria: 'Cereais e derivados',  caloriasP100g: 394, proteinasP100g: 13.9, carboidratosP100g: 66.6, gordurasP100g: 8.5,  fibrasP100g: 9.1, sodioP100g: 5   },
  { tacoId: 24, nome: 'Pão francês',                      categoria: 'Cereais e derivados',  caloriasP100g: 300, proteinasP100g: 8.0,  carboidratosP100g: 57.2, gordurasP100g: 3.1,  fibrasP100g: 2.3, sodioP100g: 489 },
  { tacoId: 25, nome: 'Pão de forma integral',            categoria: 'Cereais e derivados',  caloriasP100g: 253, proteinasP100g: 9.4,  carboidratosP100g: 44.7, gordurasP100g: 4.7,  fibrasP100g: 6.9, sodioP100g: 428 },
  { tacoId: 26, nome: 'Corn flakes',                      categoria: 'Cereais e derivados',  caloriasP100g: 386, proteinasP100g: 7.3,  carboidratosP100g: 87.0, gordurasP100g: 0.5,  fibrasP100g: 2.4, sodioP100g: 682 },
  { tacoId: 27, nome: 'Granola',                          categoria: 'Cereais e derivados',  caloriasP100g: 381, proteinasP100g: 8.2,  carboidratosP100g: 67.2, gordurasP100g: 8.9,  fibrasP100g: 7.6, sodioP100g: 82  },
  { tacoId: 28, nome: 'Farinha de trigo, enriquecida',    categoria: 'Cereais e derivados',  caloriasP100g: 360, proteinasP100g: 9.8,  carboidratosP100g: 75.1, gordurasP100g: 1.4,  fibrasP100g: 2.3, sodioP100g: 3   },
  { tacoId: 29, nome: 'Tapioca, goma, crua',              categoria: 'Cereais e derivados',  caloriasP100g: 350, proteinasP100g: 0.3,  carboidratosP100g: 86.4, gordurasP100g: 0.2,  fibrasP100g: 1.5, sodioP100g: 4   },
  { tacoId: 30, nome: 'Batata doce, cozida',              categoria: 'Cereais e derivados',  caloriasP100g: 77,  proteinasP100g: 1.4,  carboidratosP100g: 18.4, gordurasP100g: 0.1,  fibrasP100g: 2.2, sodioP100g: 29  },
  { tacoId: 31, nome: 'Batata inglesa, cozida',           categoria: 'Cereais e derivados',  caloriasP100g: 52,  proteinasP100g: 1.2,  carboidratosP100g: 11.9, gordurasP100g: 0.1,  fibrasP100g: 1.3, sodioP100g: 4   },
  // ── Leguminosas e derivados ───────────────────────────────────
  { tacoId: 32, nome: 'Feijão carioca, cozido',           categoria: 'Leguminosas e derivados', caloriasP100g: 77, proteinasP100g: 4.8, carboidratosP100g: 13.6, gordurasP100g: 0.5,  fibrasP100g: 8.5, sodioP100g: 2   },
  { tacoId: 33, nome: 'Feijão preto, cozido',             categoria: 'Leguminosas e derivados', caloriasP100g: 77, proteinasP100g: 4.5, carboidratosP100g: 14.0, gordurasP100g: 0.5,  fibrasP100g: 8.4, sodioP100g: 1   },
  { tacoId: 34, nome: 'Lentilha, cozida',                 categoria: 'Leguminosas e derivados', caloriasP100g: 93, proteinasP100g: 6.3, carboidratosP100g: 16.1, gordurasP100g: 0.5,  fibrasP100g: 7.9, sodioP100g: 2   },
  { tacoId: 35, nome: 'Ervilha, cozida',                  categoria: 'Leguminosas e derivados', caloriasP100g: 74, proteinasP100g: 5.4, carboidratosP100g: 11.7, gordurasP100g: 0.4,  fibrasP100g: 8.3, sodioP100g: 1   },
  { tacoId: 36, nome: 'Grão-de-bico, cozido',             categoria: 'Leguminosas e derivados', caloriasP100g: 164, proteinasP100g: 8.9, carboidratosP100g: 27.4, gordurasP100g: 2.6, fibrasP100g: 5.4, sodioP100g: 7   },
  { tacoId: 37, nome: 'Soja, grão, cozido',               categoria: 'Leguminosas e derivados', caloriasP100g: 163, proteinasP100g: 14.6, carboidratosP100g: 12.5, gordurasP100g: 7.7, fibrasP100g: 8.1, sodioP100g: 2   },
  { tacoId: 38, nome: 'Tofu',                             categoria: 'Leguminosas e derivados', caloriasP100g: 76,  proteinasP100g: 8.1, carboidratosP100g: 1.9,  gordurasP100g: 4.8,  fibrasP100g: 0.3, sodioP100g: 7   },
  // ── Leite e derivados ─────────────────────────────────────────
  { tacoId: 39, nome: 'Leite de vaca, integral',          categoria: 'Leite e derivados',    caloriasP100g: 61,  proteinasP100g: 3.2,  carboidratosP100g: 4.9,  gordurasP100g: 3.3,  fibrasP100g: 0,   sodioP100g: 44  },
  { tacoId: 40, nome: 'Leite de vaca, desnatado',         categoria: 'Leite e derivados',    caloriasP100g: 35,  proteinasP100g: 3.4,  carboidratosP100g: 5.0,  gordurasP100g: 0.2,  fibrasP100g: 0,   sodioP100g: 52  },
  { tacoId: 41, nome: 'Iogurte, natural, integral',       categoria: 'Leite e derivados',    caloriasP100g: 66,  proteinasP100g: 3.5,  carboidratosP100g: 4.9,  gordurasP100g: 3.3,  fibrasP100g: 0,   sodioP100g: 46  },
  { tacoId: 42, nome: 'Iogurte, natural, desnatado',      categoria: 'Leite e derivados',    caloriasP100g: 43,  proteinasP100g: 4.3,  carboidratosP100g: 6.0,  gordurasP100g: 0.2,  fibrasP100g: 0,   sodioP100g: 59  },
  { tacoId: 43, nome: 'Iogurte grego',                    categoria: 'Leite e derivados',    caloriasP100g: 133, proteinasP100g: 9.0,  carboidratosP100g: 6.5,  gordurasP100g: 8.2,  fibrasP100g: 0,   sodioP100g: 35  },
  { tacoId: 44, nome: 'Queijo mussarela',                 categoria: 'Leite e derivados',    caloriasP100g: 330, proteinasP100g: 22.0, carboidratosP100g: 3.2,  gordurasP100g: 26.0, fibrasP100g: 0,   sodioP100g: 360 },
  { tacoId: 45, nome: 'Queijo prato',                     categoria: 'Leite e derivados',    caloriasP100g: 358, proteinasP100g: 22.3, carboidratosP100g: 2.8,  gordurasP100g: 29.1, fibrasP100g: 0,   sodioP100g: 540 },
  { tacoId: 46, nome: 'Queijo cottage',                   categoria: 'Leite e derivados',    caloriasP100g: 98,  proteinasP100g: 11.0, carboidratosP100g: 4.0,  gordurasP100g: 4.3,  fibrasP100g: 0,   sodioP100g: 321 },
  { tacoId: 47, nome: 'Ricota',                           categoria: 'Leite e derivados',    caloriasP100g: 143, proteinasP100g: 9.4,  carboidratosP100g: 5.5,  gordurasP100g: 9.0,  fibrasP100g: 0,   sodioP100g: 104 },
  { tacoId: 48, nome: 'Requeijão cremoso',                categoria: 'Leite e derivados',    caloriasP100g: 247, proteinasP100g: 9.5,  carboidratosP100g: 4.6,  gordurasP100g: 21.4, fibrasP100g: 0,   sodioP100g: 510 },
  // ── Frutas e derivados ────────────────────────────────────────
  { tacoId: 49, nome: 'Abacate',                          categoria: 'Frutas e derivados',   caloriasP100g: 96,  proteinasP100g: 1.2,  carboidratosP100g: 6.0,  gordurasP100g: 8.4,  fibrasP100g: 6.3, sodioP100g: 2   },
  { tacoId: 50, nome: 'Banana, prata',                    categoria: 'Frutas e derivados',   caloriasP100g: 98,  proteinasP100g: 1.3,  carboidratosP100g: 26.0, gordurasP100g: 0.1,  fibrasP100g: 1.9, sodioP100g: 2   },
  { tacoId: 51, nome: 'Banana, nanica',                   categoria: 'Frutas e derivados',   caloriasP100g: 92,  proteinasP100g: 1.4,  carboidratosP100g: 23.8, gordurasP100g: 0.1,  fibrasP100g: 1.8, sodioP100g: 2   },
  { tacoId: 52, nome: 'Maçã, fuji',                       categoria: 'Frutas e derivados',   caloriasP100g: 56,  proteinasP100g: 0.3,  carboidratosP100g: 15.2, gordurasP100g: 0.4,  fibrasP100g: 2.0, sodioP100g: 1   },
  { tacoId: 53, nome: 'Laranja, pera',                    categoria: 'Frutas e derivados',   caloriasP100g: 46,  proteinasP100g: 0.9,  carboidratosP100g: 11.5, gordurasP100g: 0.1,  fibrasP100g: 2.4, sodioP100g: 1   },
  { tacoId: 54, nome: 'Mamão papaia',                     categoria: 'Frutas e derivados',   caloriasP100g: 40,  proteinasP100g: 0.5,  carboidratosP100g: 10.2, gordurasP100g: 0.1,  fibrasP100g: 1.8, sodioP100g: 2   },
  { tacoId: 55, nome: 'Manga tommy',                      categoria: 'Frutas e derivados',   caloriasP100g: 64,  proteinasP100g: 0.9,  carboidratosP100g: 16.8, gordurasP100g: 0.2,  fibrasP100g: 1.8, sodioP100g: 2   },
  { tacoId: 56, nome: 'Morango',                          categoria: 'Frutas e derivados',   caloriasP100g: 30,  proteinasP100g: 0.7,  carboidratosP100g: 7.1,  gordurasP100g: 0.3,  fibrasP100g: 2.0, sodioP100g: 1   },
  { tacoId: 57, nome: 'Melancia',                         categoria: 'Frutas e derivados',   caloriasP100g: 33,  proteinasP100g: 0.9,  carboidratosP100g: 8.1,  gordurasP100g: 0.2,  fibrasP100g: 0.4, sodioP100g: 2   },
  { tacoId: 58, nome: 'Uva, Itália',                      categoria: 'Frutas e derivados',   caloriasP100g: 67,  proteinasP100g: 0.6,  carboidratosP100g: 17.0, gordurasP100g: 0.4,  fibrasP100g: 0.9, sodioP100g: 1   },
  { tacoId: 59, nome: 'Abacaxi',                          categoria: 'Frutas e derivados',   caloriasP100g: 48,  proteinasP100g: 0.9,  carboidratosP100g: 12.3, gordurasP100g: 0.1,  fibrasP100g: 1.0, sodioP100g: 1   },
  { tacoId: 60, nome: 'Limão taiti, suco',                categoria: 'Frutas e derivados',   caloriasP100g: 22,  proteinasP100g: 0.5,  carboidratosP100g: 6.5,  gordurasP100g: 0.1,  fibrasP100g: 0.8, sodioP100g: 1   },
  { tacoId: 61, nome: 'Pera',                             categoria: 'Frutas e derivados',   caloriasP100g: 55,  proteinasP100g: 0.5,  carboidratosP100g: 14.6, gordurasP100g: 0.1,  fibrasP100g: 3.1, sodioP100g: 1   },
  { tacoId: 62, nome: 'Kiwi',                             categoria: 'Frutas e derivados',   caloriasP100g: 61,  proteinasP100g: 1.0,  carboidratosP100g: 14.7, gordurasP100g: 0.5,  fibrasP100g: 3.0, sodioP100g: 4   },
  // ── Verduras, hortaliças e derivados ─────────────────────────
  { tacoId: 63, nome: 'Alface, crespa, crua',             categoria: 'Verduras e hortaliças', caloriasP100g: 11, proteinasP100g: 1.3, carboidratosP100g: 1.7,  gordurasP100g: 0.2,  fibrasP100g: 1.7, sodioP100g: 10  },
  { tacoId: 64, nome: 'Tomate, maduro, cru',              categoria: 'Verduras e hortaliças', caloriasP100g: 16, proteinasP100g: 1.1, carboidratosP100g: 3.5,  gordurasP100g: 0.2,  fibrasP100g: 1.2, sodioP100g: 4   },
  { tacoId: 65, nome: 'Cenoura, crua',                    categoria: 'Verduras e hortaliças', caloriasP100g: 34, proteinasP100g: 1.3, carboidratosP100g: 7.7,  gordurasP100g: 0.3,  fibrasP100g: 3.2, sodioP100g: 58  },
  { tacoId: 66, nome: 'Brócolis, cozido',                 categoria: 'Verduras e hortaliças', caloriasP100g: 25, proteinasP100g: 2.8, carboidratosP100g: 3.4,  gordurasP100g: 0.4,  fibrasP100g: 2.6, sodioP100g: 13  },
  { tacoId: 67, nome: 'Espinafre, cozido',                categoria: 'Verduras e hortaliças', caloriasP100g: 18, proteinasP100g: 2.5, carboidratosP100g: 2.6,  gordurasP100g: 0.4,  fibrasP100g: 2.4, sodioP100g: 90  },
  { tacoId: 68, nome: 'Beterraba, cozida',                categoria: 'Verduras e hortaliças', caloriasP100g: 39, proteinasP100g: 1.5, carboidratosP100g: 9.0,  gordurasP100g: 0.1,  fibrasP100g: 1.9, sodioP100g: 72  },
  { tacoId: 69, nome: 'Abobrinha, cozida',                categoria: 'Verduras e hortaliças', caloriasP100g: 19, proteinasP100g: 1.2, carboidratosP100g: 3.8,  gordurasP100g: 0.2,  fibrasP100g: 1.2, sodioP100g: 2   },
  { tacoId: 70, nome: 'Pepino, cru',                      categoria: 'Verduras e hortaliças', caloriasP100g: 10, proteinasP100g: 0.6, carboidratosP100g: 1.7,  gordurasP100g: 0.2,  fibrasP100g: 0.8, sodioP100g: 2   },
  { tacoId: 71, nome: 'Abóbora, cozida',                  categoria: 'Verduras e hortaliças', caloriasP100g: 22, proteinasP100g: 0.8, carboidratosP100g: 4.3,  gordurasP100g: 0.5,  fibrasP100g: 1.3, sodioP100g: 5   },
  { tacoId: 72, nome: 'Chuchu, cozido',                   categoria: 'Verduras e hortaliças', caloriasP100g: 19, proteinasP100g: 0.6, carboidratosP100g: 4.2,  gordurasP100g: 0.1,  fibrasP100g: 1.7, sodioP100g: 2   },
  { tacoId: 73, nome: 'Couve, manteiga, cozida',          categoria: 'Verduras e hortaliças', caloriasP100g: 19, proteinasP100g: 1.8, carboidratosP100g: 3.4,  gordurasP100g: 0.4,  fibrasP100g: 1.7, sodioP100g: 13  },
  { tacoId: 74, nome: 'Berinjela, crua',                  categoria: 'Verduras e hortaliças', caloriasP100g: 20, proteinasP100g: 1.2, carboidratosP100g: 4.1,  gordurasP100g: 0.2,  fibrasP100g: 2.6, sodioP100g: 2   },
  { tacoId: 75, nome: 'Pimentão verde, cru',              categoria: 'Verduras e hortaliças', caloriasP100g: 18, proteinasP100g: 0.9, carboidratosP100g: 4.2,  gordurasP100g: 0.2,  fibrasP100g: 1.4, sodioP100g: 3   },
  { tacoId: 76, nome: 'Cebola, crua',                     categoria: 'Verduras e hortaliças', caloriasP100g: 37, proteinasP100g: 1.4, carboidratosP100g: 8.6,  gordurasP100g: 0.2,  fibrasP100g: 1.5, sodioP100g: 4   },
  { tacoId: 77, nome: 'Alho, cru',                        categoria: 'Verduras e hortaliças', caloriasP100g: 130, proteinasP100g: 6.4, carboidratosP100g: 28.2, gordurasP100g: 0.5,  fibrasP100g: 4.3, sodioP100g: 14  },
  // ── Gorduras e óleos ──────────────────────────────────────────
  { tacoId: 78, nome: 'Azeite de oliva, extra virgem',   categoria: 'Gorduras e óleos',      caloriasP100g: 884, proteinasP100g: 0,    carboidratosP100g: 0,    gordurasP100g: 100.0, fibrasP100g: 0,  sodioP100g: 2   },
  { tacoId: 79, nome: 'Óleo de canola',                  categoria: 'Gorduras e óleos',      caloriasP100g: 884, proteinasP100g: 0,    carboidratosP100g: 0,    gordurasP100g: 100.0, fibrasP100g: 0,  sodioP100g: 0   },
  { tacoId: 80, nome: 'Óleo de girassol',                categoria: 'Gorduras e óleos',      caloriasP100g: 884, proteinasP100g: 0,    carboidratosP100g: 0,    gordurasP100g: 100.0, fibrasP100g: 0,  sodioP100g: 0   },
  { tacoId: 81, nome: 'Óleo de coco, virgem',            categoria: 'Gorduras e óleos',      caloriasP100g: 862, proteinasP100g: 0,    carboidratosP100g: 0,    gordurasP100g: 100.0, fibrasP100g: 0,  sodioP100g: 0   },
  { tacoId: 82, nome: 'Manteiga, sem sal',               categoria: 'Gorduras e óleos',      caloriasP100g: 717, proteinasP100g: 0.9,  carboidratosP100g: 0.4,  gordurasP100g: 81.0,  fibrasP100g: 0,  sodioP100g: 11  },
  { tacoId: 83, nome: 'Margarina, cremosa',              categoria: 'Gorduras e óleos',      caloriasP100g: 580, proteinasP100g: 0.0,  carboidratosP100g: 0.1,  gordurasP100g: 64.0,  fibrasP100g: 0,  sodioP100g: 534 },
  // ── Nozes e sementes ──────────────────────────────────────────
  { tacoId: 84, nome: 'Castanha-do-Pará',                categoria: 'Nozes e sementes',      caloriasP100g: 656, proteinasP100g: 14.3, carboidratosP100g: 15.1, gordurasP100g: 63.5, fibrasP100g: 7.9, sodioP100g: 3   },
  { tacoId: 85, nome: 'Amendoim, torrado',               categoria: 'Nozes e sementes',      caloriasP100g: 581, proteinasP100g: 24.4, carboidratosP100g: 21.4, gordurasP100g: 47.0, fibrasP100g: 8.0, sodioP100g: 14  },
  { tacoId: 86, nome: 'Nozes',                           categoria: 'Nozes e sementes',      caloriasP100g: 620, proteinasP100g: 14.8, carboidratosP100g: 13.7, gordurasP100g: 58.0, fibrasP100g: 4.8, sodioP100g: 3   },
  { tacoId: 87, nome: 'Amêndoas',                        categoria: 'Nozes e sementes',      caloriasP100g: 579, proteinasP100g: 21.2, carboidratosP100g: 21.7, gordurasP100g: 49.9, fibrasP100g: 12.5, sodioP100g: 1  },
  { tacoId: 88, nome: 'Castanha de caju, torrada',       categoria: 'Nozes e sementes',      caloriasP100g: 570, proteinasP100g: 18.5, carboidratosP100g: 29.0, gordurasP100g: 46.0, fibrasP100g: 3.0, sodioP100g: 12  },
  { tacoId: 89, nome: 'Chia, semente',                   categoria: 'Nozes e sementes',      caloriasP100g: 490, proteinasP100g: 15.6, carboidratosP100g: 42.1, gordurasP100g: 30.7, fibrasP100g: 34.4, sodioP100g: 16 },
  { tacoId: 90, nome: 'Linhaça, semente',                categoria: 'Nozes e sementes',      caloriasP100g: 495, proteinasP100g: 18.3, carboidratosP100g: 28.9, gordurasP100g: 42.2, fibrasP100g: 27.3, sodioP100g: 30 },
  { tacoId: 91, nome: 'Gergelim, semente',               categoria: 'Nozes e sementes',      caloriasP100g: 573, proteinasP100g: 17.7, carboidratosP100g: 26.0, gordurasP100g: 49.7, fibrasP100g: 11.9, sodioP100g: 11 },
  // ── Açúcares e produtos de confeitaria ───────────────────────
  { tacoId: 92, nome: 'Açúcar refinado',                 categoria: 'Açúcares e doces',      caloriasP100g: 387, proteinasP100g: 0,    carboidratosP100g: 99.5, gordurasP100g: 0,    fibrasP100g: 0,   sodioP100g: 2   },
  { tacoId: 93, nome: 'Mel de abelha',                   categoria: 'Açúcares e doces',      caloriasP100g: 304, proteinasP100g: 0.3,  carboidratosP100g: 82.4, gordurasP100g: 0,    fibrasP100g: 0.2, sodioP100g: 6   },
  { tacoId: 94, nome: 'Chocolate amargo, 70% cacau',     categoria: 'Açúcares e doces',      caloriasP100g: 566, proteinasP100g: 11.0, carboidratosP100g: 38.0, gordurasP100g: 42.6, fibrasP100g: 11.0, sodioP100g: 8  },
  // ── Bebidas ───────────────────────────────────────────────────
  { tacoId: 95, nome: 'Suco de laranja, natural',        categoria: 'Bebidas',               caloriasP100g: 38,  proteinasP100g: 0.7,  carboidratosP100g: 9.1,  gordurasP100g: 0.1,  fibrasP100g: 0.2, sodioP100g: 1   },
  { tacoId: 96, nome: 'Café, infusão',                   categoria: 'Bebidas',               caloriasP100g: 1,   proteinasP100g: 0.1,  carboidratosP100g: 0.2,  gordurasP100g: 0.0,  fibrasP100g: 0,   sodioP100g: 1   },
  { tacoId: 97, nome: 'Leite de soja, enriquecido',      categoria: 'Bebidas',               caloriasP100g: 52,  proteinasP100g: 3.4,  carboidratosP100g: 6.3,  gordurasP100g: 1.5,  fibrasP100g: 0.5, sodioP100g: 42  },
  // ── Suplementos proteicos ─────────────────────────────────────
  { tacoId: 98, nome: 'Whey protein, concentrado',       categoria: 'Suplementos',           caloriasP100g: 370, proteinasP100g: 74.0, carboidratosP100g: 12.0, gordurasP100g: 4.0,  fibrasP100g: 0,   sodioP100g: 150 },
  { tacoId: 99, nome: 'Proteína de soja isolada',        categoria: 'Suplementos',           caloriasP100g: 338, proteinasP100g: 80.7, carboidratosP100g: 5.4,  gordurasP100g: 0.5,  fibrasP100g: 2.5, sodioP100g: 710 },
  { tacoId: 100, nome: 'Albumina em pó',                 categoria: 'Suplementos',           caloriasP100g: 367, proteinasP100g: 82.8, carboidratosP100g: 6.0,  gordurasP100g: 0.4,  fibrasP100g: 0,   sodioP100g: 630 },
];

export const categoriasTaco = [...new Set(tacoAlimentos.map((a) => a.categoria))].sort();
