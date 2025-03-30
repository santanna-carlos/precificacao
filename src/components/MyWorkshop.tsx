import React, { useState, useEffect } from 'react';
import { Building2, PlusCircle, Trash2, Save, Calendar } from 'lucide-react';

// Lista de despesas fixas comuns em marcenarias
const COMMON_WORKSHOP_EXPENSES = [
  "Água",
  "Aluguel",
  "Contador",
  "Depreciação de Ferramentas",
  "Encargos Trabalhistas",
  "Energia Elétrica",
  "Internet",
  "IPTU",
  "Limpeza",
  "Manutenção de Máquinas",
  "Material de Escritório",
  "Salário",
  "Seguro",
  "Software e Licenças",
  "Telefone",
  "Outros"
];

// Interface para as despesas da marcenaria
interface WorkshopExpense {
  id: string;
  type: string;
  description: string;
  quantity: number;
  unitValue: number;
  isCustomDescription?: boolean;
  note?: string;
}

// Interface para as configurações da marcenaria
export interface WorkshopSettings {
  workshopName?: string;
  logoImage?: string | null; // Alterar o tipo para string | null
  expenses: WorkshopExpense[];
  workingDaysPerMonth: number;
  lastUpdated?: string; // Adicionar campo lastUpdated como opcional
}

interface MyWorkshopProps {
  workshopSettings: WorkshopSettings;
  onSaveSettings: (settings: WorkshopSettings) => void;
}

export const MyWorkshop: React.FC<MyWorkshopProps> = ({ workshopSettings, onSaveSettings }) => {
  // Estado local para as configurações
  const [settings, setSettings] = useState<WorkshopSettings>(workshopSettings || {
    workingDaysPerMonth: 22,
    expenses: [],
    workshopName: '',
    logoImage: null
  });
  
  const [workingDaysInput, setWorkingDaysInput] = useState<string>(
    workshopSettings?.workingDaysPerMonth?.toString() || '22'
  );
  
  const [workshopNameInput, setWorkshopNameInput] = useState<string>(
    workshopSettings?.workshopName || ''
  );
  
  const [logoPreview, setLogoPreview] = useState<string | null>(
    workshopSettings?.logoImage || null
  );
  
  // Estado para controlar a exibição do modal
  const [showWorkshopInfoModal, setShowWorkshopInfoModal] = useState<boolean>(false);
  
  // Estado para feedback ao usuário
  const [savedMessage, setSavedMessage] = useState<string>('');
  
  // Carregar as configurações da marcenaria quando o componente for montado
  useEffect(() => {
    setSettings(workshopSettings || {
      workingDaysPerMonth: 22,
      expenses: [],
      workshopName: '',
      logoImage: null
    });
    setWorkingDaysInput(workshopSettings?.workingDaysPerMonth?.toString() || '22');
    setWorkshopNameInput(workshopSettings?.workshopName || '');
    setLogoPreview(workshopSettings?.logoImage || null);
  }, [workshopSettings]);
  
  // Função para adicionar uma nova despesa
  const handleAddExpense = () => {
    setSettings({
      ...settings,
      expenses: [
        ...settings.expenses,
        {
          id: crypto.randomUUID(),
          type: '',
          description: '',
          quantity: 1,
          unitValue: 0,
          isCustomDescription: false
        }
      ]
    });
  };
  
  // Função para atualizar uma despesa existente
  const handleUpdateExpense = (index: number, updatedExpense: WorkshopExpense) => {
    const updatedExpenses = [...settings.expenses];
    updatedExpenses[index] = updatedExpense;
    
    setSettings({
      ...settings,
      expenses: updatedExpenses
    });
  };
  
  // Função para remover uma despesa
  const handleRemoveExpense = (index: number) => {
    const updatedExpenses = [...settings.expenses];
    updatedExpenses.splice(index, 1);
    
    setSettings({
      ...settings,
      expenses: updatedExpenses
    });
  };
  
  // Função para calcular o custo diário da marcenaria
  const calculateDailyCost = (): number => {
    const totalMonthlyCost = settings.expenses.reduce(
      (sum, expense) => sum + (expense.unitValue || 0) * (expense.quantity || 0), 0
    );
    return settings.workingDaysPerMonth > 0 
      ? totalMonthlyCost / settings.workingDaysPerMonth 
      : 0;
  };
  
  // Função para calcular o custo por hora (baseado em 8h/dia)
  const calculateHourlyCost = (): number => {
    const dailyCost = calculateDailyCost();
    return dailyCost / 8; // Considerando jornada de 8h diárias
  };
  
  // Função para salvar as configurações da marcenaria
  const handleSave = () => {
    // Atualizar a data de última atualização
    const updatedSettings = {
      ...settings,
      workshopName: workshopNameInput,
      logoImage: logoPreview || undefined, // Usar undefined em vez de null
      lastUpdated: new Date().toISOString()
    };
    
    // Salvar os dados atualizados
    onSaveSettings(updatedSettings);
    setSettings(updatedSettings);
    
    // Fechar o modal após salvar
    closeWorkshopInfoModal();
    
    // Mostrar mensagem de feedback
    setSavedMessage('Alterações salvas com sucesso!');
    setTimeout(() => setSavedMessage(''), 3000);
  };
  
  // Cálculo do total mensal de despesas
  const totalMonthlyExpenses = settings.expenses.reduce(
    (sum, expense) => sum + (expense.unitValue || 0) * (expense.quantity || 0), 0
  );
  
  // Função para atualizar os dias de trabalho por mês
  const handleWorkingDaysChange = (value: string) => {
    // Remover zero à esquerda se houver um ou mais dígitos após ele
    if (/^0\d+/.test(value)) {
      value = value.replace(/^0/, '');
    }
    
    // Atualizar o valor do input
    setWorkingDaysInput(value);
    
    // Converter para número e atualizar o state principal
    const days = parseInt(value) || 0;
    setSettings({
      ...settings,
      workingDaysPerMonth: days
    });
  };
  
  // Função para atualizar o nome da marcenaria
  const handleWorkshopNameChange = (value: string) => {
    setWorkshopNameInput(value);
  };
  
  // Função para atualizar a logo da marcenaria
  const handleLogoChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      const file = event.target.files[0];
      const reader = new FileReader();
      
      reader.onload = (e) => {
        if (e.target && e.target.result) {
          setLogoPreview(e.target.result as string);
        }
      };
      
      reader.readAsDataURL(file);
    }
  };
  
  // Função para abrir o modal de informações da marcenaria
  const openWorkshopInfoModal = () => {
    setShowWorkshopInfoModal(true);
  };
  
  // Função para fechar o modal de informações da marcenaria
  const closeWorkshopInfoModal = () => {
    setShowWorkshopInfoModal(false);
  };
  
  // Função para salvar as informações da marcenaria e fechar o modal
  const saveWorkshopInfo = () => {
    const updatedSettings = {
      ...settings,
      workshopName: workshopNameInput,
      logoImage: logoPreview || undefined, // Usar undefined em vez de null
      lastUpdated: new Date().toISOString()
    };
    
    // Atualizar o estado local
    setSettings(updatedSettings);
    
    // Chamar a função do componente pai para atualizar o estado global e salvar no localStorage
    onSaveSettings(updatedSettings);
    
    // Mostrar mensagem de feedback
    setSavedMessage('Informações da marcenaria atualizadas com sucesso!');
    setTimeout(() => setSavedMessage(''), 3000);
    
    // Fechar o modal
    closeWorkshopInfoModal();
  };
  
  return (
    <div className="bg-white rounded-lg shadow-md p-3 sm:p-6">
      {/* Cabeçalho com título */}
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl sm:text-2xl font-bold text-gray-800 flex items-center">
          <Building2 className="mr-2 text-blue-600" size={28} />
          Minha Marcenaria
        </h2>
        
        {/* Botão para abrir o modal de informações da marcenaria */}
        <button
          onClick={openWorkshopInfoModal}
          className="bg-blue-600 hover:bg-blue-700 text-white font-medium px-3 py-2 rounded-md flex items-center text-sm transition-colors"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
            <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
          </svg>
          Editar Informações
        </button>
      </div>
      
      {/* Cards de resumo e configurações */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {/* Card de estatísticas */}
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg shadow p-5 border border-blue-100">
          <h3 className="text-lg font-semibold text-blue-800 mb-4">Resumo Financeiro</h3>
          
          <div className="space-y-4">
            <div>
              <p className="text-sm font-medium text-gray-600">Total de Despesas Mensais</p>
              <p className="text-2xl font-bold text-indigo-700">
                R$ {totalMonthlyExpenses.toFixed(2)}
              </p>
            </div>
            
            <div className="pt-3 border-t border-blue-100">
              <p className="text-sm font-medium text-gray-600">Custo Diário</p>
              <div className="flex items-baseline">
                <span className="text-2xl font-bold text-green-600">
                  R$ {calculateDailyCost().toFixed(2)}
                </span>
                <span className="ml-2 text-xs text-gray-500">/dia</span>
              </div>
            </div>
            
            <div className="pt-3 border-t border-blue-100">
              <p className="text-sm font-medium text-gray-600">Valor Hora (8h/dia)</p>
              <div className="flex items-baseline">
                <span className="text-2xl font-bold text-blue-600">
                  R$ {calculateHourlyCost().toFixed(2)}
                </span>
                <span className="ml-2 text-xs text-gray-500">/hora</span>
              </div>
            </div>
          </div>
        </div>
        
        {/* Card de dias de trabalho */}
        <div className="bg-white rounded-lg shadow p-5 border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Jornada de Trabalho</h3>
          
          <div className="mb-4">
            <label htmlFor="workingDays" className="block text-sm font-medium text-gray-700 mb-2">
              Dias de trabalho por mês
            </label>
            <div className="flex items-center">
              <input
                type="number"
                id="workingDays"
                value={workingDaysInput}
                onChange={(e) => handleWorkingDaysChange(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                min="0"
                max="31"
              />
              <div className="ml-2 bg-gray-100 px-3 py-2 rounded text-gray-700 text-sm font-medium">
                dias
              </div>
            </div>
          </div>
          
          <div className="mt-4 p-3 bg-gray-50 rounded-md border border-gray-200">
            <div className="flex items-center text-gray-600 mb-1">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-blue-500" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
              <span className="text-sm font-medium">Cálculo Automático</span>
            </div>
            <p className="text-xs text-gray-500">
              Os valores diários e por hora são calculados automaticamente com base em suas despesas mensais 
              e nos dias de trabalho informados.
            </p>
          </div>
        </div>
        
        {/* Card de informações adicionais */}
        <div className="bg-white rounded-lg shadow p-5 border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Informações Úteis</h3>
          
          <div className="space-y-4">
            <div className="flex items-start">
              <div className="flex-shrink-0 h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center mr-3">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-600" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M3 5a2 2 0 012-2h10a2 2 0 012 2v10a2 2 0 01-2 2H5a2 2 0 01-2-2V5zm11 1H6v8l4-2 4 2V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              </div>
              <div>
                <h4 className="text-sm font-semibold text-gray-700">Custo de Projetos</h4>
                <p className="text-xs text-gray-500 mt-1">
                  O custo diário será usado para calcular automaticamente as despesas fixas em seus projetos.
                </p>
              </div>
            </div>
            
            <div className="flex items-start">
              <div className="flex-shrink-0 h-8 w-8 rounded-full bg-green-100 flex items-center justify-center mr-3">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-green-600" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M4 4a2 2 0 00-2 2v4a2 2 0 002 2V6h10a2 2 0 00-2-2H4zm2 6a2 2 0 012-2h8a2 2 0 012 2v4a2 2 0 01-2 2H8a2 2 0 01-2-2v-4zm6 4a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                </svg>
              </div>
              <div>
                <h4 className="text-sm font-semibold text-gray-700">Precificação</h4>
                <p className="text-xs text-gray-500 mt-1">
                  Mantenha suas despesas sempre atualizadas para gerar orçamentos mais precisos para seus clientes.
                </p>
              </div>
            </div>
            
            <div className="flex items-start">
              <div className="flex-shrink-0 h-8 w-8 rounded-full bg-yellow-100 flex items-center justify-center mr-3">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-yellow-600" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 2a8 8 0 100 16 8 8 0 000-16zm0 14a6 6 0 110-12 6 6 0 010 12zm-1-5a1 1 0 011-1h.01a1 1 0 110 2H10a1 1 0 01-1-1z" clipRule="evenodd" />
                </svg>
              </div>
              <div>
                <h4 className="text-sm font-semibold text-gray-700">Data da Última Atualização</h4>
                <p className="text-xs text-gray-500 mt-1">
                  {settings.lastUpdated 
                    ? new Date(settings.lastUpdated).toLocaleDateString('pt-BR', {
                        day: '2-digit',
                        month: '2-digit',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })
                    : 'Nunca atualizado'}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Lista de despesas */}
      <div className="bg-white rounded-lg shadow-md border border-gray-200 mb-6">
        <div className="flex justify-between items-center p-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-800">Despesas Mensais</h3>
          <button
            onClick={handleAddExpense}
            className="bg-blue-600 hover:bg-blue-700 text-white font-medium px-3 py-2 rounded-md flex items-center text-sm transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 01-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clipRule="evenodd" />
            </svg>
            Adicionar Despesa
          </button>
        </div>
        
        {settings.expenses.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto text-gray-300 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <p className="text-lg">Nenhuma despesa cadastrada</p>
            <p className="mt-1 text-sm">Clique em "Adicionar Despesa" para começar</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm sm:text-base">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-3 sm:px-4 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-[50%] md:w-[40%]">Tipo/Descrição</th>
                  <th className="px-2 sm:px-4 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-[10%] md:w-[15%]">Qtd</th>
                  <th className="px-3 sm:px-4 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-[20%]">Unit.</th>
                  <th className="px-3 sm:px-4 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-[15%] md:w-[20%]">Total</th>
                  <th className="px-2 sm:px-4 py-2 sm:py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider w-[5%]">Ação</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200 text-xs sm:text-sm">
                {settings.expenses.map((expense, index) => (
                  <tr key={index} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                    <td className="px-3 sm:px-4 py-2 sm:py-3">
                      <div className="flex flex-col space-y-2">
                        <select
                          value={expense.type}
                          onChange={(e) => {
                            const newType = e.target.value;
                            const updatedExpense = {
                              ...expense,
                              type: newType,
                              description: newType === 'Outros' ? '' : newType,
                              isCustomDescription: newType === 'Outros'
                            };
                            handleUpdateExpense(index, updatedExpense);
                          }}
                          className="w-full p-1.5 sm:p-2 text-xs sm:text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                        >
                          <option value="">Selecione o tipo</option>
                          {COMMON_WORKSHOP_EXPENSES.map((type) => (
                            <option key={type} value={type}>{type}</option>
                          ))}
                        </select>
                        
                        {expense.type === 'Outros' && (
                          <input
                            type="text"
                            value={expense.description || ''}
                            onChange={(e) => {
                              const updatedExpense = {
                                ...expense,
                                description: e.target.value
                              };
                              handleUpdateExpense(index, updatedExpense);
                            }}
                            className="w-full p-1.5 sm:p-2 text-xs sm:text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                            placeholder="Especifique a despesa..."
                          />
                        )}
                      </div>
                    </td>
                    <td className="px-2 sm:px-4 py-2 sm:py-3">
                      <input
                        type="text"
                        inputMode="numeric"
                        pattern="[0-9]*"
                        value={expense.quantity !== undefined && expense.quantity !== null ? (expense.quantity === 0 ? "" : expense.quantity.toString()) : ""}
                        onFocus={(e) => {
                          if (expense.quantity === 0) {
                            e.target.value = "";
                          }
                        }}
                        onBlur={(e) => {
                          if (e.target.value === "") {
                            handleUpdateExpense(index, { ...expense, quantity: 0 });
                          }
                        }}
                        onChange={(e) => {
                          const value = e.target.value;
                          // Remove qualquer caractere não numérico
                          const numericValue = value.replace(/\D/g, '');
                          // Remove zeros à esquerda
                          const cleanValue = numericValue.replace(/^0+/, '');
                          
                          // Atualiza o valor no estado
                          handleUpdateExpense(index, { 
                            ...expense, 
                            quantity: cleanValue === '' ? 0 : parseInt(cleanValue, 10)
                          });
                        }}
                        className="w-full p-1.5 sm:p-2 text-xs sm:text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                      />
                    </td>
                    <td className="px-3 sm:px-4 py-2 sm:py-3">
                      <div className="relative rounded-md">
                        <div className="absolute inset-y-0 left-0 pl-2 flex items-center pointer-events-none">
                          <span className="text-gray-500 text-xs sm:text-sm">R$</span>
                        </div>
                        <input
                          type="text"
                          inputMode="decimal"
                          value={expense.unitValue !== undefined && expense.unitValue !== null ? (expense.unitValue === 0 ? "" : expense.unitValue.toString()) : ""}
                          onFocus={(e) => {
                            if (expense.unitValue === 0) {
                              e.target.value = "";
                            }
                          }}
                          onBlur={(e) => {
                            if (e.target.value === "") {
                              handleUpdateExpense(index, { ...expense, unitValue: 0 });
                            }
                          }}
                          onChange={(e) => {
                            const value = e.target.value;
                            // Permite apenas dígitos e um ponto decimal
                            const numericValue = value.replace(/[^\d.]/g, '');
                            
                            // Garante que haja apenas um ponto decimal
                            const parts = numericValue.split('.');
                            let formattedValue = parts[0];
                            
                            // Remove zeros à esquerda, exceto se for um número decimal como 0.xx
                            if (parts[0] !== '0' || parts.length === 1) {
                              formattedValue = formattedValue.replace(/^0+/, '');
                            }
                            
                            // Adiciona a parte decimal se existir
                            if (parts.length > 1) {
                              formattedValue += '.' + parts.slice(1).join('');
                            }
                            
                            // Atualiza o valor no estado
                            handleUpdateExpense(index, { 
                              ...expense, 
                              unitValue: formattedValue === '' ? 0 : parseFloat(formattedValue)
                            });
                          }}
                          className="w-full p-1.5 sm:p-2 pl-7 sm:pl-8 text-xs sm:text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                        />
                      </div>
                    </td>
                    <td className="px-3 sm:px-4 py-2 sm:py-3 font-medium text-gray-900 text-xs sm:text-sm">
                      R$ {(expense.quantity || 0) * (expense.unitValue || 0).toFixed(2)}
                    </td>
                    <td className="px-2 sm:px-4 py-2 sm:py-3 text-center">
                      <button
                        onClick={() => handleRemoveExpense(index)}
                        className="text-red-600 hover:text-red-800 transition-colors"
                        title="Remover despesa"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 sm:h-5 sm:w-5" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                        </svg>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="bg-gray-50 border-t border-gray-200">
                <tr>
                  <td colSpan={3} className="px-3 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm font-medium text-gray-700 text-right">
                    Total Mensal:
                  </td>
                  <td className="px-3 sm:px-4 py-2 sm:py-3 text-sm sm:text-base font-bold text-gray-900">
                    R$ {totalMonthlyExpenses.toFixed(2)}
                  </td>
                  <td></td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </div>
      
      {/* Modal de informações da marcenaria */}
      {showWorkshopInfoModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            {/* Overlay escuro */}
            <div 
              className="fixed inset-0 transition-opacity" 
              aria-hidden="true"
              onClick={closeWorkshopInfoModal}
            >
              <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
            </div>
            
            {/* Modal */}
            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
              <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <div className="sm:flex sm:items-start">
                  <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left w-full">
                    <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                      Informações da Marcenaria
                    </h3>
                    
                    <div className="mb-4">
                      <label htmlFor="workshopName" className="block text-sm font-medium text-gray-700 mb-2">
                        Nome da Marcenaria
                      </label>
                      <input
                        type="text"
                        id="workshopName"
                        value={workshopNameInput}
                        onChange={(e) => handleWorkshopNameChange(e.target.value)}
                        className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    
                    <div className="mb-4">
                      <label htmlFor="logo" className="block text-sm font-medium text-gray-700 mb-2">
                        Logo da Marcenaria
                      </label>
                      <input
                        type="file"
                        id="logo"
                        accept="image/*"
                        onChange={handleLogoChange}
                        className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                      {logoPreview && (
                        <div className="mt-2">
                          <img src={logoPreview} alt="Logo da Marcenaria" className="w-20 h-20 object-cover rounded-md" />
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                <button
                  type="button"
                  onClick={saveWorkshopInfo}
                  className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:ml-3 sm:w-auto sm:text-sm"
                >
                  Salvar
                </button>
                <button
                  type="button"
                  onClick={closeWorkshopInfoModal}
                  className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                >
                  Cancelar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Nota informativa no rodapé */}
      <div className="bg-blue-50 border border-blue-200 rounded-md p-3 sm:p-4 mb-4">
        <div className="flex flex-col sm:flex-row">
          <div className="flex-shrink-0 mb-2 sm:mb-0">
            <svg className="h-5 w-5 text-blue-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="sm:ml-3 flex-1">
            <h3 className="text-sm font-medium text-blue-800">Lembre-se de salvar</h3>
            <div className="mt-1 text-sm text-blue-700">
              <p>
                Mantenha suas despesas mensais atualizadas para gerar orçamentos mais precisos.
                Sempre clique em "Salvar Alterações" após fazer modificações.
              </p>
            </div>
          </div>
        </div>
      </div>
      
      {/* Botão de salvar no final da página */}
      <div className="flex flex-col items-center mt-6">
        <button
          onClick={handleSave}
          className="w-full sm:w-auto bg-green-600 hover:bg-green-700 text-white font-medium px-4 py-2 rounded-md flex items-center justify-center transition-colors"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
          </svg>
          Salvar Alterações
        </button>
        
        {/* Feedback de salvamento */}
        {savedMessage && (
          <div className="mt-4 p-3 bg-green-100 text-green-700 rounded-md flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            {savedMessage}
          </div>
        )}
      </div>
    </div>
  );
};