export interface ExpenseItem {
  id: string;
  type: string;
  quantity: number;
  unitValue: number;
  total: number;
  customType?: string; // Campo opcional para armazenar o tipo personalizado
}

export interface ProjectStage {
  completed: boolean;
  date: string | null;
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
  finalizacao: ProjectStage;
  projetoCancelado: ProjectStage; // Novo campo para indicar que o projeto foi cancelado
}

export interface Project {
  id: string;
  name: string;
  date: string; // Data do orçamento
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

export const PROJECT_STAGES = [
  { id: 'orcamento', label: 'Orçamento' },
  { id: 'projetoTecnico', label: 'Projeto Técnico' },
  { id: 'corte', label: 'Corte' },
  { id: 'fitamento', label: 'Fitamento' },
  { id: 'furacaoUsinagem', label: 'Furação/Usinagem' },
  { id: 'preMontagem', label: 'Pré-Montagem' },
  { id: 'acabamento', label: 'Acabamento' },
  { id: 'entrega', label: 'Entrega' },
  { id: 'instalacao', label: 'Instalação' },
  { id: 'finalizacao', label: 'Finalização' },
  { id: 'projetoCancelado', label: 'Projeto Cancelado' }
];