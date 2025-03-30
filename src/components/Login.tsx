import React, { useState } from 'react';
import { LogIn, Mail, Lock, AlertCircle } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

export function Login() {
  const { signIn, resetPassword } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [showResetPassword, setShowResetPassword] = useState(false);
  const [resetSent, setResetSent] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !password) {
      setError('Por favor, preencha todos os campos');
      return;
    }
    
    try {
      setLoading(true);
      setError(null);
      
      const { error } = await signIn(email, password);
      
      if (error) {
        setError(error.message || 'Erro ao fazer login');
      }
    } catch (err) {
      setError('Ocorreu um erro ao tentar fazer login');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email) {
      setError('Por favor, informe seu e-mail');
      return;
    }
    
    try {
      setLoading(true);
      setError(null);
      
      const { error, success } = await resetPassword(email);
      
      if (error) {
        setError(error.message || 'Erro ao solicitar redefinição de senha');
      } else if (success) {
        setResetSent(true);
      }
    } catch (err) {
      setError('Ocorreu um erro ao solicitar redefinição de senha');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-b from-gray-800 to-gray-900 p-4 relative">
      <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-blue-400 bg-clip-text text-transparent mb-2">Gestão e Precificação para Marceneiros</h1>
          
        </div>
        
        {error && (
          <div className="bg-red-50 text-red-700 p-3 rounded-md mb-4 flex items-start">
            <AlertCircle size={18} className="mr-2 mt-0.5 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}
        
        {!showResetPassword ? (
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                E-mail
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail size={18} className="text-gray-400" />
                </div>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-10 w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  placeholder="seu@email.com"
                />
              </div>
            </div>
            
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                Senha
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock size={18} className="text-gray-400" />
                </div>
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10 w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  placeholder="••••••••"
                />
              </div>
            </div>
            
            <button
              type="submit"
              disabled={loading}
              className={`w-full flex items-center justify-center gap-2 py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-colors ${
                loading ? 'opacity-70 cursor-not-allowed' : ''
              }`}
            >
              <LogIn size={18} />
              <span>{loading ? 'Entrando...' : 'Entrar'}</span>
            </button>
            
            <div className="mt-4 text-center">
              <button
                type="button"
                onClick={() => setShowResetPassword(true)}
                className="text-sm text-blue-600 hover:text-blue-800"
              >
                Esqueceu sua senha?
              </button>
            </div>
          </form>
        ) : (
          <>
            {resetSent ? (
              <div className="text-center py-4">
                <div className="bg-green-50 text-green-700 p-4 rounded-md mb-4">
                  <p>Um link para redefinir sua senha foi enviado para o e-mail informado.</p>
                  <p className="mt-2">Verifique sua caixa de entrada e siga as instruções.</p>
                </div>
                <button
                  onClick={() => {
                    setShowResetPassword(false);
                    setResetSent(false);
                  }}
                  className="mt-4 text-blue-600 hover:text-blue-800"
                >
                  Voltar para o login
                </button>
              </div>
            ) : (
              <>
                <h2 className="text-xl font-semibold text-gray-800 mb-4">Redefinir Senha</h2>
                <p className="text-gray-600 mb-4">
                  Informe seu e-mail e enviaremos um link para redefinir sua senha.
                </p>
                
                <form onSubmit={handleResetPassword} className="space-y-4">
                  <div>
                    <label htmlFor="reset-email" className="block text-sm font-medium text-gray-700 mb-1">
                      E-mail
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Mail size={18} className="text-gray-400" />
                      </div>
                      <input
                        id="reset-email"
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="pl-10 w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                        placeholder="seu@email.com"
                      />
                    </div>
                  </div>
                  
                  <button
                    type="submit"
                    disabled={loading}
                    className={`w-full py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-colors ${
                      loading ? 'opacity-70 cursor-not-allowed' : ''
                    }`}
                  >
                    {loading ? 'Enviando...' : 'Enviar link de redefinição'}
                  </button>
                  
                  <button
                    type="button"
                    onClick={() => setShowResetPassword(false)}
                    className="w-full py-2 px-4 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-md transition-colors mt-2"
                  >
                    Voltar para o login
                  </button>
                </form>
              </>
            )}
          </>
        )}
      </div>
      <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 text-gray-400 text-sm whitespace-nowrap">
        Desenvolvido por José Carlos Sant'Anna
      </div>
    </div>
  );
}