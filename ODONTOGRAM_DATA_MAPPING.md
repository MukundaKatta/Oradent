# Mapeamento de Dados — Oradent × react-advanced-odontogram

> ETAPA 1 (continuação). Baseado na leitura direta de `dist/index.d.ts` do pacote publicado
> `react-advanced-odontogram@2.4.0` (baixado do npm registry, não de exemplos/documentação resumida)
> e do schema Prisma real do Oradent.

## Achado central: a API real não é o que a documentação pública sugere

A doc pública (site TypeDoc/README) fala em "estado do dente", "eventos", "serialização" em termos genéricos. O `.d.ts` real mostra uma arquitetura bem mais específica e restritiva:

- `OdontogramShell` (o componente React) recebe só **props de configuração de UI** (`language`, `numberingSystem`, `darkMode`, `themeConfig`, `plugins`, `readOnly`, `enableNotes`, `enableIcdas`, níveis de detalhe de cada eixo clínico, etc). **Não existem props `value`/`initialState`/`onChange` para os dados clínicos.**
- Os dados vivem em um **motor com estado global a nível de módulo** (confirma o risco já levantado na Fase 1: *"uma instância do odontograma por página"*). Funções imperativas leem/escrevem esse estado: `initOdontogram()`, `destroyOdontogram()`, `importStatus(data: Any)`, `getStatusChart(): Any`, `getPlanChart(): Any`, `setPlanChart(payload: Any)`.
- Mudanças são capturadas via `onStateChange(cb: () => void): () => void` — o callback **não recebe o novo estado como argumento**; é preciso chamar `getStatusChart()` dentro do callback para ler o payload atual.
- O tipo do payload é literalmente `Any` (`type Any = any`) em toda a superfície pública — **o pacote não expõe (nem documenta) o shape interno por dente**. É tratado como um blob opaco que só faz sentido para o próprio motor (`importStatus`/`getStatusChart`/`exportFhir`/`exportPdf` são as únicas formas suportadas de ler/gravar).
- Existe persistência embutida via `localStorage` (`enablePersistence`/`disablePersistence`, chave padrão `"react-advanced-odontogram"`) — **não usaremos**, conforme regra do projeto-fonte (localStorage não é fonte de verdade clínica).
- Existe um segundo "chart" (`plan`) para simular alterações propostas (`setChartMode("plan")`, `getPlanChanges()` faz diff dente-a-dente contra o `status`). Isso é uma ferramenta de **visualização/comparação dentro do próprio widget**, não o mesmo conceito do nosso `TreatmentPlan`/`TreatmentPlanItem` (que tem CDT code, fee, cobertura de convênio, status de aceite). Não são a mesma coisa e não devem ser fundidos.

## Consequência para o design do adapter

Como o payload é opaco e não documentado campo a campo, **não é seguro nem honesto construir uma tabela de mapeamento campo-a-campo** (cárie → X, superfície → Y, etc.) contra o `ToothCondition.conditions` atual — faríamos suposições sobre um formato interno que pode mudar em qualquer patch do pacote, sem type-safety nenhuma nos protegendo.

A abordagem responsável, dado o que a API realmente oferece:

1. **Tratar o payload de `getStatusChart()` como um blob opaco versionado**, gravado em uma tabela nova e aditiva (não mexe no `ToothCondition` existente):
   ```prisma
   model AdvancedOdontogramChart {
     id          String   @id @default(cuid())
     patientId   String   @unique
     patient     Patient  @relation(fields: [patientId], references: [id])
     statusChart Json               // payload bruto de getStatusChart()
     version     Int      @default(1)   // optimistic locking (não existe hoje no schema)
     updatedById String?
     updatedBy   Provider? @relation(fields: [updatedById], references: [id])
     createdAt   DateTime @default(now())
     updatedAt   DateTime @updatedAt
   }
   ```
   Isso satisfaz "ADD, nunca DROP" e "nunca sobrescrever silenciosamente" (via `version` checado no PUT).
2. **`ToothCondition` (legado) permanece 100% intacto** — é a fonte de dados do odontograma antigo, que continua disponível via feature flag para rollback imediato.
3. **Sem migração automática de dados** na primeira entrega: como os dois modelos de dados não são semanticamente equivalentes campo a campo, converter `ToothCondition` → payload do pacote exigiria reverse-engineering de um formato interno não documentado — risco alto de corromper dados clínicos silenciosamente. Pacientes existentes abrem o odontograma novo **vazio/padrão** (conforme critério de aceite "paciente sem odontograma deve abrir normalmente com odontograma inicial vazio") até o dentista recarregar as condições manualmente, ou até decidirmos investir em um conversor best-effort como iniciativa separada, revisada por um dentista antes de ir para produção.
4. **`TreatmentPlan`/`TreatmentPlanItem` continuam sendo a única fonte de verdade financeira/workflow.** O modo "plan" do widget (`setChartMode`, `getPlanChanges`) é usado apenas como ferramenta de visualização client-side (ex.: "o que mudaria"), sem persistência própria no backend nesta primeira entrega — evita duplicar/confundir o conceito de "procedimento proposto".
5. **Periodontograma (`PerioChart` do pacote) fica fora desta primeira entrega**, como já determinado na Fase 1 — vira uma segunda etapa planejada, dado que `PerioReading` não tem rotas no backend hoje.

## Tabela de compatibilidade (nível de conceito, não de campo)

| Conceito | Oradent atual | Pacote novo | Compatível | Ação |
|---|---|---|---:|---|
| Estado clínico atual do dente | `ToothCondition` (Json livre, validado por Zod) | Payload opaco (`getStatusChart()`) | Não (formatos incompatíveis e não documentados) | Coexistir via tabela nova `AdvancedOdontogramChart`, sem conversão automática |
| Numeração | FDI 1–32 (`toothMap.ts`) | FDI/Universal/Palmer, `numberingSystem` prop | Sim (FDI é o padrão de ambos) | Configurar `numberingSystem="FDI"` |
| Histórico de procedimentos | `Treatment` (tabela própria) | Não existe conceito equivalente no pacote | N/A | Manter `Treatment` como está; pacote não participa do histórico |
| Plano de tratamento | `TreatmentPlan`/`TreatmentPlanItem` (fee, CDT, status) | "plan chart" (diff visual dente-a-dente, sem fee/CDT) | Parcial (conceitos diferentes) | Não fundir; plano do pacote fica client-side/visual apenas |
| Periodontograma | `PerioReading` (schema sem rotas) | `PerioChart` completo (PD/GM/CAL/BOP/mobilidade/etc) | Parcial | Fase periodontal separada, planejada depois |
| Idioma | pt-BR estático (`ptBR` object) | `language="pt-br"` nativo no pacote | Sim | Usar `language="pt-br"` |
| Optimistic locking | Não existe (`updatedAt` só) | N/A (client-side) | — | Adicionar `version` na tabela nova; endpoint PUT responde 409 em conflito |
| Auditoria | `AuditLog` automático por request HTTP (middleware global) | N/A | Sim | Endpoint novo cai automaticamente sob `PHI_ROUTES` se path seguir o padrão, ou adicionamos explicitamente |
| Concorrência (2 dentistas) | Nenhuma proteção hoje | N/A | — | 409 Conflict via `version`, como acima |
| RBAC | Sem restrição por role em rotas clínicas | N/A | — | Manter comportamento atual (fora de escopo criar RBAC novo) |
| Instância única por página | N/A | **Confirmado**: engine é singleton a nível de módulo | Restritivo | Página do prontuário só pode montar 1 `<OdontogramShell>` por vez; não pode coexistir com outro odontograma (ex. o legado) montado simultaneamente — o feature flag deve trocar de componente, não sobrepor |

## Fluxo de dados proposto

```
PostgreSQL (AdvancedOdontogramChart.statusChart: Json)
        ↑ PUT (com version check → 409 se conflito)          ↓ GET
    Express /api/dental-chart-v2/:patientId  (novo, aditivo — não mexe em /api/dental-chart)
        ↑                                                      ↓
useAdvancedOdontogram(patientId)  — React Query, debounce 800–1500ms no save
        ↑ importStatus(data) no mount                          ↓ onStateChange → getStatusChart()
    <OdontogramShell language="pt-br" numberingSystem="FDI" darkMode={...} />
```

## Próximo passo

Este documento fecha a ETAPA 1. Antes de instalar a dependência e escrever qualquer código (ETAPA 2 em diante), a decisão de armazenar o payload como blob opaco versionado (em vez de decompor campo a campo) e a exclusão do "plan chart" do pacote da persistência nesta entrega são decisões de arquitetura que valem confirmação explícita, já que impactam schema de produção com dados reais.
