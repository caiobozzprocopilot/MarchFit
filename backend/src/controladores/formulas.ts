import { Request, Response, NextFunction } from 'express';
import { db } from '../banco/firebase';
import { ErroApp } from '../middlewares/erros';

export async function listarFormulas(req: Request, res: Response, next: NextFunction) {
  try {
    const nutricionistaId = req.usuario!.id;
    const snap = await db.collection('formulas_calculo')
      .where('nutricionistaId', '==', nutricionistaId)
      .orderBy('nome', 'asc')
      .get();
    res.json(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
  } catch (err) {
    next(err);
  }
}

export async function buscarFormula(req: Request, res: Response, next: NextFunction) {
  try {
    const doc = await db.collection('formulas_calculo').doc(String(req.params.id)).get();
    if (!doc.exists) throw new ErroApp('Fórmula não encontrada.', 404);
    res.json({ id: doc.id, ...doc.data() });
  } catch (err) {
    next(err);
  }
}

export async function criarFormula(req: Request, res: Response, next: NextFunction) {
  try {
    const nutricionistaId = req.usuario!.id;
    const { nome, descricao, formula, variaveis } = req.body;
    if (!nome || !formula) throw new ErroApp('Nome e fórmula são obrigatórios.', 400);

    const ref = await db.collection('formulas_calculo').add({
      nutricionistaId, nome,
      descricao: descricao || null,
      formula,
      variaveis: typeof variaveis === 'string' ? variaveis : JSON.stringify(variaveis || []),
      criadoEm: new Date().toISOString(),
    });
    res.status(201).json({ mensagem: 'Fórmula criada com sucesso.', id: ref.id });
  } catch (err) {
    next(err);
  }
}

export async function atualizarFormula(req: Request, res: Response, next: NextFunction) {
  try {
    const id = String(req.params.id);
    const { nome, descricao, formula, variaveis } = req.body;
    const update: any = {};
    if (nome !== undefined) update.nome = nome;
    if (descricao !== undefined) update.descricao = descricao;
    if (formula !== undefined) update.formula = formula;
    if (variaveis !== undefined) update.variaveis = typeof variaveis === 'string' ? variaveis : JSON.stringify(variaveis);
    await db.collection('formulas_calculo').doc(id).update(update);
    res.json({ mensagem: 'Fórmula atualizada com sucesso.' });
  } catch (err) {
    next(err);
  }
}

export async function deletarFormula(req: Request, res: Response, next: NextFunction) {
  try {
    await db.collection('formulas_calculo').doc(String(req.params.id)).delete();
    res.json({ mensagem: 'Fórmula removida com sucesso.' });
  } catch (err) {
    next(err);
  }
}
