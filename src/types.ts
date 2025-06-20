export interface ExpenseItem {
  id: string;
  type: string;
  quantity: string | number;
  unitValue: string | number;
  total: number;
  customType?: string; // Campo opcional para armazenar o tipo personalizado
}

export interface ProjectStage {
  completed: boolean;
  date: string | null;
  cancellationReason?: string; // Motivo do cancelamento (quando aplicável)
  realCost?: number; // Valor real gasto (especialmente para a etapa de instalação)
  hasCompletionNotes?: boolean; // Indica se há notas de conclusão
  completionNotes?: string; // Notas sobre a conclusão do projeto
}

export interface ProjectStages {
  orcamento: ProjectStage;
  projetoTecnico: ProjectStage;
  corte: ProjectStage;
  fitamento: ProjectStage;
  furacaoUsinagem: ProjectStage;
  preMontagem: ProjectStage;
  acabamento: ProjectStage;
  entrega: ProjectStage;
  instalacao: ProjectStage;
  projetoCancelado: ProjectStage; // Novo campo para indicar que o projeto foi cancelado
}

// Interface para cliente independente
export interface Client {
  id: string;
  name: string;
  phone: string;
  email?: string;
  address?: string;
  notes?: string;
  createdAt: string;
  lastModified?: string;
}

export interface Project {
  id: string;
  name: string;
  date: string; // Data do orçamento
  clientId?: string; // Referência ao ID do cliente (opcional para compatibilidade com projetos antigos)
  clientName: string; // Nome do cliente
  contactPhone: string; // Telefone de contato
  fixedExpenses: ExpenseItem[];
  variableExpenses: ExpenseItem[];
  materials: ExpenseItem[];
  profitMargin: number;
  totalCost: number;
  salePrice: number;
  comments: string; // Comentários sobre o orçamento
  stages: ProjectStages; // Etapas do projeto com status e datas
  lastModified?: string; // Data da última modificação
  fixedExpenseDays?: number; // Número de dias de trabalho para o projeto
  useWorkshopForFixedExpenses?: boolean; // Indica se usa cálculo automático ou manual
  frozenDailyCost?: number; // Valor congelado do custo diário quando o projeto técnico for aprovado
  priceType?: 'normal' | 'markup'; // Tipo de preço selecionado (normal ou com markup)
  estimatedCompletionDate?: string; // Data prevista para finalização do projeto
  dailySalary?: number; // Valor do salário diário específico do projeto
  taxPercentage?: number; // Porcentagem de imposto tributado no CNPJ
  applyTax?: boolean; // Indica se o imposto deve ser aplicado no preço final
  frozenTaxPercentage?: number; // Valor congelado da porcentagem de imposto quando o projeto técnico for aprovado
  frozenApplyTax?: boolean; // Valor congelado da decisão de aplicar imposto quando o projeto técnico for aprovado
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

export interface WorkshopExpense {
  id: string;
  type: string;
  description: string;
  quantity: number;
  unitValue: number;
  isCustomDescription?: boolean;
  note?: string;
  workingDays?: number; // Dias de trabalho específicos para o salário
}

export interface WorkshopSettings {
  workingDaysPerMonth: number; // Dias úteis por mês
  expenses: WorkshopExpense[];
  lastUpdated?: string;
  workshopName?: string; // Nome da marcenaria
  logoImage?: string | null; // Logo da marcenaria em base64
}

export interface DailyCostCalculator {
  dailyCost: number; // Custo diário total
  expenseBreakdown: { [type: string]: number }; // Custo diário por categoria
}

export interface ProjectWithDailyCost extends Project {
  fixedExpenseDays?: number; // Número de dias de trabalho para o projeto
  calculatedFixedExpenses?: number; // Valor calculado com base nos dias e custo diário
  useWorkshopForFixedExpenses?: boolean; // Indica se usa cálculo automático ou manual
  frozenDailyCost?: number; // Valor congelado do custo diário quando o projeto técnico for aprovado
}

export type ExpenseType = 'fixed' | 'variable' | 'material';

export const WORKSHOP_EXPENSE_TYPES = [
  'Água',
  'Aluguel',
  'Contabilidade',
  'Depreciação de Equipamentos',
  'Depreciação de Ferramentas',
  'Energia',
  'Funcionários',
  'Impostos',
  'Internet',
  'Manutenção',
  'Material de Escritório',
  'Material de Limpeza',
  'Outros',
  'Seguro',
  'Software',
  'Telefone'
];

export const EXPENSE_OPTIONS = {
  fixed: [
    'Água',
    'Aluguel',
    'Contador',
    'Depreciação de Ferramentas',
    'Encargos Trabalhistas',
    'Energia Elétrica',
    'Internet',
    'IPTU',
    'Limpeza',
    'Manutenção de Máquinas',
    'Material de Escritório',
    'Salário',
    'Salário (hora)',
    'Seguro',
    'Software e Licenças',
    'Telefone'
  ],
  variable: [
    'Ajudante',
    'Frete',
    'Gasolina',
    'Lanche',
    'Refeição',
    'Transporte',
    'Visita'
  ],
  material: [
    'Bastão/Cabideiro',
    'Bucha',
    'Cantoneira',
    'Cola',
    'Corrediças',
    'Corte',
    'Dobradiças',
    'Fita de Borda',
    'Fitamento',
    'Kit Porta',
    'Parafusos',
    'Puxadores',
    'Terceirização',
    'Trilho Inferior',
    'Trilho Superior'
  ]
} as const;

export const CANCELLATION_REASONS = [
  'Desistência sem justificativa',
  'Demora no atendimento',
  'Falta de orçamento no momento',
  'Mudança de planos',
  'Preço alto',
  'Prazo de entrega longo',
  'Projeto inviável'
];

export const PROJECT_STAGES = [
  { id: 'orcamento', label: 'Orçamento' },
  { id: 'projetoTecnico', label: 'Projeto Técnico' },
  { id: 'corte', label: 'Corte' },
  { id: 'fitamento', label: 'Fitamento' },
  { id: 'furacaoUsinagem', label: 'Usinagem' },
  { id: 'preMontagem', label: 'Pré-Montagem' },
  { id: 'acabamento', label: 'Entrega' }, 
  { id: 'entrega', label: 'Instalação' }, 
  { id: 'instalacao', label: 'Acabamento' }, 
  { id: 'projetoCancelado', label: 'Pedido Cancelado' }
];