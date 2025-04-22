// src/pages/api/asaas-webhook.ts
import type { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const event = req.body;

  // Processar o evento recebido do Asaas
  // Exemplo: atualizar status da assinatura no Supabase

  res.status(200).json({ received: true });
}
