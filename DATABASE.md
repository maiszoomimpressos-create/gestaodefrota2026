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

## O que fica para as próximas fases

Nenhuma funcionalidade operacional foi construída agora (por decisão explícita da Fase 1): manutenção, abastecimento, viagens, checklist, ocorrências, oficinas, mecânicos, ordens de serviço, GPS, telemetria, relatórios, notificações, marketplace, financeiro, integrações.

O frontend atual (`index.html`/`app.js`) ainda usa o protótipo da sessão anterior (telas de Criar Frota/Cadastrar Veículo simplificadas) — **precisa ser reescrito** nas próximas fases para consumir este novo schema (`companies`, `vehicles`, `create_company`, etc.).
