import React from 'react';
import ReactMarkdown from 'react-markdown';

interface ChatMessageProps {
  role: 'user' | 'agent';
  content: string;
}

const ChatMessage: React.FC<ChatMessageProps> = ({ role, content }) => (
  <div className={`flex ${role === 'user' ? 'justify-end' : 'justify-start'}`}>
    <div
      className={`px-4 py-2 rounded-lg max-w-xs ${
        role === 'user'
          ? 'bg-blue-600 text-white self-end'
          : 'bg-gray-100 text-gray-800 self-start'
      }`}
      /* ← esta linha faz \n virar <br>, sem estragar o Markdown */
      style={{ whiteSpace: 'pre-line' }}
    >
      <ReactMarkdown>{content}</ReactMarkdown>
    </div>
  </div>
);

export default ChatMessage;
