export const ptBR = {
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
