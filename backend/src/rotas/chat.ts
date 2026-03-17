import { Router } from 'express';
import { enviarWaha, webhookWaha } from '../controladores/chat';

const router = Router();

// POST /api/waha/enviar  — chamado pelo frontend para relay via WhatsApp
router.post('/enviar', enviarWaha);

// POST /api/waha/webhook — endpoint para o WAHA notificar mensagens recebidas
// Configure no painel WAHA: Webhook URL = <seu-backend>/api/waha/webhook
router.post('/webhook', webhookWaha);

export { router as rotasChat };
