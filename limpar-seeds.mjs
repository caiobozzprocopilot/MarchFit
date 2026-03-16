/**
 * limpar-seeds.mjs
 * Remove todos os documentos seed-* da coleção alimentos no Firestore.
 * Uso: node limpar-seeds.mjs
 */

import { readFileSync } from 'fs';
import { join } from 'path';
import { fileURLToPath } from 'url';
import { createInterface } from 'readline';

const __dirname = fileURLToPath(new URL('.', import.meta.url));

function readEnv() {
  const content = readFileSync(join(__dirname, 'frontend', '.env'), 'utf-8').replace(/^\uFEFF/, '');
  const vars = {};
  for (const line of content.split('\n')) {
    const match = line.replace(/^\uFEFF/, '').trim().match(/^([A-Za-z_][A-Za-z0-9_]*)=(.*)$/);
    if (match) vars[match[1].trim()] = match[2].trim().replace(/^["']|["']$/g, '');
  }
  return vars;
}

async function signIn(apiKey, email, password) {
  const res = await fetch(
    `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${apiKey}`,
    { method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, returnSecureToken: true }) }
  );
  if (!res.ok) { const b = await res.json().catch(() => ({})); throw new Error(b?.error?.message ?? res.statusText); }
  return (await res.json()).idToken;
}

function prompt(q) {
  const rl = createInterface({ input: process.stdin, output: process.stdout });
  return new Promise(r => rl.question(q, a => { rl.close(); r(a); }));
}

async function listSeedDocs(projectId, token) {
  const base = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/alimentos`;
  const docs = [];
  let pageToken = null;

  do {
    const url = base + `?pageSize=300${pageToken ? `&pageToken=${pageToken}` : ''}`;
    const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
    if (!res.ok) throw new Error(`Erro ao listar documentos: ${res.status}`);
    const body = await res.json();
    for (const doc of (body.documents ?? [])) {
      const id = doc.name.split('/').pop();
      if (id.startsWith('seed-')) docs.push(doc.name);
    }
    pageToken = body.nextPageToken ?? null;
  } while (pageToken);

  return docs;
}

async function batchDelete(projectId, token, names) {
  const url = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents:commit`;
  const CHUNK = 500;
  for (let i = 0; i < names.length; i += CHUNK) {
    const writes = names.slice(i, i + CHUNK).map(name => ({ delete: name }));
    const res = await fetch(url, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ writes }),
    });
    if (!res.ok) throw new Error(`Erro ao deletar: ${await res.text()}`);
    console.log(`  Deletados ${i + 1}–${Math.min(i + CHUNK, names.length)} de ${names.length}`);
  }
}

async function main() {
  console.log('=== Limpeza de seeds ===\n');
  const env = readEnv();
  const { VITE_FIREBASE_API_KEY: apiKey, VITE_FIREBASE_PROJECT_ID: projectId } = env;

  const email    = await prompt('E-mail: ');
  const password = await prompt('Senha: ');

  process.stdout.write('\nAutenticando... ');
  const token = await signIn(apiKey, email, password);
  console.log('OK');

  process.stdout.write('Listando documentos seed-*... ');
  const seeds = await listSeedDocs(projectId, token);
  console.log(`${seeds.length} encontrados`);

  if (seeds.length === 0) { console.log('Nada para remover.'); return; }

  const confirm = await prompt(`\nRemover ${seeds.length} documentos seed-*? (s/N): `);
  if (confirm.toLowerCase() !== 's') { console.log('Cancelado.'); return; }

  await batchDelete(projectId, token, seeds);
  console.log(`\n✓ ${seeds.length} documentos removidos com sucesso!`);
}

main().catch(e => { console.error(e.message); process.exit(1); });
