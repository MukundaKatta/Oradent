const navigation = {
  schedule: "Agenda",
  patients: "Pacientes",
  clinical: "Clínico",
  dentalChart: "Odontograma",
  treatmentPlans: "Planos de tratamento",
  clinicalNotes: "Notas clínicas",
  perioChart: "Periodontograma",
  imaging: "Imagens",
  billing: "Financeiro",
  invoices: "Faturas",
  payments: "Pagamentos",
  insuranceClaims: "Guias de convênio",
  feeSchedule: "Tabela de preços",
  reports: "Relatórios",
  production: "Produção",
  collections: "Recebimentos",
  appointments: "Consultas",
  documents: "Documentos",
  tasks: "Tarefas",
  settings: "Configurações",
  practice: "Clínica",
  providers: "Profissionais",
  chairs: "Cadeiras",
  integrations: "Integrações",
} as const;

const usState = {
  AL: "Alabama", AK: "Alasca", AZ: "Arizona", AR: "Arkansas", CA: "Califórnia",
  CO: "Colorado", CT: "Connecticut", DE: "Delaware", FL: "Flórida", GA: "Geórgia",
  HI: "Havaí", ID: "Idaho", IL: "Illinois", IN: "Indiana", IA: "Iowa",
  KS: "Kansas", KY: "Kentucky", LA: "Luisiana", ME: "Maine", MD: "Maryland",
  MA: "Massachusetts", MI: "Michigan", MN: "Minnesota", MS: "Mississippi", MO: "Missouri",
  MT: "Montana", NE: "Nebraska", NV: "Nevada", NH: "New Hampshire", NJ: "Nova Jersey",
  NM: "Novo México", NY: "Nova York", NC: "Carolina do Norte", ND: "Dakota do Norte", OH: "Ohio",
  OK: "Oklahoma", OR: "Oregon", PA: "Pensilvânia", RI: "Rhode Island", SC: "Carolina do Sul",
  SD: "Dakota do Sul", TN: "Tennessee", TX: "Texas", UT: "Utah", VT: "Vermont",
  VA: "Virgínia", WA: "Washington", WV: "Virgínia Ocidental", WI: "Wisconsin", WY: "Wyoming",
} as const;

export const ptBR = {
  navigation,
  usState,
  patient: {
    gender: {
      male: "Masculino",
      female: "Feminino",
      other: "Outro",
      prefer_not_to_say: "Prefiro não informar",
    },
    status: {
      ACTIVE: "Ativo",
      INACTIVE: "Inativo",
      ARCHIVED: "Arquivado",
    },
  },
  provider: {
    role: {
      OWNER: "Proprietário",
      DENTIST: "Dentista",
      HYGIENIST: "Higienista",
      ASSISTANT: "Auxiliar",
      FRONT_DESK: "Recepção",
    },
  },
  treatment: {
    status: {
      PROPOSED: "Proposto",
      ACCEPTED: "Aceito",
      IN_PROGRESS: "Em andamento",
      COMPLETED: "Concluído",
      DECLINED: "Recusado",
    },
    priority: {
      LOW: "Baixa",
      MEDIUM: "Média",
      HIGH: "Alta",
      URGENT: "Urgente",
    },
  },
  image: {
    type: {
      PANORAMIC: "Panorâmica",
      PERIAPICAL: "Periapical",
      BITEWING: "Interproximal",
      CEPHALOMETRIC: "Cefalométrica",
      CBCT: "Tomografia computadorizada de feixe cônico",
      INTRAORAL: "Intraoral",
      EXTRAORAL: "Extraoral",
      PHOTO: "Fotografia",
      OTHER: "Outro",
    },
    status: {
      PENDING: "Pendente",
      PROCESSING: "Processando",
      COMPLETED: "Concluída",
      FAILED: "Falhou",
    },
  },
  invoice: {
    status: {
      DRAFT: "Rascunho",
      PENDING: "Pendente",
      PARTIALLY_PAID: "Parcialmente paga",
      PAID: "Paga",
      OVERDUE: "Vencida",
      VOID: "Anulada",
      WRITE_OFF: "Baixada",
    },
  },
  claim: {
    status: {
      DRAFTED: "Rascunho",
      SUBMITTED: "Enviada",
      IN_REVIEW: "Em análise",
      APPROVED: "Aprovada",
      PARTIALLY_APPROVED: "Parcialmente aprovada",
      DENIED: "Negada",
      APPEALED: "Em recurso",
      PAID: "Paga",
      WRITE_OFF: "Baixada",
    },
  },
  payment: {
    method: {
      CASH: "Dinheiro",
      CHECK: "Cheque",
      CREDIT_CARD: "Cartão de crédito",
      DEBIT_CARD: "Cartão de débito",
      INSURANCE: "Convênio",
      FINANCING: "Financiamento",
      OTHER: "Outro",
    },
    status: {
      PENDING: "Pendente",
      COMPLETED: "Concluído",
      FAILED: "Falhou",
      REFUNDED: "Reembolsado",
    },
  },
} as const;

export type PtBRCatalog = typeof ptBR;
