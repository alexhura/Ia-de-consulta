import Groq from 'groq-sdk';
import { config, systemPrompt } from '../config/index.js';

export class GroqService {
  constructor() {
    if (!config.groq.apiKey) {
      console.warn('GROQ_API_KEY no configurado. El chat no funcionara.');
      this.client = null;
    } else {
      // En Cloudflare (workerd) el SDK puede resolver un "fetch" de Node.js
      // (node-fetch) que falla internamente. Forzamos el fetch nativo del
      // runtime (Workers/Node) y desactivamos el agente HTTP custom.
      this.client = new Groq({
        apiKey: config.groq.apiKey,
        fetch: (...args) => fetch(...args),
        httpAgent: false,
        maxRetries: 2
      });
    }
    this.model = config.groq.model;
    this.visionModel = config.groq.visionModel;
    this.whisperModel = config.groq.whisperModel;
  }

  buildUserContent(userMessage, images) {
    const list = Array.isArray(images) ? images : (images ? [images] : []);
    if (!list.length) return userMessage;
    return [
      { type: 'text', text: userMessage },
      ...list.map(img => ({ type: 'image_url', image_url: { url: img } }))
    ];
  }

  async chat(userMessage, context = '', conversationHistory = [], images = null) {
    if (!this.client) {
      return 'El servicio de IA no esta configurado. Por favor configura GROQ_API_KEY en .env';
    }

    const hasImages = (Array.isArray(images) ? images : (images ? [images] : [])).length > 0;

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
          content: this.buildUserContent(userMessage, images)
        }
      ];

      const completion = await this.client.chat.completions.create({
        model: hasImages ? this.visionModel : this.model,
        messages,
        temperature: 0.7,
        max_tokens: 2048,
        top_p: 0.9,
        stream: false
      });

      const message = completion.choices[0]?.message || {};
      // Los modelos razonadores (gpt-oss) entregan la respuesta final en
      // "content"; si viene vacía usamos "reasoning" como respaldo.
      return message.content || message.reasoning || 'No pude generar una respuesta.';
    } catch (error) {
      console.error('Error en Groq API:', error.message);
      console.error('   cause:', error.cause && (error.cause.message || error.cause.name || String(error.cause)));
      console.error('   stack:', (error.stack || '').split('\n').slice(0, 6).join('\n'));
      if (error.status === 401) {
        return 'Error de autenticacion con Groq. Verifica tu API key.';
      }
      if (error.status === 429) {
        return 'Demasiadas peticiones. Espera un momento e intenta de nuevo.';
      }
      return 'Hubo un error procesando tu consulta. Por favor intenta de nuevo.';
    }
  }

  async chatStream(userMessage, context = '', conversationHistory = [], onChunk, images = null) {
    if (!this.client) {
      onChunk('El servicio de IA no esta configurado.');
      return;
    }

    const hasImages = (Array.isArray(images) ? images : (images ? [images] : [])).length > 0;

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
          content: this.buildUserContent(userMessage, images)
        }
      ];

      const stream = await this.client.chat.completions.create({
        model: hasImages ? this.visionModel : this.model,
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

  // Pide al modelo de visión que extraiga la URL de una página web visible
  // en la imagen (p.ej. captura donde aparece la dirección del sitio).
  async extractUrlFromImage(image) {
    if (!this.client) throw new Error('Groq no configurado');
    const res = await this.client.chat.completions.create({
      model: this.visionModel,
      messages: [
        {
          role: 'system',
          content: 'Eres un extractor de URLs. Lee la imagen y devuelve SOLO la URL de una página web que aparezca visible en ella (una URL de un sitio, no un buscador genérico). Si no ves ninguna URL clara, responde exactamente la palabra: ninguno'
        },
        {
          role: 'user',
          content: this.buildUserContent('¿Qué URL de una página web aparece en esta imagen? Responde solo la URL.', image)
        }
      ],
      temperature: 0,
      max_tokens: 220,
      stream: false
    });
    return (res.choices[0]?.message?.content || '').trim();
  }

  // Transcribe audio (por dictado) usando Whisper de Groq.
  // audioBase64: cadena base64 sin prefijo "data:".
  async transcribe(audioBase64, mime = 'audio/webm') {
    if (!this.client) throw new Error('Groq no configurado');

    const binary = atob(audioBase64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);

    const ext = (mime.match(/audio\/(\w+)/) || [])[1] || 'webm';
    const form = new FormData();
    form.append('model', this.whisperModel);
    form.append('file', new Blob([bytes], { type: mime }), `audio.${ext}`);

    const response = await fetch(`${config.groq.baseUrl}/audio/transcriptions`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${config.groq.apiKey}` },
      body: form
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error?.message || `Error al transcribir (${response.status})`);
    }
    if (!data.text || !data.text.trim()) {
      throw new Error('No se detectó voz en el audio. Intenta de nuevo.');
    }
    return data.text.trim();
  }
}