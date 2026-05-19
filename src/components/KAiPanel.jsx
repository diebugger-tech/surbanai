import React, { useState, useEffect, useRef } from 'react';
import db from '../lib/db';
import MODELLE, { DSGVO_LABEL, DSGVO_TOAST } from '../config/models.config.js';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import Mermaid from './Mermaid';

const styles = {
  panel: {
    display: 'flex',
    flexDirection: 'row',
    width: '100%',
    height: '100%',
    fontFamily: 'monospace',
    background: 'var(--bg-primary)',
    border: '1px solid var(--border)',
    borderRadius: '8px',
    overflow: 'hidden',
    position: 'relative'
  },
  sidebar: (collapsed, sidebarWidth, isResizing) => ({
    width: collapsed ? '0' : `${sidebarWidth}px`,
    minWidth: collapsed ? '0' : `${sidebarWidth}px`,
    height: '100%',
    borderRight: collapsed ? 'none' : '1px solid var(--border)',
    backgroundColor: 'var(--bg-secondary)',
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
    transition: isResizing ? 'none' : 'width 0.2s ease, min-width 0.2s ease, border-right 0.2s ease',
    position: 'relative'
  }),
  sidebarContent: {
    display: 'flex',
    flexDirection: 'column',
    height: '100%',
    padding: '12px',
    width: '100%',
    boxSizing: 'border-box'
  },
  sidebarTitle: {
    fontSize: '11px',
    fontWeight: 'bold',
    color: 'var(--text-muted)',
    letterSpacing: '1px'
  },
  sidebarSearch: {
    width: '100%',
    padding: '6px 8px',
    fontSize: '11px',
    fontFamily: 'monospace',
    backgroundColor: 'var(--bg-primary)',
    border: '1px solid var(--border)',
    color: 'var(--text-primary)',
    borderRadius: '4px',
    marginBottom: '10px',
    outline: 'none',
    boxSizing: 'border-box'
  },
  newChatBtn: {
    width: '100%',
    padding: '8px',
    fontSize: '11px',
    fontFamily: 'monospace',
    backgroundColor: 'rgba(29, 158, 117, 0.1)',
    border: '1px solid #1D9E75',
    color: '#1D9E75',
    borderRadius: '4px',
    cursor: 'pointer',
    fontWeight: 'bold',
    marginBottom: '12px',
    transition: 'all 0.2s',
    outline: 'none'
  },
  chatList: {
    flex: 1,
    overflowY: 'auto',
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
    paddingRight: '2px'
  },
  chatItem: (active) => ({
    padding: '8px',
    border: active ? '1px solid #1D9E75' : '1px solid var(--border)',
    backgroundColor: active ? 'rgba(29, 158, 117, 0.05)' : 'var(--bg-primary)',
    borderRadius: '4px',
    cursor: 'pointer',
    transition: 'all 0.2s',
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
    position: 'relative'
  }),
  chatItemTitle: {
    fontSize: '12px',
    color: 'var(--text-primary)',
    fontWeight: '500',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    paddingRight: '20px'
  },
  chatItemMeta: {
    display: 'flex',
    justifyContent: 'space-between',
    fontSize: '9px',
    color: 'var(--text-muted)'
  },
  chatArea: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    height: '100%',
    overflow: 'hidden'
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '8px 12px',
    borderBottom: '1px solid var(--border)',
    background: 'var(--bg-secondary)',
    position: 'relative',
    minWidth: 0
  },
  title: { color: '#1D9E75', fontSize: '12px', fontWeight: '500' },
  headerRight: { display: 'flex', alignItems: 'center', gap: '8px', paddingRight: '32px', minWidth: 0 },
  modelSelect: {
    fontSize: '11px',
    fontFamily: 'monospace',
    background: 'var(--bg-primary)',
    color: 'var(--text-primary)',
    border: '1px solid var(--border)',
    borderRadius: '4px',
    padding: '2px 4px',
    outline: 'none',
    maxWidth: '130px',
    overflow: 'hidden',
    textOverflow: 'ellipsis'
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
    gap: '14px'
  },
  welcome: { color: 'var(--text-secondary)', fontSize: '12px', lineHeight: '1.8' },
  userMsg: { display: 'flex', flexDirection: 'column', gap: '4px' },
  kaiMsg: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
    paddingLeft: '8px',
    borderLeft: '2px solid #1D9E75'
  },
  msgLabel: { fontSize: '11px', fontWeight: '500' },
  msgContent: {
    fontSize: '13px',
    color: 'var(--text-primary)',
    lineHeight: '1.6',
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
  }
};

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
  const inputRef = useRef(null);

  // Historie-Zustand
  const [currentChatId, setCurrentChatId] = useState(null);
  const [chats, setChats] = useState([]);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
    return localStorage.getItem('kai_sidebar_collapsed') === 'true';
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [wikiContextCount, setWikiContextCount] = useState(0);
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [editedTitle, setEditedTitle] = useState('');

  // Resizing-Zustände (Persistiert in localStorage)
  const [containerWidth, setContainerWidth] = useState(() => {
    const saved = localStorage.getItem('kai_container_width');
    return saved ? parseInt(saved, 10) : 800;
  });
  const [sidebarWidth, setSidebarWidth] = useState(() => {
    const saved = localStorage.getItem('kai_sidebar_width');
    return saved ? parseInt(saved, 10) : 260;
  });
  const [isResizingContainer, setIsResizingContainer] = useState(false);
  const [isResizingSidebar, setIsResizingSidebar] = useState(false);

  const handleContainerResizeMouseDown = (e) => {
    e.preventDefault();
    setIsResizingContainer(true);
    const startX = e.clientX;
    const startWidth = containerWidth;

    const handleMouseMove = (moveEvent) => {
      const deltaX = startX - moveEvent.clientX;
      const newWidth = Math.max(400, startWidth + deltaX * 2);
      const cappedWidth = Math.min(newWidth, window.innerWidth * 0.95);
      setContainerWidth(cappedWidth);
      localStorage.setItem('kai_container_width', cappedWidth.toString());
    };

    const handleMouseUp = () => {
      setIsResizingContainer(false);
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  const handleSidebarResizeMouseDown = (e) => {
    e.preventDefault();
    setIsResizingSidebar(true);
    const startX = e.clientX;
    const startWidth = sidebarWidth;

    const handleMouseMove = (moveEvent) => {
      const deltaX = moveEvent.clientX - startX;
      const newWidth = Math.max(180, Math.min(500, startWidth + deltaX));
      setSidebarWidth(newWidth);
      localStorage.setItem('kai_sidebar_width', newWidth.toString());
    };

    const handleMouseUp = () => {
      setIsResizingSidebar(false);
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // ESC shortcut to close (works even when input is focused)
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'n' && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        handleNewChat();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

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

  // Wiki Kontext-Count laden
  const loadWikiKontext = async (projektName) => {
    if (!projektName) return '';
    try {
      const res = await db.query(
        'SELECT inhalt FROM wiki WHERE projekt = $name OR typ = "system" LIMIT 5',
        { name: projektName }
      );
      const data = res[0]?.result || res[0] || [];
      setWikiContextCount(data.length);
      return data.length > 0
        ? "\nKONTEXT AUS DEM WIKI:\n" + data.map(d => d.inhalt).join('\n---\n')
        : '';
    } catch (err) {
      console.warn('[KAi] Failed to load context:', err);
      setWikiContextCount(0);
      return '';
    }
  };

  useEffect(() => {
    if (aktiveProjekt?.name) {
      loadWikiKontext(aktiveProjekt.name);
    } else {
      setWikiContextCount(0);
    }
  }, [aktiveProjekt]);

  // Live Query für Chat-Historie
  useEffect(() => {
    let liveQuery = null;
    let isMounted = true;

    const initChats = async () => {
      try {
        const res = await db.query(
          'SELECT * FROM wiki WHERE typ = "kai" ORDER BY geaendert DESC'
        );
        const data = res[0]?.result || res[0] || [];
        if (isMounted) setChats(data);

        liveQuery = await db.live('wiki', ({ action, result }) => {
          if (!isMounted) return;
          if (result?.typ !== 'kai') return;

          setChats(prev => {
            if (action === 'CREATE') {
              if (prev.some(c => c.id.toString() === result.id.toString())) return prev;
              return [result, ...prev].sort((a, b) => new Date(b.geaendert) - new Date(a.geaendert));
            }
            if (action === 'UPDATE') {
              const index = prev.findIndex(c => c.id.toString() === result.id.toString());
              const next = [...prev];
              if (index === -1) {
                next.push(result);
              } else {
                next[index] = result;
              }
              return next.sort((a, b) => new Date(b.geaendert) - new Date(a.geaendert));
            }
            if (action === 'DELETE') {
              return prev.filter(c => c.id.toString() !== result.id.toString());
            }
            return prev;
          });
        });
      } catch (err) {
        console.error('[KAiPanel] Live query error:', err);
      }
    };

    initChats();

    return () => {
      isMounted = false;
      if (liveQuery) liveQuery.kill().catch(() => {});
    };
  }, []);

  // Synchronisiere den Titel, wenn sich der aktive Chat ändert
  useEffect(() => {
    if (currentChatId) {
      const activeChat = chats.find(c => c.id.toString() === currentChatId.toString());
      if (activeChat) setEditedTitle(activeChat.titel);
    } else {
      setEditedTitle('Neuer Chat');
    }
  }, [currentChatId, chats]);

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

  const handleSelectChat = (chat) => {
    setCurrentChatId(chat.id);
    try {
      const parsed = JSON.parse(chat.inhalt);
      setMessages(parsed);
    } catch (e) {
      setMessages([{ role: 'kai', content: chat.inhalt }]);
    }
    setTimeout(() => {
      inputRef.current?.focus();
    }, 50);
  };

  const handleNewChat = () => {
    setCurrentChatId(null);
    setMessages([]);
    setTimeout(() => {
      inputRef.current?.focus();
    }, 50);
  };

  const handleDeleteChat = async (id) => {
    if (!confirm('Diesen Chat unwiderruflich löschen?')) return;
    try {
      await db.query('DELETE $id', { id });
      if (currentChatId && currentChatId.toString() === id.toString()) {
        handleNewChat();
      }
    } catch (err) {
      console.error('Failed to delete chat:', err);
    }
  };

  const handleSaveTitle = async () => {
    setIsEditingTitle(false);
    if (!editedTitle.trim() || !currentChatId) return;
    try {
      await db.query('UPDATE $id MERGE { titel: $titel }', {
        id: currentChatId,
        titel: editedTitle.trim()
      });
    } catch (err) {
      console.error('Failed to update chat title:', err);
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

  const askKAi = async (userMessage, onChunk, history = []) => {
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
            ...history.map(m => ({
              role: m.role === 'kai' ? 'assistant' : 'user',
              content: m.content
            })),
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
    
    const newMessagesUser = [...messages, { role: 'user', content: frage }];
    setMessages(newMessagesUser);
    setLoading(true);
    setMessages([...newMessagesUser, { role: 'kai', content: '', isStreaming: true }]);

    try {
      let chatId = currentChatId;
      const serializedUser = JSON.stringify(newMessagesUser);
      
      if (!chatId) {
        const title = frage.length > 50 ? frage.slice(0, 50) + '...' : frage;
        const res = await db.query(`
          CREATE wiki SET
            projekt = $projekt,
            typ = "kai",
            titel = $titel,
            inhalt = $inhalt,
            status = "open",
            erstellt = time::now(),
            geaendert = time::now()
        `, {
          projekt: aktiveProjekt?.name || 'Global',
          titel: title,
          inhalt: serializedUser
        });
        const newRecord = res[0]?.result?.[0] || res[0]?.[0];
        if (newRecord?.id) {
          chatId = newRecord.id;
          setCurrentChatId(chatId);
        }
      } else {
        await db.query(`
          UPDATE $id MERGE {
            inhalt: $inhalt,
            geaendert: time::now()
          }
        `, {
          id: chatId,
          inhalt: serializedUser
        });
      }

      const history = messages.filter(m => !m.isStreaming && m.content);
      const finalContent = await askKAi(frage, (content) => {
        setMessages(prev => {
          const next = [...prev];
          const last = { ...next[next.length - 1] };
          if (last.role === 'kai') last.content = content;
          next[next.length - 1] = last;
          return next;
        });
      }, history);

      const finalMessages = [...newMessagesUser, { role: 'kai', content: finalContent }];
      setMessages(finalMessages);

      if (chatId) {
        const serializedFinal = JSON.stringify(finalMessages);
        await db.query(`
          UPDATE $id MERGE {
            inhalt: $inhalt,
            geaendert: time::now()
          }
        `, {
          id: chatId,
          inhalt: serializedFinal
        });
      }

    } catch (err) {
      if (err.message === 'MODEL_NOT_FOUND') {
        const modelName = modell.model;
        setMessages(prev => {
          const next = [...prev];
          next[next.length - 1] = {
            ...next[next.length - 1],
            content: `> Modell ${modelName} nicht gefunden.\n> Starte Download...`
          };
          return next;
        });

        try {
          await pullModel(modelName, (status, pct) => {
            const bar = '█'.repeat(Math.floor(pct / 10)) + '░'.repeat(10 - Math.floor(pct / 10));
            setMessages(prev => {
              const next = [...prev];
              next[next.length - 1] = {
                ...next[next.length - 1],
                content: `> Download: ${modelName}\n> Status: ${status}\n> [${bar}] ${pct}%`
              };
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
          next[next.length - 1] = {
            ...next[next.length - 1],
            content: `> Fehler: ${err.message}`,
            isStreaming: false
          };
          return next;
        });
      }
    } finally {
      setLoading(false);
    }
  };

  const renderMarkdown = (content) => {
    return (
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          code({ node, inline, className, children, ...props }) {
            const match = /language-(\w+)/.exec(className || '');
            const lang = match ? match[1] : '';

            if (!inline && lang === 'mermaid') {
              return <Mermaid chart={String(children).replace(/\n$/, '')} />;
            }

            if (!inline && match) {
              const codeString = String(children).replace(/\n$/, '');
              const copyId = 'copy-btn-' + Math.random().toString(36).substr(2, 9);
              return (
                <div style={{ position: 'relative', marginTop: '6px', marginBottom: '6px' }}>
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    background: 'var(--bg-secondary)',
                    border: '1px solid var(--border)',
                    borderBottom: 'none',
                    padding: '4px 8px',
                    borderTopLeftRadius: '4px',
                    borderTopRightRadius: '4px',
                    fontSize: '10px',
                    color: 'var(--text-muted)'
                  }}>
                    <span>{lang.toUpperCase()}</span>
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(codeString);
                        const btn = document.getElementById(copyId);
                        if (btn) {
                          btn.innerText = 'COPIED!';
                          setTimeout(() => btn.innerText = 'COPY', 1500);
                        }
                      }}
                      id={copyId}
                      style={{
                        background: 'none',
                        border: '1px solid var(--border)',
                        color: 'var(--accent-green, #00ffaa)',
                        fontFamily: 'monospace',
                        fontSize: '9px',
                        padding: '2px 6px',
                        borderRadius: '3px',
                        cursor: 'pointer'
                      }}
                    >
                      COPY
                    </button>
                  </div>
                  <SyntaxHighlighter
                    style={vscDarkPlus}
                    language={lang}
                    PreTag="div"
                    customStyle={{
                      margin: 0,
                      borderTopLeftRadius: 0,
                      borderTopRightRadius: 0,
                      borderBottomLeftRadius: '4px',
                      borderBottomRightRadius: '4px',
                      border: '1px solid var(--border)'
                    }}
                    {...props}
                  >
                    {codeString}
                  </SyntaxHighlighter>
                </div>
              );
            }

            return (
              <code className={className} {...props} style={{ background: 'var(--bg-tertiary)', padding: '2px 4px', borderRadius: '3px', color: '#1D9E75' }}>
                {children}
              </code>
            );
          }
        }}
      >
        {content}
      </ReactMarkdown>
    );
  };

  const filteredChats = chats.filter(chat => {
    return chat.titel.toLowerCase().includes(searchQuery.toLowerCase()) ||
           chat.inhalt.toLowerCase().includes(searchQuery.toLowerCase());
  });

  return (
    <div style={{ ...styles.panel, width: `clamp(380px, ${containerWidth}px, 95vw)` }}>
      <style>{`
        .kai-container-resize-handle {
          position: absolute;
          top: 0;
          left: 0;
          width: 6px;
          height: 100%;
          cursor: col-resize;
          background-color: rgba(29, 158, 117, 0.05);
          border-right: 1px solid var(--border);
          z-index: 2005;
          transition: background-color 0.2s, box-shadow 0.2s;
        }
        .kai-container-resize-handle:hover,
        .kai-container-resize-handle:active {
          background-color: #1D9E75;
          box-shadow: 0 0 8px #1D9E75;
        }

        .kai-sidebar-resize-handle {
          position: absolute;
          top: 0;
          right: 0;
          width: 6px;
          height: 100%;
          cursor: col-resize;
          background-color: rgba(29, 158, 117, 0.05);
          border-right: 1px solid var(--border);
          z-index: 2005;
          transition: background-color 0.2s, box-shadow 0.2s;
        }
        .kai-sidebar-resize-handle:hover,
        .kai-sidebar-resize-handle:active {
          background-color: #1D9E75;
          box-shadow: 0 0 8px #1D9E75;
        }
      `}</style>

      {/* Container Resize Handle on the left border */}
      <div 
        className="kai-container-resize-handle"
        onMouseDown={handleContainerResizeMouseDown}
      />

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

      {/* Sidebar (Chat-Historie) */}
      <div style={styles.sidebar(sidebarCollapsed, sidebarWidth, isResizingSidebar)}>
        <div style={styles.sidebarContent}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
            <span style={styles.sidebarTitle}>CHAT HISTORY</span>
            <button 
              onClick={() => {
                setSidebarCollapsed(true);
                localStorage.setItem('kai_sidebar_collapsed', 'true');
              }}
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--text-muted)',
                cursor: 'pointer',
                fontSize: '14px',
                padding: '2px 6px',
                outline: 'none'
              }}
              title="Historie einklappen"
            >
              ◀
            </button>
          </div>
          <input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="SEARCH CHATS..."
            style={styles.sidebarSearch}
          />
          <button onClick={handleNewChat} style={styles.newChatBtn}>
            ✚ NEW CHAT
          </button>
          <div style={styles.chatList}>
            {filteredChats.map((chat) => {
              const active = currentChatId && currentChatId.toString() === chat.id.toString();
              const dateStr = new Date(chat.geaendert).toLocaleString('de-DE', {
                day: '2-digit', month: '2-digit', year: 'numeric',
                hour: '2-digit', minute: '2-digit'
              });
              
              let preview = '';
              try {
                const msgs = JSON.parse(chat.inhalt);
                preview = msgs.find(m => m.role === 'user')?.content || '';
              } catch (e) {
                preview = chat.inhalt;
              }
              if (preview.length > 50) preview = preview.slice(0, 50) + '...';

              return (
                <div 
                  key={chat.id.toString()} 
                  onClick={() => handleSelectChat(chat)}
                  style={styles.chatItem(active)}
                >
                  <div style={styles.chatItemTitle} title={chat.titel}>
                    💬 {chat.titel} {active && <span style={{ color: '#1D9E75', fontSize: '9px', fontWeight: 'bold', marginLeft: '6px' }}>● ACTIVE</span>}
                  </div>
                  <div style={{ fontSize: '10px', color: 'var(--text-muted)', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                    {preview}
                  </div>
                  <div style={styles.chatItemMeta}>
                    <span>{chat.projekt}</span>
                    <span>{dateStr}</span>
                  </div>
                  
                  <div 
                    style={{
                      position: 'absolute',
                      right: '6px',
                      top: '6px',
                      display: 'flex',
                      gap: '6px',
                      alignItems: 'center'
                    }}
                    onClick={(e) => e.stopPropagation()}
                  >
                    <button
                      onClick={() => handleSelectChat(chat)}
                      style={{
                        background: 'transparent',
                        border: 'none',
                        color: active ? '#1D9E75' : 'var(--text-muted)',
                        cursor: 'pointer',
                        fontSize: '12px',
                        padding: '2px',
                        transition: 'color 0.2s',
                        outline: 'none',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.color = '#1D9E75'}
                      onMouseLeave={(e) => e.currentTarget.style.color = active ? '#1D9E75' : 'var(--text-muted)'}
                      title="Chat fortsetzen / laden"
                    >
                      ▶
                    </button>
                    <button
                      onClick={() => handleDeleteChat(chat.id)}
                      style={{
                        background: 'transparent',
                        border: 'none',
                        color: 'var(--text-muted)',
                        cursor: 'pointer',
                        fontSize: '12px',
                        padding: '2px',
                        transition: 'color 0.2s',
                        outline: 'none',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.color = '#E24B4A'}
                      onMouseLeave={(e) => e.currentTarget.style.color = 'var(--text-muted)'}
                      title="Chat löschen"
                    >
                      🗑
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
        {!sidebarCollapsed && (
          <div 
            className="kai-sidebar-resize-handle"
            onMouseDown={handleSidebarResizeMouseDown}
          />
        )}
      </div>

      {/* Haupt-Chat-Bereich */}
      <div style={styles.chatArea}>
        <div style={styles.header}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            {sidebarCollapsed && (
              <button 
                onClick={() => {
                  setSidebarCollapsed(false);
                  localStorage.setItem('kai_sidebar_collapsed', 'false');
                }}
                style={{
                  background: 'none',
                  border: '1px solid var(--border)',
                  color: 'var(--text-primary)',
                  borderRadius: '4px',
                  padding: '2px 8px',
                  cursor: 'pointer',
                  fontSize: '12px',
                  fontFamily: 'monospace',
                  marginRight: '4px',
                  outline: 'none'
                }}
                title="Historie ausklappen"
              >
                ▶ HISTORY
              </button>
            )}
            
            {isEditingTitle ? (
              <input
                value={editedTitle}
                onChange={(e) => setEditedTitle(e.target.value)}
                onBlur={handleSaveTitle}
                onKeyDown={(e) => e.key === 'Enter' && handleSaveTitle()}
                style={{
                  background: 'var(--bg-primary)',
                  border: '1px solid #1D9E75',
                  color: 'var(--text-primary)',
                  fontFamily: 'monospace',
                  fontSize: '12px',
                  padding: '2px 4px',
                  borderRadius: '4px',
                  outline: 'none',
                  width: '200px'
                }}
                autoFocus
              />
            ) : (
              <span 
                onClick={() => currentChatId && setIsEditingTitle(true)}
                style={{ 
                  ...styles.title, 
                  cursor: currentChatId ? 'pointer' : 'default',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
                title={currentChatId ? "Klicken zum Umbenennen" : ""}
              >
                {currentChatId ? `> KAi: ${editedTitle}` : '> KAi_ASSISTANT'}
                {currentChatId && <span style={{ fontSize: '10px', opacity: 0.6 }}>✎</span>}
              </span>
            )}
          </div>

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

            <button
              onClick={onClose}
              onMouseOver={(e) => { 
                e.currentTarget.style.color = '#ffffff';
                e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.18)';
              }}
              onMouseOut={(e) => { 
                e.currentTarget.style.color = '#e0e0e0';
                e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.08)';
              }}
              style={{
                background: 'rgba(255,255,255,0.08)',
                border: '1px solid rgba(255,255,255,0.15)',
                color: '#e0e0e0',
                borderRadius: '4px',
                padding: '2px 8px',
                cursor: 'pointer',
                fontFamily: 'monospace',
                fontSize: '11px',
                marginLeft: '8px',
                transition: 'all 0.2s ease'
              }}
              title="Schließen (ESC)"
            >
              [ ESC_CLOSE ]
            </button>
          </div>
        </div>

        <div style={styles.kontextBar}>
          {`> Kontext: ${aktiveProjekt?.name || 'Global'} | Modell: ${aktivesModel} | 📁 ${wikiContextCount} Wiki-Docs geladen`}
        </div>

        <div style={styles.messages}>
          {messages.length === 0 && (
            <div style={styles.welcome}>
              {'> KAiOSS KAi-Assistant bereit.'}<br />
              {`> Projekt: ${aktiveProjekt?.name || 'keins gewaehlt'}`}<br />
              {'> Wiki-Kontext wird automatisch geladen.'}<br />
              {'> Stell mir eine Frage...'}<br />
            </div>
          )}
          {messages.map((msg, i) => (
            <div key={i} style={msg.role === 'user' ? styles.userMsg : styles.kaiMsg}>
              <span style={{ ...styles.msgLabel, color: msg.role === 'user' ? '#888' : '#1D9E75' }}>
                {msg.role === 'user' ? '> Du:' : '> KAi:'}
              </span>
              <div style={styles.msgContent}>
                {msg.role === 'user' ? (
                  <pre style={{ margin: 0, fontFamily: 'monospace', whiteSpace: 'pre-wrap', color: 'var(--text-primary)' }}>{msg.content}</pre>
                ) : (
                  renderMarkdown(msg.content)
                )}
                {msg.isStreaming && <span className="cursor"> █</span>}
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>

        <div style={styles.inputRow}>
          <span style={{ color: '#1D9E75', fontSize: '14px', fontFamily: 'monospace' }}>{'>'}</span>
          <input
            ref={inputRef}
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
    </div>
  );
};

export default KAiPanel;
