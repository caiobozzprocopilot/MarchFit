import {
  collection, doc, getDoc, getDocs, addDoc, updateDoc,
  deleteDoc, query, where, setDoc, deleteField,
} from 'firebase/firestore';
import { signInWithEmailAndPassword, signOut as fbSignOut, createUserWithEmailAndPassword, signInWithPopup, sendPasswordResetEmail } from 'firebase/auth';
import { auth, db, googleProvider, authSecundario } from '../lib/firebase';

// helpers
const snap2arr = (snap: any) => snap.docs.map((d: any) => ({ id: d.id, ...d.data() }));
const snap2one = (d: any) => (d.exists() ? { id: d.id, ...d.data() } : null);
const ok = (data: any) => ({ data });
const ts = () => new Date().toISOString();

/** Redimensiona e comprime uma imagem para no máximo maxPx no lado maior, retorna base64 JPEG */
const compressImage = (file: File, maxPx = 900, quality = 0.75): Promise<string> =>
  new Promise((res, rej) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(url);
      const scale = Math.min(1, maxPx / Math.max(img.width, img.height));
      const w = Math.round(img.width * scale);
      const h = Math.round(img.height * scale);
      const canvas = document.createElement('canvas');
      canvas.width = w; canvas.height = h;
      canvas.getContext('2d')!.drawImage(img, 0, 0, w, h);
      res(canvas.toDataURL('image/jpeg', quality));
    };
    img.onerror = rej;
    img.src = url;
  });

/** Converte File para base64 (usado para fotos de perfil pequenas) */
const file2base64 = (file: File): Promise<string> =>
  new Promise((res, rej) => { const r = new FileReader(); r.onload = () => res(r.result as string); r.onerror = rej; r.readAsDataURL(file); });
const getNutriId = async () => {
  const u = auth.currentUser;
  if (!u) throw new Error('Não autenticado.');
  const snap = await getDocs(query(collection(db, 'nutricionistas'), where('email', '==', u.email)));
  return snap.empty ? null : snap.docs[0].id;
};

const firebaseErrMsg = (code: string, raw?: any): string => {
  console.error('[Firebase] error code:', code, raw);
  const map: Record<string, string> = {
    'auth/invalid-credential': 'Email ou senha incorretos.',
    'auth/user-not-found': 'Usuário não encontrado.',
    'auth/wrong-password': 'Senha incorreta.',
    'auth/too-many-requests': 'Muitas tentativas. Tente novamente mais tarde.',
    'auth/user-disabled': 'Conta desativada.',
    'auth/invalid-email': 'Email inválido.',
    'auth/operation-not-allowed': 'Login com email/senha não está habilitado no Firebase.',
    'auth/configuration-not-found': 'Configuração de autenticação não encontrada. Habilite Email/Password no Firebase Console.',
    'permission-denied': 'Sem permissão para acessar os dados. Configure as regras do Firestore.',
    'firestore/permission-denied': 'Sem permissão para acessar os dados. Configure as regras do Firestore.',
  };
  return map[code] ?? `Erro (${code || 'desconhecido'}). Verifique os dados e tente novamente.`;
};

// ─── Auth ────────────────────────────────────────────────────────
export const autenticacaoServico = {
  loginNutricionista: async (email: string, senha: string) => {
    try {
      const cred = await signInWithEmailAndPassword(auth, email, senha);
      const token = await cred.user.getIdToken();
      const snap = await getDocs(query(collection(db, 'nutricionistas'), where('email', '==', email)));
      if (snap.empty) throw { response: { data: { mensagem: 'Nutricionista não encontrado no sistema.' } } };
      const nutri = snap.docs[0].data() as any;
      return ok({ token, usuario: { id: snap.docs[0].id, nome: nutri.nome, email: nutri.email, perfil: 'NUTRICIONISTA', crn: nutri.crn } });
    } catch (e: any) {
      if (e?.response) throw e;
      throw { response: { data: { mensagem: firebaseErrMsg(e?.code ?? '', e) } } };
    }
  },
  loginAluno: async (email: string, senha: string) => {
    try {
      const cred = await signInWithEmailAndPassword(auth, email, senha);
      const token = await cred.user.getIdToken();
      const snap = await getDocs(query(collection(db, 'alunos'), where('email', '==', email)));
      if (snap.empty) throw { response: { data: { mensagem: 'Aluno não encontrado no sistema.' } } };
      const aluno = snap.docs[0].data() as any;
      if (aluno.ativo === false) throw { response: { data: { mensagem: 'Seu acesso foi bloqueado. Entre em contato com seu nutricionista.' } } };
      return ok({ token, usuario: { id: snap.docs[0].id, nome: aluno.nome, email: aluno.email, perfil: 'PACIENTE' } });
    } catch (e: any) {
      if (e?.response) throw e;
      throw { response: { data: { mensagem: firebaseErrMsg(e?.code ?? '', e) } } };
    }
  },
  registrarNutricionista: async (dados: any) => {
    const cred = await createUserWithEmailAndPassword(auth, dados.email, dados.senha);
    const id = cred.user.uid;
    await setDoc(doc(db, 'nutricionistas', id), { nome: dados.nome, email: dados.email, crn: dados.crn || '', telefone: dados.telefone || '', ativo: true, criadoEm: ts() });
    const token = await cred.user.getIdToken();
    return ok({ token, usuario: { id, nome: dados.nome, email: dados.email, perfil: 'NUTRICIONISTA' } });
  },
  registrarAluno: async (dados: { nome: string; email: string; senha: string }) => {
    try {
      const cred = await createUserWithEmailAndPassword(auth, dados.email, dados.senha);
      const id = cred.user.uid;
      await setDoc(doc(db, 'alunos', id), { nome: dados.nome, email: dados.email, ativo: true, criadoEm: ts() });
      const token = await cred.user.getIdToken();
      return ok({ token, usuario: { id, nome: dados.nome, email: dados.email, perfil: 'PACIENTE' } });
    } catch (e: any) {
      throw { response: { data: { mensagem: firebaseErrMsg(e?.code ?? '', e) } } };
    }
  },
  loginGoogle: async () => {
    try {
      await signInWithPopup(auth, googleProvider);
      // onAuthStateChanged em autenticacao.tsx faz o lookup no Firestore e define o estado
    } catch (e: any) {
      if (e?.code === 'auth/popup-closed-by-user' || e?.code === 'auth/cancelled-popup-request') return;
      throw { response: { data: { mensagem: firebaseErrMsg(e?.code ?? '', e) } } };
    }
  },

  processGoogleRedirect: async () => null,

  vincularGoogle: async () => {
    // Substituído por redirect — não usado ativamente
    return ok({ mensagem: '' });
  },

  esqueceuSenha: async (email: string) => {
    try {
      await sendPasswordResetEmail(auth, email);
      return ok({ mensagem: 'Email de redefinição enviado.' });
    } catch (e: any) {
      throw { response: { data: { mensagem: firebaseErrMsg(e?.code ?? '', e) } } };
    }
  },
};

// ─── Nutricionista ───────────────────────────────────────────────
export const nutricionistaServico = {
  perfil: async () => {
    const u = auth.currentUser; if (!u) throw new Error('Não autenticado.');
    const snap = await getDocs(query(collection(db, 'nutricionistas'), where('email', '==', u.email)));
    return ok(snap.empty ? null : { id: snap.docs[0].id, ...snap.docs[0].data() });
  },
  atualizar: async (dados: any) => {
    const id = await getNutriId(); if (!id) throw new Error('Perfil não encontrado.');
    await updateDoc(doc(db, 'nutricionistas', id), dados);
    return ok({ id, ...dados });
  },
  dashboard: async () => {
    const nutriId = await getNutriId();
    const [alunosSnap, consultasSnap, receitasSnap, progressoSnap] = await Promise.all([
      getDocs(query(collection(db, 'alunos'), where('nutricionistaId', '==', nutriId))),
      getDocs(query(collection(db, 'consultas'), where('nutricionistaId', '==', nutriId))),
      getDocs(query(collection(db, 'receitas'), where('nutricionistaId', '==', nutriId))),
      getDocs(collection(db, 'registros_progresso')),
    ]);
    const hoje = new Date().toISOString().slice(0, 10);
    const alunosAtivos = alunosSnap.docs.filter((d) => d.data().ativo !== false);
    const consultasHoje = consultasSnap.docs.filter((d) => (d.data().dataHora || '').slice(0, 10) === hoje).length;
    const activoIds = new Set(alunosAtivos.map((a) => a.id));
    const alunosMap = new Map(alunosSnap.docs.map((d) => [d.id, { id: d.id, nome: (d.data() as any).nome }]));
    const proximasConsultas = consultasSnap.docs
      .filter((d) => {
        const data = d.data();
        const statusOk = !data.status || data.status === 'AGENDADA';
        return statusOk && (data.dataHora || '').slice(0, 10) >= hoje;
      })
      .sort((a, b) => (a.data().dataHora || '').localeCompare(b.data().dataHora || ''))
      .slice(0, 5)
      .map((d) => {
        const data = d.data() as any;
        return { id: d.id, ...data, aluno: alunosMap.get(data.alunoId) ?? null };
      });
    return ok({
      totalAlunos: alunosSnap.size,
      alunosAtivos: alunosAtivos.length,
      consultasHoje,
      totalReceitas: receitasSnap.size,
      proximasConsultas,
      ultimosProgressos: progressoSnap.docs.filter((d) => activoIds.has(d.data().alunoId)).slice(0, 5).map((d) => ({ id: d.id, ...d.data() })),
    });
  },
  atualizarFoto: async (formData: FormData) => {
    const id = await getNutriId(); if (!id) throw new Error('Não autenticado.');
    const file = formData.get('foto') as File;
    const base64 = await file2base64(file);
    await updateDoc(doc(db, 'nutricionistas', id), { fotoPerfil: base64 });
    return ok({ fotoPerfil: base64 });
  },
  uploadFoto: async (formData: FormData) => nutricionistaServico.atualizarFoto(formData),
};

// ─── Alunos ──────────────────────────────────────────────────────
export const alunosServico = {
  listar: async (params?: any) => {
    const nutriId = await getNutriId();
    const snap = await getDocs(query(collection(db, 'alunos'), where('nutricionistaId', '==', nutriId)));
    let lista = snap2arr(snap);
    if (params?.busca) lista = lista.filter((a: any) => a.nome?.toLowerCase().includes(params.busca.toLowerCase()) || a.email?.toLowerCase().includes(params.busca.toLowerCase()));
    return ok(lista);
  },
  buscar: async (id: string) => ok(snap2one(await getDoc(doc(db, 'alunos', id)))),
  criar: async (dados: any) => {
    const nutriId = await getNutriId();
    let id: string;
    try {
      const c = await createUserWithEmailAndPassword(authSecundario, dados.email, dados.senha || 'nutri@123');
      id = c.user.uid;
      await fbSignOut(authSecundario); // desconecta da instância secundária imediatamente
    } catch (e: any) {
      if (e?.code === 'auth/email-already-in-use') {
        // user already has a Firebase Auth account — find or use existing
        const existing = await getDocs(query(collection(db, 'alunos'), where('email', '==', dados.email)));
        if (!existing.empty) throw { response: { data: { mensagem: 'J\u00e1 existe um aluno cadastrado com este email.' } } };
        id = `aluno-${Date.now()}`;
      } else {
        throw { response: { data: { mensagem: 'Erro ao criar acesso: ' + firebaseErrMsg(e?.code ?? '', e) } } };
      }
    }
    const { senha, ...rest } = dados;
    await setDoc(doc(db, 'alunos', id), { ...rest, nutricionistaId: nutriId, ativo: true, criadoEm: ts() });
    return ok({ id, ...rest, nutricionistaId: nutriId });
  },
  atualizar: async (id: string, dados: any) => {
    const { senha, ...rest } = dados;
    await updateDoc(doc(db, 'alunos', id), rest);
    return ok({ id, ...rest });
  },
  toggleAtivo: async (id: string, ativo: boolean) => {
    await updateDoc(doc(db, 'alunos', id), { ativo });
    return ok({ mensagem: ativo ? 'Acesso liberado.' : 'Acesso bloqueado.' });
  },
  remover: async (id: string) => { await deleteDoc(doc(db, 'alunos', id)); return ok({ mensagem: 'Paciente removido.' }); },
  deletar: async (id: string) => { await updateDoc(doc(db, 'alunos', id), { ativo: false }); return ok({ mensagem: 'Aluno desativado.' }); },
  atualizarFoto: async (id: string, formData: FormData) => {
    const file = formData.get('foto') as File;
    const base64 = await file2base64(file);
    await updateDoc(doc(db, 'alunos', id), { fotoPerfil: base64 });
    return ok({ fotoPerfil: base64 });
  },
};

// ─── Alimentos ───────────────────────────────────────────────────
export const alimentosServico = {
  listar: async (params?: any) => {
    const snap = await getDocs(collection(db, 'alimentos'));
    let lista = snap2arr(snap);
    if (params?.busca) lista = lista.filter((a: any) => a.nome?.toLowerCase().includes(String(params.busca).toLowerCase()));
    if (params?.categoria) lista = lista.filter((a: any) => a.categoria === params.categoria);
    return ok(lista);
  },
  buscar: async (id: string) => ok(snap2one(await getDoc(doc(db, 'alimentos', id)))),
  criar: async (dados: any) => {
    const nutriId = await getNutriId();
    const ref = await addDoc(collection(db, 'alimentos'), { ...dados, personalizado: true, nutricionistaId: nutriId, criadoEm: ts() });
    return ok({ id: ref.id, ...dados });
  },
  atualizar: async (id: string, dados: any) => { await updateDoc(doc(db, 'alimentos', id), dados); return ok({ id, ...dados }); },
  deletar: async (id: string) => { await deleteDoc(doc(db, 'alimentos', id)); return ok({ mensagem: 'Alimento removido.' }); },
  importarCsv: async (_fd: FormData) => ok({ importados: 0, mensagem: 'Importação CSV não disponível no modo Firebase direto.' }),
  downloadTemplate: async () => ok(new Blob(['nome,calorias,proteinas,carboidratos,gorduras,fibras,categoria\nFrango Grelhado,165,31,0,3.6,0,Carnes\n'], { type: 'text/csv' })),
};

// ─── Exercícios ──────────────────────────────────────────────────
export const exerciciosServico = {
  listar: async (params?: any) => {
    const snap = await getDocs(collection(db, 'exercicios'));
    let lista = snap2arr(snap);
    if (params?.busca) lista = lista.filter((e: any) => e.nome?.toLowerCase().includes(String(params.busca).toLowerCase()));
    if (params?.grupo) lista = lista.filter((e: any) => e.grupoMuscular?.toLowerCase().includes(String(params.grupo).toLowerCase()));
    if (params?.nivel) lista = lista.filter((e: any) => e.nivel === params.nivel);
    return ok(lista);
  },
  buscar: async (id: string) => ok(snap2one(await getDoc(doc(db, 'exercicios', id)))),
  criar: async (dados: any) => { const ref = await addDoc(collection(db, 'exercicios'), { ...dados, personalizado: true, criadoEm: ts() }); return ok({ id: ref.id, ...dados }); },
  atualizar: async (id: string, dados: any) => { await updateDoc(doc(db, 'exercicios', id), dados); return ok({ id, ...dados }); },
  deletar: async (id: string) => { await deleteDoc(doc(db, 'exercicios', id)); return ok({ mensagem: 'Exercício removido.' }); },
};

// ─── Planos Alimentares ──────────────────────────────────────────
export const planosServico = {
  listar: async (params?: any) => {
    const u = auth.currentUser; if (!u) throw new Error('Não autenticado.');
    const nutriSnap = await getDocs(query(collection(db, 'nutricionistas'), where('email', '==', u.email)));
    let q: any;
    if (!nutriSnap.empty) {
      const nutriId = nutriSnap.docs[0].id;
      q = params?.alunoId ? query(collection(db, 'planos_alimentares'), where('nutricionistaId', '==', nutriId), where('alunoId', '==', params.alunoId)) : query(collection(db, 'planos_alimentares'), where('nutricionistaId', '==', nutriId));
    } else {
      const alunoSnap = await getDocs(query(collection(db, 'alunos'), where('email', '==', u.email)));
      q = query(collection(db, 'planos_alimentares'), where('alunoId', '==', alunoSnap.docs[0]?.id));
    }
    return ok(snap2arr(await getDocs(q)));
  },
  buscar: async (id: string) => ok(snap2one(await getDoc(doc(db, 'planos_alimentares', id)))),
  totais: async (id: string) => {
    const rfSnap = await getDocs(query(collection(db, 'refeicoes'), where('planoId', '==', id)));
    const t = { calorias: 0, proteinas: 0, carboidratos: 0, gorduras: 0, fibras: 0 };
    for (const rf of rfSnap.docs) {
      const itSnap = await getDocs(query(collection(db, 'itens_refeicao'), where('refeicaoId', '==', rf.id)));
      for (const it of itSnap.docs) {
        const d = it.data() as any; const f = (d.quantidade || 100) / 100;
        const a = (await getDoc(doc(db, 'alimentos', d.alimentoId))).data() as any;
        if (a) { t.calorias += (a.caloriasP100g || a.calorias || 0) * f; t.proteinas += (a.proteinasP100g || a.proteinas || 0) * f; t.carboidratos += (a.carboidratosP100g || a.carboidratos || 0) * f; t.gorduras += (a.gordurasP100g || a.gorduras || 0) * f; t.fibras += (a.fibrasP100g || a.fibras || 0) * f; }
      }
    }
    const r = (v: number) => Math.round(v * 10) / 10;
    return ok({ planoId: id, totais: { calorias: r(t.calorias), proteinas: r(t.proteinas), carboidratos: r(t.carboidratos), gorduras: r(t.gorduras), fibras: r(t.fibras) } });
  },
  criar: async (dados: any) => { const nutriId = await getNutriId(); const ref = await addDoc(collection(db, 'planos_alimentares'), { ...dados, nutricionistaId: nutriId, criadoEm: ts() }); return ok({ id: ref.id, ...dados }); },
  atualizar: async (id: string, dados: any) => { await updateDoc(doc(db, 'planos_alimentares', id), dados); return ok({ id, ...dados }); },
  deletar: async (id: string) => { await deleteDoc(doc(db, 'planos_alimentares', id)); return ok({ mensagem: 'Plano removido.' }); },
  refeicoes: {
    carregarEditor: async (planoId: string) => {
      const rfSnap = await getDocs(query(collection(db, 'refeicoes'), where('planoId', '==', planoId)));
      const refeicoes: any[] = snap2arr(rfSnap).sort((a: any, b: any) => (a.ordem ?? 0) - (b.ordem ?? 0));
      for (const rf of refeicoes) {
        const itSnap = await getDocs(query(collection(db, 'itens_refeicao'), where('refeicaoId', '==', rf.id)));
        rf.itens = snap2arr(itSnap);
      }
      return ok(refeicoes);
    },
    adicionar: async (_pId: string, dados: any) => { const ref = await addDoc(collection(db, 'refeicoes'), { ...dados, criadoEm: ts() }); return ok({ id: ref.id, ...dados }); },
    atualizar: async (_pId: string, refeicaoId: string, dados: any) => { await updateDoc(doc(db, 'refeicoes', refeicaoId), dados); return ok({ id: refeicaoId, ...dados }); },
    deletar: async (_pId: string, refeicaoId: string) => { await deleteDoc(doc(db, 'refeicoes', refeicaoId)); return ok({ mensagem: 'Refeição removida.' }); },
    adicionarItem: async (_pId: string, refeicaoId: string, dados: any) => { const ref = await addDoc(collection(db, 'itens_refeicao'), { ...dados, refeicaoId, criadoEm: ts() }); return ok({ id: ref.id, ...dados }); },
    atualizarItem: async (itemId: string, dados: any) => { await updateDoc(doc(db, 'itens_refeicao', itemId), dados); return ok({ id: itemId, ...dados }); },
    deletarItem: async (itemId: string) => { await deleteDoc(doc(db, 'itens_refeicao', itemId)); return ok({ mensagem: 'Item removido.' }); },
  },
};

// ─── Fichas de Treino ────────────────────────────────────────────
export const fichasServico = {
  listar: async (params?: any) => {
    const u = auth.currentUser; if (!u) throw new Error('Não autenticado.');
    const nutriSnap = await getDocs(query(collection(db, 'nutricionistas'), where('email', '==', u.email)));
    let q: any;
    if (!nutriSnap.empty) {
      const nutriId = nutriSnap.docs[0].id;
      q = params?.alunoId ? query(collection(db, 'fichas_treino'), where('nutricionistaId', '==', nutriId), where('alunoId', '==', params.alunoId)) : query(collection(db, 'fichas_treino'), where('nutricionistaId', '==', nutriId));
    } else {
      const alunoSnap = await getDocs(query(collection(db, 'alunos'), where('email', '==', u.email)));
      q = query(collection(db, 'fichas_treino'), where('alunoId', '==', alunoSnap.docs[0]?.id));
    }
    return ok(snap2arr(await getDocs(q)));
  },
  buscar: async (id: string) => ok(snap2one(await getDoc(doc(db, 'fichas_treino', id)))),
  criar: async (dados: any) => { const nutriId = await getNutriId(); const ref = await addDoc(collection(db, 'fichas_treino'), { ...dados, nutricionistaId: nutriId, ativo: true, criadoEm: ts() }); return ok({ id: ref.id, ...dados }); },
  atualizar: async (id: string, dados: any) => { await updateDoc(doc(db, 'fichas_treino', id), dados); return ok({ id, ...dados }); },
  deletar: async (id: string) => { await updateDoc(doc(db, 'fichas_treino', id), { ativo: false }); return ok({ mensagem: 'Ficha desativada.' }); },
  exercicios: {
    listar: async (fichaId: string) => ok(snap2arr(await getDocs(query(collection(db, 'exercicios_ficha'), where('fichaId', '==', fichaId))))),
    adicionar: async (fichaId: string, dados: any) => { const ref = await addDoc(collection(db, 'exercicios_ficha'), { ...dados, fichaId, criadoEm: ts() }); return ok({ id: ref.id, ...dados, fichaId }); },
    atualizar: async (_fId: string, itemId: string, dados: any) => { await updateDoc(doc(db, 'exercicios_ficha', itemId), dados); return ok({ id: itemId, ...dados }); },
    deletar: async (_fId: string, itemId: string) => { await deleteDoc(doc(db, 'exercicios_ficha', itemId)); return ok({ mensagem: 'Removido.' }); },
    reordenar: async (_fId: string, ordens: { id: string; ordem: number }[]) => { for (const o of ordens) await updateDoc(doc(db, 'exercicios_ficha', o.id), { ordem: o.ordem }); return ok({ mensagem: 'Reordenado.' }); },
  },
};

// ─── Receitas ────────────────────────────────────────────────────
export const receitasServico = {
  listar: async (params?: any) => {
    const u = auth.currentUser; if (!u) throw new Error('Não autenticado.');
    const nutriSnap = await getDocs(query(collection(db, 'nutricionistas'), where('email', '==', u.email)));
    if (!nutriSnap.empty) {
      const snap = await getDocs(query(collection(db, 'receitas'), where('nutricionistaId', '==', nutriSnap.docs[0].id)));
      let lista = snap2arr(snap);
      if (params?.busca) lista = lista.filter((r: any) => r.nome?.toLowerCase().includes(String(params.busca).toLowerCase()));
      if (params?.alunoId) lista = lista.filter((r: any) => (r.alunosIds || []).includes(params.alunoId));
      return ok(lista);
    }
    // Aluno vê todas as receitas cadastradas pelo nutricionista
    const snap = await getDocs(collection(db, 'receitas'));
    return ok(snap2arr(snap));
  },
  listarPorAluno: async (alunoId: string) => receitasServico.listar({ alunoId }),
  buscar: async (id: string) => ok(snap2one(await getDoc(doc(db, 'receitas', id)))),
  criar: async (dados: any) => {
    const nutriId = await getNutriId();
    let youtubeVideoId = dados.youtubeVideoId || '';
    if (!youtubeVideoId && dados.youtubeUrl) {
      const m = dados.youtubeUrl.match(/(?:v=|youtu\.be\/|embed\/)([\w-]{11})/);
      youtubeVideoId = m ? m[1] : '';
    }
    const raw = { ...dados, youtubeVideoId, nutricionistaId: nutriId, alunosIds: [], criadoEm: ts() };
    const payload = Object.fromEntries(Object.entries(raw).filter(([, v]) => v !== undefined));
    const ref = await addDoc(collection(db, 'receitas'), payload);
    return ok({ id: ref.id, ...payload });
  },
  atualizar: async (id: string, dados: any) => { await updateDoc(doc(db, 'receitas', id), dados); return ok({ id, ...dados }); },
  deletar: async (id: string) => { await deleteDoc(doc(db, 'receitas', id)); return ok({ mensagem: 'Removido.' }); },
  atribuirAluno: async (id: string, alunoId: string) => { const d = await getDoc(doc(db, 'receitas', id)); const atual = (d.data() as any)?.alunosIds || []; if (!atual.includes(alunoId)) await updateDoc(doc(db, 'receitas', id), { alunosIds: [...atual, alunoId] }); return ok({ mensagem: 'Atribuído.' }); },
  atribuir: async (rid: string, aid: string) => receitasServico.atribuirAluno(rid, aid),
  removerAluno: async (id: string, alunoId: string) => { const d = await getDoc(doc(db, 'receitas', id)); const atual = ((d.data() as any)?.alunosIds || []).filter((x: string) => x !== alunoId); await updateDoc(doc(db, 'receitas', id), { alunosIds: atual }); return ok({ mensagem: 'Removido.' }); },
};

// ─── Progresso ───────────────────────────────────────────────────
export const progressoServico = {
  listar: async (alunoId: string, _params?: any) => ok(snap2arr(await getDocs(query(collection(db, 'registros_progresso'), where('alunoId', '==', alunoId))))),
  buscar: async (id: string) => ok(snap2one(await getDoc(doc(db, 'registros_progresso', id)))),
  criar: async (alunoIdArg: string, payload: Record<string, any>, fotosFiles?: { frente?: File|null; lado?: File|null; costas?: File|null } | null) => {
    const dados: any = { ...payload };
    const numKeys = ['peso','altura','percentualGordura','cintura','quadril','pescoco','braco','perna'];
    numKeys.forEach((k) => { if (dados[k] !== undefined) dados[k] = parseFloat(dados[k]); });
    if (dados.peso && dados.altura) dados.imc = +(dados.peso / ((dados.altura / 100) ** 2)).toFixed(1);
    if (fotosFiles?.frente?.size) dados.fotoFrente = await compressImage(fotosFiles.frente);
    if (fotosFiles?.lado?.size) dados.fotoLado = await compressImage(fotosFiles.lado);
    if (fotosFiles?.costas?.size) dados.fotoCostas = await compressImage(fotosFiles.costas);
    // remover null/undefined antes de enviar ao Firestore
    Object.keys(dados).forEach((k) => { if (dados[k] == null) delete dados[k]; });
    const docRef = await addDoc(collection(db, 'registros_progresso'), { ...dados, alunoId: alunoIdArg, criadoEm: ts() });
    return ok({ id: docRef.id, alunoId: alunoIdArg, ...dados });
  },
  atualizar: async (id: string, payload: Record<string, any>, fotosFiles?: { frente?: File|null; lado?: File|null; costas?: File|null } | null) => {
    const dados: any = { ...payload };
    const numKeys = ['peso','altura','percentualGordura','cintura','quadril','pescoco','braco','perna'];
    numKeys.forEach((k) => { if (dados[k] !== undefined) dados[k] = parseFloat(dados[k]); });
    if (dados.peso && dados.altura) dados.imc = +(dados.peso / ((dados.altura / 100) ** 2)).toFixed(1);
    // Upload de novas fotos (sobrescreve o valor que veio no payload)
    if (fotosFiles?.frente?.size) dados.fotoFrente = await compressImage(fotosFiles.frente);
    if (fotosFiles?.lado?.size) dados.fotoLado = await compressImage(fotosFiles.lado);
    if (fotosFiles?.costas?.size) dados.fotoCostas = await compressImage(fotosFiles.costas);
    // Fotos com valor null → remover o campo do Firestore
    const fotoFields = ['fotoFrente', 'fotoLado', 'fotoCostas'];
    fotoFields.forEach((f) => { if (dados[f] === null) dados[f] = deleteField(); });
    // Remover outros null/undefined (não campos de foto)
    Object.keys(dados).forEach((k) => { if (!fotoFields.includes(k) && dados[k] == null) delete dados[k]; });
    await updateDoc(doc(db, 'registros_progresso', id), dados);
    return ok({ id, ...dados });
  },
  deletar: async (id: string) => { await deleteDoc(doc(db, 'registros_progresso', id)); return ok({ mensagem: 'Removido.' }); },
};

// ─── Consultas ───────────────────────────────────────────────────
export const consultasServico = {
  listar: async (params?: any) => {
    const u = auth.currentUser; if (!u) throw new Error('Não autenticado.');
    const nutriSnap = await getDocs(query(collection(db, 'nutricionistas'), where('email', '==', u.email)));
    let q: any;
    if (!nutriSnap.empty) {
      q = query(collection(db, 'consultas'), where('nutricionistaId', '==', nutriSnap.docs[0].id));
    } else {
      const alunoSnap = await getDocs(query(collection(db, 'alunos'), where('email', '==', u.email)));
      q = query(collection(db, 'consultas'), where('alunoId', '==', alunoSnap.docs[0]?.id));
    }
    let lista = snap2arr(await getDocs(q));
    if (params?.status) lista = lista.filter((c: any) => c.status === params.status);
    return ok(lista);
  },
  buscar: async (id: string) => ok(snap2one(await getDoc(doc(db, 'consultas', id)))),
  criar: async (dados: any) => { const nutriId = await getNutriId(); const ref = await addDoc(collection(db, 'consultas'), { status: 'AGENDADA', ...dados, nutricionistaId: nutriId, criadoEm: ts() }); return ok({ id: ref.id, ...dados }); },
  atualizar: async (id: string, dados: any) => { await updateDoc(doc(db, 'consultas', id), dados); return ok({ id, ...dados }); },
  deletar: async (id: string) => { await deleteDoc(doc(db, 'consultas', id)); return ok({ mensagem: 'Removido.' }); },
};

// ─── Fórmulas ────────────────────────────────────────────────────
export const formulasServico = {
  listar: async () => ok(snap2arr(await getDocs(collection(db, 'formulas_calculo')))),
  buscar: async (id: string) => ok(snap2one(await getDoc(doc(db, 'formulas_calculo', id)))),
  criar: async (dados: any) => { const nutriId = await getNutriId(); const ref = await addDoc(collection(db, 'formulas_calculo'), { ...dados, nutricionistaId: nutriId, criadoEm: ts() }); return ok({ id: ref.id, ...dados }); },
  atualizar: async (id: string, dados: any) => { await updateDoc(doc(db, 'formulas_calculo', id), dados); return ok({ id, ...dados }); },
  deletar: async (id: string) => { await deleteDoc(doc(db, 'formulas_calculo', id)); return ok({ mensagem: 'Removido.' }); },
};

// ─── Tabela TACO ─────────────────────────────────────────────────
import { tacoAlimentos, type TacoAlimento } from '../dados/taco';

export const tacoServico = {
  /** Busca alimentos na tabela TACO local (sem Firestore). */
  buscar: (q: string): TacoAlimento[] => {
    if (!q.trim()) return tacoAlimentos;
    const termo = q.toLowerCase().trim();
    return tacoAlimentos.filter(
      (a) =>
        a.nome.toLowerCase().includes(termo) ||
        a.categoria.toLowerCase().includes(termo),
    );
  },
};

export { fbSignOut as signOut };
export default { autenticacaoServico, nutricionistaServico, alunosServico, alimentosServico, tacoServico, exerciciosServico, planosServico, fichasServico, receitasServico, progressoServico, consultasServico, formulasServico };
