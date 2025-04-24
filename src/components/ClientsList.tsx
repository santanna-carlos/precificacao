import React, { useState, useRef, useMemo } from 'react';
import { Phone, User, Calendar, Search, Briefcase, ChevronRight, Mail, MapPin, Plus, Edit, Trash2, X, Save } from 'lucide-react';
import { Project, Client } from '../types';

interface ClientsListProps {
  clients: Client[];
  projects?: Project[];
  onAddClient: (client: Omit<Client, 'id' | 'createdAt'>) => Client;
  onUpdateClient: (client: Client) => void;
  onDeleteClient: (clientId: string) => void;
  onSelectProject?: (projectId: string) => void; // Nova prop para selecionar um projeto
}

// Tipo para clientes derivados de projetos (para compatibilidade)
type DerivedClient = {
  name: string;
  phone: string;
  projectsCount: number;
  lastProject?: {
    name: string;
    date: string;
  }
  fromProject: true;
};

// Tipo para o formulário de cliente
type ClientFormData = {
  name: string;
  phone: string;
  email: string;
  address: string;
  notes: string;
};

export function ClientsList({ clients, projects = [], onAddClient, onUpdateClient, onDeleteClient, onSelectProject }: ClientsListProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingClientId, setEditingClientId] = useState<string | null>(null);
  const [formData, setFormData] = useState<ClientFormData>({
    name: '',
    phone: '',
    email: '',
    address: '',
    notes: ''
  });
  
  // Estado para controlar o modal de detalhes do cliente
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedClient, setSelectedClient] = useState<(Client | DerivedClient) | null>(null);
  
  // Referência para o formulário
  const formRef = useRef<HTMLFormElement>(null);
  
  // Extrair clientes únicos dos projetos (para compatibilidade)
  const derivedClients: DerivedClient[] = useMemo(() => {
    const clientMap = new Map<string, {
      name: string;
      phone: string;
      projects: Project[];
    }>();
    
    // Agrupar todos os projetos por cliente
    projects
      .filter(project => project.clientName && !project.clientId) // Apenas projetos sem clientId
      .forEach(project => {
        const clientKey = `${project.clientName.toLowerCase()}-${project.contactPhone || ''}`;
        
        if (!clientMap.has(clientKey)) {
          clientMap.set(clientKey, {
            name: project.clientName,
            phone: project.contactPhone || '',
            projects: []
          });
        }
        
        // Adicionar o projeto à lista de projetos do cliente
        clientMap.get(clientKey)!.projects.push(project);
      });
    
    // Processar cada cliente para criar o objeto DerivedClient
    const result: DerivedClient[] = [];
    
    clientMap.forEach(({ name, phone, projects }, key) => {
      if (projects.length > 0) {
        // Ordenar projetos por data (do mais recente para o mais antigo)
        const sortedProjects = [...projects].sort((a, b) => {
          const dateA = new Date(a.date || '').getTime();
          const dateB = new Date(b.date || '').getTime();
          return dateB - dateA; // Ordem decrescente (mais recente primeiro)
        });
        
        // O primeiro projeto após a ordenação é o mais recente
        const mostRecentProject = sortedProjects[0];
        
        result.push({
          name,
          phone,
          projectsCount: projects.length,
          lastProject: {
            name: mostRecentProject.name || "Sem nome",
            date: mostRecentProject.date
          },
          fromProject: true
        });
      }
    });
    
    // Ordenar clientes por nome
    return result.sort((a, b) => a.name.localeCompare(b.name));
  }, [projects]);
  
  // Contar projetos para cada cliente independente
  const clientsWithProjectCount = useMemo(() => {
    return clients.map(client => {
      const clientProjects = projects.filter(project => project.clientId === client.id);
      
      // Ordenar projetos por data (do mais recente para o mais antigo)
      const sortedProjects = [...clientProjects].sort((a, b) => {
        const dateA = new Date(a.date || '').getTime();
        const dateB = new Date(b.date || '').getTime();
        return dateB - dateA; // Ordem decrescente (mais recente primeiro)
      });
      
      const lastProject = sortedProjects.length > 0 ? sortedProjects[0] : undefined;
      
      return {
        ...client,
        projectsCount: clientProjects.length,
        lastProject: lastProject ? {
          name: lastProject.name || "Sem nome",
          date: lastProject.date
        } : undefined,
        fromProject: false
      };
    });
  }, [clients, projects]);
  
  // Combinar clientes independentes e derivados
  const allClients = useMemo(() => {
    // Criar um mapa para armazenar clientes únicos
    const uniqueClientsMap = new Map();
    
    // Primeiro, adicionar todos os clientes cadastrados
    clientsWithProjectCount.forEach(client => {
      // Usar o ID como chave para clientes cadastrados
      uniqueClientsMap.set(client.id, client);
    });
    
    // Depois, adicionar clientes derivados de projetos apenas se não existirem no mapa
    derivedClients.forEach(derivedClient => {
      // Para clientes derivados, verificar se já existe um cliente com o mesmo nome E telefone
      const existingClientWithSameNameAndPhone = Array.from(uniqueClientsMap.values()).find(
        c => c.name.toLowerCase() === derivedClient.name.toLowerCase() && 
             c.phone === derivedClient.phone
      );
      
      if (!existingClientWithSameNameAndPhone) {
        // Se não existir cliente com o mesmo nome e telefone, adicionar ao mapa
        // Usar um ID temporário para clientes derivados que inclui nome e telefone
        uniqueClientsMap.set(`derived-${derivedClient.name}-${derivedClient.phone}`, derivedClient);
      } else {
        // Se existir um cliente com o mesmo nome e telefone, atualizar a contagem de projetos
        // e informações do último projeto, se necessário
        const existingClient = existingClientWithSameNameAndPhone;
        
        // Atualizar contagem de projetos
        existingClient.projectsCount = Math.max(
          existingClient.projectsCount || 0,
          derivedClient.projectsCount || 0
        );
        
        // Atualizar último projeto se o derivado tiver um mais recente
        if (derivedClient.lastProject && existingClient.lastProject) {
          const existingDate = new Date(existingClient.lastProject.date);
          const derivedDate = new Date(derivedClient.lastProject.date);
          
          if (derivedDate > existingDate) {
            existingClient.lastProject = derivedClient.lastProject;
          }
        } else if (derivedClient.lastProject && !existingClient.lastProject) {
          existingClient.lastProject = derivedClient.lastProject;
        }
      }
    });
    
    // Converter o mapa de volta para um array e ordenar por nome
    return Array.from(uniqueClientsMap.values())
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [clientsWithProjectCount, derivedClients]);
  
  // Filtrar clientes com base no termo de busca
  const filteredClients = useMemo(() => {
    if (!searchTerm) return allClients;
    
    const term = searchTerm.toLowerCase();
    return allClients.filter(client => 
      client.name.toLowerCase().includes(term) || 
      (client.phone && client.phone.includes(term)) ||
      ('email' in client && client.email && client.email.toLowerCase().includes(term))
    );
  }, [allClients, searchTerm]);
  
  // Estatísticas gerais
  const totalClients = allClients.length;
  const totalProjects = projects.length;
  const averageProjectsPerClient = totalClients > 0 
    ? (totalProjects / totalClients).toFixed(1) 
    : '0';
    
  // Manipuladores de formulário
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    
    // Formatação especial para o campo de telefone
    if (name === 'phone') {
      // Remove todos os caracteres não numéricos
      const numericValue = value.replace(/\D/g, '');
      
      // Aplica a formatação (xx) xxxxx-xxxx
      let formattedValue = '';
      if (numericValue.length <= 2) {
        formattedValue = numericValue.length > 0 ? `(${numericValue}` : numericValue;
      } else if (numericValue.length <= 7) {
        formattedValue = `(${numericValue.slice(0, 2)}) ${numericValue.slice(2)}`;
      } else if (numericValue.length <= 11) {
        formattedValue = `(${numericValue.slice(0, 2)}) ${numericValue.slice(2, 7)}-${numericValue.slice(7)}`;
      } else {
        // Limita a 11 dígitos (DDD + 9 dígitos)
        formattedValue = `(${numericValue.slice(0, 2)}) ${numericValue.slice(2, 7)}-${numericValue.slice(7, 11)}`;
      }
      
      setFormData(prev => ({ ...prev, [name]: formattedValue }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };
  
  const handleAddNewClient = () => {
    setFormData({
      name: '',
      phone: '',
      email: '',
      address: '',
      notes: ''
    });
    setShowAddForm(true);
    setEditingClientId(null);
  };
  
  const handleEditClient = (client: Client | DerivedClient) => {
    // Se for um cliente derivado (de projeto), preparamos para criar um novo cliente
    if ('fromProject' in client && client.fromProject) {
      setFormData({
        name: client.name,
        phone: client.phone,
        email: '',
        address: '',
        notes: ''
      });
      setEditingClientId(null); // Não temos ID para editar, será um novo cliente
    } else {
      // Cliente regular
      setFormData({
        name: client.name,
        phone: client.phone,
        email: (client as Client).email || '',
        address: (client as Client).address || '',
        notes: (client as Client).notes || ''
      });
      setEditingClientId((client as Client).id);
    }
    setShowAddForm(true);
  };
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      alert('O nome do cliente é obrigatório');
      return;
    }
    
    if (editingClientId) {
      // Atualizar cliente existente
      const existingClient = clients.find(c => c.id === editingClientId);
      if (!existingClient) {
        alert('Cliente não encontrado');
        return;
      }
      
      onUpdateClient({
        ...existingClient,
        name: formData.name.trim(),
        phone: formData.phone.trim(),
        email: formData.email.trim() || undefined,
        address: formData.address.trim() || undefined,
        notes: formData.notes.trim() || undefined,
        lastModified: new Date().toISOString()
      });
    } else {
      // Adicionar novo cliente
      onAddClient({
        name: formData.name.trim(),
        phone: formData.phone.trim(),
        email: formData.email.trim() || undefined,
        address: formData.address.trim() || undefined,
        notes: formData.notes.trim() || undefined
      });
    }
    
    // Limpar formulário e fechar
    setFormData({
      name: '',
      phone: '',
      email: '',
      address: '',
      notes: ''
    });
    setShowAddForm(false);
    setEditingClientId(null);
  };
  
  // Função para abrir o modal de detalhes do cliente
  const handleViewDetails = (client: Client | DerivedClient) => {
    setSelectedClient(client);
    setShowDetailsModal(true);
  };
  
  // Função para obter os projetos associados ao cliente selecionado
  const getClientProjects = useMemo(() => {
    if (!selectedClient) return [];
    
    // Para clientes registrados (com ID)
    if ('id' in selectedClient && selectedClient.id) {
      // Buscar projetos tanto pelo ID quanto pelo nome E telefone do cliente
      return projects.filter(project => 
        // Projetos associados diretamente pelo ID
        project.clientId === selectedClient.id ||
        // Projetos associados pelo nome E telefone (sem clientId)
        (!project.clientId && 
         project.clientName && 
         project.clientName.toLowerCase() === selectedClient.name.toLowerCase() &&
         project.contactPhone === selectedClient.phone)
      );
    }
    
    // Para clientes derivados (sem ID, apenas nome e telefone)
    return projects.filter(
      project => 
        !project.clientId && 
        project.clientName && 
        project.clientName.toLowerCase() === selectedClient.name.toLowerCase() &&
        project.contactPhone === selectedClient.phone
    );
  }, [selectedClient, projects]);

  return (
    <div className="bg-white rounded-lg shadow-md p-4 sm:p-6 mb-4">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800">Meus Clientes</h2>
        
        <div className="flex flex-wrap gap-2 text-sm">
          {totalClients > 0 && (
            <>
              <div className="bg-blue-50 text-blue-700 px-3 py-1 rounded-full font-medium flex items-center">
                <User size={14} className="mr-1" />
                {totalClients} {totalClients === 1 ? 'cliente' : 'clientes'}
              </div>
              <div className="bg-green-50 text-green-700 px-3 py-1 rounded-full font-medium flex items-center">
                <Briefcase size={14} className="mr-1" />
                {totalProjects} {totalProjects === 1 ? 'projeto' : 'projetos'}
              </div>
              <div className="bg-purple-50 text-purple-700 px-3 py-1 rounded-full font-medium flex items-center">
                <Calendar size={14} className="mr-1" />
                {averageProjectsPerClient} projetos/cliente
              </div>
            </>
          )}
        </div>
      </div>
      
      {showAddForm && (
        <div className="mb-6 bg-blue-50 p-4 rounded-lg border border-blue-200">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold text-blue-800">
              {editingClientId ? 'Editar Cliente' : 'Novo Cliente'}
            </h3>
            <button 
              onClick={() => {
                setShowAddForm(false);
                setEditingClientId(null);
              }}
              className="text-gray-500 hover:text-gray-700"
            >
              <X size={20} />
            </button>
          </div>
          
          <form ref={formRef} onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nome *
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Telefone
                </label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleInputChange}
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Endereço
                </label>
                <input
                  type="text"
                  name="address"
                  value={formData.address}
                  onChange={handleInputChange}
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Observações
              </label>
              <textarea
                name="notes"
                value={formData.notes}
                onChange={handleInputChange}
                rows={3}
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            
            <div className="flex justify-end">
              <button
                type="submit"
                className="flex items-center bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
              >
                <Save size={16} className="mr-2" />
                {editingClientId ? 'Atualizar Cliente' : 'Salvar Cliente'}
              </button>
            </div>
          </form>
        </div>
      )}
      
      {!showAddForm && (
        <div className="relative mb-6">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search size={18} className="text-gray-400" />
          </div>
          <input
            type="text"
            placeholder="Buscar cliente por nome, telefone ou email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
          />
        </div>
      )}
      
      {totalClients === 0 ? (
        <div className="text-center py-10 bg-gray-50 rounded-lg border border-gray-200">
          <User size={48} className="mx-auto text-gray-300 mb-3" />
          <h3 className="text-lg font-medium text-gray-800 mb-1">Nenhum cliente cadastrado</h3>
          <p className="text-gray-500 mb-4">
            Adicione seu primeiro cliente clicando no botão "Novo Cliente".
          </p>
          <button 
            onClick={handleAddNewClient}
            className="bg-blue-600 text-white px-4 py-2 rounded-md font-medium flex items-center hover:bg-blue-700 transition-colors mx-auto"
          >
            <Plus size={16} className="mr-2" />
            Novo Cliente
          </button>
        </div>
      ) : filteredClients.length === 0 ? (
        <div className="text-center py-8 bg-gray-50 rounded-lg border border-gray-200">
          <Search size={36} className="mx-auto text-gray-300 mb-3" />
          <h3 className="text-lg font-medium text-gray-800 mb-1">Nenhum resultado encontrado</h3>
          <p className="text-gray-500">
            Tente buscar com outros termos.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
          {filteredClients.map((client, index) => (
            <div 
              key={index}
              className={`bg-white rounded-lg border overflow-hidden hover:border-blue-300 group ${
                'fromProject' in client && client.fromProject 
                  ? 'border-gray-200' 
                  : 'border-blue-200'
              }`}
            >
              <div className={`p-3 border-b ${
                'fromProject' in client && client.fromProject 
                  ? 'bg-gradient-to-r from-blue-50 to-indigo-50 border-gray-200' 
                  : 'bg-gradient-to-r from-blue-100 to-indigo-100 border-blue-200'
              }`}>
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <div className={`${
                      'fromProject' in client && client.fromProject 
                        ? 'bg-blue-100 text-blue-600' 
                        : 'bg-blue-200 text-blue-700'
                    } p-1.5 rounded-full`}>
                      <User size={16} />
                    </div>
                    <h3 className="font-semibold text-gray-800 truncate text-sm" title={client.name}>
                      {client.name}
                    </h3>
                  </div>
                  
                  <div className="flex gap-1">
                    {'id' in client && (
                      <button
                        onClick={() => onDeleteClient(client.id)}
                        className="text-red-600 hover:text-red-800 p-0.5 rounded-full hover:bg-red-50"
                        title="Excluir cliente"
                      >
                        <Trash2 size={14} />
                      </button>
                    )}
                  </div>
                </div>
                
                {client.phone && (
                  <div className="flex items-center gap-1.5 text-gray-600 ml-7 text-xs">
                    <Phone size={12} className="text-gray-400" />
                    <a href={`tel:${client.phone}`} className="hover:text-blue-600 transition-colors">
                      {client.phone}
                    </a>
                  </div>
                )}
                
                {'email' in client && client.email && (
                  <div className="flex items-center gap-1.5 text-gray-600 ml-7 mt-0.5 text-xs">
                    <Mail size={12} className="text-gray-400" />
                    <a href={`mailto:${client.email}`} className="hover:text-blue-600 transition-colors truncate" title={client.email}>
                      {client.email}
                    </a>
                  </div>
                )}
                
                {'address' in client && client.address && (
                  <div className="flex items-center gap-1.5 text-gray-600 ml-7 mt-0.5 text-xs">
                    <MapPin size={12} className="text-gray-400" />
                    <span className="truncate" title={client.address}>
                      {client.address}
                    </span>
                  </div>
                )}
              </div>
              
              <div className="p-2">
                <div className="flex justify-between items-center mb-1">
                  <div className="text-xs text-gray-500">Projetos</div>
                  <div className="font-semibold text-blue-600 text-sm">{client.projectsCount}</div>
                </div>
                
                <div className="mt-2 text-right">
                  <button 
                    onClick={() => handleViewDetails(client)}
                    className="text-blue-600 hover:text-blue-800 text-xs font-medium inline-flex items-center no-shadow"
                  >
                    Ver detalhes
                    <ChevronRight size={14} className="ml-0.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
      
      {/* Modal de detalhes do cliente */}
      {showDetailsModal && selectedClient && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-lg w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
            <div className="p-4 border-b bg-gradient-to-r from-blue-100 to-indigo-100 flex justify-between items-center">
              <h3 className="text-lg font-semibold text-gray-800">
                Projetos de {selectedClient.name}
              </h3>
              <button 
                onClick={() => setShowDetailsModal(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <X size={20} />
              </button>
            </div>
            
            <div className="overflow-y-auto p-4 flex-grow">
              {getClientProjects.length === 0 ? (
                <div className="text-center py-8">
                  <Briefcase size={36} className="mx-auto text-gray-300 mb-3" />
                  <p className="text-gray-600">Nenhum projeto encontrado para este cliente.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  <p className="text-sm text-gray-500 mb-2">
                    Total de projetos: <span className="font-medium text-gray-700">{getClientProjects.length}</span>
                  </p>
                  
                  <div className="divide-y divide-gray-100">
                    {getClientProjects.map((project, index) => (
                      <div key={index} className="py-3">
                        <div className="flex justify-between items-center">
                          <h4 className="font-medium text-gray-800">
                            {onSelectProject && project.id ? (
                              <button 
                                onClick={() => {
                                  onSelectProject(project.id);
                                  setShowDetailsModal(false); // Fechar o modal após clicar
                                }}
                                className="hover:text-blue-600 hover:underline text-left no-shadow"
                                title="Abrir projeto"
                              >
                                {project.name || "Sem nome"}
                              </button>
                            ) : (
                              project.name || "Sem nome"
                            )}
                          </h4>
                          <span className="text-sm text-gray-500">
                            {new Date(project.date).toLocaleDateString('pt-BR')}
                          </span>
                        </div>
                        
                        <div className="mt-1 text-sm text-gray-600 flex flex-wrap gap-x-4 gap-y-1">
                          {(() => {
                            let status = "A Iniciar";
                            let statusColor = "bg-blue-100 text-blue-800";
                            
                            if (project.stages) {
                              if (project.stages.projetoCancelado?.completed) {
                                status = "Cancelado";
                                statusColor = "bg-red-100 text-red-800";
                              } else if (project.stages.instalacao?.completed) {
                                status = "Concluído";
                                statusColor = "bg-green-100 text-green-800";
                              } else if (
                                project.stages.orcamento?.completed || 
                                project.stages.projetoTecnico?.completed || 
                                project.stages.corte?.completed || 
                                project.stages.fitamento?.completed || 
                                project.stages.furacaoUsinagem?.completed || 
                                project.stages.preMontagem?.completed || 
                                project.stages.acabamento?.completed || 
                                project.stages.entrega?.completed || 
                                project.stages.instalacao?.completed
                              ) {
                                status = "Em Andamento";
                                statusColor = "bg-yellow-100 text-yellow-800";
                              }
                            }
                            
                            return (
                              <div className="flex items-center">
                                <span className="font-medium mr-1">Status:</span>
                                <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusColor}`}>
                                  {status}
                                </span>
                              </div>
                            );
                          })()}
                          
                          {project.salePrice !== undefined && (
                            <div className="flex items-center">
                              <span className="font-medium mr-1">Preço:</span> 
                              {new Intl.NumberFormat('pt-BR', { 
                                style: 'currency', 
                                currency: 'BRL' 
                              }).format(
                                project.priceType === 'markup' 
                                  ? (() => {
                                      // Calcular o custo de materiais
                                      const materialsTotal = project.materials
                                        ? project.materials.reduce((sum, material) => {
                                            const quantity = typeof material.quantity === 'string' 
                                              ? (material.quantity === '' ? 0 : parseFloat(material.quantity)) 
                                              : (material.quantity || 0);
                                            const unitValue = typeof material.unitValue === 'string'
                                              ? (material.unitValue === '' ? 0 : parseFloat(material.unitValue))
                                              : (material.unitValue || 0);
                                            return sum + (quantity * unitValue);
                                          }, 0)
                                        : 0;
                                      
                                      // Calcular o markup como a razão entre o preço de venda e o custo de materiais
                                      const markup = materialsTotal > 0 ? project.salePrice / materialsTotal : 1;
                                      
                                      // Calcular o preço com markup como o custo total multiplicado pelo markup
                                      return project.totalCost * markup;
                                    })()
                                  : project.salePrice
                              )}
                              {project.priceType === 'markup' && (
                                <span className="ml-1 text-xs text-green-600 font-medium">(Markup)</span>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
            
            <div className="p-4 border-t bg-gray-50 flex justify-end">
              <button
                onClick={() => setShowDetailsModal(false)}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}