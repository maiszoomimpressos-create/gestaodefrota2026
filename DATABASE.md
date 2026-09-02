# FleetControl — Fundação do Banco (Fase 1)

Projeto Supabase: **fleetcontrol** (`qqtrhcyrlfkuwrtogbmk`, região São Paulo)
Dashboard: https://supabase.com/dashboard/project/qqtrhcyrlfkuwrtogbmk

## Arquitetura

Sem servidor de aplicação próprio. O "backend" é o Postgres do Supabase:

- **PostgREST** expõe automaticamente uma API REST para cada tabela (`/rest/v1/<tabela>`).
- **RPC** expõe funções Postgres como endpoints (`/rest/v1/rpc/<funcao>`).
- **RLS (Row Level Security)** garante isolamento multiempresa **no banco**, não no frontend — mesmo uma chamada direta à API sem passar pelo app respeita as mesmas regras.
- **Supabase Auth** cuida de cadastro, login, sessão (JWT) e senha (hash, nunca texto puro).

## Tabelas

| Tabela | Descrição |
|---|---|
| `roles` | Catálogo de papéis (extensível). Seed: MASTER_ADMIN, COMPANY_OWNER, COMPANY_ADMIN, FLEET_MANAGER, SUPERVISOR, DRIVER, EMPLOYEE. |
| `users` | Espelho de `auth.users` (pessoa física). Sincronizado automaticamente via trigger no cadastro. |
| `companies` | Pessoa jurídica. Campo `document` = CNPJ (único quando presente). |
| `company_members` | Vínculo N:N usuário↔empresa com papel. Um usuário pode pertencer a várias empresas (uma linha por empresa). |
| `platform_admins` | MASTER_ADMIN — administradores globais da plataforma (não vinculados a empresa). |
| `vehicles` | Corporativo (`company_id`) OU pessoal (`personal_owner_user_id`) — nunca os dois (constraint XOR). Placa única por dono. |
| `vehicle_assignments` | Histórico de uso do veículo. Nunca apaga o registro anterior — uma nova atribuição encerra a anterior (`status='ended'`) e cria uma nova ativa. Só pode existir 1 atribuição `active` por veículo. |
| `plans` | Planos: PERSONAL_FREE/PLUS/PRO, COMPANY_FREE/BUSINESS/PRO/ENTERPRISE. |
| `plan_limits` | Limites por plano e recurso (`vehicles`, `users`) — vêm do banco, não do código. |
| `audit_logs` | Log de INSERT/UPDATE/DELETE em companies, company_members, vehicles, vehicle_assignments (dados antes/depois em JSON). |
| `integration_settings` | Chaves de integrações externas (hoje: AUTOSAVE), gerenciadas em Admin → APIs. Só MASTER_ADMIN lê/escreve. |
| `whatsapp_notification_recipients` | Número de WhatsApp por tipo de aviso (`type_key`), gerenciado em Admin → Comunicação → WhatsApp. Lista dirigida por dado — tipo de aviso novo é uma linha nova, não código novo. Só MASTER_ADMIN lê/escreve. |

## Relacionamentos principais

```
auth.users 1—1 public.users 1—N company_members N—1 companies
companies 1—N vehicles (corporativo)
users 1—N vehicles (pessoal)
vehicles 1—N vehicle_assignments N—1 users
companies 1—N vehicle_assignments
plans 1—N plan_limits
users/companies N—1 plans (assinatura atual)
```

## Funções RPC

- `create_company(_name, _legal_name, _document, _email, _phone, _plan_code)` — cria a empresa e já vincula quem chamou como `COMPANY_OWNER`, atomicamente.
- `assign_vehicle(_vehicle_id, _user_id, _reason, _odometer_start)` — encerra a atribuição ativa atual (se houver) e cria uma nova, mantendo histórico. Valida permissão (dono/gestor da empresa ou dono pessoal) e que o usuário atribuído pertence à empresa do veículo.

## Segurança (RLS) — resumo

- Usuário só vê/edita o próprio registro em `users`.
- Empresa só é visível para seus membros ativos (ou MASTER_ADMIN).
- Veículo corporativo: visível para membros da empresa; editável por OWNER/ADMIN/FLEET_MANAGER.
- Veículo pessoal: visível/editável apenas pelo dono.
- `plan_limits`/`plans`/`roles`: leitura livre para autenticados (não editável por clientes).
- Toda checagem está no banco (RLS + validações dentro das funções RPC `security definer`, que **não** herdam RLS automaticamente e por isso fazem a checagem de permissão manualmente).

## Planos e limites (seed)

| Plano | Tipo | Veículos | Usuários |
|---|---|---|---|
| Personal Free | PERSONAL | 2 | — |
| Personal Plus | PERSONAL | 5 | — |
| Personal Pro | PERSONAL | 10 | — |
| Company Free | COMPANY | 5 | 3 |
| Company Business | COMPANY | 50 | 20 |
| Company Pro | COMPANY | 200 | 100 |
| Company Enterprise | COMPANY | personalizado (desabilitado por padrão) | personalizado |

## Integração — busca de placa via AUTOSAVE

`supabase/functions/lookup-plate` é uma Edge Function que faz proxy entre o
frontend e a API de parceiros do AUTOSAVE (`GET /api/v1/vehicles?plate=`).
Existe porque o FleetControl não tem servidor de aplicação próprio — sem
esse proxy, a `x-api-key` do AUTOSAVE ficaria exposta no navegador. Usada em
"Cadastrar Veículo": digitou a placa, clicou "Buscar", marca/modelo/ano/
cor/combustível/chassi vêm preenchidos.

**`integration_settings`** (nova tabela) — guarda a chave em vez de um
secret de CLI: `name` (ex.: `AUTOSAVE`), `api_key`, `updated_by`,
`updated_at`. RLS: só quem está em `platform_admins` com papel
`MASTER_ADMIN` lê/escreve (mesma checagem usada no resto do schema
administrativo). A function `lookup-plate` lê essa linha com o service role
(`SUPABASE_SERVICE_ROLE_KEY`, injetado automaticamente pelo runtime das
Edge Functions — não precisa configurar nada extra), então ignora a RLS de
propósito: ela não roda com sessão de usuário.

Gerenciada na tela **Admin → APIs** (`adminPageApis` / `autosaveKeyForm` em
`app.js`): campo mascarado com olho pra mostrar/esconder, igual ao padrão já
usado nos campos de senha do login/cadastro. Colar uma chave nova ali e
salvar já vale pra próxima busca de placa — sem redeploy da function, sem
CLI.

A key em si é uma chave de parceiro do AUTOSAVE (recurso `vehicles`, nome
"FleetControl", campos: brand/model/year/color/type/fuel_type/chassis_number)
— revogável a qualquer momento em `/api-docs` no AUTOSAVE. Revogar lá torna
a busca de placa aqui indisponível (a tela volta pra preenchimento manual)
até uma chave nova ser colada em Admin → APIs.

Existe uma **segunda chave** (linha `AUTOSAVE_CUSTOMERS`, mesma tabela e
tela), recurso `customers` — o AUTOSAVE exige uma chave por recurso, não dá
pra unificar isso do lado de lá. Dá acesso a nome/CPF-CNPJ/endereço/CNH, no
mesmo nível que o Mai Drive já tem pra sincronizar motorista. Guardada e
gerenciável, mas **ainda sem tela no FleetControl que a consuma** — nenhum
fluxo hoje busca cliente/motorista no AUTOSAVE (a diferença do `vehicles`,
que já tem o botão "Buscar" na placa).

## Admin → Comunicação — número de WhatsApp por tipo de aviso

`whatsapp_notification_recipients`: uma linha por tipo de aviso (`type_key`),
cada uma com seu próprio número de destino. Painel em Admin → Comunicação →
aba WhatsApp — lista vem do banco, então um tipo de aviso novo é só um
`insert`, nunca precisa mexer em `app.js`/`index.html`.

Existe uma linha hoje, `campo_novo_detectado` — reservada pro dia em que a
detecção de campo novo vindo do AUTOSAVE for implementada (ainda não é: essa
tabela guarda só o *número que vai receber* o aviso, a lógica de detectar
"isso é um campo que a gente não conhece" e realmente disparar a mensagem
ainda não existe). Envio, quando existir, via Boot Whats — reaproveitando a
mesma conexão ("Maiszap") que o AUTOSAVE já usa pro alerta de saldo, não uma
conexão nova.

## Fase 2 — Conta pessoal, empresa e contextos

Frontend reescrito para trabalhar com dois **contextos** explícitos, nunca
decididos automaticamente pelo código:

- **Minha Conta (pessoal)** — ambiente inicial, sempre, a cada login. Veículo
  cadastrado aqui vira `personal_owner_user_id = auth.uid()`.
- **Empresa X** — escolhida no seletor de contexto da sidebar (alimentado por
  `company_members` do usuário logado). Veículo cadastrado aqui vira
  `company_id = <empresa selecionada>`.

O antigo comportamento (decidir pessoal x corporativo automaticamente
baseado em o usuário administrar ou não alguma empresa) foi removido —
`registerVehicleForm` agora só olha o contexto selecionado no momento.

Mudanças no banco (aplicadas diretamente via Management API, sem arquivo de
migração formal — mesmo padrão usado no restante do schema desta fase):

- **`vehicles_delete`** (nova política RLS): faltava por completo — sem ela
  o `DELETE` era bloqueado por padrão pelo RLS mesmo para o dono do veículo.
  Mesma regra de autorização da `vehicles_update` (dono pessoal, ou
  OWNER/ADMIN/FLEET_MANAGER da empresa, ou MASTER_ADMIN).
- **`companies_document_unique`** (novo índice único parcial em
  `companies.document`, quando não nulo): o próprio texto deste documento já
  descrevia essa regra, mas o índice nunca tinha sido criado de fato.

Formulários revisados para usar só campos que existem nas tabelas:

- **Empresa** (`pageCreateCompany` / `createCompanyForm`): `name`,
  `legal_name`, `document` (CNPJ, com máscara), `email`, `phone`. Removidos
  campos que só existiam na tela e nunca eram salvos (tipo de frota,
  responsável, base/filial, observações).
- **Veículo** (`pageRegisterVehicle` / `registerVehicleForm`, agora também
  usado para editar): removido campo fantasma "Proprietário" (a posse é
  sempre implícita via `personal_owner_user_id`/`company_id`, nunca um texto
  livre) e "Observações" (não existe coluna correspondente). O campo antigo
  "Chassi (RENAVAM)" foi corrigido para dois campos reais e distintos:
  `chassis` e `renavam`.

Página nova **Veículos** (`pageVehicles`): lista os veículos do contexto
atual (filtrado explicitamente por `personal_owner_user_id` ou `company_id`
no frontend, além do RLS no banco), com editar/excluir por card. "Adicionar
Veículo" e "Editar Veículo" reaproveitam a mesma página/formulário
(`editingVehicleId` no frontend decide entre `insert` e `update`).

Sem RPC nova nesta fase — inserção/edição/exclusão de veículo e leitura de
`company_members` são feitas direto via PostgREST, protegidas só por RLS
(a criação de empresa continua usando a RPC `create_company` da Fase 1, que
já cobre "criar empresa + vincular COMPANY_OWNER" atomicamente).

## O que fica para as próximas fases

Nenhuma funcionalidade operacional foi construída ainda: manutenção,
abastecimento, viagens, checklist, ocorrências, oficinas, mecânicos, ordens
de serviço, GPS, telemetria, relatórios, notificações, marketplace,
financeiro/assinaturas. Também fica para depois: upgrade de plano (o limite
de 2 veículos do Personal Free é fixo nesta fase, mesmo a arquitetura já
suportando outros planos via `plans`/`plan_limits`) e o catálogo
administrável (pesquisa + autocomplete) mencionado como direção futura para
serviços/peças/categorias — nenhum módulo que dependa disso foi construído
ainda, só a decisão de não usar listas fixas hardcoded quando esses módulos
chegarem.

### Diretriz para o "cadastro completo" — identidade x papéis (não implementado ainda)

Confirmado que `users` **não tem e nunca deve ganhar** um campo único de
classificação (algo como `user_type = PARTICULAR/EMPREGADO/EMPRESÁRIO`).
A pessoa é só **usuário**; papéis e vínculos vêm de onde já vêm hoje —
`company_members` (um usuário pode ter uma linha lá por empresa, cada uma
com seu `role_id`, sem exclusividade entre elas) e posse de veículo
(`vehicles.personal_owner_user_id` x `company_id`). Um mesmo usuário já
pode, ao mesmo tempo, ter carros pessoais, ser `DRIVER` na Empresa A e
`COMPANY_OWNER` na Empresa B — isso é a arquitetura atual, não precisa de
tabela nova.

Quando o "cadastro completo" for implementado (fase futura), a ideia é uma
tela pós-primeiro-login tipo "Vamos configurar sua conta", com checkboxes
de múltipla escolha e não excludentes (ex.: "Quero controlar meus veículos
pessoais" / "Trabalho com veículos de uma empresa" / "Sou responsável por
uma empresa/frota" / "Quero cadastrar minha empresa"). É só personalização
de UI (quais atalhos aparecem primeiro) — **não deve gravar permissão
nenhuma nem travar o usuário**; ele continua podendo fazer tudo (criar
empresa, cadastrar veículo pessoal etc.) independente do que marcar ali.
Avaliado e adiado por decisão do usuário em 02/09/2026 — não há problema
real que essa tela resolva hoje.

## Admin > Equipe — permissão por tela + Área Restrita (02/09/2026)

A partir de agora, cada tela nova do **admin** (não do app do usuário) deve
ganhar um controle de permissão próprio — decisão do usuário. Implementado
com o mínimo de estrutura nova:

- **`admin_permissions`** (nova tabela): `(user_id, feature)`, chave única.
  Presença da linha = permissão concedida; não existe "desmarcada", só
  existe ou não existe. `feature` é um código livre (`dashboard`, `plans`,
  `apis`, `team`...) — toda tela nova do admin só precisa entrar na lista
  `ADMIN_FEATURES` do `app.js` pra já poder ser concedida/revogada aqui,
  sem migração nova.
- **`platform_admins`** continua sendo "faz parte da equipe da plataforma"
  (inalterado); `admin_permissions` decide **quais telas** essa pessoa vê
  dentro do admin.
- RLS: qualquer membro da equipe lê tudo (`admin_permissions_select`,
  `platform_admins_select` — precisa pra montar a tela de Equipe). Só quem
  **já tem a permissão `team`** consegue conceder/revogar permissão de
  outros ou adicionar/remover gente da equipe (`admin_permissions_insert`/
  `_delete`, `platform_admins_insert`/`_delete`, via a função
  `has_admin_permission(_feature)`). Bootstrap: todo `platform_admins`
  existente na hora da migração recebeu automaticamente as 4 permissões
  atuais, senão ninguém — nem o admin original — conseguiria abrir a tela
  de Equipe pra conceder a primeira permissão.
- **Adicionar à equipe** exige que a pessoa **já tenha conta** no
  FleetControl (cadastro comum); o admin só concede acesso administrativo
  a uma conta existente — não cria conta nova nem envia convite por e-mail.
- **Área Restrita**: seção própria na sidebar do admin (hoje só "Equipe",
  mas pensada pra crescer). Antes de entrar em qualquer item dela, pede a
  senha de novo (`supabase.auth.signInWithPassword` com o e-mail da sessão
  atual) — confirmado uma vez por sessão, em memória, nunca persistido.
  Isso é só fricção de UX; a barreira de segurança de verdade é a RLS acima
  (testado direto: quem não tem a permissão `team` recebe 403 tentando
  gravar em `admin_permissions`/`platform_admins`, mesmo sabendo a URL certa
  da API — a UI escondida não é o que impede).

Testado ponta a ponta com 4 contas reais (líder com `team`, membro sem
`team`, convidado, estranho) direto contra o banco: leitura liberada pra
qualquer membro da equipe, escrita (conceder/revogar/adicionar/remover)
bloqueada por RLS pra quem não tem `team`, e alguém de fora da equipe não
enxerga nem lê nada dessas duas tabelas. Sem resíduo de teste no banco.
