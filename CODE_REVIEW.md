# Code Review — Oradent

**Data:** 2026-08-27 · **Escopo:** `packages/server` (4.700 linhas, integral) + `packages/web` (96 arquivos)
**Foco pedido:** controle de fluxo de operação, integridade de dados, dead code, bugs.

> **Nota de método:** `tsc --noEmit` passa limpo e os 36 testes passam. Nenhum dos
> problemas abaixo é detectado pela suíte atual — as interfaces do frontend são
> *internamente consistentes*, apenas não correspondem ao que a API devolve, e não
> existe nenhum teste que toque o servidor. Tipo não é contrato.

---

## Sumário por severidade

| # | Severidade | Tema | Itens |
|---|---|---|---|
| A | 🔴 Crítico | Isolamento multi-tenant (7 endpoints escrevem sem verificar a clínica) | A1–A7 |
| B | 🔴 Crítico | Módulo de faturamento do frontend não funciona | B1–B5 |
| C | 🟠 Alto | Integridade financeira e de concorrência | C1–C5 |
| D | 🟠 Alto | Trilha de auditoria com identificador errado/ausente | D1–D2 |
| E | 🟡 Médio | Agenda: filtros e conflitos | E1–E4 |
| F | 🟡 Médio | Autenticação e sessão | F1–F4 |
| G | 🟡 Médio | Upload e arquivos | G1–G3 |
| H | 🔵 Baixo | Dead code (~1.100 linhas) | H1–H4 |

---

## A. Isolamento multi-tenant — 7 endpoints gravam sem checar a clínica 🔴

O padrão correto existe e é usado na maioria das rotas: buscar o registro com
`findFirst({ where: { id, ...práticaId } })` **antes** de escrever. Sete endpoints
pulam essa etapa e chamam `update`/`create` direto com um ID vindo do cliente.
Qualquer usuário autenticado de qualquer clínica pode alterar registros de outra.

| # | Endpoint | Arquivo | O que dá para fazer |
|---|---|---|---|
| A1 | `PATCH /api/treatments/notes/:id/sign` | [treatments.ts:273](packages/server/src/routes/treatments.ts#L273) | **Assinar nota clínica de outra clínica.** Além disso não registra *quem* assinou e permite reassinar, sobrescrevendo `signedAt`. Assinatura é ato legal — é o pior desta lista. |
| A2 | `PATCH /api/treatments/plans/:id/status` | [treatments.ts:92](packages/server/src/routes/treatments.ts#L92) | Marcar plano de tratamento alheio como ACEITO/RECUSADO (distorce receita e o relatório de aceitação). |
| A3 | `PUT /api/imaging/:imageId/annotations` | [imaging.ts:82](packages/server/src/routes/imaging.ts#L82) | Sobrescrever anotações de radiografia de outro paciente. Nem verifica se a imagem existe. |
| A4 | `POST /api/billing/invoices` | [billing.ts:82](packages/server/src/routes/billing.ts#L82) | Emitir fatura no nome de paciente de outra clínica. Os *tratamentos* são validados (linha 93), o `patientId` não. |
| A5 | `POST /api/appointments` | [appointments.ts:181](packages/server/src/routes/appointments.ts#L181) | `patientId`/`providerId`/`chairId` não são validados. A checagem de conflito é escopada por clínica, o `create` não. |
| A6 | `PATCH /api/ai/analysis/:id/review` + `POST /analyze-xray` + `POST /generate-note` | [ai.ts:193](packages/server/src/routes/ai.ts#L193), [ai.ts:16](packages/server/src/routes/ai.ts#L16), [ai.ts:93](packages/server/src/routes/ai.ts#L93) | `patientId` do body nunca é validado nem confrontado com `image.patientId` → análise de IA gravada no prontuário errado. |
| A7 | `POST /api/ai/pre-auth-letter` | [ai.ts:127](packages/server/src/routes/ai.ts#L127) | `treatmentPlan.findUnique` sem escopo → conteúdo do plano de outra clínica é enviado ao modelo e gravado em `AIAnalysis.output`. **Vazamento de PHI.** |
| — | `PUT /api/settings/chairs/:id` | [settings.ts:100](packages/server/src/routes/settings.ts#L100) | Mesmo padrão (renomear/desativar cadeira de outra clínica). Menor impacto por exigir OWNER. |

**Correção:** em cada um, inserir o `findFirst` escopado antes do `update`, exatamente
como em `PUT /api/patients/:id` ([patients.ts:118](packages/server/src/routes/patients.ts#L118)).
Vale considerar uma extensão Prisma `$extends` que force o escopo, porque essa
falha já se repetiu 8 vezes — é uma questão de arquitetura, não de descuido pontual.

---

## B. Módulo de faturamento do frontend está quebrado de ponta a ponta 🔴

`packages/web/src/hooks/useBilling.ts` descreve uma API que **não existe**. É a mesma
classe de bug já corrigida em Patients e no odontograma, mas aqui atinge dinheiro.

| # | Hook | Espera | Servidor devolve/aceita | Efeito |
|---|---|---|---|---|
| B1 | `useInvoices` | `{ data, total, totalPages }` | `{ invoices, pagination }` | `invoiceData?.data` é sempre `undefined` |
| B2 | `usePayments` | `GET /api/billing/payments?patientId=` | **endpoint não existe** (só `POST /payments`) | 404 em toda chamada |
| B3 | `Invoice` | `patientName`, `items`, `tax`, `amountPaid`, `balance`, status minúsculo | `patient{}`, `treatments[]`, `taxAmount`, `payments[]`, status MAIÚSCULO | nenhum campo bate |
| B4 | `useCreateInvoice` | envia `{ items, dueDate }` | exige `subtotal`, não aceita `items` | 400 sempre |
| B5 | `useRecordPayment` | `method: 'credit_card'` | enum `'CREDIT_CARD'` | 400 sempre |

**Consequência visível hoje:** em [patients/[id]/billing/page.tsx:23-27](packages/web/src/app/\(dashboard\)/patients/[id]/billing/page.tsx#L23),
`invoices` e `payments` caem no fallback `[]`, então **"Saldo em aberto" e "Total pago"
exibem R$ 0,00 para todo paciente**, mesmo com faturas em aberto. Não há erro na tela —
é um número financeiro errado, apresentado com confiança. Esse é o achado mais perigoso
do review, porque parece que está funcionando.

O servidor **já tem** o cálculo correto pronto e ninguém consome:
`GET /api/billing/ledger/:patientId` devolve `summary.balance` agregado no banco
([billing.ts:225](packages/server/src/routes/billing.ts#L225)).

**Mesma situação em `useAppointments.ts`:** envia `startDate`/`endDate`, o servidor lê
`start`/`end` ([appointments.ts:44](packages/server/src/routes/appointments.ts#L44)) →
**o filtro de data é silenciosamente ignorado**, a agenda sempre mostra os próximos
7 dias. `useTodaySchedule` espera `{time, patientName, chair, provider}` achatado e
recebe objetos aninhados → as linhas da "Agenda de hoje" do dashboard renderizam vazias.

**Correção estrutural:** validar as respostas com Zod na borda do cliente (os schemas
do servidor podem ser compartilhados via um pacote `packages/shared`), em vez de
declarar `interface` e torcer. Uma `interface` errada é indistinguível de uma certa
para o compilador.

---

## C. Integridade financeira e concorrência 🟠

**C1 — Corrida no registro de pagamento** · [billing.ts:133](packages/server/src/routes/billing.ts#L133)
A transação lê `invoice.payments`, soma e decide o status. No isolamento padrão do
Postgres (Read Committed) dois pagamentos simultâneos leem o mesmo estado inicial:
uma fatura de R$ 1.000 que recebe 2×R$ 500 ao mesmo tempo fica **`PARTIALLY_PAID`
com saldo zero**. Some com o item C3 e ela ainda vira `OVERDUE` depois.
→ Usar `SELECT ... FOR UPDATE` (`$queryRaw`), ou `isolationLevel: 'Serializable'`,
ou recalcular o status por agregação após o insert.

**C2 — `total` da fatura é ditado pelo cliente** · [billing.ts:107](packages/server/src/routes/billing.ts#L107)
`subtotal`, `discount` e `insurancePortion` vêm do body e o total é aceito sem
conferir contra a soma de `treatments[].fee`. Uma fatura pode ficar permanentemente
divergente dos procedimentos que a compõem. O serviço que faria isso certo —
`services/billingCalc.ts`, com tabela CDT e regras de dedutível — **existe e nunca
é importado** (ver H1). Recalcular no servidor a partir dos `treatmentIds`.

**C3 — Faturas parcialmente pagas nunca ficam vencidas** · [claimFollowUp.ts:44](packages/server/src/jobs/claimFollowUp.ts#L44)
O job só considera `status: 'PENDING'`. `PARTIALLY_PAID` vencida some do relatório
de inadimplência. Trocar por `status: { in: ['PENDING', 'PARTIALLY_PAID'] }`.

**C4 — Número de fatura colide** · [formatters.ts:26](packages/server/src/utils/formatters.ts#L26)
`INV-AAAAMM-` + 4 dígitos aleatórios. Pelo paradoxo do aniversário, com ~118 faturas
no mesmo mês a chance de colisão passa de 50%. `invoiceNumber` é `@unique` → P2002 →
409 sem retry, e a emissão simplesmente falha. Usar sequência no banco ou contador atômico.

**C5 — `throw new Error` dentro da transação vira HTTP 500** · [billing.ts:143](packages/server/src/routes/billing.ts#L143)
"Invoice not found" devolve 500 em vez de 404. O padrão certo já está em
[appointments.ts:9](packages/server/src/routes/appointments.ts#L9) (`ConflictError`)
e em `AppError` no errorHandler — basta usar.

---

## D. Trilha de auditoria registra o identificador errado 🟠

**D1 — Regex não cobre rotas com hífen** · [auditMiddleware.ts:22](packages/server/src/middleware/auditMiddleware.ts#L22)
`/\/api\/(\w+)(?:\/([^/]+))?/` — `\w` não casa `-`. Verificado:

```
/api/dental-chart/advanced/abc123 → resource: "dental"   resourceId: ""        ← paciente perdido
/api/billing/invoices/xyz         → resource: "billing"  resourceId: "invoices" ← sub-rota, não o ID
/api/patients/cmta8               → resource: "patients" resourceId: "cmta8"    ← único correto
```

Ou seja: **todo acesso ao odontograma é auditado sem o identificador do paciente**, e
faturamento grava um `resourceId` que não é um ID. O sistema existente justamente para
provar quem tocou qual prontuário não consegue responder isso.

**D2 — Rotas fora da auditoria** · [auditMiddleware.ts:5](packages/server/src/middleware/auditMiddleware.ts#L5)
`PHI_ROUTES` não inclui `/api/appointments`, `/api/ai` nem `/api/settings`. Fica sem
registro: exclusão de consulta (hard delete, [appointments.ts:275](packages/server/src/routes/appointments.ts#L275)),
criação de usuário e **reset de senha de outro provider**.

---

## E. Agenda 🟡

**E1 — Consultas que cruzam a borda do período somem** · [appointments.ts:54](packages/server/src/routes/appointments.ts#L54)
`startTime >= start AND endTime <= end`. Uma consulta que começa 17h e termina 18h30
não aparece numa consulta até 18h. Sobreposição correta: `startTime < end AND endTime > start`.

**E2 — `PUT /:id` não revalida conflito** · [appointments.ts:237](packages/server/src/routes/appointments.ts#L237)
O `POST` tem proteção contra corrida com transação; o `PUT` — que é o caminho de
remarcar/arrastar no calendário — não tem nenhuma. Dá para empilhar duas consultas na
mesma cadeira. A lógica já existe no POST; extrair e reusar nos dois.

**E3 — `check-conflict` usa fuso diferente do `POST`** · appointments.ts:114
`new Date(\`${date}T${time}:00\`)` interpreta no fuso local do servidor, enquanto o
`POST` recebe ISO (UTC). A pré-checagem pode dizer "livre" e a criação recusar — ou pior,
o contrário.

**E4 — Job de lembrete usa a configuração de uma clínica aleatória** · [appointmentReminder.ts:9](packages/server/src/jobs/appointmentReminder.ts#L9)
`prisma.practiceSettings.findFirst()` sem filtro pega **qualquer** clínica e aplica seu
`reminderHoursBefore` a todas. Agravante: o job marca `reminderSent: true` mas só faz
`logger.info('Would send...')` — quando o envio real for implementado, todas essas
consultas já estarão marcadas como notificadas e serão puladas. Iterar por clínica.

---

## F. Autenticação e sessão 🟡

**F1 — Logout não invalida o refresh token** · [auth.ts:190](packages/server/src/routes/auth.ts#L190)
Só o access token entra na blacklist. Com o refresh token (validade 7d) ainda válido em
`localStorage`, dá para emitir novos access tokens depois do logout. Mesma lacuna na
troca de senha ([auth.ts:220](packages/server/src/routes/auth.ts#L220)) e no reset pelo
OWNER: a sessão do usuário comprometido continua ativa. Considerar `tokenVersion` no
Provider, checada no `authenticate`.

**F2 — Blacklist chaveada por 16 caracteres do token** · [auth.ts:41](packages/server/src/middleware/auth.ts#L41)
`bl:${token.slice(-16)}` — sufixo da assinatura, não o `jti`. Colisão é improvável mas o
custo de acertar é zero: usar o hash completo do token ou um `jti`.

**F3 — WebSocket aceita refresh token e ignora a blacklist** · [liveUpdates.ts:24](packages/server/src/websocket/liveUpdates.ts#L24)
O handshake só faz `jwt.verify`, sem as duas checagens que o middleware HTTP faz.
Um usuário deslogado mantém a conexão. (Na prática o canal está inerte — ver H2.)

**F4 — Rate limit por IP do proxy** · [index.ts:51](packages/server/src/index.ts#L51)
`app.set('trust proxy', ...)` não está configurado e o app roda atrás do nginx, então
`req.ip` é o IP do proxy: **a clínica inteira compartilha um único balde de 500 req/15min**,
e as 10 tentativas de login do `authLimiter` são globais — as falhas de um usuário
travam o login de todos. Além disso o `keyGenerator` por usuário do `apiLimiter` é
código morto: ele roda **antes** do `authenticate`, então `req.auth` é sempre `undefined`.

---

## G. Upload e arquivos 🟡

**G1 — `/uploads` é servido sem autenticação** · [index.ts:57](packages/server/src/index.ts#L57)
`express.static` montado antes de qualquer auth. Radiografias e fotos intraorais ficam
acessíveis a quem tiver a URL. Os nomes são UUID v4, mas isso é obscuridade, não
controle de acesso — a URL vaza por histórico, referrer e log de proxy. Servir por uma
rota autenticada que valide a clínica e faça stream do arquivo.

**G2 — Filtro de tipo de arquivo não filtra** · [upload.ts:20](packages/server/src/middleware/upload.ts#L20)
`|| file.mimetype.startsWith('image/')` anula a allow-list, e o mimetype vem do cliente.
Um `image/svg+xml` com script embutido é servido da mesma origem da API → XSS
armazenado. Combinado com o token em `localStorage`, o roubo de sessão é direto.
Validar por *magic bytes* e recusar SVG.

**G3 — Caminho absoluto no banco e arquivo órfão** · [imaging.ts:63](packages/server/src/routes/imaging.ts#L63)
`filePath: req.file.path` grava o caminho absoluto do contêiner; se `UPLOAD_DIR` mudar,
todas as imagens antigas quebram — guardar o caminho relativo. E o multer grava em disco
*antes* da checagem de paciente (linha 43): quando dá 404, o arquivo fica órfão.
Bônus: `toothNumbers: z.string().transform(s => JSON.parse(s))` (linha 56) faz
`JSON.parse` sem proteção — JSON malformado vira 500, não 400, e o resultado não é
validado como array de números.

---

## H. Dead code 🔵

**H1 — 8 módulos do servidor nunca importados** (~600 linhas)

| Módulo | Observação |
|---|---|
| `services/billingCalc.ts` | 119 linhas de regra de cobertura CDT/dedutível — é exatamente o que falta em C2 |
| `services/auditLog.ts` | `createAuditEntry`/`getAuditLogs`; **não há nenhum endpoint para ler a auditoria** |
| `services/emailService.ts` | por isso os lembretes só logam (E4) |
| `services/appointmentSlots.ts` | busca de horários livres, sem rota |
| `utils/encryption.ts` | AES-256-GCM para PHI em repouso, nunca usado (e `TAG_LENGTH` sequer é lido) |
| `utils/cdtCodes.ts`, `utils/icdCodes.ts`, `utils/toothNumbers.ts` | tabelas de referência órfãs |

Não é código inofensivo: `billingCalc` e `auditLog` dão a impressão de que a regra de
negócio e a auditoria consultável existem, quando nenhuma das duas está ligada.

**H2 — Tempo real morto nas duas pontas** (~180 linhas)
`emitAppointmentUpdate`, `emitChairStatus`, `emitNotification`, `getIO`
([liveUpdates.ts:48-60](packages/server/src/websocket/liveUpdates.ts#L48)) são exportados
e **nunca chamados** — nada é emitido. Do lado do cliente, `hooks/useSocket.ts` emite
`join:practice`/`leave:practice`, eventos para os quais **o servidor não registra
listener** (ele já faz o join automático no connect). O hook inteiro não é usado por
nenhum componente. Ou liga-se a funcionalidade, ou remove-se — hoje ela existe só no
organograma.

**H3 — Frontend órfão:** `stores/chartStore.ts` (149 linhas, Zustand com estado
de odontograma paralelo ao servidor), `stores/notificationStore.ts`,
`hooks/useDebounce.ts`, `hooks/useAIAnalysis.ts`, `hooks/useSocket.ts`,
`components/dental-chart/PerioChart.tsx`, `components/dashboard/ChairStatusCard.tsx`,
`components/appointments/AppointmentCard.tsx`. Também `useCreateInvoice`,
`useRecordPayment`, `useCreateAppointment`, `useUpdateAppointment` — nenhum tem
consumidor, o que confirma que criar fatura/pagamento/consulta não está ligado na UI.

**H4 — Menores:** `utils/cache.ts` exporta `invalidateCache`/`invalidateCachePattern`
sem uso (o cache do dashboard nunca é invalidado, só expira em 60s);
`config/storage.ts` exporta `getUploadPath` que o multer não usa; `/api/docs` publica
um Swagger vazio (`apis: []`).

---

## I. Observações sobre a integração do odontograma avançado

Revisei também o que foi entregue nesta sessão. Dois pontos legítimos:

**I1 — Autosave sem serialização** · [useAdvancedOdontogram.ts:44](packages/web/src/hooks/useAdvancedOdontogram.ts#L44)
`sendSave` não é enfileirado. Se o `onStateChange` disparar de novo enquanto um PUT
está em voo, o segundo envio usa o `versionRef` antigo → **409 do dentista consigo
mesmo**. O debounce de 1200ms reduz a janela mas não a fecha (latência > 1200ms é
comum). Correção: guardar um `inFlightRef` e reenfileirar o pendente ao concluir.

**I2 — Provável gravação fantasma na abertura** · [AdvancedOdontogramContainer.tsx:99](packages/web/src/components/dental-chart/advanced/AdvancedOdontogramContainer.tsx#L99)
A assinatura de `onStateChange` é feita antes da hidratação, e `importStatus()` muda o
estado do engine. Se ele notificar (não consegui confirmar no bundle minificado), abrir
a ficha dispara um save que só reescreve o que acabou de ler — incrementando `version` e
carimbando `updatedById`/`updatedAt` com quem apenas *visualizou*. Verificar com um log
no callback e, se confirmado, suprimir a notificação durante a hidratação com um flag.

**I3 — Sem risco de localStorage.** Confirmado no `.d.ts`: a persistência em
localStorage do pacote é opt-in (`enablePersistence()`), nunca chamada. A regra do
briefing está respeitada.

---

## Ordem sugerida

1. **A1–A7** — escopo de clínica nos 8 endpoints (algumas horas, risco baixo, fecha vazamento de PHI)
2. **B1–B5** — corrigir `useBilling` contra a API real e usar `/ledger/:patientId` (o saldo R$ 0,00 é visível para o usuário hoje)
3. **D1** — corrigir a regex da auditoria (uma linha, restaura a rastreabilidade)
4. **C1, C4** — corrida de pagamento e colisão de número de fatura
5. **F4, G1, G2** — `trust proxy`, `/uploads` autenticado, filtro de upload
6. **E1–E4**, depois **C2/C3**, e por fim decidir sobre H1–H4 (ligar ou remover)
