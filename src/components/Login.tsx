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
    <div className="min-h-screen flex flex-col items-center justify-between bg-white p-4 py-6">
      {/* Conteúdo principal centralizado */}
      <div className="h-screen flex-1 flex flex-col items-center justify-center w-full">
        <div className="bg-[#506D67] rounded-lg shadow-xl p-6 w-full max-w-md">
          <div className="text-center mb-6">
            <div className="flex flex-col items-center">
              {/* Substituindo o texto por uma imagem responsiva */}
              <div className="mb-">
                <img 
                  src="/imagens/banner1.png" 
                  alt="Logo Offi" 
                  className="w-[253px] sm:w-[300px] md:w-[300px]" // Responsivo: tamanhos diferentes para diferentes breakpoints
                />
              </div>
              <span className="text-[#FFFFFF] text-base">Gestão e Precificação para Marceneiros</span>
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
                <label htmlFor="email" className="block text-sm font-medium text-[#FFFFFF] mb-1">
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
                    className="pl-10 w-full p-2 border border-gray-300 rounded-md focus:ring-[#FF8800] focus:border-[#FF8800]"
                    placeholder="seu@email.com"
                  />
                </div>
              </div>
              
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-[#FFFFFF] mb-1">
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
                    className="pl-10 w-full p-2 border border-gray-300 rounded-md focus:ring-[#FF8800] focus:border-[#FF8800]"
                    placeholder="••••••••"
                  />
                </div>
              </div>
              
              <button
                type="submit"
                disabled={loading}
                className={`w-full py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-[#FF8800] hover:bg-[#e67a00] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#FF8800] ${
                  loading ? 'opacity-70 cursor-not-allowed' : ''
                }`}
              >
                {loading ? (
                  <span className="flex items-center justify-center">
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Entrando...
                  </span>
                ) : (
                  <span className="flex items-center justify-center">
                    <LogIn size={18} className="mr-2" />
                    Entrar
                  </span>
                )}
              </button>
              
              <div className="text-center">
                <button
                  type="button"
                  onClick={() => setShowResetPassword(true)}
                  className="text-[#FFFFFF] hover:underline text-sm"
                >
                  Esqueceu sua senha?
                </button>
              </div>
              <div className="text-center mt-2">
                <p className="text-sm text-[#FFFFFF]">
                  Não tem uma conta?{' '}
                  <Link to="/signup" className="text-[#FF8800] hover:underline">
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
                    className="mt-4 text-[#FF8800] hover:underline"
                  >
                    Voltar para o login
                  </button>
                </div>
              ) : (
                <>
                  <div className="text-center mb-4">
                    <h2 className="text-xl font-semibold text-[#FFFFFF]">Redefinir Senha</h2>
                    <p className="text-[#FFFFFF] mt-1">
                      Informe seu e-mail para receber instruções de redefinição de senha.
                    </p>
                  </div>
                  
                  <form onSubmit={handleResetPassword} className="space-y-4">
                    <div>
                      <label htmlFor="reset-email" className="block text-sm font-medium text-[#FFFFFF] mb-1">
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
                          className="pl-10 w-full p-2 border border-gray-300 rounded-md focus:ring-[#FF8800] focus:border-[#FF8800]"
                          placeholder="seu@email.com"
                        />
                      </div>
                    </div>
                    
                    <button
                      type="submit"
                      disabled={loading}
                      className={`w-full py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-[#FF8800] hover:bg-[#e67a00] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#FF8800] ${
                        loading ? 'opacity-70 cursor-not-allowed' : ''
                      }`}
                    >
                      {loading ? 'Enviando...' : 'Enviar instruções'}
                    </button>
                    
                    <button
                      type="button"
                      onClick={() => setShowResetPassword(false)}
                      className="w-full mt-2 text-center text-sm text-white hover:underline"
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
        <div className="text-gray-600 text-sm mt-4 text-center">
          <a href="https://wa.me/31995993693" target="_blank" rel="noopener noreferrer">
            Desenvolvido por José Carlos Sant'Anna
          </a>
        </div>
      </div>
    </div>
  );
}