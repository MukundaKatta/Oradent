# Tradução do frontend para português do Brasil

## Objetivo

Traduzir toda a interface visual do frontend do Oradent para português do Brasil, preservando integralmente o backend, o banco de dados, as APIs, os payloads, os enums internos e as integrações existentes.

## Escopo

O trabalho ficará limitado a `packages/web`. Serão traduzidos textos visíveis e auxiliares das telas de autenticação, dashboard, pacientes, agenda, faturamento, relatórios, configurações, odontograma, imagens, command palette, notificações, tooltips, placeholders, mensagens de erro, estados de carregamento e estados vazios.

Não serão alterados `packages/server`, o schema Prisma, as rotas HTTP, os nomes de propriedades, os valores de enums enviados à API, a autenticação ou a lógica de negócio.

## Arquitetura

Os textos serão centralizados em catálogos tipados dentro de `packages/web/src/i18n/`:

- `pt-BR.ts`: textos gerais da interface, navegação, ações e mensagens.
- `clinical-pt-BR.ts`: terminologia clínica e financeira, incluindo consultas, tratamentos, condições dentárias, superfícies, faturas, claims, funções e categorias.
- `index.ts`: ponto de entrada e acesso tipado aos catálogos.

Os valores internos continuarão em inglês. Por exemplo, `COMPLETED` continuará sendo enviado e recebido pela API, mas será exibido como `Concluída` por meio do catálogo visual.

## Terminologia e localização

- Usar português brasileiro natural e consistente.
- Manter siglas e códigos técnicos como CDT, ICD-10, NPI e SOAP.
- Usar “paciente”, “profissional”, “consulta”, “tratamento”, “fatura” e “convênio”.
- Usar “odontograma”, “superfície”, “vestibular”, “lingual”, “mesial” e “distal”.
- Usar `lang="pt-BR"` no layout principal.
- Formatar datas como `DD/MM/AAAA`, horários em padrão local, números em `pt-BR` e valores como `R$`/BRL.
- Preservar nomes próprios, e-mails, códigos de procedimentos e dados dinâmicos da API.
- Fornecer fallback seguro para labels desconhecidos.

## Formatação

Os formatadores existentes em `packages/web/src/lib/formatters.ts` serão ajustados somente na apresentação:

- moeda com `Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" })`;
- datas e distâncias relativas com locale `pt-BR` do `date-fns`;
- horários no padrão brasileiro;
- números e tamanhos de arquivo localizados.

Essas funções não modificarão os valores de entrada nem os dados enviados ao backend.

## Fluxo de dados

```text
API/backend em inglês
        ↓
tipos e enums internos preservados
        ↓
catálogo pt-BR converte labels
        ↓
interface exibe português brasileiro
```

Constantes de labels atualmente em `packages/web/src/lib/constants.ts` serão reorganizadas ou substituídas por acesso aos catálogos sem alterar as chaves originais.

## Critérios de aceite

1. Nenhum texto operacional em inglês permanece nas telas principais.
2. Login, cadastro, dashboard, pacientes, agenda, faturamento, relatórios, configurações, odontograma e imagens estão em português brasileiro.
3. Placeholders, tooltips, aria-labels, loading, erros e estados vazios também estão traduzidos.
4. A API continua usando os mesmos endpoints, payloads, enums e nomes de propriedades.
5. O backend não possui alterações.
6. Datas, horários, números e moeda seguem o padrão brasileiro.
7. Catálogos e formatadores possuem testes unitários.
8. `type-check`, `lint` e `build` do frontend passam.
9. As rotas principais são revisadas manualmente após a implementação.

## Fora de escopo

- Seletor de idioma ou suporte a múltiplos idiomas.
- Tradução do backend, Swagger, logs, banco ou contratos da API.
- Alteração dos dados seed ou dos códigos clínicos.
- Revisão de conteúdo clínico além da tradução visual.
