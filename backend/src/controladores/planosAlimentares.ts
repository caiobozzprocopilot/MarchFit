import { Request, Response, NextFunction } from 'express';
import { db } from '../banco/firebase';
import { ErroApp } from '../middlewares/erros';

export async function listarPlanos(req: Request, res: Response, next: NextFunction) {
  try {
    const { alunoId } = req.query;
    const usuario = req.usuario!;
    const filtroAlunoId = usuario.perfil === 'ALUNO' ? usuario.id : alunoId ? String(alunoId) : undefined;

    let query: FirebaseFirestore.Query = db.collection('planos_alimentares');
    if (filtroAlunoId) query = query.where('alunoId', '==', filtroAlunoId);
    const snap = await query.orderBy('criadoEm', 'desc').get();
    const planos = snap.docs.map((d) => ({ id: d.id, ...d.data() })) as any[];

    const resultado = await Promise.all(
      planos.map(async (p) => {
        const refSnap = await db.collection('refeicoes').where('planoId', '==', p.id).get();
        return { ...p, _count: { refeicoes: refSnap.size } };
      })
    );
    res.json(resultado);
  } catch (err) {
    next(err);
  }
}

export async function buscarPlano(req: Request, res: Response, next: NextFunction) {
  try {
    const doc = await db.collection('planos_alimentares').doc(String(req.params.id)).get();
    if (!doc.exists) throw new ErroApp('Plano alimentar não encontrado.', 404);
    const plano = { id: doc.id, ...doc.data() } as any;

    const refSnap = await db.collection('refeicoes').where('planoId', '==', doc.id).orderBy('ordem', 'asc').get();
    const refeicoes = await Promise.all(
      refSnap.docs.map(async (rd) => {
        const ref = { id: rd.id, ...rd.data() } as any;
        const itensSnap = await db.collection('itens_refeicao').where('refeicaoId', '==', rd.id).get();
        const itens = await Promise.all(
          itensSnap.docs.map(async (iDoc) => {
            const item = { id: iDoc.id, ...iDoc.data() } as any;
            const alimDoc = await db.collection('alimentos').doc(item.alimentoId).get();
            return { ...item, alimento: alimDoc.exists ? { id: alimDoc.id, ...alimDoc.data() } : null };
          })
        );
        return { ...ref, itens };
      })
    );
    res.json({ ...plano, refeicoes });
  } catch (err) {
    next(err);
  }
}

export async function criarPlano(req: Request, res: Response, next: NextFunction) {
  try {
    const { alunoId, nome, descricao, dataFim, metaMacro } = req.body;
    if (!alunoId || !nome) throw new ErroApp('Aluno e nome do plano são obrigatórios.', 400);

    const ref = await db.collection('planos_alimentares').add({
      alunoId, nome,
      descricao: descricao || null,
      ativo: true,
      dataFim: dataFim || null,
      criadoEm: new Date().toISOString(),
      metaMacro: metaMacro ? {
        caloriasAlvo: parseFloat(metaMacro.caloriasAlvo),
        proteinasAlvo: parseFloat(metaMacro.proteinasAlvo),
        carboidratosAlvo: parseFloat(metaMacro.carboidratosAlvo),
        gordurasAlvo: parseFloat(metaMacro.gordurasAlvo),
        fibrasAlvo: metaMacro.fibrasAlvo ? parseFloat(metaMacro.fibrasAlvo) : null,
      } : null,
    });
    res.status(201).json({ mensagem: 'Plano alimentar criado com sucesso.', id: ref.id });
  } catch (err) {
    next(err);
  }
}

export async function atualizarPlano(req: Request, res: Response, next: NextFunction) {
  try {
    const id = String(req.params.id);
    const { nome, descricao, ativo, dataFim, metaMacro } = req.body;
    const update: any = {};
    if (nome !== undefined) update.nome = nome;
    if (descricao !== undefined) update.descricao = descricao;
    if (ativo !== undefined) update.ativo = ativo;
    if (dataFim !== undefined) update.dataFim = dataFim;
    if (metaMacro) {
      update.metaMacro = {
        caloriasAlvo: parseFloat(metaMacro.caloriasAlvo),
        proteinasAlvo: parseFloat(metaMacro.proteinasAlvo),
        carboidratosAlvo: parseFloat(metaMacro.carboidratosAlvo),
        gordurasAlvo: parseFloat(metaMacro.gordurasAlvo),
        fibrasAlvo: metaMacro.fibrasAlvo ? parseFloat(metaMacro.fibrasAlvo) : null,
      };
    }
    await db.collection('planos_alimentares').doc(id).update(update);
    res.json({ mensagem: 'Plano atualizado com sucesso.' });
  } catch (err) {
    next(err);
  }
}

export async function deletarPlano(req: Request, res: Response, next: NextFunction) {
  try {
    await db.collection('planos_alimentares').doc(String(req.params.id)).delete();
    res.json({ mensagem: 'Plano removido com sucesso.' });
  } catch (err) {
    next(err);
  }
}

export async function adicionarRefeicao(req: Request, res: Response, next: NextFunction) {
  try {
    const planoId = String(req.params.planoId);
    const { nome, horario, ordem } = req.body;
    if (!nome) throw new ErroApp('Nome da refeição é obrigatório.', 400);
    const ref = await db.collection('refeicoes').add({ planoId, nome, horario: horario || null, ordem: ordem ?? 0 });
    res.status(201).json({ mensagem: 'Refeição adicionada.', id: ref.id });
  } catch (err) {
    next(err);
  }
}

export async function atualizarRefeicao(req: Request, res: Response, next: NextFunction) {
  try {
    const refeicaoId = String(req.params.refeicaoId);
    const { nome, horario, ordem } = req.body;
    const update: any = {};
    if (nome !== undefined) update.nome = nome;
    if (horario !== undefined) update.horario = horario;
    if (ordem !== undefined) update.ordem = ordem;
    await db.collection('refeicoes').doc(refeicaoId).update(update);
    res.json({ mensagem: 'Refeição atualizada.' });
  } catch (err) {
    next(err);
  }
}

export async function deletarRefeicao(req: Request, res: Response, next: NextFunction) {
  try {
    await db.collection('refeicoes').doc(String(req.params.refeicaoId)).delete();
    res.json({ mensagem: 'Refeição removida.' });
  } catch (err) {
    next(err);
  }
}

export async function adicionarItemRefeicao(req: Request, res: Response, next: NextFunction) {
  try {
    const refeicaoId = String(req.params.refeicaoId);
    const { alimentoId, quantidade, unidade } = req.body;
    if (!alimentoId || !quantidade) throw new ErroApp('Alimento e quantidade são obrigatórios.', 400);
    const ref = await db.collection('itens_refeicao').add({
      refeicaoId, alimentoId,
      quantidade: parseFloat(quantidade),
      unidade: unidade || 'GRAMAS',
    });
    res.status(201).json({ mensagem: 'Item adicionado à refeição.', id: ref.id });
  } catch (err) {
    next(err);
  }
}

export async function atualizarItemRefeicao(req: Request, res: Response, next: NextFunction) {
  try {
    const itemId = String(req.params.itemId);
    const { quantidade, unidade } = req.body;
    const update: any = {};
    if (quantidade !== undefined) update.quantidade = parseFloat(quantidade);
    if (unidade !== undefined) update.unidade = unidade;
    await db.collection('itens_refeicao').doc(itemId).update(update);
    res.json({ mensagem: 'Item atualizado.' });
  } catch (err) {
    next(err);
  }
}

export async function deletarItemRefeicao(req: Request, res: Response, next: NextFunction) {
  try {
    await db.collection('itens_refeicao').doc(String(req.params.itemId)).delete();
    res.json({ mensagem: 'Item removido da refeição.' });
  } catch (err) {
    next(err);
  }
}

export async function calcularTotaisPlano(req: Request, res: Response, next: NextFunction) {
  try {
    const planoId = String(req.params.id);
    const planoDoc = await db.collection('planos_alimentares').doc(planoId).get();
    if (!planoDoc.exists) {
      return res.status(404).json({ mensagem: 'Plano não encontrado.' });
    }

    const refeicoesSnap = await db.collection('refeicoes').where('planoId', '==', planoId).get();
    const refeicaoIds = refeicoesSnap.docs.map((d) => d.id);

    const totais = { calorias: 0, proteinas: 0, carboidratos: 0, gorduras: 0, fibras: 0 };

    for (const refeicaoId of refeicaoIds) {
      const itensSnap = await db.collection('itens_refeicao').where('refeicaoId', '==', refeicaoId).get();
      for (const item of itensSnap.docs) {
        const d = item.data() as any;
        const fator = (d.quantidade || 100) / 100;
        const alimDoc = await db.collection('alimentos').doc(d.alimentoId).get();
        if (alimDoc.exists) {
          const a = alimDoc.data() as any;
          totais.calorias += (a.calorias || 0) * fator;
          totais.proteinas += (a.proteinas || 0) * fator;
          totais.carboidratos += (a.carboidratos || 0) * fator;
          totais.gorduras += (a.gorduras || 0) * fator;
          totais.fibras += (a.fibras || 0) * fator;
        }
      }
    }

    const arredondar = (v: number) => Math.round(v * 10) / 10;
    res.json({
      planoId,
      totais: {
        calorias: arredondar(totais.calorias),
        proteinas: arredondar(totais.proteinas),
        carboidratos: arredondar(totais.carboidratos),
        gorduras: arredondar(totais.gorduras),
        fibras: arredondar(totais.fibras),
      },
    });
  } catch (err) {
    next(err);
  }
}
