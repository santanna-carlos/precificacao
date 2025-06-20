import React, { useState, useRef, useEffect } from 'react';

const ChatInput: React.FC<{ onSend: (msg: string) => void; disabled?: boolean }> = ({ onSend, disabled }) => {
  const [value, setValue] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  
  // Ajusta a altura do textarea quando o valor muda
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [value]);
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (value.trim()) {
      onSend(value.trim());
      setValue('');
      // Reset altura do textarea
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
      }
    }
  };
  
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };
  
  return (
    <form onSubmit={handleSubmit} className="flex p-2 border-t bg-white">
      <textarea
        ref={textareaRef}
        className="flex-1 rounded-l-md border border-gray-200 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-300 resize-none overflow-hidden"
        placeholder="Digite sua mensagem..."
        value={value}
        onChange={e => setValue(e.target.value)}
        onKeyDown={handleKeyDown}
        disabled={disabled}
        rows={1}
        style={{ minHeight: '40px', maxHeight: '160px' }}
        autoFocus
      />
      <button
        type="submit"
        className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-r-md transition"
        disabled={disabled || !value.trim()}
      >
        Enviar
      </button>
    </form>
  );
};

export default ChatInput;