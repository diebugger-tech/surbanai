import React, { useState, useEffect, useRef } from 'react';
import db from '../lib/db';

const KAiPanel = ({ aktiveProjekt, onClose }) => {
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [ollamaOnline, setOllamaOnline] = useState(false);
  const [ollamaModels, setOllamaModels] = useState([]);
  const [aktivesModel, setAktivesModel] = useState(
    localStorage.getItem('kai_ollama_model') || 'qwen3:32b'
  );
  const messagesEndRef = useRef(null);

  // Ollama Status + Modelle laden
  useEffect(() => {
    const checkOllama = async () => {
      try {
        const res = await fetch('http://localhost:11434/api/tags');
        if (!res.ok) throw new Error('Offline');
        const data = await res.json();
        const models = data.models?.map(m => m.name) || [];
        setOllamaModels(models);
        setOllamaOnline(true);
        
        // Wenn das gespeicherte Modell nicht existiert, nimm das erste verfügbare
        if (models.length > 0) {
          const stored = localStorage.getItem('kai_ollama_model');
          if (!stored || !models.includes(stored)) {
            setAktivesModel(models[0]);
          }
        }
      } catch (err) {
        setOllamaOnline(false);
      }
    };
    checkOllama();
    // Poll status every 30s
    const timer = setInterval(checkOllama, 30000);
    return () => clearInterval(timer);
  }, []);

  // Auto-scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Wiki-Kontext laden
  const loadWikiKontext = async (projektName) => {
    if (!projektName) return '';
    try {
      // Abfrage der Wiki-Einträge für dieses Projekt
      const wiki = await db.query(
        'SELECT titel, inhalt FROM wiki WHERE projekt = $name LIMIT 10',
        { name: projektName }
      );
      
      // SurrealDB gibt ein Array von Result-Sets zurück
      const entries = Array.isArray(wiki[0]) ? wiki[0] : [];
      const wikiText = entries.map(e => `${e.titel}: ${e.inhalt}`).join('\n') || '';
      
      if (!wikiText) return '';
      return ('Wiki-Kontext fuer ' + projektName + ':\n' + wikiText).slice(0, 2000);
    } catch (err) { 
      console.warn('[KAi] Kontext-Load Fehler:', err);
      return ''; 
    }
  };

  // Ollama API Call
  const askKaiOllama = async (userMessage) => {
    const kontext = await loadWikiKontext(aktiveProjekt?.name);
    const systemPrompt = [
      'Du bist KAi, KI-Assistent von KAiOSS.',
      'Antworte auf natürliche Sprache — du bist kein Terminal und führst keine Befehle aus.',
      'Antworte präzise und hilfreich.',
      kontext ? '\n' + kontext : ''
    ].join('\n');

    try {
      const res = await fetch('http://localhost:11434/api/chat', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          model: aktivesModel,
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userMessage }
          ],
          stream: false
        })
      });

      if (!res.ok) throw new Error('Ollama Error ' + res.status);
      
      const data = await res.json();
      return data.message?.content || '> keine Antwort';
    } catch (err) {
      console.error('[KAi] API Fehler:', err);
      throw err;
    }
  };

  const handleSend = async () => {
    if (!input.trim() || loading || !ollamaOnline) return;
    const frage = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: frage }]);
    setLoading(true);
    try {
      const antwort = await askKaiOllama(frage);
      setMessages(prev => [...prev, { role: 'kai', content: antwort }]);
    } catch (err) {
      setMessages(prev => [...prev, { 
        role: 'kai', 
        content: '> Ollama nicht erreichbar.\n> Tipp: ollama serve starten oder Modell prüfen.' 
      }]);
    }
    setLoading(false);
  };

  return (
    <div style={styles.panel}>
      {/* Header */}
      <div style={styles.header}>
        <span style={styles.title}>{'> KAi_ASSISTANT'}</span>
        <div style={styles.headerRight}>
          <span style={{ fontSize: '11px', fontFamily: 'monospace', color: ollamaOnline ? '#1D9E75' : '#E24B4A' }}>
            {ollamaOnline ? '● ONLINE' : '● OFFLINE'}
          </span>
          {ollamaOnline && ollamaModels.length > 0 && (
            <select
              value={aktivesModel}
              onChange={(e) => {
                setAktivesModel(e.target.value);
                localStorage.setItem('kai_ollama_model', e.target.value);
              }}
              style={styles.modelSelect}
            >
              {ollamaModels.map(m => <option key={m} value={m}>{m}</option>)}
            </select>
          )}
          <button onClick={onClose} style={styles.esc}>ESC_CLOSE</button>
        </div>
      </div>

      {/* Kontext-Bar */}
      {aktiveProjekt && (
        <div style={styles.kontextBar}>
          {'> Kontext: ' + aktiveProjekt.name + ' | Modell: ' + aktivesModel}
        </div>
      )}

      {/* Messages */}
      <div style={styles.messages}>
        {messages.length === 0 && (
          <div style={styles.welcome}>
            {'> KAiOSS KAi-Assistant bereit.'}<br />
            {'> Projekt: ' + (aktiveProjekt?.name || 'keins gewaehlt')}<br />
            {'> Wiki-Kontext wird automatisch geladen.'}<br />
            {'> Stell mir eine Frage...'}<br />
          </div>
        )}
        {messages.map((msg, i) => (
          <div key={i} style={msg.role === 'user' ? styles.userMsg : styles.kaiMsg}>
            <span style={{ ...styles.msgLabel, color: msg.role === 'user' ? '#888' : '#1D9E75' }}>
              {msg.role === 'user' ? '> Du:' : '> KAi:'}
            </span>
            <pre style={styles.msgContent}>{msg.content}</pre>
          </div>
        ))}
        {loading && (
          <div style={styles.kaiMsg}>
            <span style={{ ...styles.msgLabel, color: '#1D9E75' }}>{'> KAi:'}</span>
            <span style={{ fontFamily: 'monospace', color: '#1D9E75', fontSize: '13px' }}>
              {'denkt nach... █▒▒'}
            </span>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div style={styles.inputRow}>
        <span style={{ color: '#1D9E75', fontSize: '14px', fontFamily: 'monospace' }}>{'>'}</span>
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSend()}
          placeholder={ollamaOnline ? 'ASK_SOMETHING...' : 'OLLAMA_OFFLINE -- ollama serve starten'}
          disabled={!ollamaOnline || loading}
          style={styles.input}
          autoFocus
        />
        <button onClick={handleSend} disabled={!ollamaOnline || loading} style={styles.sendBtn}>
          SEND
        </button>
      </div>
    </div>
  );
};

const styles = {
  panel: { 
    display: 'flex', 
    flexDirection: 'column', 
    height: '100%', 
    fontFamily: 'monospace', 
    background: 'var(--bg-primary, #0d1117)', 
    border: '1px solid var(--border, #30363d)', 
    borderRadius: '8px', 
    overflow: 'hidden',
    position: 'relative'
  },
  header: { 
    display: 'flex', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    padding: '8px 12px', 
    borderBottom: '1px solid var(--border, #30363d)', 
    background: 'var(--bg-secondary, #161b22)' 
  },
  title: { color: '#1D9E75', fontSize: '12px', fontWeight: '500' },
  headerRight: { display: 'flex', alignItems: 'center', gap: '8px' },
  modelSelect: { 
    fontSize: '11px', 
    fontFamily: 'monospace', 
    background: 'var(--bg-primary, #0d1117)', 
    color: 'var(--text-primary, #e6edf3)', 
    border: '1px solid var(--border, #30363d)', 
    borderRadius: '4px', 
    padding: '2px 4px',
    outline: 'none'
  },
  esc: { 
    fontSize: '11px', 
    fontFamily: 'monospace', 
    background: 'none', 
    border: '1px solid var(--border, #30363d)', 
    color: 'var(--text-secondary, #8b949e)', 
    borderRadius: '4px', 
    padding: '2px 6px', 
    cursor: 'pointer' 
  },
  kontextBar: { 
    padding: '4px 12px', 
    fontSize: '11px', 
    color: '#1D9E75', 
    borderBottom: '1px dashed var(--border, #30363d)', 
    opacity: 0.7, 
    background: 'var(--bg-secondary, #161b22)' 
  },
  messages: { 
    flex: 1, 
    overflowY: 'auto', 
    padding: '12px', 
    display: 'flex', 
    flexDirection: 'column', 
    gap: '10px' 
  },
  welcome: { color: 'var(--text-secondary, #8b949e)', fontSize: '12px', lineHeight: '1.8' },
  userMsg: { display: 'flex', flexDirection: 'column', gap: '2px' },
  kaiMsg: { 
    display: 'flex', 
    flexDirection: 'column', 
    gap: '2px', 
    paddingLeft: '8px', 
    borderLeft: '2px solid #1D9E75' 
  },
  msgLabel: { fontSize: '11px', fontWeight: '500' },
  msgContent: { 
    fontSize: '13px', 
    color: 'var(--text-primary, #e6edf3)', 
    lineHeight: '1.6', 
    whiteSpace: 'pre-wrap', 
    margin: 0, 
    fontFamily: 'monospace' 
  },
  inputRow: { 
    display: 'flex', 
    alignItems: 'center', 
    gap: '8px', 
    padding: '8px 12px', 
    borderTop: '1px solid var(--border, #30363d)', 
    background: 'var(--bg-secondary, #161b22)' 
  },
  input: { 
    flex: 1, 
    background: 'none', 
    border: 'none', 
    color: 'var(--text-primary, #e6edf3)', 
    fontFamily: 'monospace', 
    fontSize: '13px', 
    outline: 'none' 
  },
  sendBtn: { 
    fontSize: '11px', 
    fontFamily: 'monospace', 
    background: 'none', 
    border: '1px solid #1D9E75', 
    color: '#1D9E75', 
    borderRadius: '4px', 
    padding: '3px 8px', 
    cursor: 'pointer' 
  },
};

export default KAiPanel;
