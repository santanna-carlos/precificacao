import React from 'react';
import { PlusCircle, Trash2 } from 'lucide-react';
import { ExpenseItem, ExpenseType, EXPENSE_OPTIONS } from '../types';

interface ExpenseSectionProps {
  title: string;
  type: ExpenseType;
  items: ExpenseItem[];
  onAdd: () => void;
  onRemove: (id: string) => void;
  onChange: (id: string, field: keyof ExpenseItem, value: number | string) => void;
}

export function ExpenseSection({ title, type, items, onAdd, onRemove, onChange }: ExpenseSectionProps) {
  // Função auxiliar para exibir o tipo correto do item (customizado ou predefinido)
  const getDisplayType = (item: ExpenseItem): string => {
    if (item.type === 'Outro' && item.customType) {
      return item.customType;
    }
    return item.type;
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-3 sm:p-6 mb-4 sm:mb-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-3 sm:mb-4 gap-2 sm:gap-0">
        <h2 className="text-lg sm:text-xl font-semibold text-gray-800">{title}</h2>
        <button
          onClick={onAdd}
          className="flex items-center gap-1 sm:gap-2 px-3 py-1 sm:px-4 sm:py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors text-xs sm:text-base w-full sm:w-auto justify-center sm:justify-start"
        >
          <PlusCircle size={16} className="sm:hidden" />
          <PlusCircle size={20} className="hidden sm:block" />
          Adicionar Item
        </button>
      </div>

      <div className="overflow-x-auto -mx-3 sm:mx-0">
        <table className="w-full text-xs sm:text-base">
          <thead>
            <tr className="bg-gray-50">
              <th className="px-2 sm:px-4 py-1 sm:py-2 text-left">Tipo</th>
              <th className="px-2 sm:px-4 py-1 sm:py-2 text-right">Qtd</th>
              <th className="px-2 sm:px-4 py-1 sm:py-2 text-right">Valor Unit.</th>
              <th className="px-2 sm:px-4 py-1 sm:py-2 text-right">Total</th>
              <th className="px-2 sm:px-4 py-1 sm:py-2"></th>
            </tr>
          </thead>
          <tbody>
            {items.map((item) => (
              <React.Fragment key={item.id}>
                <tr className="border-t">
                  <td className="px-2 sm:px-4 py-1 sm:py-2">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:gap-2">
                      {item.type === 'Outro' ? (
                        <>
                          <div className="flex items-center w-full gap-1">
                            <select
                              value={item.type}
                              onChange={(e) => onChange(item.id, 'type', e.target.value)}
                              className="border rounded px-1 py-1 bg-white text-xs sm:text-base w-20 flex-shrink-0"
                            >
                              <option value="">Sel.</option>
                              {EXPENSE_OPTIONS[type].map((option) => (
                                <option key={option} value={option}>
                                  {option.length > 7 ? option.substring(0, 7) + '...' : option}
                                </option>
                              ))}
                            </select>
                            <input
                              type="text"
                              placeholder="Especifique..."
                              value={item.customType || ''}
                              onChange={(e) => onChange(item.id, 'customType', e.target.value)}
                              className="flex-1 min-w-0 border rounded px-1 py-1 bg-white text-xs sm:text-base"
                            />
                          </div>
                        </>
                      ) : (
                        <select
                          value={item.type}
                          onChange={(e) => onChange(item.id, 'type', e.target.value)}
                          className="w-full border rounded px-1 sm:px-2 py-1 bg-white text-xs sm:text-base"
                        >
                          <option value="">Selecione</option>
                          {EXPENSE_OPTIONS[type].map((option) => (
                            <option key={option} value={option}>
                              {option}
                            </option>
                          ))}
                        </select>
                      )}
                    </div>
                  </td>
                  <td className="px-2 sm:px-4 py-1 sm:py-2">
                    <input
                      type="number"
                      min="0"
                      value={item.quantity}
                      onChange={(e) => onChange(item.id, 'quantity', Number(e.target.value))}
                      className="w-full border rounded px-1 sm:px-2 py-1 text-right text-xs sm:text-base"
                    />
                  </td>
                  <td className="px-2 sm:px-4 py-1 sm:py-2">
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={item.unitValue}
                      onChange={(e) => onChange(item.id, 'unitValue', Number(e.target.value))}
                      className="w-full border rounded px-1 sm:px-2 py-1 text-right text-xs sm:text-base"
                    />
                  </td>
                  <td className="px-2 sm:px-4 py-1 sm:py-2 text-right whitespace-nowrap">
                    R$ {(item.quantity * item.unitValue).toFixed(2)}
                  </td>
                  <td className="px-2 sm:px-4 py-1 sm:py-2">
                    <button
                      onClick={() => onRemove(item.id)}
                      className="text-red-600 hover:text-red-800"
                    >
                      <Trash2 size={16} className="sm:hidden" />
                      <Trash2 size={20} className="hidden sm:block" />
                    </button>
                  </td>
                </tr>
              </React.Fragment>
            ))}
          </tbody>
          <tfoot>
            <tr className="border-t font-semibold">
              <td colSpan={3} className="px-2 sm:px-4 py-1 sm:py-2 text-right">
                Total:
              </td>
              <td className="px-2 sm:px-4 py-1 sm:py-2 text-right whitespace-nowrap">
                R$ {items.reduce((sum, item) => sum + item.quantity * item.unitValue, 0).toFixed(2)}
              </td>
              <td></td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
}