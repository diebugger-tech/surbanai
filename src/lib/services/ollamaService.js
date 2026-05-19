const OLLAMA_HOST = import.meta.env.VITE_OLLAMA_URL || 'http://localhost:11434';

/**
 * OllamaService
 * Service layer for interacting with local Ollama API endpoints.
 */
export const ollamaService = {
  /**
   * Check if the Ollama local API is online and responding.
   */
  checkHealth: async () => {
    try {
      const res = await fetch(`${OLLAMA_HOST}/api/tags`);
      return res.ok;
    } catch (err) {
      return false;
    }
  },

  /**
   * Downloads (pulls) a model from the Ollama library.
   * Calls onProgress(status, percentage).
   */
  pullModel: async (modelName, onProgress) => {
    const res = await fetch(`${OLLAMA_HOST}/api/pull`, {
      method: 'POST',
      body: JSON.stringify({ name: modelName })
    });

    if (!res.ok) {
      throw new Error(`Failed to pull model: ${res.statusText}`);
    }

    if (!res.body) {
      throw new Error('ReadableStream not supported');
    }

    const reader = res.body.getReader();
    const decoder = new TextDecoder();

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      const chunk = decoder.decode(value);
      const lines = chunk.split('\n');
      for (const line of lines) {
        if (!line.trim()) continue;
        try {
          const json = JSON.parse(line);
          if (json.status) {
            const pct = json.completed && json.total ? Math.round((json.completed / json.total) * 100) : 0;
            onProgress(json.status, pct);
          }
        } catch (e) {
          // Ignore JSON parsing errors for partial stream chunks
        }
      }
    }
  },

  /**
   * Streams a chat completion response.
   * Calls onChunk(fullContentAccumulated) as tokens arrive.
   */
  chatStream: async (endpoint, modelName, messages, onChunk) => {
    // Endpoints in models.config.js are absolute (e.g. 'http://localhost:11434/api/chat')
    const url = endpoint || `${OLLAMA_HOST}/api/chat`;
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        model: modelName,
        messages,
        stream: true
      })
    });

    if (!res.ok) {
      if (res.status === 404) {
        throw new Error('MODEL_NOT_FOUND');
      }
      throw new Error(`Ollama API Error: ${res.status}`);
    }

    if (!res.body) {
      throw new Error('ReadableStream not supported');
    }

    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let fullContent = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      const chunk = decoder.decode(value, { stream: true });
      const lines = chunk.split('\n');

      for (const line of lines) {
        if (!line.trim()) continue;
        try {
          const json = JSON.parse(line);
          if (json.message?.content) {
            fullContent += json.message.content;
            onChunk(fullContent);
          }
        } catch (e) {
          // Ignore parsing errors for incomplete lines
        }
      }
    }
    return fullContent;
  },

  /**
   * Generates a non-streaming prompt response.
   * Used in TodoPanel and CommandPalette.
   */
  generateCompletion: async (modelName, prompt) => {
    const res = await fetch(`${OLLAMA_HOST}/api/generate`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        model: modelName,
        prompt,
        stream: false
      })
    });

    if (!res.ok) {
      throw new Error(`Ollama generate error: ${res.status}`);
    }

    const json = await res.json();
    return json.response?.trim() || '';
  }
};
