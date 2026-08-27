import Groq from 'groq-sdk';
import { config, systemPrompt } from '../config/index.js';

export class GroqService {
  constructor() {
    if (!config.groq.apiKey) {
      console.warn('GROQ_API_KEY no configurado. El chat no funcionara.');
      this.client = null;
    } else {
      this.client = new Groq({
        apiKey: config.groq.apiKey,
      });
    }
    this.model = config.groq.model;
  }

  async chat(userMessage, context = '', conversationHistory = []) {
    if (!this.client) {
      return 'El servicio de IA no esta configurado. Por favor configura GROQ_API_KEY en .env';
    }

    try {
      const messages = [
        {
          role: 'system',
          content: systemPrompt + '\n\nCONTEXTO DE CONOCIMIENTO:\n' + context
        },
        ...conversationHistory.slice(-6).map(msg => ({
          role: msg.role,
          content: msg.content
        })),
        {
          role: 'user',
          content: userMessage
        }
      ];

      const completion = await this.client.chat.completions.create({
        model: this.model,
        messages,
        temperature: 0.7,
        max_tokens: 2048,
        top_p: 0.9,
        stream: false
      });

      return completion.choices[0]?.message?.content || 'No pude generar una respuesta.';
    } catch (error) {
      console.error('Error en Groq API:', error.message);
      if (error.status === 401) {
        return 'Error de autenticacion con Groq. Verifica tu API key.';
      }
      if (error.status === 429) {
        return 'Demasiadas peticiones. Espera un momento e intenta de nuevo.';
      }
      return 'Hubo un error procesando tu consulta. Por favor intenta de nuevo.';
    }
  }

  async chatStream(userMessage, context = '', conversationHistory = [], onChunk) {
    if (!this.client) {
      onChunk('El servicio de IA no esta configurado.');
      return;
    }

    try {
      const messages = [
        {
          role: 'system',
          content: systemPrompt + '\n\nCONTEXTO DE CONOCIMIENTO:\n' + context
        },
        ...conversationHistory.slice(-6).map(msg => ({
          role: msg.role,
          content: msg.content
        })),
        {
          role: 'user',
          content: userMessage
        }
      ];

      const stream = await this.client.chat.completions.create({
        model: this.model,
        messages,
        temperature: 0.7,
        max_tokens: 2048,
        top_p: 0.9,
        stream: true
      });

      for await (const chunk of stream) {
        const content = chunk.choices[0]?.delta?.content || '';
        if (content) {
          onChunk(content);
        }
      }
    } catch (error) {
      console.error('Error en Groq Stream:', error.message);
      onChunk('Error al generar respuesta.');
    }
  }
}