import React from 'react';
import { Phone, User } from 'lucide-react';
import { Project } from '../types';

interface ClientsListProps {
  projects: Project[];
}

export function ClientsList({ projects }: ClientsListProps) {
  // Extrair clientes únicos dos projetos (removendo duplicatas)
  const uniqueClients = projects
    .filter(project => project.clientName)
    .reduce((clients, project) => {
      const clientExists = clients.some(
        client => 
          client.name === project.clientName && 
          client.phone === project.contactPhone
      );
      
      if (!clientExists && project.clientName) {
        clients.push({
          name: project.clientName,
          phone: project.contactPhone || ''
        });
      }
      
      return clients;
    }, [] as { name: string; phone: string }[])
    .sort((a, b) => a.name.localeCompare(b.name));

  return (
    <div className="bg-white rounded-lg shadow-md p-4 sm:p-6 mb-4">
      <h2 className="text-xl font-semibold text-gray-800 mb-4">Meus Clientes</h2>
      
      {uniqueClients.length === 0 ? (
        <div className="text-gray-500 text-center py-4">
          Nenhum cliente cadastrado. Crie um projeto com informações de cliente.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {uniqueClients.map((client, index) => (
            <div 
              key={index}
              className="bg-gray-50 rounded-lg p-3 border border-gray-200 flex flex-col"
            >
              <div className="flex items-center gap-2 mb-2">
                <User size={18} className="text-blue-600" />
                <span className="font-medium">{client.name}</span>
              </div>
              {client.phone && (
                <div className="flex items-center gap-2 text-gray-600">
                  <Phone size={16} />
                  <span>{client.phone}</span>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}