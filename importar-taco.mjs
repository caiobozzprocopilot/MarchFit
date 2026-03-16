/**
 * importar-taco.mjs
 *
 * Importa os ~600 alimentos da tabela TACO (NEPA/UNICAMP) para o Firestore.
 *
 * Como usar:
 *   1. Na pasta nutri-sistema, execute:  node importar-taco.mjs
 *   2. Informe o e-mail e senha de um nutricionista admin quando solicitado.
 *
 * Sem dependências externas — usa apenas APIs built-in do Node 18+.
 */

import { readFileSync } from 'fs';
import { join } from 'path';
import { fileURLToPath } from 'url';
import { createInterface } from 'readline';

const __dirname = fileURLToPath(new URL('.', import.meta.url));

// ---------------------------------------------------------------------------
// Lê variáveis do frontend/.env
// ---------------------------------------------------------------------------
function readEnv() {
  const envPath = join(__dirname, 'frontend', '.env');
  let content;
  try {
    content = readFileSync(envPath, 'utf-8');
  } catch {
    throw new Error('Arquivo frontend/.env não encontrado.');
  }
  // Remove BOM se presente
  content = content.replace(/^\uFEFF/, '');
  const vars = {};
  for (const line of content.split('\n')) {
    // Remove BOM de cada linha e espaços em branco
    const cleanLine = line.replace(/^\uFEFF/, '').trim();
    const match = cleanLine.match(/^([A-Za-z_][A-Za-z0-9_]*)=(.*)$/);
    if (match) {
      const key = match[1].trim();
      const val = match[2].trim().replace(/^["']|["']$/g, '');
      vars[key] = val;
    }
  }
  return vars;
}

// ---------------------------------------------------------------------------
// Autenticação via Firebase Auth REST API (email + senha)
// ---------------------------------------------------------------------------
async function signIn(apiKey, email, password) {
  const res = await fetch(
    `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, returnSecureToken: true }),
    }
  );
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    const msg = body?.error?.message ?? res.statusText;
    throw new Error(`Falha na autenticação: ${msg}`);
  }
  const { idToken } = await res.json();
  return idToken;
}

// ---------------------------------------------------------------------------
// Parser CSV simples com suporte a campos entre aspas
// ---------------------------------------------------------------------------
function parseCsv(text) {
  const lines = text.replace(/\r/g, '').trim().split('\n');
  if (lines.length === 0) return [];

  const parseRow = (line) => {
    const cells = [];
    let cell = '';
    let inQuote = false;
    for (let i = 0; i < line.length; i++) {
      const ch = line[i];
      if (ch === '"') {
        if (inQuote && line[i + 1] === '"') { cell += '"'; i++; }
        else { inQuote = !inQuote; }
      } else if (ch === ',' && !inQuote) {
        cells.push(cell.trim());
        cell = '';
      } else {
        cell += ch;
      }
    }
    cells.push(cell.trim());
    return cells;
  };

  const headers = parseRow(lines[0]);
  const rows = [];
  for (let i = 1; i < lines.length; i++) {
    if (!lines[i].trim()) continue;
    const values = parseRow(lines[i]);
    const obj = {};
    headers.forEach((h, idx) => { obj[h] = values[idx] ?? ''; });
    rows.push(obj);
  }
  return rows;
}

// ---------------------------------------------------------------------------
// Helpers de tipos Firestore REST
// ---------------------------------------------------------------------------
const fStr  = (v) => ({ stringValue: String(v) });
const fBool = (v) => ({ booleanValue: Boolean(v) });
const fNum  = (v) => {
  const n = parseFloat(v);
  return isNaN(n) ? { doubleValue: 0 } : { doubleValue: n };
};

// ---------------------------------------------------------------------------
// Batch write via Firestore REST API (máx 500 por chamada)
// ---------------------------------------------------------------------------
async function batchWrite(projectId, token, documents) {
  const url = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents:commit`;

  const writes = documents.map(({ docId, fields }) => ({
    update: {
      name: `projects/${projectId}/databases/(default)/documents/alimentos/${docId}`,
      fields,
    },
  }));

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ writes }),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Erro ao gravar no Firestore (HTTP ${res.status}): ${body}`);
  }
}

// ---------------------------------------------------------------------------
// Prompt interativo
// ---------------------------------------------------------------------------
function prompt(question, hidden = false) {
  const rl = createInterface({ input: process.stdin, output: process.stdout });
  if (hidden && process.stdout.isTTY) {
    process.stdout.write(question);
    // Lê sem eco (melhor esforço — funciona no terminal nativo)
    process.stdin.setRawMode?.(true);
    return new Promise((resolve) => {
      let chars = '';
      process.stdin.resume();
      const handler = (ch) => {
        ch = ch.toString();
        if (ch === '\n' || ch === '\r' || ch === '\u0004') {
          process.stdin.setRawMode?.(false);
          process.stdin.pause();
          process.stdin.removeListener('data', handler);
          process.stdout.write('\n');
          rl.close();
          resolve(chars);
        } else if (ch === '\u0003') {
          process.exit();
        } else {
          chars += ch;
          process.stdout.write('*');
        }
      };
      process.stdin.on('data', handler);
    });
  }
  return new Promise((resolve) => rl.question(question, (ans) => { rl.close(); resolve(ans); }));
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------
async function main() {
  console.log('=== Importador TACO → Firestore ===\n');

  // 1. Lê config do .env
  let env;
  try { env = readEnv(); } catch (e) { console.error(e.message); process.exit(1); }

  const apiKey    = env['VITE_FIREBASE_API_KEY'];
  const projectId = env['VITE_FIREBASE_PROJECT_ID'];

  if (!apiKey || !projectId) {
    console.error(
      'VITE_FIREBASE_API_KEY ou VITE_FIREBASE_PROJECT_ID não encontrados em frontend/.env'
    );
    process.exit(1);
  }

  console.log(`Projeto: ${projectId}`);

  // 2. Autenticação
  const email    = await prompt('E-mail do nutricionista: ');
  const password = await prompt('Senha: ', true);

  process.stdout.write('\nAutenticando... ');
  let token;
  try { token = await signIn(apiKey, email, password); }
  catch (e) { console.error('\n' + e.message); process.exit(1); }
  console.log('OK');

  // 3. Baixa os CSVs do GitHub
  process.stdout.write('Baixando dados TACO... ');
  const BASE = 'https://raw.githubusercontent.com/raulfdm/taco-api/main/references/csv';
  const [foodRes, nutRes, catRes] = await Promise.all([
    fetch(`${BASE}/food.csv`),
    fetch(`${BASE}/nutrients.csv`),
    fetch(`${BASE}/categories.csv`),
  ]);

  if (!foodRes.ok || !nutRes.ok || !catRes.ok) {
    console.error('\nFalha ao baixar CSVs do GitHub. Verifique sua conexão.');
    process.exit(1);
  }

  const foods      = parseCsv(await foodRes.text());
  const nutrients  = parseCsv(await nutRes.text());
  const categories = parseCsv(await catRes.text());
  console.log('OK');

  // 4. Cria mapa categoria id → nome
  const catMap = {};
  for (const c of categories) {
    if (c.id) catMap[c.id] = c.name || c.tipo || String(c.id);
  }
  // Fallback com nomes conhecidos, caso o CSV use colunas diferentes
  const catFallback = {
    '1':  'Cereais e derivados',
    '2':  'Verduras, hortaliças e derivados',
    '3':  'Frutas e derivados',
    '4':  'Gorduras e óleos',
    '5':  'Pescados e frutos do mar',
    '6':  'Carnes e derivados',
    '7':  'Leite e derivados',
    '8':  'Bebidas',
    '9':  'Ovos e derivados',
    '10': 'Açúcares e produtos de confeitaria',
    '11': 'Condimentos e molhos',
    '12': 'Produtos industrializados',
    '13': 'Pratos prontos e misturas industrializadas',
    '14': 'Leguminosas e derivados',
    '15': 'Nozes e sementes',
  };

  // 5. Cria mapa nutrientes foodId → objeto
  const nutMap = {};
  for (const n of nutrients) {
    if (n.foodId) nutMap[n.foodId] = n;
  }

  // 6. Monta documentos
  const criadoEm = new Date().toISOString();
  const docs = [];

  for (const food of foods) {
    const n = nutMap[food.id];
    if (!n) continue;

    const categoria =
      catMap[food.categoryId] ||
      catFallback[food.categoryId] ||
      'Outros';

    docs.push({
      docId: `taco_${food.id}`,
      fields: {
        nome:              fStr(food.name),
        categoria:         fStr(categoria),
        caloriasP100g:     fNum(n.kcal),
        proteinasP100g:    fNum(n.protein),
        carboidratosP100g: fNum(n.carbohydrates),
        gordurasP100g:     fNum(n.lipids),
        fibrasP100g:       fNum(n.dietaryFiber),
        personalizado:     fBool(false),
        criadoEm:          fStr(criadoEm),
      },
    });
  }

  console.log(`Alimentos para importar: ${docs.length}\n`);

  // 7. Grava em lotes de 500
  const BATCH = 500;
  for (let i = 0; i < docs.length; i += BATCH) {
    const slice = docs.slice(i, i + BATCH);
    const fim = Math.min(i + BATCH, docs.length);
    process.stdout.write(`  Gravando ${i + 1}–${fim} de ${docs.length}... `);
    try {
      await batchWrite(projectId, token, slice);
      console.log('OK');
    } catch (e) {
      console.error('\nErro: ' + e.message);
      console.error('Verifique as regras de segurança do Firestore (a coleção "alimentos" deve permitir escrita para usuários autenticados).');
      process.exit(1);
    }
  }

  console.log(`\n✓ Importação concluída! ${docs.length} alimentos gravados na coleção "alimentos".`);
}

main();
