import { Request, Response } from 'express';
import https from 'https';
import http from 'http';
import admin, { db } from '../banco/firebase';

const WAHA_URL     = process.env.WAHA_URL ?? '';
const WAHA_SESSION = process.env.WAHA_SESSION ?? 'default';
const WAHA_API_KEY = process.env.WAHA_API_KEY ?? '';

/** Faz POST JSON para a API WAHA usando o módulo http/https nativo do Node */
function enviarTextoWaha(chatId: string, text: string): Promise<void> {
  return new Promise((resolve, reject) => {
    if (!WAHA_URL) { resolve(); return; }

    const body = JSON.stringify({ session: WAHA_SESSION, chatId, text });
    const url  = new URL(`${WAHA_URL}/api/sendText`);
    const options: http.RequestOptions = {
      hostname: url.hostname,
      port:     url.port || (url.protocol === 'https:' ? '443' : '80'),
      path:     url.pathname,
      method:   'POST',
      headers: {
        'Content-Type':   'application/json',
        'Content-Length': Buffer.byteLength(body),
        ...(WAHA_API_KEY ? { 'X-Api-Key': WAHA_API_KEY } : {}),
      },
    };
    const mod = url.protocol === 'https:' ? https : http;
    const req = mod.request(options, (res) => {
      res.resume(); // drena a resposta
      if (res.statusCode && res.statusCode >= 400) {
        reject(new Error(`WAHA HTTP ${res.statusCode}`));
      } else {
        resolve();
      }
    });
    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

/** Formata número de telefone para chatId do WhatsApp */
function toChatId(phone: string) {
  return phone.replace(/\D/g, '') + '@c.us';
}

// ─── POST /api/waha/enviar ────────────────────────────────────────
export const enviarWaha = async (req: Request, res: Response) => {
  const { alunoId, texto, remetente } = req.body as {
    alunoId?: string;
    texto?: string;
    remetente?: 'aluno' | 'nutricionista';
  };

  if (!alunoId || !texto) {
    res.status(400).json({ mensagem: 'alunoId e texto são obrigatórios.' });
    return;
  }

  if (!WAHA_URL) {
    // WAHA não configurado — aceita sem erro para não travar o fluxo
    res.json({ mensagem: 'WAHA não configurado. Mensagem salva apenas no app.' });
    return;
  }

  try {
    // Tenta obter nutricionistaId do doc de conversa OU do doc do aluno diretamente
    const [convSnap, alunoSnap] = await Promise.all([
      db.collection('conversas').doc(alunoId).get(),
      db.collection('alunos').doc(alunoId).get(),
    ]);
    const conv = convSnap.data();
    const nutricionistaId = conv?.nutricionistaId || alunoSnap.data()?.nutricionistaId;

    console.log(`[WAHA] alunoId=${alunoId} remetente=${remetente} nutricionistaId=${nutricionistaId}`);

    if (remetente === 'aluno') {
      // Aluno → encaminha para WhatsApp do nutricionista
      if (!nutricionistaId) {
        console.warn('[WAHA] Nutricionista não vinculado ao aluno:', alunoId);
        res.json({ mensagem: 'Nutricionista não vinculado.' });
        return;
      }
      const nutriSnap = await db.collection('nutricionistas').doc(nutricionistaId).get();
      const nutriWhatsapp = nutriSnap.data()?.whatsapp as string | undefined;
      console.log(`[WAHA] nutriWhatsapp=${nutriWhatsapp}`);
      if (!nutriWhatsapp) {
        res.json({ mensagem: 'WhatsApp do nutricionista não configurado.' });
        return;
      }
      const alunoNome = (alunoSnap.data()?.nome as string) ?? 'Paciente';
      const alunoTelefone = (alunoSnap.data()?.telefone as string | undefined) ?? '';
      // Salva telefone na conversa para o webhook conseguir fazer match futuro
      if (alunoTelefone) {
        await db.collection('conversas').doc(alunoId).set(
          { telefone: alunoTelefone.replace(/\D/g, '') },
          { merge: true }
        );
      }
      await enviarTextoWaha(toChatId(nutriWhatsapp), `📱 *${alunoNome}* (App):\n${texto}`);

    } else {
      // Nutricionista → encaminha para WhatsApp do aluno (opcional)
      const alunoSnap = await db.collection('alunos').doc(alunoId).get();
      const alunoTelefone = alunoSnap.data()?.telefone as string | undefined;
      if (!alunoTelefone) {
        res.json({ mensagem: 'Telefone do aluno não cadastrado.' });
        return;
      }
      await enviarTextoWaha(toChatId(alunoTelefone), `👩‍⚕️ *Nutricionista*:\n${texto}`);
    }

    res.json({ mensagem: 'Enviado via WAHA.' });
  } catch (err: any) {
    console.error('[WAHA] enviar:', err?.message);
    res.status(500).json({ mensagem: 'Erro ao enviar via WAHA.', detalhe: err?.message });
  }
};

// ─── POST /api/waha/webhook ───────────────────────────────────────
// Configure no WAHA: Webhook URL = https://seu-backend.com/api/waha/webhook
export const webhookWaha = async (req: Request, res: Response) => {
  try {
    const { event, payload } = req.body ?? {};

    // Só processa mensagens recebidas (ignora status, typing, etc.)
    if (event !== 'message' && event !== 'message.any') {
      res.json({ ok: true });
      return;
    }

    const from: string = payload?.from ?? '';
    const body: string = payload?.body ?? payload?.text?.body ?? '';

    if (!body || !from || from.startsWith('status@')) {
      res.json({ ok: true });
      return;
    }

    // Identifica o telefone do remetente
    const phoneRaw = from.replace('@c.us', '').replace(/\D/g, '');
    const criadoEm = new Date().toISOString();

    // 1º: busca conversa que já tenha esse telefone salvo (mais rápido)
    const conversasPorTel = await db.collection('conversas')
      .where('telefone', '==', phoneRaw)
      .limit(1)
      .get();

    if (!conversasPorTel.empty) {
      const convDoc = conversasPorTel.docs[0];
      await convDoc.ref.collection('mensagens').add({
        texto: body, remetente: 'aluno', criadoEm, lida: false, fonte: 'whatsapp',
      });
      await convDoc.ref.set({
        ultimaMensagem: body,
        ultimaMensagemEm: criadoEm,
        naoLidasAdmin: admin.firestore.FieldValue.increment(1),
      }, { merge: true });
      res.json({ ok: true });
      return;
    }

    // 2º: busca aluno pelo telefone (últimos 8 dígitos)
    const alunosSnap = await db.collection('alunos').get();
    let matchAlunoId: string | null = null;
    let matchNutriId: string | null = null;
    let matchAlunoNome = phoneRaw;

    for (const d of alunosSnap.docs) {
      const data = d.data();
      const tel = (data.telefone ?? '').replace(/\D/g, '');
      if (tel.length >= 8 && phoneRaw.endsWith(tel.slice(-8))) {
        matchAlunoId = d.id;
        matchNutriId = data.nutricionistaId ?? null;
        matchAlunoNome = data.nome ?? phoneRaw;
        break;
      }
    }

    // 3º: se não achou aluno, cria conversa com número desconhecido
    // Busca o primeiro nutricionista para vincular
    if (!matchAlunoId) {
      const nutriSnap = await db.collection('nutricionistas').limit(1).get();
      const nutriId = nutriSnap.empty ? null : nutriSnap.docs[0].id;
      if (!nutriId) { res.json({ ok: true }); return; }
      const convId = `whatsapp_${phoneRaw}`;
      await db.collection('conversas').doc(convId).collection('mensagens').add({
        texto: body, remetente: 'aluno', criadoEm, lida: false, fonte: 'whatsapp',
      });
      await db.collection('conversas').doc(convId).set({
        alunoNome: `+${phoneRaw}`,
        nutricionistaId: nutriId,
        telefone: phoneRaw,
        ultimaMensagem: body,
        ultimaMensagemEm: criadoEm,
        naoLidasAdmin: admin.firestore.FieldValue.increment(1),
        desconhecido: true,
      }, { merge: true });
      console.log(`[WAHA webhook] Conversa criada para número desconhecido: +${phoneRaw}`);
      res.json({ ok: true });
      return;
    }

    // Aluno encontrado — salva mensagem e atualiza conversa
    await db.collection('conversas').doc(matchAlunoId).collection('mensagens').add({
      texto: body, remetente: 'aluno', criadoEm, lida: false, fonte: 'whatsapp',
    });
    await db.collection('conversas').doc(matchAlunoId).set({
      alunoNome: matchAlunoNome,
      nutricionistaId: matchNutriId,
      telefone: phoneRaw,
      ultimaMensagem: body,
      ultimaMensagemEm: criadoEm,
      naoLidasAdmin: admin.firestore.FieldValue.increment(1),
    }, { merge: true });

    res.json({ ok: true });
  } catch (err) {
    console.error('[WAHA webhook]:', err);
    res.status(500).json({ ok: false });
  }
};
