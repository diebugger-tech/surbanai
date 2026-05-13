// DSGVO-Klassifizierung: green = lokal/EU, yellow = USA (DPF), red = China (kein DPF)
export const DSGVO_KLASSE = {
  GREEN: 'green',
  YELLOW: 'yellow',
  RED: 'red',
};

export const DSGVO_LABEL = {
  green: '🟢 Lokal / EU — kein Datentransfer',
  yellow: '🟡 USA — Drittlandtransfer (DPF-zertifiziert)',
  red: '🔴 China — kein DPF, Datensicherheitsgesetz gilt',
};

export const DSGVO_TOAST = {
  yellow: (anbieter) => `⚠️ Dieses Modell überträgt Daten an ${anbieter} (USA). DPF-zertifiziert, aber Drittlandtransfer.`,
  red: (anbieter) => `⚠️ Dieses Modell überträgt Daten an ${anbieter} (China). Chinesisches Datensicherheitsgesetz gilt — kein EU-Datenschutz.`,
};

export const MODELLE = [
  // LOKAL (immer 🟢)
  { id: 'ollama-qwen', label: 'Qwen2.5:7b (lokal)', endpoint: 'http://localhost:11434/api/chat', model: 'qwen2.5:latest', typ: 'ollama', dsgvo: DSGVO_KLASSE.GREEN },
  { id: 'ollama-qwen-coder', label: 'Qwen2.5-Coder:7b (lokal)', endpoint: 'http://localhost:11434/api/chat', model: 'qwen2.5-coder:7b', typ: 'ollama', dsgvo: DSGVO_KLASSE.GREEN },
  { id: 'ollama-gemma', label: 'Gemma3:12b (lokal)', endpoint: 'http://localhost:11434/api/chat', model: 'gemma3:12b', typ: 'ollama', dsgvo: DSGVO_KLASSE.GREEN },
  { id: 'ollama-mistral', label: 'Mistral (lokal)', endpoint: 'http://localhost:11434/api/chat', model: 'mistral:latest', typ: 'ollama', dsgvo: DSGVO_KLASSE.GREEN },
  { id: 'ollama-deepseek', label: 'DeepSeek-R1 (lokal)', endpoint: 'http://localhost:11434/api/chat', model: 'deepseek-r1:7b', typ: 'ollama', dsgvo: DSGVO_KLASSE.GREEN },

  // EU (🟢)
  { id: 'mistral-api', label: 'Mistral API (EU)', endpoint: 'https://api.mistral.ai/v1/chat/completions', model: 'mistral-small-latest', typ: 'openai-compat', anbieter: 'Mistral AI', dsgvo: DSGVO_KLASSE.GREEN },

  // USA (🟡)
  { id: 'claude-api', label: 'Claude API (Anthropic)', endpoint: 'https://api.anthropic.com/v1/messages', model: 'claude-sonnet-4-20250514', typ: 'claude', anbieter: 'Anthropic', dsgvo: DSGVO_KLASSE.YELLOW },
  { id: 'gemini-api', label: 'Gemini API (Google)', endpoint: 'https://generativelanguage.googleapis.com/v1beta/models', model: 'gemini-2.0-flash', typ: 'gemini', anbieter: 'Google', dsgvo: DSGVO_KLASSE.YELLOW },
  { id: 'groq-api', label: 'Groq API', endpoint: 'https://api.groq.com/openai/v1/chat/completions', model: 'qwen-qwq-32b', typ: 'openai-compat', anbieter: 'Groq', dsgvo: DSGVO_KLASSE.YELLOW },
  { id: 'openai-api', label: 'OpenAI API', endpoint: 'https://api.openai.com/v1/chat/completions', model: 'gpt-4o-mini', typ: 'openai-compat', anbieter: 'OpenAI', dsgvo: DSGVO_KLASSE.YELLOW },

  // CHINA (🔴) — nur lokal via Ollama empfohlen
  { id: 'qwen-api', label: 'Qwen API (Alibaba Cloud)', endpoint: 'https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions', model: 'qwen-max', typ: 'openai-compat', anbieter: 'Alibaba', dsgvo: DSGVO_KLASSE.RED },
  { id: 'deepseek-api', label: 'DeepSeek API', endpoint: 'https://api.deepseek.com/v1/chat/completions', model: 'deepseek-chat', typ: 'openai-compat', anbieter: 'DeepSeek', dsgvo: DSGVO_KLASSE.RED },
  { id: 'glm-api', label: 'GLM API (Zhipu AI)', endpoint: 'https://open.bigmodel.cn/api/paas/v4/chat/completions', model: 'glm-4-flash', typ: 'openai-compat', anbieter: 'Zhipu AI', dsgvo: DSGVO_KLASSE.RED },
];

export default MODELLE;
