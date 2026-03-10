import { Request, Response, NextFunction } from 'express';

export class ErroApp extends Error {
  statusHttp: number;

  constructor(mensagem: string, statusHttp: number = 500) {
    super(mensagem);
    this.statusHttp = statusHttp;
    this.name = 'ErroApp';
  }
}

export function middlewareErros(
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  console.error(`[ERRO] ${err.name}: ${err.message}`);

  if (err instanceof ErroApp) {
    res.status(err.statusHttp).json({ mensagem: err.message });
    return;
  }

  // Firestore: documento não encontrado
  if ((err as any).code === 5 || (err as any).code === 'NOT_FOUND') {
    res.status(404).json({ mensagem: 'Registro não encontrado.' });
    return;
  }

  res.status(500).json({ mensagem: 'Erro interno do servidor.' });
}
