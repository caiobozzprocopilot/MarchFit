import { Request, Response, NextFunction } from 'express';
import { db } from '../banco/firebase';
import { ErroApp } from '../middlewares/erros';

export async function perfilNutricionista(req: Request, res: Response, next: NextFunction) {
  try {
    const doc = await db.collection('nutricionistas').doc(req.usuario!.id).get();
    if (!doc.exists) throw new ErroApp('Nutricionista não encontrado.', 404);
    const { senhaHash, ...dados } = doc.data() as any;
    res.json({ id: doc.id, ...dados });
  } catch (err) {
    next(err);
  }
}

export async function atualizarNutricionista(req: Request, res: Response, next: NextFunction) {
  try {
    const { nome, telefone, crn } = req.body;
    const update: any = {};
    if (nome !== undefined) update.nome = nome;
    if (telefone !== undefined) update.telefone = telefone;
    if (crn !== undefined) update.crn = crn;
    await db.collection('nutricionistas').doc(req.usuario!.id).update(update);
    res.json({ mensagem: 'Perfil atualizado com sucesso.' });
  } catch (err) {
    next(err);
  }
}

export async function fotoPerfilNutricionista(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.file) throw new ErroApp('Nenhuma imagem enviada.', 400);
    const base64 = `data:image/jpeg;base64,${req.file.buffer.toString('base64')}`;
    await db.collection('nutricionistas').doc(req.usuario!.id).update({ fotoPerfil: base64 });
    res.json({ mensagem: 'Foto de perfil atualizada.' });
  } catch (err) {
    next(err);
  }
}

export async function dashboardAdmin(req: Request, res: Response, next: NextFunction) {
  try {
    const nutricionistaId = req.usuario!.id;
    const hoje = new Date();
    const inicioDia = new Date(hoje); inicioDia.setHours(0, 0, 0, 0);
    const fimDia   = new Date(hoje); fimDia.setHours(23, 59, 59, 999);

    const [alunosSnap, consultasSnap, receitasSnap, proxConsultasSnap, progSnap] = await Promise.all([
      db.collection('alunos').where('nutricionistaId', '==', nutricionistaId).get(),
      db.collection('consultas')
        .where('nutricionistaId', '==', nutricionistaId)
        .where('dataHora', '>=', inicioDia.toISOString())
        .where('dataHora', '<=', fimDia.toISOString())
        .get(),
      db.collection('receitas').where('nutricionistaId', '==', nutricionistaId).get(),
      db.collection('consultas')
        .where('nutricionistaId', '==', nutricionistaId)
        .where('status', '==', 'AGENDADA')
        .where('dataHora', '>=', new Date().toISOString())
        .orderBy('dataHora', 'asc')
        .limit(5)
        .get(),
      db.collection('registros_progresso').orderBy('registradoEm', 'desc').limit(20).get(),
    ]);

    const alunos = alunosSnap.docs.map((d) => ({ id: d.id, ...d.data() })) as any[];
    const alunosIds = new Set(alunos.map((a) => a.id));
    const alunosAtivos = alunos.filter((a) => a.ativo).length;

    const progressoFiltrado = progSnap.docs
      .map((d) => ({ id: d.id, ...d.data() })) as any[];
    const progresso5 = progressoFiltrado.filter((p) => alunosIds.has(p.alunoId)).slice(0, 5);

    const proximasConsultas = await Promise.all(
      proxConsultasSnap.docs.map(async (d) => {
        const c = { id: d.id, ...d.data() } as any;
        const alunoDoc = await db.collection('alunos').doc(c.alunoId).get();
        return {
          ...c,
          aluno: alunoDoc.exists ? { id: alunoDoc.id, nome: (alunoDoc.data() as any).nome } : null,
        };
      })
    );

    res.json({
      totais: { totalAlunos: alunos.length, alunosAtivos, consultasHoje: consultasSnap.size, totalReceitas: receitasSnap.size },
      proximasConsultas,
      ultimosProgressos: progresso5.map((p) => ({ ...p, foto: null })),
    });
  } catch (err) {
    next(err);
  }
}
