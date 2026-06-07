/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI, Type } from '@google/genai';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = 3000;

// Parse JSON bodies
app.use(express.json());

// Initialize Gemini client (server-side only)
const apiKey = process.env.GEMINI_API_KEY;

let ai: GoogleGenAI | null = null;
if (apiKey) {
  ai = new GoogleGenAI({
    apiKey: apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
} else {
  console.warn('AVISO: A variável de ambiente GEMINI_API_KEY não está configurada.');
}

// Health check route
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', hasGeminiKey: !!apiKey });
});

// Chat route with Virtual Secretary Irmã Maria
app.post('/api/chat', async (req, res) => {
  const { messages, userMessage } = req.body;

  if (!ai) {
    return res.status(500).json({
      error: 'O serviço de IA não está configurado. Cadastre as chaves de API nos segredos do AI Studio.',
    });
  }

  try {
    const systemInstruction = 
      "Você é a Irmã Maria, uma prestativa e organizada Secretária Virtual Paroquial que auxilia missionários católicos a organizar sua rotina, missões e projetos de evangelização. " +
      "Seu tom é sempre amigável, pastoral, cuidadoso e encorajador. Você pode dar conselhos pastorais úteis (ex: quais leituras sugerir, materiais litúrgicos para preparar, checklists). " +
      "Se o usuário pedir ou descrever a criação de um evento/missão/projeto (ex: 'Marca aí uma missa da RCC para o dia 12 às 20h'), identifique as informações e preencha a propriedade `suggestedEvent`. " +
      "Valores aceitáveis para o campo `movement`: 'rcc', 'ejns', 'shalom', 'vincentinos', 'cancao_nova', 'terco_homens', 'paroquial'. " +
      "Para a data, o ano atual é 2026. Data de referência de hoje: 6 de Junho de 2026. " +
      "Se a entrada for vaga ou para ideias futuras sem data fixa, coloque o `status` do evento como 'backlog' e deixe a data em branco. " +
      "Sua resposta DEVE ser estritamente em formato JSON seguindo o esquema fornecido.";

    // Format chat history for Gemini
    const contents = messages.map((m: any) => ({
      role: m.sender === 'user' ? 'user' : 'model',
      parts: [{ text: m.text }],
    }));

    // Add current user prompt
    contents.push({
      role: 'user',
      parts: [{ text: userMessage }],
    });

    const response = await ai.models.generateContent({
      model: 'gemini-3.5-flash',
      contents: contents,
      config: {
        systemInstruction: systemInstruction,
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            text: {
              type: Type.STRING,
              description: 'Resposta de texto encorajadora e pastoral da Irmã Maria.',
            },
            suggestedEvent: {
              type: Type.OBJECT,
              description: 'O compromisso sugerido derivado da conversa, ou null se não houver um compromisso específico a agendar.',
              properties: {
                title: { type: Type.STRING, description: 'Título claro do compromisso ou missão' },
                movement: { type: Type.STRING, description: 'Um dos valores litúrgicos/movimentos permitidos' },
                dateStr: { type: Type.STRING, description: 'Data no formato YYYY-MM-DD (deixe em branco para backlog)' },
                startTime: { type: Type.STRING, description: 'Hora de início no formato HH:MM' },
                endTime: { type: Type.STRING, description: 'Hora de término no formato HH:MM (ex: 1 hora depois do início se desconhecido)' },
                location: { type: Type.STRING, description: 'Salão, capela, igreja ou endereço' },
                description: { type: Type.STRING, description: 'Notas litúrgicas ou objetivos da missão' },
                musicMinister: { type: Type.STRING, description: 'Ministério de Música sugerido' },
                readers: { type: Type.STRING, description: 'Leitores ou equipe de liturgia sugerida' },
                status: { type: Type.STRING, description: 'preparing, confirmed ou backlog' },
              }
            }
          },
          required: ['text'],
        },
      },
    });

    const textOutput = response.text || '{}';
    const parsedData = JSON.parse(textOutput);
    res.json(parsedData);
  } catch (error: any) {
    console.error('Erro na chamada da API Gemini:', error);
    res.status(500).json({
      error: 'Desculpe, a Irmã Maria teve um problema ao processar seu pedido. Tente novamente mais tarde.',
      details: error.message,
    });
  }
});

// Vite middleware flow
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Servidor rodando em http://localhost:${PORT}`);
  });
}

startServer();
