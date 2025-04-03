import React, { useEffect, useState } from 'react';
import { PlusCircle, Trash2, Settings, ToggleLeft, ToggleRight, Lock } from 'lucide-react';
import { ExpenseItem, ExpenseType, EXPENSE_OPTIONS } from '../types';

interface ExpenseSectionProps {
  title: string;
  type: ExpenseType;
  items: ExpenseItem[];
  onAdd: () => void;
  onRemove: (id: string) => void;
  onChange: (id: string, field: string, value: string | number) => void;
  dailyCost?: number; // Custo diário da marcenaria
  fixedExpenseDays?: number | null; // Número de dias de trabalho
  onChangeDays?: (days: number | null) => void; // Função para atualizar dias
  useWorkshopSettings?: boolean; // Indica se deve usar configurações da marcenaria
  onToggleCalculationMode?: (useAutoCalculation: boolean) => void; // Função para alternar modo de cálculo
  disabled?: boolean; // Nova propriedade para desabilitar a edição
}

export function ExpenseSection({
  title,
  type,
  items,
  onAdd,
  onRemove,
  onChange,
  dailyCost = 0,
  fixedExpenseDays = null,
  onChangeDays,
  useWorkshopSettings = false,
  onToggleCalculationMode,
  disabled = false
}: ExpenseSectionProps) {
  // Estado local para controlar se usa as configurações da marcenaria ou entrada manual
  const [useAutoCalculation, setUseAutoCalculation] = useState(useWorkshopSettings);
  
  // Verifica se é a seção de despesas fixas e se deve usar as configurações da marcenaria
  const isFixedExpenseWithWorkshopSettings = type === 'fixed' && useAutoCalculation;

  // Ao montar o componente, limpar quaisquer despesas fixas existentes
  // se estiver usando o cálculo baseado em dias
  useEffect(() => {
    if (isFixedExpenseWithWorkshopSettings && items.length > 0 && onChangeDays) {
      // Remover todas as despesas fixas existentes
      items.forEach(item => onRemove(item.id));
    }
  // Adicionando deps, mas evitando que o useEffect seja executado a
  // cada alteração nos items, apenas quando a flag useWorkshopSettings mudar
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isFixedExpenseWithWorkshopSettings, onChangeDays, onRemove]);

  // Calcular o total para despesas manuais
  const total = items.reduce((sum, item) => {
    const quantity = parseFloat(item.quantity.toString()) || 0;
    const unitValue = parseFloat(item.unitValue.toString()) || 0;
    return sum + (quantity * unitValue);
  }, 0);

  // Calcular o total quando usa configurações da marcenaria
  const calculatedTotal = dailyCost * (fixedExpenseDays || 1);

  // Decidir qual total exibir
  const displayTotal = isFixedExpenseWithWorkshopSettings ? calculatedTotal : total;

  // Função para alternar entre cálculo automático e manual
  const toggleCalculationMode = () => {
    setUseAutoCalculation(!useAutoCalculation);
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-4 sm:p-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-3 sm:mb-4 gap-2 sm:gap-0">
        <h2 className="text-lg sm:text-xl font-semibold text-gray-800 flex items-center gap-2">
          {title}
          {disabled && <Lock size={16} className="text-amber-500" />}
        </h2>
        
        {type === 'fixed' && (
          <div className="flex items-center gap-2 sm:ml-auto mr-2">
            <button 
              onClick={() => {
                if (!disabled && onToggleCalculationMode) {
                  const newValue = !useAutoCalculation;
                  setUseAutoCalculation(newValue);
                  onToggleCalculationMode(newValue);
                }
              }}
              disabled={disabled}
              className={`flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-700 rounded-md hover:bg-blue-200 transition-colors text-xs sm:text-sm ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
              title={useAutoCalculation ? "Clique para inserir despesas manualmente" : "Clique para usar cálculo automático da marcenaria"}
            >
              <Settings size={16} />
              {useAutoCalculation ? (
                <>
                  <ToggleRight size={20} />
                  <span className="hidden sm:inline">Entrada Manual</span>
                </>
              ) : (
                <>
                  <ToggleLeft size={20} />
                  <span className="hidden sm:inline">Cálculo Automático</span>
                </>
              )}
            </button>
          </div>
        )}
        
        {!isFixedExpenseWithWorkshopSettings && (
          <button 
            onClick={() => !disabled && onAdd()}
            disabled={disabled}
            className={`flex items-center gap-1 sm:gap-2 px-3 py-1 sm:px-4 sm:py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors text-xs sm:text-base w-full sm:w-auto justify-center sm:justify-start ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            <PlusCircle size={16} className="sm:hidden" />
            <PlusCircle size={20} className="hidden sm:block" />
            Adicionar Item
          </button>
        )}
      </div>

      {isFixedExpenseWithWorkshopSettings ? (
        <div className="mb-4 bg-blue-50 p-4 rounded-lg">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
            <div>
              <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                Quantos dias de trabalho?
              </label>
              <input
                type="number"
                min="1"
                max="90"
                value={fixedExpenseDays === null ? '' : fixedExpenseDays}
                onChange={(e) => {
                  if (!disabled) {
                    const value = e.target.value === '' ? null : parseInt(e.target.value);
                    onChangeDays && onChangeDays(value);
                  }
                }}
                disabled={disabled}
                className={`w-full sm:w-32 p-2 text-xs sm:text-sm border border-gray-300 rounded-md ${disabled ? 'bg-gray-100 cursor-not-allowed' : ''}`}
              />
            </div>
            
            <div className="flex-1 text-xs sm:text-sm bg-white p-3 rounded-md">
              <div className="font-medium flex items-center">
                {disabled ? (
                  <>
                    <Lock size={14} className="text-orange-500 mr-1" />
                    <span>Cálculo congelado (Projeto Técnico aprovado):</span>
                  </>
                ) : (
                  <span>Cálculo automático:</span>
                )}
              </div>
              <div className="flex flex-wrap items-center gap-2 mt-1">
                <span className={`text-gray-600 ${disabled ? 'font-medium' : ''}`}>
                  Custo diário: R$ {dailyCost.toFixed(2)}
                </span>
                <span className="text-gray-600">×</span>
                <span className={`text-gray-600 ${disabled ? 'font-medium' : ''}`}>
                  Dias: {fixedExpenseDays || 0}
                </span>
                <span className="text-gray-600">=</span>
                <span className={`font-semibold ${disabled ? 'text-orange-600' : 'text-green-700'}`}>
                  R$ {displayTotal.toFixed(2)}
                </span>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <>
          {/* Tabela de despesas */}
          <div className="overflow-x-auto">
            <table className="w-full table-auto">
              <thead>
                <tr className="bg-gray-50">
                  <th className="w-[45%] sm:w-[40%] px-2 sm:px-4 py-2 text-left text-xs sm:text-sm font-medium text-gray-600">
                    {type === 'material' ? 'Material' : 'Tipo'}
                  </th>
                  <th className="w-[15%] px-2 sm:px-4 py-2 text-left text-xs sm:text-sm font-medium text-gray-600">
                    Qtd
                  </th>
                  <th className="w-[20%] px-2 sm:px-4 py-2 text-right text-xs sm:text-sm font-medium text-gray-600">
                    Valor
                  </th>
                  <th className="w-[15%] sm:w-[20%] px-2 sm:px-4 py-2 text-right text-xs sm:text-sm font-medium text-gray-600">
                    Total
                  </th>
                  <th className="w-[5%] px-2 sm:px-4 py-2"></th>
                </tr>
              </thead>
              <tbody>
                {items.map((item) => {
                  const itemTotal = (parseFloat(item.quantity.toString()) || 0) * (parseFloat(item.unitValue.toString()) || 0);
                  
                  return (
                    <tr key={item.id} className="border-b">
                      <td className="px-2 sm:px-4 py-2">
                        <select
                          value={item.customType && (EXPENSE_OPTIONS as { [key: string]: string[] })[type]?.includes(item.customType as any) ? item.customType : item.type}
                          onChange={(e) => {
                            if (disabled) return;
                            
                            const selectedType = e.target.value;
                            onChange(item.id, 'type', selectedType);
                            
                            // Se não for "Outros", usar o valor selecionado como customType
                            if (selectedType !== 'Outros') {
                              onChange(item.id, 'customType', selectedType);
                            } else {
                              // Se for "Outros", limpar o customType para que o usuário preencha
                              onChange(item.id, 'customType', '');
                            }
                          }}
                          disabled={disabled}
                          className={`w-full p-1 sm:p-2 text-xs sm:text-sm border border-gray-300 rounded-md ${disabled ? 'bg-gray-100' : ''}`}
                        >
                          <option value="">Selecione...</option>
                          {(EXPENSE_OPTIONS as { [key: string]: string[] })[type]?.map((option) => (
                            <option key={option} value={option}>
                              {option}
                            </option>
                          ))}
                          <option value="Outros">Outros</option>
                        </select>
                        {/* Campo para customização quando selecionar "Outros" */}
                        {item.type === 'Outros' && (
                          <input
                            type="text"
                            value={item.customType || ''}
                            onChange={(e) => !disabled && onChange(item.id, 'customType', e.target.value)}
                            placeholder="Especifique..."
                            disabled={disabled}
                            className={`w-full mt-1 p-1 sm:p-2 text-xs sm:text-sm border border-gray-300 rounded-md ${disabled ? 'bg-gray-100' : ''}`}
                          />
                        )}
                      </td>
                      <td className="px-2 sm:px-4 py-2">
                        <input
                          type={type === 'material' || type === 'variable' || type === 'fixed' ? "text" : "number"}
                          min="0"
                          step="0.01"
                          value={item.quantity}
                          onChange={(e) => {
                            if (disabled) return;
                            
                            if (type === 'material' || type === 'variable' || type === 'fixed') {
                              // Validação regex para permitir apenas números ou vazio
                              const regex = /^\d*$/;
                              if (regex.test(e.target.value)) {
                                onChange(item.id, 'quantity', e.target.value);
                              }
                            } else {
                              onChange(item.id, 'quantity', e.target.value);
                            }
                          }}
                          disabled={disabled}
                          className={`w-full p-1 sm:p-2 text-xs sm:text-sm border border-gray-300 rounded-md text-center ${disabled ? 'bg-gray-100' : ''}`}
                        />
                      </td>
                      <td className="px-2 sm:px-4 py-2">
                        <input
                          type={type === 'material' || type === 'variable' || type === 'fixed' ? "text" : "number"}
                          min="0"
                          step="0.01"
                          value={item.unitValue}
                          onChange={(e) => {
                            if (disabled) return;
                            
                            if (type === 'material' || type === 'variable' || type === 'fixed') {
                              // Validação regex para permitir apenas números, ponto decimal ou vazio
                              const regex = /^(\d*\.?\d*)?$/;
                              if (regex.test(e.target.value)) {
                                onChange(item.id, 'unitValue', e.target.value);
                              }
                            } else {
                              onChange(item.id, 'unitValue', e.target.value);
                            }
                          }}
                          disabled={disabled}
                          className={`w-full p-1 sm:p-2 text-xs sm:text-sm border border-gray-300 rounded-md text-right ${disabled ? 'bg-gray-100' : ''}`}
                        />
                      </td>
                      <td className="px-2 sm:px-4 py-2 text-right text-xs sm:text-sm font-medium">
                        R$ {itemTotal.toFixed(2)}
                      </td>
                      <td className="px-2 sm:px-4 py-2 text-center">
                        <button
                          onClick={() => !disabled && onRemove(item.id)}
                          disabled={disabled}
                          className={`text-red-500 hover:text-red-700 ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
                          title="Remover item"
                        >
                          <Trash2 size={18} />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot>
                <tr className="bg-gray-50">
                  <td colSpan={3} className="px-2 sm:px-4 py-2 font-medium text-right text-xs sm:text-sm">
                    Total:
                  </td>
                  <td className="px-2 sm:px-4 py-2 text-right font-bold text-xs sm:text-sm">
                    R$ {displayTotal.toFixed(2)}
                  </td>
                  <td></td>
                </tr>
              </tfoot>
            </table>
          </div>
          
          {items.length === 0 && (
            <div className="text-center py-6 bg-gray-50 rounded-md">
              <p className="text-gray-500">Nenhum item adicionado</p>
              <p className="text-sm text-gray-400 mt-1">Clique em "Adicionar Item" para começar</p>
            </div>
          )}
        </>
      )}
    </div>
  );
}