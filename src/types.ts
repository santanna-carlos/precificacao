export interface ExpenseItem {
  id: string;
  type: string;
  quantity: number;
  unitValue: number;
  total: number;
  customType?: string; // Campo opcional para armazenar o tipo personalizado
}

export interface Project {
  id: string;
  name: string;
  date: string; // Data do orçamento
  fixedExpenses: ExpenseItem[];
  variableExpenses: ExpenseItem[];
  materials: ExpenseItem[];
  profitMargin: number;
  totalCost: number;
  salePrice: number;
}

export interface ProjectSummary {
  fixedExpensesTotal: number;
  variableExpensesTotal: number;
  materialsTotal: number;
  profitAmount: number;
  totalCost: number;
  salePrice: number;
  markup: number;
  markupSalePrice: number;
}

export type ExpenseType = 'fixed' | 'variable' | 'material';

export const EXPENSE_OPTIONS = {
  fixed: [
    'Salário',
    'Energia',
    'Água',
    'Depreciação de Ferramentas',
    'Aluguel',
    'Funcionário',
    'Impostos',
    'Outro'
  ],
  variable: [
    'Gasolina',
    'Visita',
    'Transporte',
    'Frete',
    'Lanche',
    'Refeição',
    'Ajudante',
    'Outro'
  ],
  material: [
    'Terceirização',
    'Corte',
    'Fitamento',
    'Parafusos',
    'Fita de Borda',
    'Cola',
    'Cantoneira',
    'Corrediças',
    'Dobradiças',
    'Bucha',
    'Puxadores',
    'Bastão/Cabideiro',
    'Trilho Inferior',
    'Trilho Superior',
    'Kit Porta',
    'Outro'
  ]
} as const;