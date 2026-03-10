import 'dotenv/config';
import * as admin from 'firebase-admin';
import * as path from 'path';
import * as fs from 'fs';
import bcrypt from 'bcryptjs';

const serviceAccountPath = path.resolve(__dirname, '../serviceAccountKey.json');
if (!fs.existsSync(serviceAccountPath)) {
  console.error('❌  serviceAccountKey.json não encontrado em backend/');
  process.exit(1);
}

const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf8'));
admin.initializeApp({ credential: admin.credential.cert(serviceAccount), projectId: 'nutrisystem-1fdf6' });
const db = admin.firestore();

async function upsertById(collection: string, id: string, data: any) {
  await db.collection(collection).doc(id).set(data, { merge: true });
}

async function main() {
  console.log('🌱 Iniciando seed Firebase...\n');

  // ─── Nutricionista padrão (Firebase Auth + Firestore) ────────────
  console.log('👤 Criando nutricionista padrão...');

  // Create Firebase Auth user (idempotent)
  try {
    await admin.auth().createUser({
      uid: 'admin-nutri',
      email: 'admin@nutrisistema.com',
      password: 'nutri123',
      displayName: 'Dr. Admin',
    });
    console.log('  ✅ Firebase Auth user criado.');
  } catch (e: any) {
    if (e.code === 'auth/uid-already-exists' || e.code === 'auth/email-already-exists') {
      console.log('  ℹ️  Firebase Auth user já existe.');
    } else {
      throw e;
    }
  }

  const senhaHash = await bcrypt.hash('nutri123', 12);
  await db.collection('nutricionistas').doc('admin-nutri').set({
    nome: 'Dr. Admin',
    email: 'admin@nutrisistema.com',
    senhaHash,
    crn: 'CRN-0/00000',
    telefone: '(11) 99999-9999',
    fotoPerfil: null,
    ativo: true,
    criadoEm: new Date().toISOString(),
  }, { merge: true });
  console.log('  ✅ admin@nutrisistema.com / nutri123\n');

  // ─── Alimentos ─────────────────────────────────────────────────
  console.log('🥗 Inserindo alimentos...');
  const alimentos = [
    { nome: 'Frango Grelhado', nomePopular: 'Peito de Frango', caloriasP100g: 165, proteinasP100g: 31.0, carboidratosP100g: 0, gordurasP100g: 3.6, fibrasP100g: 0, categoria: 'Carnes' },
    { nome: 'Carne Bovina Grelhada', nomePopular: 'Patinho Grelhado', caloriasP100g: 219, proteinasP100g: 30.7, carboidratosP100g: 0, gordurasP100g: 10.3, fibrasP100g: 0, categoria: 'Carnes' },
    { nome: 'Ovo Cozido', nomePopular: 'Ovo de Galinha', caloriasP100g: 146, proteinasP100g: 13.3, carboidratosP100g: 1.6, gordurasP100g: 9.5, fibrasP100g: 0, categoria: 'Ovos' },
    { nome: 'Atum em Lata', nomePopular: 'Atum', caloriasP100g: 119, proteinasP100g: 26.0, carboidratosP100g: 0, gordurasP100g: 1.0, fibrasP100g: 0, categoria: 'Peixes' },
    { nome: 'Tilápia Grelhada', nomePopular: 'Tilápia', caloriasP100g: 128, proteinasP100g: 26.2, carboidratosP100g: 0, gordurasP100g: 2.7, fibrasP100g: 0, categoria: 'Peixes' },
    { nome: 'Salmão Grelhado', nomePopular: 'Salmão', caloriasP100g: 208, proteinasP100g: 20.4, carboidratosP100g: 0, gordurasP100g: 13.4, fibrasP100g: 0, categoria: 'Peixes' },
    { nome: 'Arroz Branco Cozido', nomePopular: 'Arroz', caloriasP100g: 130, proteinasP100g: 2.7, carboidratosP100g: 28.1, gordurasP100g: 0.3, fibrasP100g: 0.4, categoria: 'Cereais' },
    { nome: 'Arroz Integral Cozido', nomePopular: 'Arroz Integral', caloriasP100g: 124, proteinasP100g: 2.6, carboidratosP100g: 25.8, gordurasP100g: 1.0, fibrasP100g: 1.8, categoria: 'Cereais' },
    { nome: 'Batata Doce Cozida', nomePopular: 'Batata Doce', caloriasP100g: 77, proteinasP100g: 1.4, carboidratosP100g: 18.0, gordurasP100g: 0.1, fibrasP100g: 1.5, categoria: 'Tubérculos' },
    { nome: 'Batata Inglesa Cozida', nomePopular: 'Batata', caloriasP100g: 52, proteinasP100g: 1.2, carboidratosP100g: 12.0, gordurasP100g: 0.1, fibrasP100g: 1.0, categoria: 'Tubérculos' },
    { nome: 'Macarrão Cozido', nomePopular: 'Macarrão', caloriasP100g: 131, proteinasP100g: 4.5, carboidratosP100g: 26.6, gordurasP100g: 0.9, fibrasP100g: 1.8, categoria: 'Massas' },
    { nome: 'Pão Francês', nomePopular: 'Pão de Sal', caloriasP100g: 300, proteinasP100g: 9.4, carboidratosP100g: 58.6, gordurasP100g: 3.1, fibrasP100g: 2.3, categoria: 'Pães' },
    { nome: 'Aveia em Flocos', nomePopular: 'Aveia', caloriasP100g: 394, proteinasP100g: 13.9, carboidratosP100g: 66.6, gordurasP100g: 8.5, fibrasP100g: 9.1, categoria: 'Cereais' },
    { nome: 'Feijão Preto Cozido', nomePopular: 'Feijão Preto', caloriasP100g: 77, proteinasP100g: 5.3, carboidratosP100g: 14.0, gordurasP100g: 0.5, fibrasP100g: 8.4, categoria: 'Leguminosas' },
    { nome: 'Feijão Carioca Cozido', nomePopular: 'Feijão', caloriasP100g: 76, proteinasP100g: 4.8, carboidratosP100g: 13.6, gordurasP100g: 0.5, fibrasP100g: 8.5, categoria: 'Leguminosas' },
    { nome: 'Iogurte Natural Integral', nomePopular: 'Iogurte', caloriasP100g: 61, proteinasP100g: 3.2, carboidratosP100g: 4.7, gordurasP100g: 3.3, fibrasP100g: 0, categoria: 'Laticínios' },
    { nome: 'Leite Integral', nomePopular: 'Leite', caloriasP100g: 61, proteinasP100g: 3.2, carboidratosP100g: 4.7, gordurasP100g: 3.3, fibrasP100g: 0, categoria: 'Laticínios' },
    { nome: 'Queijo Mussarela', nomePopular: 'Mussarela', caloriasP100g: 300, proteinasP100g: 22.0, carboidratosP100g: 2.2, gordurasP100g: 22.0, fibrasP100g: 0, categoria: 'Laticínios' },
    { nome: 'Whey Protein (concentrado)', nomePopular: 'Whey Protein', caloriasP100g: 373, proteinasP100g: 80.0, carboidratosP100g: 8.0, gordurasP100g: 4.0, fibrasP100g: 0, categoria: 'Suplementos' },
    { nome: 'Banana Nanica', nomePopular: 'Banana', caloriasP100g: 92, proteinasP100g: 1.4, carboidratosP100g: 23.8, gordurasP100g: 0.1, fibrasP100g: 1.9, categoria: 'Frutas' },
    { nome: 'Maçã', nomePopular: 'Maçã', caloriasP100g: 56, proteinasP100g: 0.3, carboidratosP100g: 15.2, gordurasP100g: 0.1, fibrasP100g: 1.3, categoria: 'Frutas' },
    { nome: 'Laranja Pêra', nomePopular: 'Laranja', caloriasP100g: 37, proteinasP100g: 0.9, carboidratosP100g: 8.9, gordurasP100g: 0.1, fibrasP100g: 0.4, categoria: 'Frutas' },
    { nome: 'Abacate', nomePopular: 'Abacate', caloriasP100g: 96, proteinasP100g: 1.2, carboidratosP100g: 6.0, gordurasP100g: 8.4, fibrasP100g: 6.7, categoria: 'Frutas' },
    { nome: 'Brócolis Cozido', nomePopular: 'Brócolis', caloriasP100g: 25, proteinasP100g: 2.9, carboidratosP100g: 2.4, gordurasP100g: 0.3, fibrasP100g: 3.0, categoria: 'Vegetais' },
    { nome: 'Espinafre Cru', nomePopular: 'Espinafre', caloriasP100g: 23, proteinasP100g: 2.9, carboidratosP100g: 3.6, gordurasP100g: 0.4, fibrasP100g: 2.2, categoria: 'Vegetais' },
    { nome: 'Tomate', nomePopular: 'Tomate', caloriasP100g: 15, proteinasP100g: 1.1, carboidratosP100g: 3.1, gordurasP100g: 0.2, fibrasP100g: 1.2, categoria: 'Vegetais' },
    { nome: 'Cenoura Crua', nomePopular: 'Cenoura', caloriasP100g: 34, proteinasP100g: 1.3, carboidratosP100g: 7.7, gordurasP100g: 0.2, fibrasP100g: 3.2, categoria: 'Vegetais' },
    { nome: 'Azeite de Oliva', nomePopular: 'Azeite', caloriasP100g: 884, proteinasP100g: 0, carboidratosP100g: 0, gordurasP100g: 100, fibrasP100g: 0, categoria: 'Óleos e Gorduras' },
    { nome: 'Castanha do Pará', nomePopular: 'Castanha do Pará', caloriasP100g: 656, proteinasP100g: 14.3, carboidratosP100g: 11.7, gordurasP100g: 63.5, fibrasP100g: 7.5, categoria: 'Oleaginosas' },
    { nome: 'Amendoim Tostado', nomePopular: 'Amendoim', caloriasP100g: 581, proteinasP100g: 26.2, carboidratosP100g: 18.9, gordurasP100g: 46.7, fibrasP100g: 6.0, categoria: 'Oleaginosas' },
  ];

  for (const a of alimentos) {
    const id = `seed-${a.nome.toLowerCase().replace(/[\s()°/áàãâéêíóôõúç]/g, (c) => ({ ' ': '-', 'á': 'a', 'à': 'a', 'ã': 'a', 'â': 'a', 'é': 'e', 'ê': 'e', 'í': 'i', 'ó': 'o', 'ô': 'o', 'õ': 'o', 'ú': 'u', 'ç': 'c' }[c] || ''))}`;
    await upsertById('alimentos', id, { ...a, personalizado: false });
  }
  console.log(`  ✅ ${alimentos.length} alimentos inseridos.\n`);

  // ─── Exercícios ────────────────────────────────────────────────
  console.log('🏋️ Inserindo exercícios...');
  const exercicios = [
    { nome: 'Supino Reto com Barra', grupoMuscular: 'Peito', equipamento: 'Barra', nivel: 'INTERMEDIARIO', descricao: 'Exercício composto para desenvolvimento do peitoral maior.' },
    { nome: 'Supino Reto com Halteres', grupoMuscular: 'Peito', equipamento: 'Halteres', nivel: 'INICIANTE', descricao: 'Variação do supino com maior amplitude de movimento.' },
    { nome: 'Crucifixo com Halteres', grupoMuscular: 'Peito', grupoSecundario: 'Ombros', equipamento: 'Halteres', nivel: 'INICIANTE', descricao: 'Isola o peitoral com movimento de adução horizontal.' },
    { nome: 'Flexão de Braço', grupoMuscular: 'Peito', grupoSecundario: 'Tríceps', equipamento: 'Peso Corporal', nivel: 'INICIANTE', descricao: 'Exercício básico sem equipamento para peito e tríceps.' },
    { nome: 'Puxada Frontal', grupoMuscular: 'Costas', grupoSecundario: 'Bíceps', equipamento: 'Polia', nivel: 'INICIANTE', descricao: 'Exercício vertical para desenvolver o grande dorsal.' },
    { nome: 'Remada Curvada com Barra', grupoMuscular: 'Costas', grupoSecundario: 'Bíceps', equipamento: 'Barra', nivel: 'INTERMEDIARIO', descricao: 'Excelente exercício para espessura das costas.' },
    { nome: 'Levantamento Terra', grupoMuscular: 'Costas', grupoSecundario: 'Pernas', equipamento: 'Barra', nivel: 'AVANCADO', descricao: 'Exercício composto completo, um dos mais importantes.' },
    { nome: 'Barra Fixa', grupoMuscular: 'Costas', grupoSecundario: 'Bíceps', equipamento: 'Barra Fixa', nivel: 'INTERMEDIARIO', descricao: 'Exercício clássico com peso corporal para costas.' },
    { nome: 'Desenvolvimento com Halteres', grupoMuscular: 'Ombros', equipamento: 'Halteres', nivel: 'INICIANTE', descricao: 'Exercício composto para desenvolvimento dos deltoides.' },
    { nome: 'Elevação Lateral', grupoMuscular: 'Ombros', equipamento: 'Halteres', nivel: 'INICIANTE', descricao: 'Isola o deltoide medial para largura dos ombros.' },
    { nome: 'Face Pull', grupoMuscular: 'Ombros', grupoSecundario: 'Costas', equipamento: 'Polia', nivel: 'INICIANTE', descricao: 'Ótimo exercício para o manguito rotador e trapézio.' },
    { nome: 'Rosca Direta com Barra', grupoMuscular: 'Bíceps', equipamento: 'Barra', nivel: 'INICIANTE', descricao: 'Exercício clássico de isolamento para bíceps.' },
    { nome: 'Rosca Alternada com Halteres', grupoMuscular: 'Bíceps', equipamento: 'Halteres', nivel: 'INICIANTE', descricao: 'Permite maior amplitude e supinação do punho.' },
    { nome: 'Tríceps Testa com Barra', grupoMuscular: 'Tríceps', equipamento: 'Barra', nivel: 'INICIANTE', descricao: 'Exercício de isolamento para tríceps longo.' },
    { nome: 'Tríceps Polia (Pulley)', grupoMuscular: 'Tríceps', equipamento: 'Polia', nivel: 'INICIANTE', descricao: 'Extensão de cotovelo na polia alta.' },
    { nome: 'Agachamento Livre', grupoMuscular: 'Quadríceps', grupoSecundario: 'Glúteos', equipamento: 'Barra', nivel: 'INTERMEDIARIO', descricao: 'O rei dos exercícios de perna.' },
    { nome: 'Leg Press 45°', grupoMuscular: 'Quadríceps', grupoSecundario: 'Glúteos', equipamento: 'Máquina', nivel: 'INICIANTE', descricao: 'Alternativa ao agachamento com mais sobrecarga.' },
    { nome: 'Extensão de Perna', grupoMuscular: 'Quadríceps', equipamento: 'Máquina', nivel: 'INICIANTE', descricao: 'Isolamento do quadríceps.' },
    { nome: 'Mesa Flexora', grupoMuscular: 'Posterior de Coxa', equipamento: 'Máquina', nivel: 'INICIANTE', descricao: 'Isolamento da cadeia posterior da coxa.' },
    { nome: 'Elevação Pélvica (Hip Thrust)', grupoMuscular: 'Glúteos', grupoSecundario: 'Posterior de Coxa', equipamento: 'Barra', nivel: 'INICIANTE', descricao: 'Melhor exercício para ativação dos glúteos.' },
    { nome: 'Panturrilha em Pé', grupoMuscular: 'Panturrilha', equipamento: 'Máquina', nivel: 'INICIANTE', descricao: 'Desenvolvimento do gastrocnêmio.' },
    { nome: 'Abdominal Crunch', grupoMuscular: 'Abdômen', equipamento: 'Peso Corporal', nivel: 'INICIANTE', descricao: 'Exercício básico para o reto abdominal.' },
    { nome: 'Prancha Abdominal', grupoMuscular: 'Abdômen', grupoSecundario: 'Core', equipamento: 'Peso Corporal', nivel: 'INICIANTE', descricao: 'Isométrico para estabilização do core.' },
  ];

  for (const e of exercicios) {
    const id = `seed-${e.nome.toLowerCase().replace(/[\s()°/áàãâéêíóôõúç]/g, (c) => ({ ' ': '-', '(': '', ')': '', '°': '', '/': '-', 'á': 'a', 'à': 'a', 'ã': 'a', 'â': 'a', 'é': 'e', 'ê': 'e', 'í': 'i', 'ó': 'o', 'ô': 'o', 'õ': 'o', 'ú': 'u', 'ç': 'c' }[c] || ''))}`;
    await upsertById('exercicios', id, { ...e, grupoSecundario: (e as any).grupoSecundario || null, personalizado: false });
  }
  console.log(`  ✅ ${exercicios.length} exercícios inseridos.\n`);

  console.log('✅ Seed Firebase concluído!');
  console.log('\n📋 Acesso padrão:');
  console.log('   Email: admin@nutrisistema.com');
  console.log('   Senha: nutri123\n');
  process.exit(0);
}

main().catch((e) => { console.error('❌ Erro no seed:', e); process.exit(1); });
