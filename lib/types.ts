// Modelo de dados do Assistente Financeiro.
// Campos numéricos de entrada (saldoAtual, salarioMensal, diaFechamento, despesasFixas,
// despesasVariaveis) são persistidos ora como number, ora como string (parseCurrencyInput
// retorna string via toFixed(2)). O código sempre passa por parseFloat/parseInt, então
// mantemos `number | string` para fidelidade ao comportamento original.

export type Numeric = number | string;

export interface Compra {
  id: number;
  item: string;
  data: string; // 'YYYY-MM-DD'
  valorTotal: number;
  parcelas: number;
  oculta: boolean;
}

export interface Estorno {
  id: number;
  nome: string;
  mes: string; // 'YYYY-MM'
  valor: number;
}

export interface Despesa {
  id: number;
  nome: string;
  valor: number;
  vezesRestantes: number | null; // null => permanente
  dataInicio: string | null; // 'YYYY-MM' (ou 'YYYY-MM-DD' vindo do Calendar)
  temLimite?: boolean;
}

export interface DespesaExtra {
  id: number;
  nome: string;
  valor: number;
  mes: string; // 'YYYY-MM'
  data: string; // 'YYYY-MM-DD'
  ativo: boolean;
}

export interface EntradaExtra {
  id: number;
  nome: string;
  valor: number;
  mes: string; // 'YYYY-MM'
  data: string; // 'YYYY-MM-DD'
  recorrente: boolean;
  somarNoSaldo: boolean; // sempre false (informativo)
  ativo: boolean;
}

export type ChatRole = 'user' | 'assistant';

export interface ChatMessage {
  id: string;
  tipo: ChatRole;
  conteudo: string;
  data: string; // ISO
}

export interface Chat {
  id: string;
  titulo: string;
  criadoEm: string; // ISO
  mensagens: ChatMessage[];
  loading: boolean;
}

export interface FinanceData {
  saldoAtual: Numeric;
  diaFechamento: Numeric;
  salarioMensal: Numeric;
  despesasFixas: Numeric; // legado (fallback)
  despesasVariaveis: Numeric; // legado (fallback)
  compras: Compra[];
  estornos: Estorno[];
  entradasExtras: EntradaExtra[];
  despesas: Despesa[];
  despesasExtras: DespesaExtra[];
  salariosRecebidos: string[]; // ['YYYY-MM']
  limiteAlertaMensal: number;
  apiKey: string; // NUNCA exportada/sincronizada
  chats: Chat[];
  chatAtivoId: string | null;
  /** Campo legado, migrado para chats na inicialização. */
  historicoIA?: Array<{ id?: number | string; pergunta?: string; resposta?: string; data?: string }>;
}

export interface TimelineMonth {
  name: string;
  monthKey: string; // 'YYYY-MM'
  salarioJaRecebido: boolean;
  income: number;
  expenses: number;
  cardBill: number;
  netResult: number;
  finalBalance: number;
}
