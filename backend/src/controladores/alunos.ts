import { Request, Response, NextFunction } from 'express';
import bcrypt from 'bcryptjs';
import { db } from '../banco/firebase';
import { ErroApp } from '../middlewares/erros';

export async function listarAlunos(req: Request, res: Response, next: NextFunction) {
  try {
    const { busca, ativo } = req.query;
    const nutricionistaId = req.usuario!.id;

    let query: FirebaseFirestore.Query = db.collection('alunos').where('nutricionistaId', '==', nutricionistaId);
    if (ativo !== undefined) query = query.where('ativo', '==', ativo === 'true');

    const snap = await query.orderBy('nome', 'asc').get();
    let alunos = snap.docs.map((d) => ({ id: d.id, ...d.data() })) as any[];

    if (busca) {
      const b = String(busca).toLowerCase();
      alunos = alunos.filter((a) => a.nome?.toLowerCase().includes(b) || a.email?.toLowerCase().includes(b));
    }

    const resultado = await Promise.all(
      alunos.map(async (a) => {
        const { senhaHash, ...resto } = a;
        const [planos, fichas, progressos, consultas] = await Promise.all([
          db.collection('planos_alimentares').where('alunoId', '==', a.id).get(),
          db.collection('fichas_treino').where('alunoId', '==', a.id).get(),
          db.collection('registros_progresso').where('alunoId', '==', a.id).get(),
          db.collection('consultas').where('alunoId', '==', a.id).get(),
        ]);
        return {
          ...resto,
          _count: { planosAlimentares: planos.size, fichasTreino: fichas.size, registrosProgresso: progressos.size, consultas: consultas.size },
        };
      })
    );

    res.json(resultado);
  } catch (err) {
    next(err);
  }
}

export async function buscarAluno(req: Request, res: Response, next: NextFunction) {
  try {
    const id = String(req.params.id);
    const usuario = req.usuario!;
    if (usuario.perfil === 'ALUNO' && usuario.id !== id) throw new ErroApp('Acesso negado.', 403);

    const doc = await db.collection('alunos').doc(id).get();
    if (!doc.exists) throw new ErroApp('Aluno não encontrado.', 404);
    const { senhaHash, ...aluno } = { id: doc.id, ...doc.data() } as any;

    const [planosSnap, fichasSnap, consultasSnap, progressosSnap] = await Promise.all([
      db.collection('planos_alimentares').where('alunoId', '==', id).where('ativo', '==', true).get(),
      db.collection('fichas_treino').where('alunoId', '==', id).where('ativo', '==', true).get(),
      db.collection('consultas').where('alunoId', '==', id).orderBy('dataHora', 'desc').limit(5).get(),
      db.collection('registros_progresso').where('alunoId', '==', id).orderBy('registradoEm', 'desc').limit(10).get(),
    ]);

    const planosAlimentares = await Promise.all(
      planosSnap.docs.map(async (pd) => {
        const plano = { id: pd.id, ...pd.data() } as any;
        const refSnap = await db.collection('refeicoes').where('planoId', '==', pd.id).orderBy('ordem', 'asc').get();
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
        return { ...plano, refeicoes };
      })
    );

    const fichasTreino = await Promise.all(
      fichasSnap.docs.map(async (fd) => {
        const ficha = { id: fd.id, ...fd.data() } as any;
        const exSnap = await db.collection('exercicios_ficha').where('fichaId', '==', fd.id).orderBy('ordem', 'asc').get();
        const exercicios = await Promise.all(
          exSnap.docs.map(async (ed) => {
            const ex = { id: ed.id, ...ed.data() } as any;
            const exDoc = await db.collection('exercicios').doc(ex.exercicioId).get();
            return { ...ex, exercicio: exDoc.exists ? { id: exDoc.id, ...exDoc.data() } : null };
          })
        );
        return { ...ficha, exercicios };
      })
    );

    res.json({
      ...aluno,
      planosAlimentares,
      fichasTreino,
      consultas: consultasSnap.docs.map((d) => ({ id: d.id, ...d.data() })),
      registrosProgresso: progressosSnap.docs.map((d) => {
        const { foto, ...r } = { id: d.id, ...d.data() } as any;
        return { ...r, foto: null };
      }),
    });
  } catch (err) {
    next(err);
  }
}

export async function criarAluno(req: Request, res: Response, next: NextFunction) {
  try {
    const nutricionistaId = req.usuario!.id;
    const { nome, email, senha, telefone, dataNascimento, sexo, altura, pesoInicial, objetivos, observacoes } = req.body;
    if (!nome || !email || !senha) throw new ErroApp('Nome, email e senha são obrigatórios.', 400);

    const snap = await db.collection('alunos').where('email', '==', email).limit(1).get();
    if (!snap.empty) throw new ErroApp('Email já cadastrado.', 409);

    const senhaHash = await bcrypt.hash(senha, 12);
    const ref = await db.collection('alunos').add({
      nutricionistaId, nome, email, senhaHash,
      telefone: telefone || null,
      dataNascimento: dataNascimento || null,
      sexo: sexo || null,
      altura: altura ? parseFloat(altura) : null,
      pesoInicial: pesoInicial ? parseFloat(pesoInicial) : null,
      objetivos: objetivos || null,
      observacoes: observacoes || null,
      fotoPerfil: null,
      ativo: true,
      criadoEm: new Date().toISOString(),
    });

    res.status(201).json({ mensagem: 'Aluno cadastrado com sucesso.', id: ref.id });
  } catch (err) {
    next(err);
  }
}

export async function atualizarAluno(req: Request, res: Response, next: NextFunction) {
  try {
    const id = String(req.params.id);
    const { nome, telefone, dataNascimento, sexo, altura, pesoInicial, objetivos, observacoes, ativo } = req.body;
    const update: any = {};
    if (nome !== undefined) update.nome = nome;
    if (telefone !== undefined) update.telefone = telefone;
    if (dataNascimento !== undefined) update.dataNascimento = dataNascimento;
    if (sexo !== undefined) update.sexo = sexo;
    if (altura !== undefined) update.altura = parseFloat(altura);
    if (pesoInicial !== undefined) update.pesoInicial = parseFloat(pesoInicial);
    if (objetivos !== undefined) update.objetivos = objetivos;
    if (observacoes !== undefined) update.observacoes = observacoes;
    if (ativo !== undefined) update.ativo = ativo;
    await db.collection('alunos').doc(id).update(update);
    res.json({ mensagem: 'Aluno atualizado com sucesso.', id });
  } catch (err) {
    next(err);
  }
}

export async function deletarAluno(req: Request, res: Response, next: NextFunction) {
  try {
    await db.collection('alunos').doc(String(req.params.id)).update({ ativo: false });
    res.json({ mensagem: 'Aluno desativado com sucesso.' });
  } catch (err) {
    next(err);
  }
}

export async function fotoPerfil(req: Request, res: Response, next: NextFunction) {
  try {
    const id = String(req.params.id);
    if (!req.file) throw new ErroApp('Nenhuma imagem enviada.', 400);
    const base64 = `data:image/jpeg;base64,${req.file.buffer.toString('base64')}`;
    await db.collection('alunos').doc(id).update({ fotoPerfil: base64 });
    res.json({ mensagem: 'Foto de perfil atualizada.' });
  } catch (err) {
    next(err);
  }
}
