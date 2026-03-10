import { Request, Response, NextFunction } from 'express';
import { db } from '../banco/firebase';
import { ErroApp } from '../middlewares/erros';

export async function listarExercicios(req: Request, res: Response, next: NextFunction) {
  try {
    const { busca, grupo, nivel, equipamento } = req.query;
    const snap = await db.collection('exercicios').get();
    let exercicios = snap.docs.map((d) => ({ id: d.id, ...d.data() })) as any[];

    if (busca) exercicios = exercicios.filter((e) => e.nome?.toLowerCase().includes(String(busca as string).toLowerCase()));
    if (grupo) exercicios = exercicios.filter((e) => e.grupoMuscular?.toLowerCase().includes(String(grupo as string).toLowerCase()));
    if (nivel) exercicios = exercicios.filter((e) => e.nivel === String(nivel as string));
    if (equipamento) exercicios = exercicios.filter((e) => e.equipamento?.toLowerCase().includes(String(equipamento as string).toLowerCase()));

    exercicios.sort((a, b) => (a.grupoMuscular || '').localeCompare(b.grupoMuscular || '') || (a.nome || '').localeCompare(b.nome || ''));
    res.json(exercicios);
  } catch (err) {
    next(err);
  }
}

export async function buscarExercicio(req: Request, res: Response, next: NextFunction) {
  try {
    const doc = await db.collection('exercicios').doc(String(req.params.id)).get();
    if (!doc.exists) throw new ErroApp('Exercício não encontrado.', 404);
    res.json({ id: doc.id, ...doc.data() });
  } catch (err) {
    next(err);
  }
}

export async function criarExercicio(req: Request, res: Response, next: NextFunction) {
  try {
    const { nome, grupoMuscular, grupoSecundario, equipamento, descricao, instrucoes, nivel, videoUrl } = req.body;
    if (!nome || !grupoMuscular) throw new ErroApp('Nome e grupo muscular são obrigatórios.', 400);

    const ref = await db.collection('exercicios').add({
      nome, grupoMuscular,
      grupoSecundario: grupoSecundario || null,
      equipamento: equipamento || null,
      descricao: descricao || null,
      instrucoes: instrucoes || null,
      nivel: nivel || 'INICIANTE',
      videoUrl: videoUrl || null,
      personalizado: true,
    });

    res.status(201).json({ mensagem: 'Exercício criado com sucesso.', id: ref.id });
  } catch (err) {
    next(err);
  }
}

export async function atualizarExercicio(req: Request, res: Response, next: NextFunction) {
  try {
    const id = String(req.params.id);
    const { nome, grupoMuscular, grupoSecundario, equipamento, descricao, instrucoes, nivel, videoUrl } = req.body;
    const update: any = {};
    if (nome !== undefined) update.nome = nome;
    if (grupoMuscular !== undefined) update.grupoMuscular = grupoMuscular;
    if (grupoSecundario !== undefined) update.grupoSecundario = grupoSecundario;
    if (equipamento !== undefined) update.equipamento = equipamento;
    if (descricao !== undefined) update.descricao = descricao;
    if (instrucoes !== undefined) update.instrucoes = instrucoes;
    if (nivel !== undefined) update.nivel = nivel;
    if (videoUrl !== undefined) update.videoUrl = videoUrl;
    await db.collection('exercicios').doc(id).update(update);
    res.json({ mensagem: 'Exercício atualizado com sucesso.' });
  } catch (err) {
    next(err);
  }
}

export async function deletarExercicio(req: Request, res: Response, next: NextFunction) {
  try {
    await db.collection('exercicios').doc(String(req.params.id)).delete();
    res.json({ mensagem: 'Exercício removido com sucesso.' });
  } catch (err) {
    next(err);
  }
}
