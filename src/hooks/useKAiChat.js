import { useState, useEffect } from 'react';
import { chatRepository } from '../lib/repositories/chatRepository';
import { ollamaService } from '../lib/services/ollamaService';
import MODELLE, { DSGVO_TOAST } from '../config/models.config.js';

/**
 * useKAiChat Hook
 * Orchestrates business logic, state management, and real-time database/AI services
 * for the KAi Panel assistant.
 */
export function useKAiChat(aktiveProjekt, dbReady) {
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [ollamaOnline, setOllamaOnline] = useState(false);
  const [aktivesModel, setAktivesModel] = useState(() => {
    return localStorage.getItem('kai_model') || 'ollama-qwen';
  });
  const [dsgvoToast, setDsgvoToast] = useState(null);
  const [dsgvoGesehenKlassen, setDsgvoGesehenKlassen] = useState(new Set(['green']));
  const [currentChatId, setCurrentChatId] = useState(null);
  const [chats, setChats] = useState([]);
  const [wikiContextCount, setWikiContextCount] = useState(0);

  // Check Ollama status on mount and periodically
  useEffect(() => {
    const checkOllama = async () => {
      const online = await ollamaService.checkHealth();
      setOllamaOnline(online);
    };
    checkOllama();
    const timer = setInterval(checkOllama, 30000);
    return () => clearInterval(timer);
  }, []);

  // Sync wiki context count
  const loadWikiContextCount = async (projektName) => {
    if (!projektName) {
      setWikiContextCount(0);
      return;
    }
    const { data } = await chatRepository.loadWikiContext(projektName);
    setWikiContextCount(data?.length || 0);
  };

  useEffect(() => {
    if (dbReady && aktiveProjekt?.name) {
      loadWikiContextCount(aktiveProjekt.name);
    } else {
      setWikiContextCount(0);
    }
  }, [aktiveProjekt, dbReady]);

  // Live Query for chat history
  useEffect(() => {
    if (!dbReady) return;
    let liveQuery = null;
    let isMounted = true;

    const initChats = async () => {
      try {
        const { data, error } = await chatRepository.fetchChats();
        if (error) throw new Error(error);
        if (isMounted) setChats(data);

        const sub = await chatRepository.subscribeChatsLive(({ action, result }) => {
          if (!isMounted) return;
          if (result?.typ !== 'kai') return;

          setChats(prev => {
            if (action === 'CREATE') {
              if (prev.some(c => c.id.toString() === result.id.toString())) return prev;
              const next = [result, ...prev];
              return next.sort((a, b) => {
                const pinA = a.pinned ? 1 : 0;
                const pinB = b.pinned ? 1 : 0;
                if (pinA !== pinB) return pinB - pinA;
                return new Date(b.geaendert) - new Date(a.geaendert);
              });
            }
            if (action === 'UPDATE') {
              const index = prev.findIndex(c => c.id.toString() === result.id.toString());
              const next = [...prev];
              if (index === -1) {
                next.push(result);
              } else {
                next[index] = result;
              }
              return next.sort((a, b) => {
                const pinA = a.pinned ? 1 : 0;
                const pinB = b.pinned ? 1 : 0;
                if (pinA !== pinB) return pinB - pinA;
                return new Date(b.geaendert) - new Date(a.geaendert);
              });
            }
            if (action === 'DELETE') {
              return prev.filter(c => c.id.toString() !== result.id.toString());
            }
            return prev;
          });
        });

        if (isMounted && sub.data) {
          liveQuery = sub.data;
        } else if (sub.data) {
          sub.data();
        }
      } catch (err) {
        console.error('[useKAiChat] Live query error:', err);
      }
    };

    initChats();

    return () => {
      isMounted = false;
      if (liveQuery) liveQuery();
    };
  }, [dbReady]);

  const handleModellWechsel = (modellId) => {
    const modell = MODELLE.find(m => m.id === modellId);
    if (!modell) return;

    setAktivesModel(modellId);
    localStorage.setItem('kai_model', modellId);

    if (modell.dsgvo !== 'green' && !dsgvoGesehenKlassen.has(modell.dsgvo)) {
      setDsgvoToast({
        text: DSGVO_TOAST[modell.dsgvo](modell.anbieter || 'Drittanbieter'),
        klasse: modell.dsgvo,
      });
      setDsgvoGesehenKlassen(prev => new Set([...prev, modell.dsgvo]));
    } else {
      setDsgvoToast(null);
    }
  };

  const selectChat = (chat) => {
    setCurrentChatId(chat.id);
    try {
      const parsed = JSON.parse(chat.inhalt);
      setMessages(parsed);
    } catch (e) {
      setMessages([{ role: 'kai', content: chat.inhalt }]);
    }
  };

  const newChat = () => {
    setCurrentChatId(null);
    setMessages([]);
  };

  const deleteChat = async (id) => {
    if (!window.confirm('Möchtest du diesen Chat wirklich unwiderruflich löschen?')) return;
    const { error } = await chatRepository.deleteChat(id);
    if (error) {
      console.error('[useKAiChat] Delete error:', error);
      return;
    }
    if (currentChatId && currentChatId.toString() === id.toString()) {
      newChat();
    }
  };

  const togglePin = async (chat) => {
    const { error } = await chatRepository.toggleChatPin(chat.id, !chat.pinned);
    if (error) {
      console.error('[useKAiChat] Pin error:', error);
    }
  };

  const saveTitle = async (title) => {
    if (!currentChatId || !title.trim()) return;
    const { error } = await chatRepository.updateChatTitle(currentChatId, title.trim());
    if (error) {
      console.error('[useKAiChat] Save title error:', error);
    }
  };

  const handleSend = async () => {
    if (!input.trim() || loading) return;
    const modell = MODELLE.find(m => m.id === aktivesModel);
    if (!modell) return;
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
        const { data, error } = await chatRepository.createChat(
          aktiveProjekt?.name || 'Global',
          title,
          serializedUser
        );
        if (error) throw new Error(error);
        if (data?.id) {
          chatId = data.id;
          setCurrentChatId(chatId);
        }
      } else {
        const { error } = await chatRepository.updateChatContent(chatId, serializedUser);
        if (error) throw new Error(error);
      }

      // Load wiki context
      const { data: wikiContextData } = await chatRepository.loadWikiContext(aktiveProjekt?.name);
      const wikiContextStr = wikiContextData && wikiContextData.length > 0
        ? '\nKONTEXT AUS DEM WIKI:\n' + wikiContextData.map(d => d.inhalt).join('\n---\n')
        : '';

      const systemPrompt = [
        'Du bist KAi, KI-Assistent von KAiOSS.',
        'Antworte kurz und präzise im Terminal-Stil.',
        wikiContextStr
      ].join('\n');

      const history = messages.filter(m => !m.isStreaming && m.content);

      let finalContent = '';
      if (modell.typ === 'ollama') {
        const formattedHistory = history.map(m => ({
          role: m.role === 'kai' ? 'assistant' : 'user',
          content: m.content
        }));

        finalContent = await ollamaService.chatStream(
          modell.endpoint,
          modell.model,
          [
            { role: 'system', content: systemPrompt },
            ...formattedHistory,
            { role: 'user', content: frage }
          ],
          (content) => {
            setMessages(prev => {
              const next = [...prev];
              const last = { ...next[next.length - 1] };
              if (last.role === 'kai') last.content = content;
              next[next.length - 1] = last;
              return next;
            });
          }
        );
      } else {
        throw new Error(`API_TYP_${modell.typ.toUpperCase()}_NOCH_NICHT_IMPLEMENTIERT`);
      }

      const finalMessages = [...newMessagesUser, { role: 'kai', content: finalContent }];
      setMessages(finalMessages);

      if (chatId) {
        const serializedFinal = JSON.stringify(finalMessages);
        await chatRepository.updateChatContent(chatId, serializedFinal);
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
          await ollamaService.pullModel(modelName, (status, pct) => {
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

  return {
    input,
    setInput,
    messages,
    loading,
    ollamaOnline,
    aktivesModel,
    handleModellWechsel,
    dsgvoToast,
    setDsgvoToast,
    wikiContextCount,
    currentChatId,
    chats,
    selectChat,
    newChat,
    deleteChat,
    togglePin,
    saveTitle,
    handleSend
  };
}
