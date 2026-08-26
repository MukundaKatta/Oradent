import { ptBR } from "@/i18n";
import { formatCurrency } from "@/lib/formatters";

export const billingText = {
  outstanding: "Total em aberto",
  monthlyRevenue: "Receita do mês",
  pendingClaims: "Guias pendentes",
  collectionRate: "Índice de recebimento",
  invoices: "Faturas",
  payments: "Pagamentos",
  claims: "Guias de convênio",
  feeSchedule: "Tabela de preços",
  newInvoice: "Nova fatura",
  newClaim: "Nova guia",
  paymentHistory: "Histórico de pagamentos",
  selectInvoice: "Selecione um paciente na aba Faturas para consultar seu extrato de pagamentos.",
  noClaims: "Nenhuma guia",
  cdtCode: "Código CDT",
  description: "Descrição",
  category: "Categoria",
  fee: "Valor",
  insuranceAllowance: "Cobertura do convênio",
  actions: "Ações",
  edit: "Editar",
  noFeeSchedule: "Nenhum item cadastrado na tabela de preços.",
  patientLedger: "Extrato do paciente",
  currentBalance: "Saldo atual",
  date: "Data",
  type: "Tipo",
  reference: "Referência",
  amount: "Valor",
  balance: "Saldo",
  noLedgerEntries: "Nenhum lançamento encontrado.",
  recordPayment: "Registrar pagamento",
  invoice: "Fatura",
  patient: "Paciente",
  total: "Total",
  paid: "Pago",
  balanceDue: "Saldo a pagar",
  method: "Forma de pagamento",
  optional: "Opcional",
  notes: "Observações",
  optionalNotes: "Observações opcionais...",
  cancel: "Cancelar",
  processing: "Processando...",
  createInvoice: "Criar fatura",
  creatingInvoice: "Criando fatura...",
  dueDate: "Data de vencimento",
  patientRequired: "Selecione um paciente",
  selectPatient: "Selecionar paciente",
  searchPatients: "Busque por nome ou telefone...",
  noPatients: "Nenhum paciente encontrado.",
  lineItems: "Itens da fatura",
  addItem: "Adicionar item",
  quantity: "Quantidade",
  tooth: "Dente",
  removeItem: "Remover item",
  claimTitle: "Nova guia de convênio",
  insuranceProvider: "Operadora do convênio",
  subscriberId: "ID do beneficiário",
  groupNumber: "Número do grupo",
  submitClaim: "Enviar guia",
  submittingClaim: "Enviando guia...",
  searchInvoices: "Buscar faturas...",
  invoiceNumber: "Fatura nº",
  viewDetails: "Ver detalhes",
  viewLedger: "Ver extrato",
  items: "Itens",
  noInvoices: "Nenhuma fatura encontrada.",
  claimsError: "Não foi possível carregar os dados financeiros. Tente novamente.",
} as const;

const ledgerTypeLabels = {
  charge: "Cobrança",
  payment: "Pagamento",
  adjustment: "Ajuste",
  insurance: "Convênio",
} as const;

export function formatBillingCurrency(amount: number): string {
  return formatCurrency(amount);
}

export function getLedgerTypeLabel(type: string): string {
  return ledgerTypeLabels[type as keyof typeof ledgerTypeLabels] ?? type;
}

export function getInvoiceStatusLabel(status: string): string {
  return ptBR.invoice.status[status as keyof typeof ptBR.invoice.status] ?? status;
}

export function getClaimStatusLabel(status: string): string {
  return ptBR.claim.status[status as keyof typeof ptBR.claim.status] ?? status;
}

export function getPaymentMethodLabel(method: string): string {
  return ptBR.payment.method[method as keyof typeof ptBR.payment.method] ?? method;
}
