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
  debug: false
});