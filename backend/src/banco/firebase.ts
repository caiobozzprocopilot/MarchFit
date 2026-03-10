import 'dotenv/config';
import * as admin from 'firebase-admin';
import * as path from 'path';
import * as fs from 'fs';

const serviceAccountPath = path.resolve(__dirname, '../../serviceAccountKey.json');

if (!admin.apps.length) {
  if (!fs.existsSync(serviceAccountPath)) {
    throw new Error(
      '❌  serviceAccountKey.json não encontrado.\n' +
      '    Acesse: Firebase Console → Configurações do Projeto → Contas de Serviço\n' +
      '    → Gerar nova chave privada → salve como serviceAccountKey.json na pasta backend/'
    );
  }
  const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf8'));
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    projectId: 'nutrisystem-1fdf6',
  });
}

export const db = admin.firestore();
export default admin;
