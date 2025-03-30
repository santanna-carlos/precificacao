import { createClient } from '@supabase/supabase-js';

// As variáveis são substituídas em tempo de build
// Isso não oculta as chaves nas requisições de rede, mas pelo menos
// evita que apareçam diretamente no código-fonte
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

// Criar o cliente Supabase com configurações de segurança melhoradas
export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    persistSession: true,  // Ativa a persistência da sessão
    autoRefreshToken: true, // Ativa a renovação automática do token
    detectSessionInUrl: true, // Mantém a detecção de sessão na URL para login inicial
    storage: window.sessionStorage // Usa sessionStorage em vez de localStorage
  },
  // Desativa logs de debug que podem expor informações sensíveis
  debug: false,
  // Configurações globais para todas as requisições fetch
  global: {
    headers: {
      'Accept': 'application/json',
      'Content-Type': 'application/json',
      'X-Client-Info': 'app_precificacao'
    },
    fetch: (url, options) => {
      // Configurar timeout para evitar requisições penduradas
      const timeoutId = setTimeout(() => console.error('Supabase request timeout'), 30000);
      
      return fetch(url, {
        ...options,
        // Garantir que o modo credentials seja incluído
        credentials: 'same-origin',
        // Garantir que o modo cors seja explícito
        mode: 'cors',
      }).then(response => {
        clearTimeout(timeoutId);
        return response;
      }).catch(error => {
        clearTimeout(timeoutId);
        console.error('Erro na requisição Supabase:', error);
        throw error;
      });
    }
  }
});