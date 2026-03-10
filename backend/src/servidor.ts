import 'dotenv/config';
import app from './app';

const PORTA = process.env.PORTA ? parseInt(process.env.PORTA) : 3001;

app.listen(PORTA, () => {
  console.log(`\n🥗 NutriSistema Backend rodando na porta ${PORTA}`);
  console.log(`📡 Ambiente: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🌐 URL: http://localhost:${PORTA}\n`);
});
