import React, { useState, useEffect, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import Mermaid from './Mermaid';
import MODELLE, { DSGVO_LABEL } from '../config/models.config.js';

const styles = {
  chatArea: (chatCollapsed) => ({
    flex: chatCollapsed ? 'none' : 1,
    width: chatCollapsed ? '0' : 'auto',
    minWidth: '0',
    display: chatCollapsed ? 'none' : 'flex',
    flexDirection: 'column',
    height: '100%',
    overflow: 'hidden'
  }),
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
    fontFamily: 'monospace',
    wordBreak: 'break-word',
    overflowWrap: 'break-word',
    maxWidth: '100%'
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

export default function ChatArea({
  messages,
  loading,
  ollamaOnline,
  aktivesModel,
  onModellWechsel,
  currentChatId,
  activeChat,
  onSaveTitle,
  input,
  setInput,
  onSend,
  sidebarCollapsed,
  chatCollapsed,
  setSidebarCollapsed,
  setChatCollapsed,
  onClose,
  aktiveProjekt,
  wikiContextCount
}) {
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [editedTitle, setEditedTitle] = useState('');
  
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  // Sync editedTitle when the active chat changes
  useEffect(() => {
    if (activeChat) {
      setEditedTitle(activeChat.titel);
    } else {
      setEditedTitle('');
    }
  }, [currentChatId, activeChat]);

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Focus input when selecting/creating a chat
  useEffect(() => {
    setTimeout(() => {
      inputRef.current?.focus();
    }, 50);
  }, [currentChatId]);

  const handleSaveTitle = () => {
    setIsEditingTitle(false);
    if (editedTitle.trim() && editedTitle !== activeChat?.titel) {
      onSaveTitle(editedTitle);
    }
  };

  const renderMarkdown = (content) => {
    return (
      <div className="markdown-body" style={{ wordBreak: 'break-word', overflowWrap: 'break-word', maxWidth: '100%' }}>
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
                        border: '1px solid var(--border)',
                        maxWidth: '100%',
                        overflowX: 'auto'
                      }}
                      {...props}
                    >
                      {codeString}
                    </SyntaxHighlighter>
                  </div>
                );
              }

              return (
                <code className={className} {...props} style={{ background: 'var(--bg-tertiary)', padding: '2px 4px', borderRadius: '3px', color: '#1D9E75', wordBreak: 'break-all', whiteSpace: 'pre-wrap' }}>
                  {children}
                </code>
              );
            }
          }}
        >
          {content}
        </ReactMarkdown>
      </div>
    );
  };

  return (
    <div style={styles.chatArea(chatCollapsed)}>
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
            onChange={(e) => onModellWechsel(e.target.value)}
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

          {!sidebarCollapsed && (
            <button
              onClick={() => {
                setChatCollapsed(true);
                localStorage.setItem('kai_chat_collapsed', 'true');
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
                transition: 'all 0.2s ease',
                outline: 'none'
              }}
              onMouseOver={(e) => { 
                e.currentTarget.style.color = '#ffffff';
                e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.18)';
              }}
              onMouseOut={(e) => { 
                e.currentTarget.style.color = '#e0e0e0';
                e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.08)';
              }}
              title="Chat einklappen"
            >
              ◀ CHAT
            </button>
          )}

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
          onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && onSend()}
          placeholder={ollamaOnline ? 'ASK_SOMETHING...' : 'OLLAMA_OFFLINE -- ollama serve starten'}
          disabled={!ollamaOnline || loading}
          style={styles.input}
          autoFocus
        />
        <button onClick={onSend} disabled={!ollamaOnline || loading} style={styles.sendBtn}>
          SEND
        </button>
      </div>
    </div>
  );
}
