import React, { useState, useEffect, useRef } from 'react';
import db from '../lib/db';
import MODELLE, { DSGVO_LABEL, DSGVO_TOAST } from '../config/models.config.js';

const KAiPanel = ({ aktiveProjekt, onClose, onOpenWiki }) => {
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [ollamaOnline, setOllamaOnline] = useState(false);
  const [aktivesModel, setAktivesModel] = useState(
    localStorage.getItem('kai_aktives_model') || 'ollama-qwen'
  );
  const [dsgvoToast, setDsgvoToast] = useState(null); 
  const [dsgvoGesehenKlassen, setDsgvoGesehenKlassen] = useState(new Set(['green']));
  const messagesEndRef = useRef(null);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Ollama Status prüfen
  useEffect(() => {
    const checkOllama = async () => {
      try {
        const res = await fetch('http://localhost:11434/api/tags');
        setOllamaOnline(res.ok);
      } catch (err) {
        setOllamaOnline(false);
      }
    };
    checkOllama();
    const timer = setInterval(checkOllama, 30000);
    return () => clearInterval(timer);
  }, []);

  const handleModellWechsel = (modellId) => {
    const modell = MODELLE.find(m => m.id === modellId);
    if (!modell) return;

    if (modell.dsgvo !== 'green' && !dsgvoGesehenKlassen.has(modell.dsgvo)) {
      setDsgvoToast({
        text: DSGVO_TOAST[modell.dsgvo](modell.anbieter || 'Drittanbieter'),
        klasse: modell.dsgvo,
      });
      setDsgvoGesehenKlassen(prev => new Set([...prev, modell.dsgvo]));
    } else {
      setDsgvoToast(null);
    }

    setAktivesModel(modellId);
    localStorage.setItem('kai_aktives_model', modellId);
  };

  const loadWikiKontext = async (projektName) => {
    if (!projektName) return '';
    try {
      const res = await db.query(
        'SELECT content FROM wiki WHERE projekt = $name OR typ = "system" LIMIT 5',
        { name: projektName }
      );
      const data = res[0]?.result || res[0] || [];
      return data.length > 0 
        ? "\nKONTEXT AUS DEM WIKI:\n" + data.map(d => d.content).join('\n---\n')
        : '';
    } catch (err) {
      console.warn('[KAi] Failed to load context:', err);
      return '';
    }
  };

  const pullModel = async (modelName, onProgress) => {
    const res = await fetch('http://localhost:11434/api/pull', {
      method: 'POST',
      body: JSON.stringify({ name: modelName })
    });
    
    if (!res.body) throw new Error('ReadableStream not supported');
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
        } catch (e) {}
      }
    }
  };

  const askKAi = async (userMessage, onChunk) => {
    const modell = MODELLE.find(m => m.id === aktivesModel);
    if (!modell) throw new Error('MODELL_NICHT_GEFUNDEN');

    const kontext = await loadWikiKontext(aktiveProjekt?.name);
    const systemPrompt = [
      'Du bist KAi, KI-Assistent von KAiOSS.',
      'Antworte kurz und präzise im Terminal-Stil.',
      kontext
    ].join('\n');

    if (modell.typ === 'ollama') {
      const res = await fetch(modell.endpoint, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          model: modell.model,
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userMessage }
          ],
          stream: true
        })
      });

      if (!res.ok) {
        if (res.status === 404) throw new Error('MODEL_NOT_FOUND');
        throw new Error('API Error ' + res.status);
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
          } catch (e) {}
        }
      }
      return fullContent;
    } else {
      throw new Error(`API_TYP_${modell.typ.toUpperCase()}_NOCH_NICHT_IMPLEMENTIERT`);
    }
  };

  const handleSend = async () => {
    if (!input.trim() || loading) return;
    const modell = MODELLE.find(m => m.id === aktivesModel);
    if (modell.typ === 'ollama' && !ollamaOnline) return;

    const frage = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: frage }]);
    setLoading(true);
    setMessages(prev => [...prev, { role: 'kai', content: '', isStreaming: true }]);

    try {
      await askKAi(frage, (content) => {
        setMessages(prev => {
          const next = [...prev];
          const last = next[next.length - 1];
          if (last && last.role === 'kai') last.content = content;
          return next;
        });
      });
      
      setMessages(prev => {
        const next = [...prev];
        const last = next[next.length - 1];
        if (last) last.isStreaming = false;
        return next;
      });

    } catch (err) {
      if (err.message === 'MODEL_NOT_FOUND') {
        const modelName = modell.model;
        setMessages(prev => {
          const next = [...prev];
          next[next.length - 1].content = `> Modell ${modelName} nicht gefunden.\n> Starte Download...`;
          return next;
        });

        try {
          await pullModel(modelName, (status, pct) => {
            const bar = '█'.repeat(Math.floor(pct / 10)) + '░'.repeat(10 - Math.floor(pct / 10));
            setMessages(prev => {
              const next = [...prev];
              const last = next[next.length - 1];
              last.content = `> Download: ${modelName}\n> Status: ${status}\n> [${bar}] ${pct}%`;
              return next;
            });
          });
          setMessages(prev => [...prev, { role: 'kai', content: `> ${modelName} bereit. Bitte frage erneut!` }]);
        } catch (pullErr) {
          setMessages(prev => [...prev, { role: 'kai', content: `> Download fehlgeschlagen: ${pullErr.message}` }]);
        }
      } else {
        setMessages(prev => {
          const next = [...prev];
          const last = next[next.length - 1];
          if (last) {
            last.content = `> Fehler: ${err.message}`;
            last.isStreaming = false;
          }
          return next;
        });
      }
    } finally {
      setLoading(false);
    }
  };

  const styles = {
    panel: { 
      display: 'flex', 
      flexDirection: 'column', 
      height: '100%', 
      fontFamily: 'monospace', 
      background: 'var(--bg-primary)', 
      border: '1px solid var(--border)', 
      borderRadius: '8px', 
      overflow: 'hidden',
      position: 'relative'
    },
    header: { 
      display: 'flex', 
      justifyContent: 'space-between', 
      alignItems: 'center', 
      padding: '8px 12px', 
      borderBottom: '1px solid var(--border)', 
      background: 'var(--bg-secondary)' 
    },
    title: { color: '#1D9E75', fontSize: '12px', fontWeight: '500' },
    headerRight: { display: 'flex', alignItems: 'center', gap: '8px' },
    modelSelect: { 
      fontSize: '11px', 
      fontFamily: 'monospace', 
      background: 'var(--bg-primary)', 
      color: 'var(--text-primary)', 
      border: '1px solid var(--border)', 
      borderRadius: '4px', 
      padding: '2px 4px',
      outline: 'none'
    },
    esc: { 
      fontSize: '11px', 
      fontFamily: 'monospace', 
      background: 'none', 
      border: '1px solid var(--border)', 
      color: 'var(--text-secondary)', 
      borderRadius: '4px', 
      padding: '2px 6px', 
      cursor: 'pointer' 
    },
    kontextBar: { 
      padding: '4px 12px', 
      fontSize: '11px', 
      color: '#1D9E75', 
      borderBottom: '1px dashed var(--border)', 
      opacity: 0.7, 
      background: 'var(--bg-secondary)' 
    },
    messages: { 
      flex: 1, 
      overflowY: 'auto', 
      padding: '12px', 
      display: 'flex', 
      flexDirection: 'column', 
      gap: '10px' 
    },
    welcome: { color: 'var(--text-secondary)', fontSize: '12px', lineHeight: '1.8' },
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
      color: 'var(--text-primary)', 
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
      borderTop: '1px solid var(--border)', 
      background: 'var(--bg-secondary)' 
    },
    input: { 
      flex: 1, 
      background: 'none', 
      border: 'none', 
      color: 'var(--text-primary)', 
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
    closeBtn: {
      fontSize: '20px',
      lineHeight: '1',
      background: 'none',
      border: 'none',
      color: 'var(--text-secondary)',
      cursor: 'pointer',
      padding: '0 4px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      transition: 'color 0.2s'
    }
  };

  return (
    <div style={styles.panel}>
      {dsgvoToast && (
        <div className={`dsgvo-toast dsgvo-toast--${dsgvoToast.klasse}`}>
          <span>{dsgvoToast.text}</span>
          <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
            <button onClick={() => { onOpenWiki('Datenschutz & Modelle'); setDsgvoToast(null); }}>
              Mehr erfahren →
            </button>
            <button onClick={() => setDsgvoToast(null)}>
              Trotzdem nutzen
            </button>
          </div>
        </div>
      )}

      <div style={styles.header}>
        <span style={styles.title}>{'> KAi_ASSISTANT'}</span>
        <div style={styles.headerRight}>
          <span style={{ fontSize: '11px', fontFamily: 'monospace', color: ollamaOnline ? '#1D9E75' : '#E24B4A' }}>
            {ollamaOnline ? '● OLLAMA_ONLINE' : '● OLLAMA_OFFLINE'}
          </span>
          
          <select
            value={aktivesModel}
            onChange={(e) => handleModellWechsel(e.target.value)}
            style={styles.modelSelect}
          >
            <optgroup label="LOKAL (Ollama)">
              {MODELLE.filter(m => m.typ === 'ollama').map(m => (
                <option key={m.id} value={m.id} title={DSGVO_LABEL[m.dsgvo]}>{m.label}</option>
              ))}
            </optgroup>
            <optgroup label="EU">
              {MODELLE.filter(m => m.dsgvo === 'green' && m.typ !== 'ollama').map(m => (
                <option key={m.id} value={m.id} title={DSGVO_LABEL[m.dsgvo]}>{m.label}</option>
              ))}
            </optgroup>
            <optgroup label="USA">
              {MODELLE.filter(m => m.dsgvo === 'yellow').map(m => (
                <option key={m.id} value={m.id} title={DSGVO_LABEL[m.dsgvo]}>{m.label}</option>
              ))}
            </optgroup>
            <optgroup label="CHINA">
              {MODELLE.filter(m => m.dsgvo === 'red').map(m => (
                <option key={m.id} value={m.id} title={DSGVO_LABEL[m.dsgvo]}>{m.label}</option>
              ))}
            </optgroup>
          </select>
          
          <button onClick={onClose} style={styles.closeBtn} title="Schließen (ESC)">×</button>
        </div>
      </div>

      {aktiveProjekt && (
        <div style={styles.kontextBar}>
          {'> Kontext: ' + aktiveProjekt.name + ' | Modell: ' + aktivesModel}
        </div>
      )}

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
            <pre style={styles.msgContent}>
              {msg.content}
              {msg.isStreaming && <span className="cursor"> █</span>}
            </pre>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

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

export default KAiPanel;
