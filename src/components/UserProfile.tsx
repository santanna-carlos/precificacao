import React, { useState, useEffect } from 'react';
import { User } from '@supabase/supabase-js';
import { useAuth } from '../contexts/AuthContext';
import { AlertCircle, User as UserIcon, Mail, Lock, Save, X, Info } from 'lucide-react';
import { getUserProfile, updateUserName, updateUserPassword, UserProfile as ProfileType } from '../services/profileService';

export function UserProfile() {
  const { user, refreshSession } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  const [showPasswordChange, setShowPasswordChange] = useState(false);
  
  useEffect(() => {
    const loadUserProfile = async () => {
      if (user) {
        setLoading(true);
        setError(null);
        
        try {
          const { data, error } = await getUserProfile();
          
          if (error) {
            setError('Erro ao carregar perfil: ' + error.message);
            return;
          }
          
          if (data) {
            setName(data.name || '');
            setEmail(data.email || '');
          }
        } catch (err: any) {
          setError('Erro ao carregar perfil: ' + err.message);
        } finally {
          setLoading(false);
        }
      }
    };
    
    loadUserProfile();
  }, [user]);
  
  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);
    
    try {
      // Atualizar o nome do usuário
      const { error: nameError } = await updateUserName(name);
      
      if (nameError) {
        throw new Error(nameError.message);
      }
      
      setSuccess('Perfil atualizado com sucesso!');
      
      // Atualizar a sessão para refletir as mudanças
      await refreshSession();
    } catch (err: any) {
      setError(err.message || 'Erro ao atualizar perfil');
    } finally {
      setLoading(false);
    }
  };
  
  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (newPassword !== confirmPassword) {
      setError('As senhas não coincidem');
      return;
    }
    
    if (newPassword.length < 6) {
      setError('A senha deve ter pelo menos 6 caracteres');
      return;
    }
    
    setLoading(true);
    setError(null);
    setSuccess(null);
    
    try {
      const { error } = await updateUserPassword(newPassword);
      
      if (error) {
        throw new Error(error.message);
      }
      
      setSuccess('Senha alterada com sucesso!');
      setNewPassword('');
      setConfirmPassword('');
      setShowPasswordChange(false);
    } catch (err: any) {
      setError(err.message || 'Erro ao alterar senha');
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="bg-white rounded-lg shadow-md p-6">
        <h1 className="text-2xl font-bold text-gray-800 mb-6">Meu Perfil</h1>
        
        {error && (
          <div className="bg-red-50 text-red-700 p-3 rounded-md mb-4 flex items-start">
            <AlertCircle size={18} className="mr-2 mt-0.5 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}
        
        {success && (
          <div className="bg-green-50 text-green-700 p-3 rounded-md mb-4 flex items-start">
            <Save size={18} className="mr-2 mt-0.5 flex-shrink-0" />
            <span>{success}</span>
          </div>
        )}
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div>
            <h2 className="text-lg font-semibold text-gray-700 mb-4">Informações Pessoais</h2>
            
            <form onSubmit={handleUpdateProfile} className="space-y-4">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                  Nome
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <UserIcon size={18} className="text-gray-400" />
                  </div>
                  <input
                    id="name"
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="pl-10 w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Seu nome"
                  />
                </div>
              </div>
              
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
                    disabled
                    className="pl-10 w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                    placeholder="seu@email.com"
                  />
                </div>
                <p className="text-sm text-gray-600 mt-1">
                  Para alterar o e-mail, entre em contato com a equipe de suporte.
                </p>
              </div>
              
              <button
                type="submit"
                disabled={loading}
                className={`py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-colors ${
                  loading ? 'opacity-70 cursor-not-allowed' : ''
                }`}
              >
                {loading ? 'Salvando...' : 'Salvar Alterações'}
              </button>
            </form>
          </div>
          
          <div>
            <h2 className="text-lg font-semibold text-gray-700 mb-4">Segurança</h2>
            
            {!showPasswordChange ? (
              <button
                onClick={() => setShowPasswordChange(true)}
                className="py-2 px-4 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-md transition-colors"
              >
                Alterar Senha
              </button>
            ) : (
              <form onSubmit={handleChangePassword} className="space-y-4">
                <div>
                  <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700 mb-1">
                    Nova Senha
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Lock size={18} className="text-gray-400" />
                    </div>
                    <input
                      id="newPassword"
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="pl-10 w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Nova senha"
                    />
                  </div>
                </div>
                
                <div>
                  <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1">
                    Confirmar Senha
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
                      placeholder="Confirmar nova senha"
                    />
                  </div>
                </div>
                
                <div className="flex space-x-2">
                  <button
                    type="submit"
                    disabled={loading}
                    className={`py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-colors ${
                      loading ? 'opacity-70 cursor-not-allowed' : ''
                    }`}
                  >
                    {loading ? 'Alterando...' : 'Confirmar'}
                  </button>
                  
                  <button
                    type="button"
                    onClick={() => {
                      setShowPasswordChange(false);
                      setNewPassword('');
                      setConfirmPassword('');
                    }}
                    className="py-2 px-4 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-md transition-colors"
                  >
                    Cancelar
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}