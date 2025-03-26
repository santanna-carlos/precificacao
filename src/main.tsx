import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';

// Componente de fallback para debug
const FallbackComponent = () => {
  return (
    <div style={{ 
      padding: '20px', 
      fontFamily: 'Arial, sans-serif',
      maxWidth: '600px',
      margin: '40px auto',
      backgroundColor: '#f8f9fa',
      borderRadius: '8px',
      boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
    }}>
      <h1 style={{ color: '#3b82f6' }}>Aplicativo de Precificação</h1>
      <p>Se você está vendo esta mensagem, o React está funcionando, mas há um problema com o componente principal.</p>
      <p>Por favor, verifique o console do navegador (F12) para ver os erros.</p>
    </div>
  )
}

// Renderizar o aplicativo com tratamento de erros
try {
  const root = ReactDOM.createRoot(document.getElementById('root') as HTMLElement);
  root.render(
    <React.StrictMode>
      <App />
    </React.StrictMode>,
  )
} catch (error) {
  console.error('Erro ao renderizar o aplicativo:', error)
  const root = ReactDOM.createRoot(document.getElementById('root') as HTMLElement);
  root.render(
    <FallbackComponent />
  )
}
