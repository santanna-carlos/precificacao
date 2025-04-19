import React, { useState } from 'react';
import { LogIn, Mail, Lock, AlertCircle } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { Link } from 'react-router-dom';

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
    <div className="min-h-screen flex flex-col items-center justify-between bg-gradient-to-b from-gray-800 to-gray-900 p-4 py-6">
      {/* Conteúdo principal centralizado */}
      <div className="flex-1 flex flex-col items-center justify-center w-full">
        <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md">
          <div className="text-center mb-8">
            <div className="flex flex-col items-center">
              <h1 className="text-3xl font-bold mb-2 relative">
                <span className="bg-gradient-to-r from-blue-600 via-blue-500 to-blue-400 bg-clip-text text-transparent">
                  Marcenaria Pro
                </span>
              </h1>
              <span className="text-gray-600 text-sm mt-2">Gestão e Precificação para Marceneiros</span>
            </div>
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
                className={`w-full flex items-center justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${
                  loading ? 'opacity-70 cursor-not-allowed' : ''
                }`}
              >
                {loading ? (
                  'Entrando...'
                ) : (
                  <>
                    <LogIn size={18} className="mr-2" />
                    Entrar
                  </>
                )}
              </button>
              
              <div className="text-center mt-4">
                <button
                  type="button"
                  onClick={() => setShowResetPassword(true)}
                  className="text-sm text-blue-600 hover:text-blue-800"
                >
                  Esqueceu sua senha?
                </button>
              </div>
              <div className="text-center mt-2">
                <p className="text-sm text-gray-600">
                  Não tem uma conta?{' '}
                  <Link to="/signup" className="text-blue-600 hover:text-blue-800">
                    Cadastre-se
                  </Link>
                </p>
              </div>
            </form>
          ) : (
            <>
              {resetSent ? (
                <div className="text-center py-4">
                  <div className="bg-green-50 text-green-700 p-4 rounded-md mb-4">
                    <p className="font-medium">E-mail enviado!</p>
                    <p className="mt-2">
                      Verifique sua caixa de entrada para instruções sobre como redefinir sua senha.
                    </p>
                  </div>
                  <button
                    type="button"
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
                  <div className="text-center mb-4">
                    <h2 className="text-xl font-semibold text-gray-800">Redefinir Senha</h2>
                    <p className="text-gray-600 mt-1">
                      Informe seu e-mail para receber instruções de redefinição de senha.
                    </p>
                  </div>
                  
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
                      className={`w-full py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${
                        loading ? 'opacity-70 cursor-not-allowed' : ''
                      }`}
                    >
                      {loading ? 'Enviando...' : 'Enviar instruções'}
                    </button>
                    
                    <button
                      type="button"
                      onClick={() => setShowResetPassword(false)}
                      className="w-full mt-2 text-center text-sm text-blue-600 hover:text-blue-800"
                    >
                      Voltar para o login
                    </button>
                  </form>
                </>
              )}
            </>
          )}
        </div>
        
        {/* Texto de crédito abaixo da caixa branca */}
        <div className="text-gray-400 text-sm mt-4 text-center">
          Desenvolvido por José Carlos Sant'Anna
        </div>
      </div>
    </div>
  );
}