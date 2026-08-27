# Análise da Implementação Atual — Odontograma (Oradent)

> Documento da ETAPA 1 (auditoria) do plano de integração do `react-advanced-odontogram`.
> Gerado antes de qualquer alteração de código. Fonte: leitura direta do schema Prisma, rotas Express e componentes React existentes.

## Arquitetura encontrada

### Frontend
- Next.js 14 App Router, `packages/web/src`.
- Prontuário do paciente: `src/app/(dashboard)/patients/[id]/chart/page.tsx`.
- Componente do odontograma: `src/components/dental-chart/DentalChart.tsx` — **SVG desenhado à mão**, sem lib externa. Suporta `teethData`, `onToothSave`, `readOnly` via props.
- Componentes auxiliares: `ToothSVG.tsx`, `ToothPopover.tsx`, `SurfaceSelector.tsx`, `ConditionPalette.tsx`, `ChartLegend.tsx`, `PerioChart.tsx`.
- Dados: hook `useDentalChart.ts` (TanStack Query) + `apiGet`/`apiPut` (`src/lib/api.ts`).
- Estado de edição: store Zustand `src/stores/chartStore.ts` (dente/superfície selecionados, modo de edição, zoom).
- Mapas estáticos: `src/lib/toothMap.ts` (numeração 1–32, superfícies M O I D B L), `src/lib/conditionColors.ts` (cores + labels pt-BR de 17 condições).
- i18n: objeto estático `ptBR` (`src/i18n/pt-BR.ts`), sem lib de i18n — chaves relevantes sob `patientWorkflow.chart.*`.
- Não existe padrão `features/`/`adapters/` no projeto. Organização é por tipo técnico (`components/<domínio>/`, `hooks/`, `stores/`, `lib/`).

### Backend
- Express, `packages/server/src`.
- Rotas: `src/routes/dentalChart.ts` (montada em `/api/dental-chart`), `src/routes/treatments.ts` (`/api/treatments`).
- Todas as rotas exigem `authenticate` (JWT); **nenhuma** exige `authorize(role)` — qualquer `Provider` autenticado (inclusive `FRONT_DESK`) lê/escreve o odontograma hoje.
- Auditoria automática: `src/middleware/auditMiddleware.ts`, global, intercepta todas as chamadas a `/api/dental-chart` (entre outras rotas PHI) e grava `AuditLog` por requisição HTTP (não por campo alterado).

### Banco
- PostgreSQL via Prisma. Uma única migration (`20260826150510_init`) — schema recente.
- Sem soft-delete, sem `version`/optimistic locking em nenhum model clínico — apenas `updatedAt`.

## Odontograma atual

### Como os dados são armazenados
Model `ToothCondition` — **um registro por dente** (`@@unique([patientId, toothNumber])`):
```prisma
model ToothCondition {
  id          String      @id @default(cuid())
  patientId   String
  toothNumber Int
  conditions  Json        @default("[]")   // array livre, validado só via Zod no backend
  status      ToothStatus @default(PRESENT) // PRESENT MISSING IMPACTED UNERUPTED IMPLANT PONTIC
  isDeciduous Boolean     @default(false)
  updatedAt   DateTime    @updatedAt
}
```
`conditions` é `Json` — cada `PUT` **sobrescreve o array inteiro** daquele dente. Não há tabela de histórico por condição.

Também existe `PerioReading` (periograma) no schema, mas **sem rotas CRUD no backend** — o `PerioChart.tsx` do frontend é client-only/mock hoje.

### Quais tabelas participam
`ToothCondition`, `PerioReading` (schema apenas), e indiretamente `Treatment`/`TreatmentPlan`/`TreatmentPlanItem` (histórico de procedimentos, ligados a `toothNumber` mas em tabela separada — corretamente desacoplados do estado atual do dente).

### Quais APIs são utilizadas
- `GET /api/dental-chart/:patientId` → array de `ToothCondition` (**sem wrapper**).
- `GET /api/dental-chart/:patientId/tooth/:toothNumber` → um `ToothCondition` (ou stub vazio).
- `PUT /api/dental-chart/:patientId/tooth/:toothNumber` → upsert de um dente.
- `PUT /api/dental-chart/:patientId/batch` → upsert de vários dentes em transação.

### Como o frontend carrega os dados
`useDentalChart(patientId)` chama `GET /api/dental-chart/:patientId` e tipa o retorno como `{patientId, teeth: ToothCondition[], lastUpdated, updatedBy?}` — **shape que não bate com a resposta real da API** (array puro). Ver bug abaixo.

### Como salva
`useUpdateTooth(patientId)` chama `PUT /api/dental-chart/:patientId/tooth/:toothNumber`, sem debounce, invalida a query no sucesso.

### Como tratamentos se relacionam ao odontograma
Corretamente desacoplado: `Treatment` (procedimento realizado) e `TreatmentPlanItem` (procedimento proposto) são tabelas próprias, referenciando `toothNumber` como campo solto (não FK para `ToothCondition`). Isso já respeita a separação "estado atual do dente" vs. "histórico de procedimentos" pedida na Fase de dados clínicos.

## Bugs reais encontrados (pré-existentes, não relacionados ao redesign visual)

1. **Odontograma desconectado dos dados reais.** Em `chart/page.tsx`, `<DentalChart />` é renderizado **sem props** — não recebe `teethData` nem `onToothSave`, apesar de `useDentalChart` já buscar os dados. O botão "Salvar" do header não tem `onClick`. Resultado: a tela renderiza um odontograma vazio/estático mesmo quando o paciente tem condições salvas no banco.
2. **Mismatch de shape front/back.** `useDentalChart` espera `{patientId, teeth, lastUpdated, updatedBy}`; o backend devolve um array puro de `ToothCondition`. `chartData?.lastUpdated` nunca existirá.
3. **Três definições divergentes de `ToothCondition` no frontend**: em `useDentalChart.ts` (`conditions: string[]`), em `types/index.ts` (`conditions: ToothConditionEntry[]`, com `type/surfaces/notes/date/providerId`) e a usada por `ToothSVG.tsx`/`chartStore.ts`. Precisam ser unificadas antes de conectar um novo componente.
4. **`PerioReading` sem CRUD no backend** — o periograma do frontend não persiste nada hoje.

Esses bugs **serão corrigidos como parte da integração** (é a "leitura" da Etapa 4 do plano), não descartados.

## Riscos encontrados para a integração do `react-advanced-odontogram`

| Risco | Detalhe | Mitigação planejada |
|---|---|---|
| Sem optimistic locking | `ToothCondition` não tem `version`; dois dentistas editando o mesmo paciente podem se sobrescrever silenciosamente | Adicionar campo aditivo (ex. `version Int @default(1)`) + checagem no PUT, responder 409 |
| `conditions` é `Json` livre | Shape só validado via Zod no backend, não no banco; risco de o adapter gravar formato incompatível | Adapter explícito bidirecional (`fromOradent`/`toOradent`) com o Zod schema existente como contrato |
| Sem RBAC granular | Qualquer `Provider` (inclusive `FRONT_DESK`) pode escrever no odontograma | Fora do escopo desta migração (comportamento já existente); não vamos criar RBAC paralelo, só reaproveitar `authorize()` se decidido separadamente |
| `PerioReading` sem rotas | Periograma novo do pacote pode não ter onde persistir | Tratar periodontograma como **Fase 2 separada**, como pedido no documento-fonte — não misturar com a primeira migração |
| API real do pacote desconhecida | Precisa verificar versão/documentação atual antes de desenhar o adapter (Fase 2 do plano) | Próximo passo: investigar o pacote antes de qualquer código |
| Numeração | Projeto já usa FDI 1–32 (`toothMap.ts`) consistente com o padrão pedido (FDI/ISO 3950) — baixo risco aqui | — |
| Sem feature flag existente | Precisa criar do zero para permitir rollback rápido | Env var simples (`NEXT_PUBLIC_ADVANCED_ODONTOGRAM_ENABLED`) lida no componente contêiner |

## Convenções a seguir na integração
- Testes: Vitest, arquivo `*.test.ts(x)` ao lado do código-fonte.
- i18n: adicionar chaves em `pt-BR.ts` (objeto estático), sem lib de i18n.
- Autosave: não existe padrão hoje — usar `useDebounce` (já existe, genérico) + `useMutation` (a criar).
- CI: `typecheck` (tsc + prisma generate) → `lint`/`build` → `test` (Postgres+Redis reais). Qualquer migration deve rodar limpo em `prisma migrate deploy` no job de teste.
