import React, { useState } from 'react';
import { UserPlus, Mail, Lock, AlertCircle, User, CreditCard, Phone, MapPin, Hash, Home } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { Link } from 'react-router-dom';
import { AlertTriangle } from 'lucide-react';
import { FaWhatsapp } from 'react-icons/fa';
import { createCustomer } from '../services/customerService';

export function Signup() {
  const { signUp } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [cpfCnpj, setCpfCnpj] = useState('');
  const [phone, setPhone] = useState('');
  const [cep, setCep] = useState('');
  const [addressNumber, setAddressNumber] = useState('');
  const [addressComplement, setAddressComplement] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const [asaasError, setAsaasError] = useState<string | null>(null);

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name || !email || !cpfCnpj || !phone || !cep || !addressNumber || !addressComplement || !password || !confirmPassword) {
      setError('Por favor, preencha todos os campos');
      return;
    }

    if (password !== confirmPassword) {
      setError('As senhas não coincidem');
      return;
    }

    if (password.length < 6) {
      setError('A senha deve ter pelo menos 6 caracteres');
      return;
    }
    
    try {
      setLoading(true);
      setError(null);
      setAsaasError(null);
/*
      // 1. Cadastro no Asaas (primeiro!)
      try {
        await createCustomer({
          name,
          email,
          cpfCnpj,
          mobilePhone: phone,
          postalCode: cep,
          addressNumber,
          complement: addressComplement
        });
      } catch (asaasErr: any) {
        setError('Erro ao integrar com o Asaas. Cadastro não realizado. Entre em contato com o suporte.');
        setSuccess(false);
        setLoading(false);
        return;
      }
*/
      // 2. Cadastro no seu sistema (Supabase)
      const { error } = await signUp(email, password, name, {
        cpfCnpj,
        phone,
        cep,
        addressNumber,
        addressComplement
      });

      if (error) {
        setError(error.message || 'Erro ao criar conta');
        setSuccess(false);
        setLoading(false);
        return;
      }

      setSuccess(true);
    } catch (err) {
      setError('Ocorreu um erro ao tentar criar sua conta');
      setSuccess(false);
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-between bg-white p-4 py-6">
      {/* Conteúdo principal centralizado */}
      <div className="flex-1 flex flex-col items-center justify-center w-full">
        <div className="bg-[#506D67] rounded-lg shadow-xl p-6 w-full max-w-md">
          <div className="text-center mb-8">
            <div className="flex flex-col items-center">
              <div className="mb-2">
                <img 
                  src="/imagens/banner1.png" 
                  alt="Logo Offi" 
                  className="w-[250px] sm:w-[350px] md:w-[300px]" // Responsivo: tamanhos diferentes para diferentes breakpoints
                />
              </div>
              <span className="text-[#FFFFFF] text-lg mt-1 mb-2">Faça seu Cadastro</span>
            </div>
          </div>
          
          {error && (
            <div className="bg-red-50 text-red-700 p-3 rounded-md mb-4 flex items-start">
              <AlertCircle size={18} className="mr-2 mt-0.5 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}
          
          {success ? (
            <div className="text-center py-4">
              <div className="bg-green-50 text-green-700 p-4 rounded-md mb-4">
                <p className="font-medium">Conta criada com sucesso!</p>
                <p className="mt-2">
                  Verifique seu e-mail para confirmar seu cadastro e faça login para começar a usar o sistema.
                </p>
              </div>
              <div className="bg-green-50 text-green-700 p-4 rounded-md mb-4 mt-8 flex flex-col items-center">
              <AlertTriangle size={32} className="mb-2 text-[#506D67]" />
                <p className="font-medium">Verifique sua caixa de SPAM</p>
              </div>
              <Link
                to="/login"
                className="inline-block mt-4 text-[#FF8800] hover:text-[#FF8800]"
              >
                Ir para o login
              </Link>
              <div className="mt-1 flex items-center justify-center">
                <a href="https://wa.me/31995993693" target="_blank" rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 mt-4 text-white hover:underline"
                >
                  <FaWhatsapp size={20} className="text-white" />
                  Precisa de Suporte? Clique Aqui
                </a>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSignup} className="space-y-4">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-[#FFFFFF] mb-1">
                  Nome completo
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <User size={18} className="text-gray-400" />
                  </div>
                  <input
                    id="name"
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="pl-10 w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Seu nome completo"
                  />
                </div>
              </div>
              
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
                    className="pl-10 w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                    placeholder="seu@email.com"
                  />
                </div>
              </div>
              
              <div>
                <label htmlFor="cpfCnpj" className="block text-sm font-medium text-[#FFFFFF] mb-1">
                  CPF ou CNPJ
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <CreditCard size={18} className="text-gray-400" />
                  </div>
                  <input
                    id="cpfCnpj"
                    type="text"
                    value={cpfCnpj}
                    onChange={(e) => setCpfCnpj(e.target.value)}
                    className="pl-10 w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                    placeholder="000.000.000-00 ou 00.000.000/0000-00"
                    required
                  />
                </div>
              </div>
              
              <div>
                <label htmlFor="phone" className="block text-sm font-medium text-[#FFFFFF] mb-1">
                  Celular
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Phone size={18} className="text-gray-400" />
                  </div>
                  <input
                    id="phone"
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="pl-10 w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                    placeholder="(00) 00000-0000"
                    required
                  />
                </div>
              </div>
              
              <div>
                <label htmlFor="cep" className="block text-sm font-medium text-[#FFFFFF] mb-1">
                  CEP
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <MapPin size={18} className="text-gray-400" />
                  </div>
                  <input
                    id="cep"
                    type="text"
                    value={cep}
                    onChange={(e) => setCep(e.target.value)}
                    className="pl-10 w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                    placeholder="00000-000"
                    required
                  />
                </div>
              </div>
              
              <div>
                <label htmlFor="addressNumber" className="block text-sm font-medium text-[#FFFFFF] mb-1">
                  Número do endereço
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Hash size={18} className="text-gray-400" />
                  </div>
                  <input
                    id="addressNumber"
                    type="text"
                    value={addressNumber}
                    onChange={(e) => setAddressNumber(e.target.value)}
                    className="pl-10 w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                    placeholder="123"
                    required
                  />
                </div>
              </div>
              
              <div>
                <label htmlFor="addressComplement" className="block text-sm font-medium text-[#FFFFFF] mb-1">
                  Complemento
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Home size={18} className="text-gray-400" />
                  </div>
                  <input
                    id="addressComplement"
                    type="text"
                    value={addressComplement}
                    onChange={(e) => setAddressComplement(e.target.value)}
                    className="pl-10 w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Apto 101, Bloco B"
                    required
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
                    className="pl-10 w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Mínimo 6 caracteres"
                  />
                </div>
              </div>
              
              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-[#FFFFFF] mb-1">
                  Confirmar senha
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Lock size={18} className="text-gray-400" />
                  </div>
                  <input
                    id="confirmPassword"
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="pl-10 w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Digite a senha novamente"
                  />
                </div>
              </div>
              
              <button
                type="submit"
                disabled={loading}
                className={`w-full flex justify-center items-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-[#FF8800] hover:bg-[#FF8800] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#FF8800] ${
                  loading ? 'opacity-70 cursor-not-allowed' : ''
                }`}
              >
                {loading ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Criando conta...
                  </>
                ) : (
                  <>
                    <UserPlus size={18} className="mr-2" />
                    Criar conta
                  </>
                )}
              </button>
              
              <div className="text-center mt-4">
                <p className="text-sm text-[#FFFFFF]">
                  Já tem uma conta?{' '}
                  <Link to="/login" className="text-[#FF8800] hover:text-[#FF8800]">
                    Faça login
                  </Link>
                  <div className="mt-1 flex items-center justify-center">
                <a href="https://wa.me/31995993693" target="_blank" rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 mt-4 text-white hover:underline"
                >
                  <FaWhatsapp size={20} className="text-white" />
                  Suporte
                </a>
              </div>
                </p>
              </div>
            </form>
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