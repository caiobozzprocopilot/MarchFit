import { Request, Response, NextFunction } from 'express';
import { db } from '../banco/firebase';
import { ErroApp } from '../middlewares/erros';
import { extrairIdYoutube } from '../utils/helpers';

export async function listarReceitas(req: Request, res: Response, next: NextFunction) {
  try {
    const { busca, alunoId } = req.query;
    const usuario = req.usuario!;

    const snap = await db.collection('receitas').get();
    let receitas = snap.docs.map((d) => ({ id: d.id, ...d.data() })) as any[];

    if (usuario.perfil === 'ALUNO') {
      receitas = receitas.filter((r) => (r.alunosIds || []).includes(usuario.id));
    } else {
      receitas = receitas.filter((r) => r.nutricionistaId === usuario.id);
      if (busca) receitas = receitas.filter((r) => r.nome?.toLowerCase().includes(String(busca as string).toLowerCase()));
      if (alunoId) receitas = receitas.filter((r) => (r.alunosIds || []).includes(String(alunoId as string)));
    }
    receitas.sort((a, b) => (a.nome || '').localeCompare(b.nome || ''));
    res.json(receitas);
  } catch (err) {
    next(err);
  }
}

export async function buscarReceita(req: Request, res: Response, next: NextFunction) {
  try {
    const doc = await db.collection('receitas').doc(String(req.params.id)).get();
    if (!doc.exists) throw new ErroApp('Receita não encontrada.', 404);
    const receita = { id: doc.id, ...doc.data() } as any;

    const alunosIds: string[] = receita.alunosIds || [];
    const alunos = (await Promise.all(
      alunosIds.map(async (aid) => {
        const a = await db.collection('alunos').doc(aid).get();
        return a.exists ? { id: a.id, nome: (a.data() as any).nome } : null;
      })
    )).filter(Boolean);

    res.json({ ...receita, alunos });
  } catch (err) {
    next(err);
  }
}

export async function criarReceita(req: Request, res: Response, next: NextFunction) {
  try {
    const nutricionistaId = req.usuario!.id;
    const { nome, descricao, youtubeUrl, ingredientes, modoPreparo, tempoPreparo, porcoes } = req.body;
    if (!nome || !youtubeUrl) throw new ErroApp('Nome e URL do YouTube são obrigatórios.', 400);

    const youtubeVideoId = extrairIdYoutube(youtubeUrl);
    if (!youtubeVideoId) throw new ErroApp('URL do YouTube inválida.', 400);

    const ref = await db.collection('receitas').add({
      nutricionistaId, nome,
      descricao: descricao || null,
      youtubeUrl, youtubeVideoId,
      ingredientes: ingredientes || null,
      modoPreparo: modoPreparo || null,
      tempoPreparo: tempoPreparo ? parseInt(tempoPreparo) : null,
      porcoes: porcoes ? parseInt(porcoes) : null,
      alunosIds: [],
      criadoEm: new Date().toISOString(),
    });
    res.status(201).json({ mensagem: 'Receita criada com sucesso.', id: ref.id });
  } catch (err) {
    next(err);
  }
}

export async function atualizarReceita(req: Request, res: Response, next: NextFunction) {
  try {
    const id = String(req.params.id);
    const { nome, descricao, youtubeUrl, ingredientes, modoPreparo, tempoPreparo, porcoes } = req.body;
    const update: any = {};
    if (nome !== undefined) update.nome = nome;
    if (descricao !== undefined) update.descricao = descricao;
    if (ingredientes !== undefined) update.ingredientes = ingredientes;
    if (modoPreparo !== undefined) update.modoPreparo = modoPreparo;
    if (tempoPreparo !== undefined) update.tempoPreparo = parseInt(tempoPreparo);
    if (porcoes !== undefined) update.porcoes = parseInt(porcoes);
    if (youtubeUrl) {
      const youtubeVideoId = extrairIdYoutube(youtubeUrl);
      if (!youtubeVideoId) throw new ErroApp('URL do YouTube inválida.', 400);
      update.youtubeUrl = youtubeUrl;
      update.youtubeVideoId = youtubeVideoId;
    }
    await db.collection('receitas').doc(id).update(update);
    res.json({ mensagem: 'Receita atualizada com sucesso.' });
  } catch (err) {
    next(err);
  }
}

export async function deletarReceita(req: Request, res: Response, next: NextFunction) {
  try {
    await db.collection('receitas').doc(String(req.params.id)).delete();
    res.json({ mensagem: 'Receita removida com sucesso.' });
  } catch (err) {
    next(err);
  }
}

export async function atribuirReceitaAluno(req: Request, res: Response, next: NextFunction) {
  try {
    const id = String(req.params.id);
    const alunoId = String(req.params.alunoId);
    const doc = await db.collection('receitas').doc(id).get();
    if (!doc.exists) throw new ErroApp('Receita não encontrada.', 404);
    const alunosIds: string[] = (doc.data() as any).alunosIds || [];
    if (!alunosIds.includes(alunoId)) {
      await db.collection('receitas').doc(id).update({ alunosIds: [...alunosIds, alunoId] });
    }
    res.json({ mensagem: 'Receita atribuída ao aluno.' });
  } catch (err) {
    next(err);
  }
}

export async function removerReceitaAluno(req: Request, res: Response, next: NextFunction) {
  try {
    const id = String(req.params.id);
    const alunoId = String(req.params.alunoId);
    const doc = await db.collection('receitas').doc(id).get();
    if (!doc.exists) throw new ErroApp('Receita não encontrada.', 404);
    const alunosIds: string[] = ((doc.data() as any).alunosIds || []).filter((a: string) => a !== alunoId);
    await db.collection('receitas').doc(id).update({ alunosIds });
    res.json({ mensagem: 'Receita removida do aluno.' });
  } catch (err) {
    next(err);
  }
}
