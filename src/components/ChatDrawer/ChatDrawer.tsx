import React, { useState, useRef, useEffect } from 'react';
import { X, Loader2 } from 'lucide-react';
import ChatInput from './ChatInput';
import ChatMessage from './ChatMessage';

// util ─ cria UUID v4 se o browser suporta, senão fallback simples
const generateId = () =>
  (crypto?.randomUUID ? crypto.randomUUID() : Math.random().toString(36).slice(2));

const ChatDrawer: React.FC = () => {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<{ role: 'user' | 'agent'; content: string }[]>([]);
  const [loading, setLoading] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [showBalloon, setShowBalloon] = useState(false);
  const drawerRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // ➜ 1. cria ou recupera ID único por usuário
  useEffect(() => {
    const saved = localStorage.getItem('chat-session-id');
    if (saved) {
      setSessionId(saved);
    } else {
      const id = generateId();
      localStorage.setItem('chat-session-id', id);
      setSessionId(id);
    }
  }, []);

  // Mostrar balão temporário por 5 segundos
  useEffect(() => {
    setShowBalloon(true);
    const timer = setTimeout(() => {
      setShowBalloon(false);
    }, 8000);
    
    return () => clearTimeout(timer);
  }, []);

  // fecha quando clica fora
  useEffect(() => {
    if (!open) return;
    const handleClickOutside = (event: MouseEvent) => {
      if (drawerRef.current && !drawerRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [open]);

  // rola sempre para a última msg
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // ➜ 2. envia msg + sessionId ao n8n
  const handleSend = async (msg: string) => {
    if (!sessionId) return; // ainda não temos ID

    setMessages(prev => [...prev, { role: 'user', content: msg }]);
    setLoading(true);

    try {
      const resp = await fetch('https://n8n.espacoharmonia.com/webhook/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId, message: msg }),
      });

      const replyText = await resp.text();
      setMessages(prev => [...prev, { role: 'agent', content: replyText }]);
    } catch (e) {
      setMessages(prev => [...prev, { role: 'agent', content: '⚠️ Erro ao conectar com o assistente.' }]);
    }
    setLoading(false);
  };

  return (
    <>
      {/* Floating button */}
      {!open && (
        <div
          style={{
            position: 'fixed',
            bottom: '24px',
            right: '24px',
            zIndex: 9999,
            filter: 'drop-shadow(0 4px 12px rgba(0,0,0,0.25))',
          }}
        >
          <button
            className="bg-green-600 hover:bg-green-700 text-white p-1 rounded-full transition-all transform hover:scale-110 flex items-center justify-center"
            aria-label="Abrir chat com IA"
            onClick={() => setOpen(true)}
            style={{ width: '70px', height: '70px', animation: 'pulse 2s infinite ease-in-out' }}
          >
            <img src="/imagens/jesus.png" alt="Jesus" width="60" height="60" />
            <style jsx>{`
              @keyframes pulse {
                0% {
                  box-shadow: 0 0 0 0 rgba(19, 78, 7, 0.7);
                }
                70% {
                  box-shadow: 0 0 0 10px rgba(37, 99, 235, 0);
                }
                100% {
                  box-shadow: 0 0 0 0 rgba(37, 99, 235, 0);
                }
              }
            `}</style>
          </button>
          
          {/* Balão de mensagem */}
          {showBalloon && (
            <div 
              className="absolute bg-white text-gray-800 p-3 rounded-lg shadow-lg"
              style={{
                bottom: '80px',
                right: '0',
                width: '180px',
                borderRadius: '12px',
                animation: 'fadeIn 0.5s',
                border: '1px solid #e2e8f0'
              }}
            >
              <div className="text-sm font-medium">Se precisar de ajuda, estou aqui!</div>
              <div 
                style={{
                  position: 'absolute',
                  bottom: '-10px',
                  right: '30px',
                  width: '20px',
                  height: '10px',
                  overflow: 'hidden'
                }}
              >
                <div 
                  style={{
                    position: 'absolute',
                    transform: 'translateY(-50%) rotate(45deg)',
                    width: '14px',
                    height: '14px',
                    backgroundColor: 'white',
                    border: '1px solid #e2e8f0',
                    borderTop: 'none',
                    borderLeft: 'none'
                  }}
                />
              </div>
              <style jsx>{`
                @keyframes fadeIn {
                  from { opacity: 0; transform: translateY(10px); }
                  to { opacity: 1; transform: translateY(0); }
                }
              `}</style>
            </div>
          )}
        </div>
      )}

      {/* Drawer */}
      {open && (
        <div
          ref={drawerRef}
          className="fixed top-0 right-0 h-full bg-white shadow-2xl border-l border-gray-200 flex flex-col transition-transform duration-300 ease-in-out"
          style={{ width: '100%', maxWidth: 'min(100vw, 24rem)', transform: open ? 'translateX(0)' : 'translateX(100%)', zIndex: 9999 }}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-3 border-b bg-blue-50">
            <span className="font-semibold text-blue-700">Jesus</span>
            <button onClick={() => setOpen(false)} aria-label="Fechar chat" className="p-1 rounded-full hover:bg-gray-200 transition-colors">
              <X size={22} />
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.length === 0 ? (
              <div className="text-center text-gray-500 py-8">
                <p className="mb-2">👋 Oi! Sou o Jesus, seu assistente de marcenaria. Como posso te ajudar?</p>
                <p className="text-sm"><br></br>Faça perguntas sobre plano de corte, listagem de peças e ferragens ou sobre as finanças da sua marcenaria.</p>
              </div>
            ) : (
              messages.map((msg, i) => <ChatMessage key={i} role={msg.role} content={msg.content} />)
            )}
            {loading && (
              <div className="flex items-center text-gray-500">
                <Loader2 className="animate-spin mr-2" size={18} />
                <span>Pensando...</span>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <ChatInput onSend={handleSend} disabled={loading} />
        </div>
      )}
    </>
  );
};

export default ChatDrawer;