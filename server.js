import 'dotenv/config';
import express from 'express';
import fetch from 'node-fetch';
import cors from 'cors';

console.log('ASAS_API_KEY:', process.env.ASAS_API_KEY);

const app = express();
const PORT = 4000;

app.use(cors()); // Permite requisições do seu frontend
app.use(express.json());

// Proxy para criar cliente no Asaas
app.post('/api/asaas/customers', async (req, res) => {
  try {
    const response = await fetch('https://api-sandbox.asaas.com/v3/customers', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'access_token': process.env.ASAS_API_KEY,
      },
      body: JSON.stringify(req.body),
    });

    const text = await response.text();
    let data;
    try {
      data = text ? JSON.parse(text) : {};
    } catch (e) {
      data = { raw: text };
    }
    res.status(response.status).json(data);
  } catch (err) {
    console.error('Erro ao comunicar com o Asaas:', err);
    res.status(500).json({ error: 'Erro interno ao comunicar com o Asaas' });
  }
});

app.listen(PORT, () => {
  console.log(`Backend proxy rodando em http://localhost:${PORT}`);
});