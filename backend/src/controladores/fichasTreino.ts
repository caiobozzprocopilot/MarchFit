import { Request, Response, NextFunction } from 'express';
import { db } from '../banco/firebase';
import { ErroApp } from '../middlewares/erros';

export async function listarFichas(req: Request, res: Response, next: NextFunction) {
  try {
    const { alunoId } = req.query;
    const usuario = req.usuario!;
    const filtroAlunoId = usuario.perfil === 'ALUNO' ? usuario.id : alunoId ? String(alunoId) : undefined;

    let query: FirebaseFirestore.Query = db.collection('fichas_treino').where('ativo', '==', true);
    if (filtroAlunoId) query = query.where('alunoId', '==', filtroAlunoId);

    const snap = await query.get();
    const fichas = snap.docs.map((d) => ({ id: d.id, ...d.data() })) as any[];

    const resultado = await Promise.all(
      fichas.map(async (f) => {
        const exSnap = await db.collection('exercicios_ficha').where('fichaId', '==', f.id).get();
        return { ...f, _count: { exercicios: exSnap.size } };
      })
    );
    resultado.sort((a, b) => (a.ordem ?? 0) - (b.ordem ?? 0));
    res.json(resultado);
  } catch (err) {
    next(err);
  }
}

export async function buscarFicha(req: Request, res: Response, next: NextFunction) {
  try {
    const doc = await db.collection('fichas_treino').doc(String(req.params.id)).get();
    if (!doc.exists) throw new ErroApp('Ficha de treino não encontrada.', 404);
    const ficha = { id: doc.id, ...doc.data() } as any;

    const exSnap = await db.collection('exercicios_ficha').where('fichaId', '==', doc.id).orderBy('ordem', 'asc').get();
    const exercicios = await Promise.all(
      exSnap.docs.map(async (ed) => {
        const ex = { id: ed.id, ...ed.data() } as any;
        const exDoc = await db.collection('exercicios').doc(ex.exercicioId).get();
        return { ...ex, exercicio: exDoc.exists ? { id: exDoc.id, ...exDoc.data() } : null };
      })
    );
    res.json({ ...ficha, exercicios });
  } catch (err) {
    next(err);
  }
}

export async function criarFicha(req: Request, res: Response, next: NextFunction) {
  try {
    const { alunoId, nome, descricao, ordem } = req.body;
    if (!alunoId || !nome) throw new ErroApp('Aluno e nome da ficha são obrigatórios.', 400);

    const ref = await db.collection('fichas_treino').add({
      alunoId, nome,
      descricao: descricao || null,
      ordem: ordem ?? 0,
      ativo: true,
      criadoEm: new Date().toISOString(),
    });
    res.status(201).json({ mensagem: 'Ficha de treino criada.', id: ref.id });
  } catch (err) {
    next(err);
  }
}

export async function atualizarFicha(req: Request, res: Response, next: NextFunction) {
  try {
    const id = String(req.params.id);
    const { nome, descricao, ativo, ordem } = req.body;
    const update: any = {};
    if (nome !== undefined) update.nome = nome;
    if (descricao !== undefined) update.descricao = descricao;
    if (ativo !== undefined) update.ativo = ativo;
    if (ordem !== undefined) update.ordem = ordem;
    await db.collection('fichas_treino').doc(id).update(update);
    res.json({ mensagem: 'Ficha atualizada com sucesso.' });
  } catch (err) {
    next(err);
  }
}

export async function deletarFicha(req: Request, res: Response, next: NextFunction) {
  try {
    await db.collection('fichas_treino').doc(String(req.params.id)).update({ ativo: false });
    res.json({ mensagem: 'Ficha desativada com sucesso.' });
  } catch (err) {
    next(err);
  }
}

export async function adicionarExercicioFicha(req: Request, res: Response, next: NextFunction) {
  try {
    const fichaId = String(req.params.fichaId);
    const { exercicioId, series, repeticoes, carga, tempoDescanso, observacoes, ordem } = req.body;
    if (!exercicioId || !series || !repeticoes) throw new ErroApp('Exercício, séries e repetições são obrigatórios.', 400);

    const ref = await db.collection('exercicios_ficha').add({
      fichaId, exercicioId,
      series: parseInt(series),
      repeticoes: String(repeticoes),
      carga: carga ? parseFloat(carga) : null,
      tempoDescanso: tempoDescanso ? parseInt(tempoDescanso) : null,
      observacoes: observacoes || null,
      ordem: ordem ?? 0,
    });
    res.status(201).json({ mensagem: 'Exercício adicionado à ficha.', id: ref.id });
  } catch (err) {
    next(err);
  }
}

export async function atualizarExercicioFicha(req: Request, res: Response, next: NextFunction) {
  try {
    const itemId = String(req.params.itemId);
    const { series, repeticoes, carga, tempoDescanso, observacoes, ordem } = req.body;
    const update: any = {};
    if (series !== undefined) update.series = parseInt(series);
    if (repeticoes !== undefined) update.repeticoes = String(repeticoes);
    if (carga !== undefined) update.carga = parseFloat(carga);
    if (tempoDescanso !== undefined) update.tempoDescanso = parseInt(tempoDescanso);
    if (observacoes !== undefined) update.observacoes = observacoes;
    if (ordem !== undefined) update.ordem = parseInt(ordem);
    await db.collection('exercicios_ficha').doc(itemId).update(update);
    res.json({ mensagem: 'Exercício da ficha atualizado.' });
  } catch (err) {
    next(err);
  }
}

export async function deletarExercicioFicha(req: Request, res: Response, next: NextFunction) {
  try {
    await db.collection('exercicios_ficha').doc(String(req.params.itemId)).delete();
    res.json({ mensagem: 'Exercício removido da ficha.' });
  } catch (err) {
    next(err);
  }
}

export async function reordenarExercicios(req: Request, res: Response, next: NextFunction) {
  try {
    const { ordens } = req.body as { ordens: { id: string; ordem: number }[] };
    await Promise.all(ordens.map((item) => db.collection('exercicios_ficha').doc(item.id).update({ ordem: item.ordem })));
    res.json({ mensagem: 'Ordem dos exercícios atualizada.' });
  } catch (err) {
    next(err);
  }
}
