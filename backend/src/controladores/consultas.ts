import { Request, Response, NextFunction } from 'express';
import { db } from '../banco/firebase';
import { ErroApp } from '../middlewares/erros';

export async function listarConsultas(req: Request, res: Response, next: NextFunction) {
  try {
    const { alunoId, status, inicio, fim } = req.query;
    const usuario = req.usuario!;

    const snap = await db.collection('consultas').get();
    let consultas = snap.docs.map((d) => ({ id: d.id, ...d.data() })) as any[];

    if (usuario.perfil === 'NUTRICIONISTA') {
      consultas = consultas.filter((c) => c.nutricionistaId === usuario.id);
      if (alunoId) consultas = consultas.filter((c) => c.alunoId === String(alunoId as string));
    } else {
      consultas = consultas.filter((c) => c.alunoId === usuario.id);
    }
    if (status) consultas = consultas.filter((c) => c.status === String(status as string));
    if (inicio && fim) {
      consultas = consultas.filter((c) => c.dataHora >= String(inicio as string) && c.dataHora <= String(fim as string));
    }

    const resultado = await Promise.all(
      consultas.map(async (c) => {
        const alunoDoc = await db.collection('alunos').doc(c.alunoId).get();
        const a = alunoDoc.data() as any;
        return { ...c, aluno: alunoDoc.exists ? { id: alunoDoc.id, nome: a.nome, email: a.email } : null };
      })
    );
    resultado.sort((a, b) => (a.dataHora || '').localeCompare(b.dataHora || ''));
    res.json(resultado);
  } catch (err) {
    next(err);
  }
}

export async function buscarConsulta(req: Request, res: Response, next: NextFunction) {
  try {
    const doc = await db.collection('consultas').doc(String(req.params.id)).get();
    if (!doc.exists) throw new ErroApp('Consulta não encontrada.', 404);
    const c = { id: doc.id, ...doc.data() } as any;
    const alunoDoc = await db.collection('alunos').doc(c.alunoId).get();
    const a = alunoDoc.data() as any;
    res.json({ ...c, aluno: alunoDoc.exists ? { id: alunoDoc.id, nome: a.nome, email: a.email, telefone: a.telefone } : null });
  } catch (err) {
    next(err);
  }
}

export async function criarConsulta(req: Request, res: Response, next: NextFunction) {
  try {
    const nutricionistaId = req.usuario!.id;
    const { alunoId, dataHora, duracao, observacoes } = req.body;
    if (!alunoId || !dataHora) throw new ErroApp('Aluno e data/hora são obrigatórios.', 400);

    const ref = await db.collection('consultas').add({
      nutricionistaId, alunoId,
      dataHora: typeof dataHora === 'string' ? dataHora : new Date(dataHora).toISOString(),
      duracao: duracao ? parseInt(duracao) : 60,
      status: 'AGENDADA',
      observacoes: observacoes || null,
      anotacoesPriv: null,
      criadoEm: new Date().toISOString(),
    });
    res.status(201).json({ mensagem: 'Consulta agendada com sucesso.', id: ref.id });
  } catch (err) {
    next(err);
  }
}

export async function atualizarConsulta(req: Request, res: Response, next: NextFunction) {
  try {
    const id = String(req.params.id);
    const { dataHora, duracao, status, observacoes, anotacoesPriv } = req.body;
    const update: any = {};
    if (dataHora) update.dataHora = typeof dataHora === 'string' ? dataHora : new Date(dataHora).toISOString();
    if (duracao !== undefined) update.duracao = parseInt(duracao);
    if (status) update.status = status;
    if (observacoes !== undefined) update.observacoes = observacoes;
    if (anotacoesPriv !== undefined) update.anotacoesPriv = anotacoesPriv;
    await db.collection('consultas').doc(id).update(update);
    res.json({ mensagem: 'Consulta atualizada com sucesso.' });
  } catch (err) {
    next(err);
  }
}

export async function deletarConsulta(req: Request, res: Response, next: NextFunction) {
  try {
    await db.collection('consultas').doc(String(req.params.id)).delete();
    res.json({ mensagem: 'Consulta removida.' });
  } catch (err) {
    next(err);
  }
}
