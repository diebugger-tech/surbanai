import React, { useState } from 'react';

const styles = {
  sidebar: (collapsed, sidebarWidth, isResizing, chatCollapsed) => ({
    width: collapsed ? '0' : (chatCollapsed ? '100%' : `${sidebarWidth}px`),
    minWidth: collapsed ? '0' : (chatCollapsed ? '100%' : `${sidebarWidth}px`),
    height: '100%',
    borderRight: (collapsed || chatCollapsed) ? 'none' : '1px solid var(--border)',
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
  }
};

const getGroupedChats = (chatsList) => {
  const pinned = [];
  const today = [];
  const yesterday = [];
  const last7Days = [];
  const older = [];

  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const startOfYesterday = startOfToday - 24 * 60 * 60 * 1000;
  const startOf7DaysAgo = startOfToday - 7 * 24 * 60 * 60 * 1000;

  chatsList.forEach(chat => {
    if (chat.pinned) {
      pinned.push(chat);
      return;
    }

    const time = new Date(chat.geaendert).getTime();
    if (time >= startOfToday) {
      today.push(chat);
    } else if (time >= startOfYesterday) {
      yesterday.push(chat);
    } else if (time >= startOf7DaysAgo) {
      last7Days.push(chat);
    } else {
      older.push(chat);
    }
  });

  return [
    { id: 'pinned', title: '📌 Angeheftet', items: pinned },
    { id: 'today', title: 'Heute', items: today },
    { id: 'yesterday', title: 'Gestern', items: yesterday },
    { id: 'last7Days', title: 'Letzte 7 Tage', items: last7Days },
    { id: 'older', title: 'Älter', items: older }
  ].filter(group => group.items.length > 0);
};

const getRelativeTimeString = (dateStr) => {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHour = Math.floor(diffMin / 60);

  if (diffSec < 60) {
    return 'gerade eben';
  }
  if (diffMin < 60) {
    return `vor ${diffMin} Min.`;
  }
  if (diffHour < 24) {
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    if (date.getTime() >= startOfToday) {
      return `vor ${diffHour} Std.`;
    }
  }

  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const dateTime = date.getTime();
  if (dateTime >= startOfToday - 24 * 60 * 60 * 1000) {
    return 'gestern';
  }

  const diffDays = Math.floor(diffHour / 24);
  if (diffDays < 7) {
    return `vor ${diffDays} Tagen`;
  }

  return date.toLocaleDateString('de-DE', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });
};

export default function ChatHistorySidebar({
  chats,
  currentChatId,
  sidebarCollapsed,
  sidebarWidth,
  isResizingSidebar,
  chatCollapsed,
  setChatCollapsed,
  setSidebarCollapsed,
  onSelectChat,
  onNewChat,
  onDeleteChat,
  onTogglePin,
  handleSidebarResizeMouseDown
}) {
  const [searchQuery, setSearchQuery] = useState('');

  const filteredChats = chats.filter(chat => {
    return chat.titel.toLowerCase().includes(searchQuery.toLowerCase()) ||
           chat.inhalt.toLowerCase().includes(searchQuery.toLowerCase());
  });

  const groupedChats = getGroupedChats(filteredChats);

  return (
    <div style={styles.sidebar(sidebarCollapsed, sidebarWidth, isResizingSidebar, chatCollapsed)}>
      <div style={styles.sidebarContent}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
          <span style={styles.sidebarTitle}>CHAT HISTORY</span>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            {chatCollapsed && (
              <button
                onClick={() => {
                  setChatCollapsed(false);
                  localStorage.setItem('kai_chat_collapsed', 'false');
                }}
                style={{
                  background: 'none',
                  border: '1px solid var(--border)',
                  color: '#1D9E75',
                  borderRadius: '4px',
                  padding: '2px 8px',
                  cursor: 'pointer',
                  fontSize: '11px',
                  fontFamily: 'monospace',
                  outline: 'none'
                }}
                title="Chat-Fenster ausklappen"
              >
                ▶ CHAT
              </button>
            )}
            {!chatCollapsed && (
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
            )}
          </div>
        </div>
        <input
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="SEARCH CHATS..."
          style={styles.sidebarSearch}
        />
        <button onClick={onNewChat} style={styles.newChatBtn}>
          ✚ NEW CHAT
        </button>
        <div style={styles.chatList}>
          {groupedChats.length === 0 ? (
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '40px 10px',
              textAlign: 'center',
              color: 'var(--text-muted)',
              fontFamily: 'monospace',
              fontSize: '11px',
              border: '1px dashed rgba(255,255,255,0.05)',
              borderRadius: '6px',
              margin: '10px 4px',
              backgroundColor: 'rgba(0,0,0,0.1)'
            }}>
              <div style={{ color: '#E24B4A', fontWeight: 'bold', marginBottom: '8px' }}>
                {searchQuery ? '> SEARCH_FAILED (0)' : '> NO_HISTORY'}
              </div>
              <pre style={{
                fontSize: '9px',
                lineHeight: '1.2',
                margin: '10px 0',
                color: 'rgba(255,255,255,0.25)',
                textAlign: 'left'
              }}>
                {searchQuery ? `   _____ ___  __ 
  |_   _/ _ \\|  \\
    | || (_) | o )
    |_| \\___/|__/ ` : `   _  _ ___ ___ 
  | \\| | __/ _ \\
  | .  | _| (_) |
  |_|\\_|___\\___/ `}
              </pre>
              <div style={{ fontSize: '10px', marginTop: '6px', lineHeight: '1.4' }}>
                {searchQuery 
                  ? 'Suchbegriff liefert\nkeine Übereinstimmung.' 
                  : 'Bisher keine KAi-Chats\naufgezeichnet.'}
              </div>
            </div>
          ) : (
            groupedChats.map((group) => (
              <div key={group.id} style={{ marginBottom: '14px' }}>
                <div style={{
                  fontSize: '9px',
                  color: 'var(--text-muted)',
                  fontFamily: 'monospace',
                  letterSpacing: '1px',
                  padding: '4px 8px',
                  borderBottom: '1px dashed rgba(255, 255, 255, 0.08)',
                  marginBottom: '8px',
                  textTransform: 'uppercase'
                }}>
                  {group.title}
                </div>
                {group.items.map((chat) => {
                  const active = currentChatId && currentChatId.toString() === chat.id.toString();
                  const relativeTime = getRelativeTimeString(chat.geaendert);
                  
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
                      onClick={() => onSelectChat(chat)}
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
                        <span>{relativeTime}</span>
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
                          onClick={(e) => onTogglePin(chat, e)}
                          style={{
                            background: 'transparent',
                            border: 'none',
                            color: chat.pinned ? '#1D9E75' : 'var(--text-muted)',
                            opacity: chat.pinned ? 1 : 0.4,
                            cursor: 'pointer',
                            fontSize: '12px',
                            padding: '2px',
                            transition: 'opacity 0.2s, color 0.2s',
                            outline: 'none',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.opacity = '1';
                            e.currentTarget.style.color = '#1D9E75';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.opacity = chat.pinned ? '1' : '0.4';
                            e.currentTarget.style.color = chat.pinned ? '#1D9E75' : 'var(--text-muted)';
                          }}
                          title={chat.pinned ? 'Anheftung lösen' : 'Chat anheften'}
                        >
                          📌
                        </button>
                        <button
                          onClick={() => onSelectChat(chat)}
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
                          onClick={() => onDeleteChat(chat.id)}
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
            ))
          )}
        </div>
      </div>
      {!sidebarCollapsed && !chatCollapsed && (
        <div 
          className="kai-sidebar-resize-handle"
          onMouseDown={handleSidebarResizeMouseDown}
        />
      )}
    </div>
  );
}
