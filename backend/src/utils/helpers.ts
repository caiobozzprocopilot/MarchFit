import jwt from 'jsonwebtoken';
import { PayloadToken } from '../middlewares/autenticacao';

const JWT_SEGREDO = process.env.JWT_SEGREDO || 'segredo-padrao';
const JWT_EXPIRACAO = process.env.JWT_EXPIRACAO || '7d';

export function gerarToken(payload: PayloadToken): string {
  return jwt.sign(payload, JWT_SEGREDO, { expiresIn: JWT_EXPIRACAO } as jwt.SignOptions);
}

/** Extrai o ID do vídeo de uma URL do YouTube */
export function extrairIdYoutube(url: string): string | null {
  const padroes = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/,
    /youtube\.com\/shorts\/([a-zA-Z0-9_-]{11})/,
  ];
  for (const padrao of padroes) {
    const match = url.match(padrao);
    if (match) return match[1];
  }
  return null;
}

/** Calcula o IMC a partir do peso em kg e altura em metros */
export function calcularIMC(pesoKg: number, alturaM: number): number {
  return parseFloat((pesoKg / (alturaM * alturaM)).toFixed(2));
}

/** Calcula macros de um alimento para uma dada quantidade em gramas */
export function calcularMacrosPorQuantidade(
  caloriasP100g: number,
  proteinasP100g: number,
  carboidratosP100g: number,
  gordurasP100g: number,
  fibrasP100g: number | null,
  quantidadeGramas: number
): { calorias: number; proteinas: number; carboidratos: number; gorduras: number; fibras: number } {
  const fator = quantidadeGramas / 100;
  return {
    calorias:     parseFloat((caloriasP100g     * fator).toFixed(2)),
    proteinas:    parseFloat((proteinasP100g    * fator).toFixed(2)),
    carboidratos: parseFloat((carboidratosP100g * fator).toFixed(2)),
    gorduras:     parseFloat((gordurasP100g     * fator).toFixed(2)),
    fibras:       parseFloat(((fibrasP100g || 0) * fator).toFixed(2)),
  };
}
