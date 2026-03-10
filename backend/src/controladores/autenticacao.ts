import { Request, Response, NextFunction } from 'express';
import bcrypt from 'bcryptjs';
import { db } from '../banco/firebase';
import { gerarToken } from '../utils/helpers';
import { ErroApp } from '../middlewares/erros';

export async function loginNutricionista(req: Request, res: Response, next: NextFunction) {
  try {
    const { email, senha } = req.body;
    if (!email || !senha) throw new ErroApp('Email e senha são obrigatórios.', 400);

    const snap = await db.collection('nutricionistas').where('email', '==', email).limit(1).get();
    if (snap.empty) throw new ErroApp('Credenciais inválidas.', 401);

    const doc = snap.docs[0];
    const n = { id: doc.id, ...doc.data() } as any;
    if (!n.ativo) throw new ErroApp('Conta inativa. Contate o suporte.', 403);

    const senhaValida = await bcrypt.compare(senha, n.senhaHash);
    if (!senhaValida) throw new ErroApp('Credenciais inválidas.', 401);

    const token = gerarToken({ id: n.id, email: n.email, perfil: 'NUTRICIONISTA' });
    res.json({
      token,
      usuario: { id: n.id, nome: n.nome, email: n.email, crn: n.crn, perfil: 'NUTRICIONISTA' },
    });
  } catch (err) {
    next(err);
  }
}

export async function loginAluno(req: Request, res: Response, next: NextFunction) {
  try {
    const { email, senha } = req.body;
    if (!email || !senha) throw new ErroApp('Email e senha são obrigatórios.', 400);

    const snap = await db.collection('alunos').where('email', '==', email).limit(1).get();
    if (snap.empty) throw new ErroApp('Credenciais inválidas.', 401);

    const doc = snap.docs[0];
    const a = { id: doc.id, ...doc.data() } as any;
    if (!a.ativo) throw new ErroApp('Conta inativa. Contate seu nutricionista.', 403);

    const senhaValida = await bcrypt.compare(senha, a.senhaHash);
    if (!senhaValida) throw new ErroApp('Credenciais inválidas.', 401);

    const token = gerarToken({ id: a.id, email: a.email, perfil: 'ALUNO' });
    res.json({
      token,
      usuario: { id: a.id, nome: a.nome, email: a.email, perfil: 'ALUNO' },
    });
  } catch (err) {
    next(err);
  }
}

export async function registrarNutricionista(req: Request, res: Response, next: NextFunction) {
  try {
    const { nome, email, senha, crn, telefone } = req.body;
    if (!nome || !email || !senha) throw new ErroApp('Nome, email e senha são obrigatórios.', 400);

    const snap = await db.collection('nutricionistas').where('email', '==', email).limit(1).get();
    if (!snap.empty) throw new ErroApp('Email já cadastrado.', 409);

    const senhaHash = await bcrypt.hash(senha, 12);
    const ref = await db.collection('nutricionistas').add({
      nome, email, senhaHash,
      crn: crn || null,
      telefone: telefone || null,
      fotoPerfil: null,
      ativo: true,
      criadoEm: new Date().toISOString(),
    });

    res.status(201).json({ mensagem: 'Nutricionista cadastrado com sucesso.', id: ref.id });
  } catch (err) {
    next(err);
  }
}
