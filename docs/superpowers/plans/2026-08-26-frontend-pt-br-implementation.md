# Tradução do frontend para português do Brasil — Plano de implementação

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Traduzir a interface visual do frontend Oradent para português do Brasil, preservando backend, banco, APIs, payloads, enums e integrações.

**Architecture:** Centralizar textos gerais em `packages/web/src/i18n/pt-BR.ts` e terminologia clínica/financeira em `clinical-pt-BR.ts`, expondo catálogos por `index.ts`. Componentes usarão catálogos tipados e formatadores locais; valores internos permanecerão em inglês.

**Tech Stack:** Next.js 14 App Router, React, TypeScript, Tailwind CSS, `date-fns`, `Intl.NumberFormat`, Vitest.

**Spec:** `docs/superpowers/specs/2026-08-26-frontend-pt-br-design.md`

## Global Constraints

- O trabalho ficará limitado a `packages/web`.
- Não alterar `packages/server`, schema Prisma, rotas HTTP, payloads, enums internos, autenticação ou lógica de negócio.
- Usar português brasileiro natural e consistente.
- Manter CDT, ICD-10, NPI, SOAP e demais códigos técnicos.
- Preservar nomes próprios, e-mails, códigos de procedimentos e dados dinâmicos da API.
- Usar `lang="pt-BR"`, datas `DD/MM/AAAA`, horários locais, números `pt-BR` e moeda `R$`/BRL.
- Labels desconhecidos devem ter fallback seguro.
- Nenhum texto visível, placeholder, tooltip, aria-label, loading, erro ou estado vazio deve permanecer em inglês nas telas cobertas.

---

## Mapa de arquivos

- Criar `packages/web/src/i18n/index.ts`, `pt-BR.ts` e `clinical-pt-BR.ts`.
- Modificar `packages/web/src/lib/constants.ts`, mantendo as chaves internas e delegando labels aos catálogos.
- Modificar `packages/web/src/lib/formatters.ts` e `packages/web/src/app/layout.tsx`.
- Criar `packages/web/vitest.config.ts`, `src/i18n/i18n.test.ts` e `src/lib/formatters.test.ts`.
- Modificar `packages/web/package.json` e `package-lock.json` para testes.
- Traduzir `src/app/(auth)`, `src/app/(dashboard)`, `src/components/layout`, `dashboard`, `appointments`, `patients`, `dental-chart`, `imaging` e `billing`.

## Task 1: Base de i18n e catálogos

**Files:**
- Create: `packages/web/src/i18n/pt-BR.ts`
- Create: `packages/web/src/i18n/clinical-pt-BR.ts`
- Create: `packages/web/src/i18n/index.ts`
- Modify: `packages/web/package.json`, `package-lock.json`
- Create: `packages/web/vitest.config.ts`, `packages/web/src/i18n/i18n.test.ts`

**Interfaces:** Produz `ptBR`, `clinicalPtBR` e `t(path: string, fallback?: string): string`. Os mapas devem incluir tipos/status de consulta, faturas, claims, pagamentos, profissionais, pacientes, tratamentos, imagens, condições dentárias, superfícies e categorias CDT.

- [ ] Adicionar `vitest` e `@vitejs/plugin-react` como devDependencies, script `"test": "vitest run"` e alias `@` em `vitest.config.ts`.
- [ ] Escrever testes para labels não vazios e fallback:

```ts
it("traduz status de consulta", () => {
  expect(clinicalPtBR.appointmentStatus.COMPLETED).toBe("Concluída");
  expect(Object.values(clinicalPtBR.appointmentStatus).every(Boolean)).toBe(true);
});

it("usa fallback para chave desconhecida", () => {
  expect(t("clinical.appointmentStatus.UNKNOWN", "Desconhecida")).toBe("Desconhecida");
});
```

- [ ] Rodar `npm test -w packages/web -- src/i18n/i18n.test.ts`; confirmar falha inicial antes da implementação.
- [ ] Migrar labels visuais de `constants.ts` para os catálogos sem alterar chaves como `COMPLETED`, `PAID` ou `OWNER`.
- [ ] Implementar `t()` com caminho separado por ponto, fallback explícito e fallback humanizado para chave ausente.
- [ ] Rodar novamente o teste e confirmar sucesso.
- [ ] Commitar com `git add packages/web/package.json packages/web/vitest.config.ts packages/web/src/i18n package-lock.json && git commit -m "feat(web): add typed pt-BR translation catalogs"`.

## Task 2: Formatação brasileira e layout

**Files:**
- Modify: `packages/web/src/lib/formatters.ts`
- Create: `packages/web/src/lib/formatters.test.ts`
- Modify: `packages/web/src/app/layout.tsx`, `packages/web/src/lib/constants.ts`

**Interfaces:** Preservar as assinaturas existentes de `formatCurrency`, `formatDate`, `formatDateTime`, `formatTime`, `formatRelativeDate`, `formatPhone`, `formatAge` e `formatFileSize`.

- [ ] Escrever testes esperando `formatCurrency(1234.5) === "R$ 1.234,50"`, data brasileira e fallbacks traduzidos.
- [ ] Rodar `npm test -w packages/web -- src/lib/formatters.test.ts`; confirmar falha inicial.
- [ ] Usar `Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" })` e `date-fns/locale/pt-BR`.
- [ ] Localizar datas, horários, distância relativa, idade, números e tamanhos de arquivo; não alterar os valores de entrada.
- [ ] Definir `<html lang="pt-BR">` e manter metadata/providers.
- [ ] Rodar `npm test -w packages/web -- src/lib/formatters.test.ts` e `npm run type-check -w packages/web`; confirmar sucesso.
- [ ] Commitar com `git add packages/web/src/lib packages/web/src/app/layout.tsx && git commit -m "feat(web): localize Brazilian Portuguese formatting"`.

## Task 3: Autenticação e shell global

**Files:** `packages/web/src/app/(auth)/*`; `packages/web/src/components/layout/{Sidebar,TopBar,CommandPalette,NotificationPanel,ErrorBoundary,ThemeToggle}.tsx`.

**Interfaces:** Props, hooks, rotas, chaves localStorage e chamadas de API permanecem inalterados.

- [ ] Traduzir login/cadastro: títulos, labels, placeholders, validações, erros, botões, links e acessibilidade.
- [ ] Traduzir sidebar, top bar, perfil, logout, busca global, command palette, notificações, erro, tema e tooltips; manter `href`s.
- [ ] Rodar `npm run type-check -w packages/web && npm run lint -w packages/web`.
- [ ] Revisar `/login` e `/register` manualmente.
- [ ] Commitar com `git add packages/web/src/app/'(auth)' packages/web/src/components/layout && git commit -m "feat(web): translate auth and global navigation"`.

## Task 4: Dashboard e agenda

**Files:** `packages/web/src/app/(dashboard)/page.tsx`, `packages/web/src/components/dashboard/*.tsx`, `packages/web/src/app/(dashboard)/appointments/page.tsx`, `packages/web/src/components/appointments/*.tsx`.

**Interfaces:** Query keys, endpoints, request bodies, response types, enums e callbacks permanecem iguais.

- [ ] Traduzir indicadores, data do dia, agenda, ações rápidas, insights de IA, loading, erro e estados vazios.
- [ ] Traduzir calendário, cadeiras, modal, busca, tipos/status de consulta, conflitos, filtros e feedbacks.
- [ ] Usar labels de `clinicalPtBR` para valores vindos da API.
- [ ] Rodar type-check/lint e revisar `/` e `/appointments`, incluindo criar/editar consulta.
- [ ] Commitar com `git add packages/web/src/app/'(dashboard)'/page.tsx packages/web/src/components/dashboard packages/web/src/app/'(dashboard)'/appointments packages/web/src/components/appointments && git commit -m "feat(web): translate dashboard and appointments"`.

## Task 5: Pacientes, odontograma e imagens

**Files:** `packages/web/src/app/(dashboard)/patients/**`, `packages/web/src/components/patients/*.tsx`, `packages/web/src/components/dental-chart/*.tsx`, `packages/web/src/components/imaging/*.tsx`.

**Interfaces:** Patient IDs, tooth numbers, condition keys, image types, endpoints e payloads permanecem inalterados.

- [ ] Traduzir listagem, busca, formulário, perfil, dados médicos, seguros, abas, histórico e tratamentos.
- [ ] Traduzir legenda, condições, superfícies, popovers, periodontal, botões, tooltips e aria-labels do odontograma.
- [ ] Traduzir galeria, uploader, filtros, viewer, análise de IA, zoom, erros e estados vazios das imagens.
- [ ] Rodar type-check/lint e revisar um paciente seed, abas clínicas e edição de condição sem alterar requests.
- [ ] Commitar com `git add packages/web/src/app/'(dashboard)'/patients packages/web/src/components/patients packages/web/src/components/dental-chart packages/web/src/components/imaging && git commit -m "feat(web): translate patient clinical workflows"`.

## Task 6: Faturamento, relatórios e configurações

**Files:** `packages/web/src/app/(dashboard)/billing/page.tsx`, páginas de billing, `packages/web/src/components/billing/*.tsx`, `reports/page.tsx`, `settings/page.tsx`.

**Interfaces:** Invoice/claim/payment enums, endpoints, números e payloads permanecem inalterados.

- [ ] Traduzir faturas, pagamentos, ledger, claims, convênios, formulários, status, filtros, tabelas, modais e feedbacks.
- [ ] Exibir valores financeiros em BRL somente na apresentação, sem converter o payload.
- [ ] Traduzir relatórios, métricas, gráficos, filtros de período, produção, receita, contas a receber e retornos.
- [ ] Traduzir configurações de clínica, profissionais, cadeiras, horários, feriados, preços, seguradoras, permissões e validações.
- [ ] Rodar type-check/lint e verificar requests com valores originais.
- [ ] Commitar com `git add packages/web/src/app/'(dashboard)'/billing packages/web/src/app/'(dashboard)'/reports packages/web/src/app/'(dashboard)'/settings packages/web/src/components/billing && git commit -m "feat(web): translate billing reports and settings"`.

## Task 7: Auditoria e validação final

**Files:** Qualquer arquivo restante em `packages/web/src` apontado pela auditoria; catálogos se faltar label.

**Interfaces:** Nenhuma alteração no backend ou contratos da API.

- [ ] Buscar strings operacionais remanescentes:

```bash
grep -RInE "Welcome|Dashboard|Patients|Appointments|Billing|Settings|Search|Loading|Cancel|Save|Delete|Edit|Create|No results|Not found|Sign out|Forgot password|Today|Submit|Error|Success" packages/web/src --include='*.tsx' --include='*.ts'
```

- [ ] Revisar cada ocorrência, preservando identificadores, comentários técnicos, URLs, enums, nomes próprios e textos de terceiros.
- [ ] Comparar uniões em `src/types/index.ts` com `clinicalPtBR` e adicionar labels/fallbacks ausentes.
- [ ] Executar `npm test -w packages/web`, `npm run type-check -w packages/web`, `npm run lint -w packages/web` e `npm run build -w packages/web`; todos devem terminar com código `0`.
- [ ] Revisar manualmente `/login`, `/register`, `/`, `/patients`, `/appointments`, `/billing`, `/reports`, `/settings`, `/ai-assistant`, abas clínicas, command palette, notificações, loading, erro e estados vazios.
- [ ] Confirmar `git diff --name-only` e garantir que nenhum arquivo em `packages/server` foi alterado.
- [ ] Commitar com `git add packages/web/src && git commit -m "chore(web): complete pt-BR translation audit"`.

## Handoff de deploy

Após a validação local, publicar somente o frontend:

```bash
cd /home/deploy/apps/Oradent
git pull --ff-only
docker compose build web
docker compose up -d web
curl -fsS http://127.0.0.1:3000
```

Não executar migrations, seed ou comandos do backend durante o rollout da tradução visual.
