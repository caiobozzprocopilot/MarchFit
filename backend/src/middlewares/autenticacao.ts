import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

export interface PayloadToken {
  id: string;
  email: string;
  perfil: 'NUTRICIONISTA' | 'ALUNO';
}

// Estende o Request para incluir o usuário autenticado
declare global {
  namespace Express {
    interface Request {
      usuario?: PayloadToken;
    }
  }
}

const JWT_SEGREDO = process.env.JWT_SEGREDO || 'segredo-padrao';

export function autenticar(req: Request, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ mensagem: 'Token de autenticação não fornecido.' });
    return;
  }

  const token = authHeader.split(' ')[1];

  try {
    const payload = jwt.verify(token, JWT_SEGREDO) as PayloadToken;
    req.usuario = payload;
    next();
  } catch {
    res.status(401).json({ mensagem: 'Token inválido ou expirado.' });
  }
}

export function apenasNutricionista(req: Request, res: Response, next: NextFunction): void {
  if (!req.usuario || req.usuario.perfil !== 'NUTRICIONISTA') {
    res.status(403).json({ mensagem: 'Acesso restrito ao nutricionista.' });
    return;
  }
  next();
}

export function apenasAluno(req: Request, res: Response, next: NextFunction): void {
  if (!req.usuario || req.usuario.perfil !== 'ALUNO') {
    res.status(403).json({ mensagem: 'Acesso restrito ao aluno.' });
    return;
  }
  next();
}
