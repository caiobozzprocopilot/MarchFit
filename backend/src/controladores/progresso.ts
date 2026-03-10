import { Request, Response, NextFunction } from 'express';
import { db } from '../banco/firebase';
import { ErroApp } from '../middlewares/erros';
import { calcularIMC } from '../utils/helpers';

export async function listarProgresso(req: Request, res: Response, next: NextFunction) {
  try {
    const alunoId = String(req.params.alunoId);
    const { limite } = req.query;
    const usuario = req.usuario!;
    if (usuario.perfil === 'ALUNO' && usuario.id !== alunoId) throw new ErroApp('Acesso negado.', 403);

    let query: FirebaseFirestore.Query = db.collection('registros_progresso')
      .where('alunoId', '==', alunoId)
      .orderBy('registradoEm', 'desc');
    if (limite) query = query.limit(parseInt(String(limite)));

    const snap = await query.get();
    res.json(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
  } catch (err) {
    next(err);
  }
}

export async function buscarRegistroProgresso(req: Request, res: Response, next: NextFunction) {
  try {
    const doc = await db.collection('registros_progresso').doc(String(req.params.id)).get();
    if (!doc.exists) throw new ErroApp('Registro de progresso não encontrado.', 404);
    res.json({ id: doc.id, ...doc.data() });
  } catch (err) {
    next(err);
  }
}

export async function criarRegistroProgresso(req: Request, res: Response, next: NextFunction) {
  try {
    const alunoId = String(req.params.alunoId);
    const usuario = req.usuario!;
    if (usuario.perfil === 'ALUNO' && usuario.id !== alunoId) throw new ErroApp('Acesso negado.', 403);

    const { peso, percentualGordura, massaMuscular, cintura, quadril, pescoco, braco, perna, observacoes, registradoEm } = req.body;

    let imc: number | null = null;
    if (peso) {
      const alunoDoc = await db.collection('alunos').doc(alunoId).get();
      if (alunoDoc.exists) {
        const { altura } = alunoDoc.data() as any;
        if (altura) imc = calcularIMC(parseFloat(peso), altura / 100);
      }
    }

    const foto = req.file ? `data:image/jpeg;base64,${req.file.buffer.toString('base64')}` : null;

    const ref = await db.collection('registros_progresso').add({
      alunoId,
      peso: peso ? parseFloat(peso) : null,
      percentualGordura: percentualGordura ? parseFloat(percentualGordura) : null,
      massaMuscular: massaMuscular ? parseFloat(massaMuscular) : null,
      imc,
      cintura: cintura ? parseFloat(cintura) : null,
      quadril: quadril ? parseFloat(quadril) : null,
      pescoco: pescoco ? parseFloat(pescoco) : null,
      braco: braco ? parseFloat(braco) : null,
      perna: perna ? parseFloat(perna) : null,
      foto,
      observacoes: observacoes || null,
      registradoEm: registradoEm || new Date().toISOString(),
    });

    res.status(201).json({ mensagem: 'Progresso registrado com sucesso.', id: ref.id });
  } catch (err) {
    next(err);
  }
}

export async function atualizarRegistroProgresso(req: Request, res: Response, next: NextFunction) {
  try {
    const id = String(req.params.id);
    const { peso, percentualGordura, massaMuscular, cintura, quadril, pescoco, braco, perna, observacoes } = req.body;
    const update: any = {};
    if (peso !== undefined) update.peso = parseFloat(peso);
    if (percentualGordura !== undefined) update.percentualGordura = parseFloat(percentualGordura);
    if (massaMuscular !== undefined) update.massaMuscular = parseFloat(massaMuscular);
    if (cintura !== undefined) update.cintura = parseFloat(cintura);
    if (quadril !== undefined) update.quadril = parseFloat(quadril);
    if (pescoco !== undefined) update.pescoco = parseFloat(pescoco);
    if (braco !== undefined) update.braco = parseFloat(braco);
    if (perna !== undefined) update.perna = parseFloat(perna);
    if (observacoes !== undefined) update.observacoes = observacoes;
    if (req.file) update.foto = `data:image/jpeg;base64,${req.file.buffer.toString('base64')}`;
    await db.collection('registros_progresso').doc(id).update(update);
    res.json({ mensagem: 'Registro de progresso atualizado.' });
  } catch (err) {
    next(err);
  }
}

export async function deletarRegistroProgresso(req: Request, res: Response, next: NextFunction) {
  try {
    const id = String(req.params.id);
    await db.collection('registros_progresso').doc(id).delete();
    res.json({ mensagem: 'Registro de progresso removido com sucesso.' });
  } catch (err) {
    next(err);
  }
}
