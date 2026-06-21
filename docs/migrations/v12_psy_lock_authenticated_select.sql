-- =============================================================================
-- Migration v12: Lock SELECT em tabelas sensíveis psy_*
-- =============================================================================
--
-- Reforça o invariante de anonimato: nenhum role `authenticated` (sessão de
-- utilizador normal do Supabase Auth) consegue SELECT directo a respostas
-- individuais. Apenas o service role lê estas tabelas, e fá-lo no backend
-- para devolver SÓ agregados gated (N>=5) ao cliente.
--
-- Tabelas LOCKED para authenticated:
--   - psy_responses
--   - psy_answers
--   - psy_dispatch_tokens
--
-- Tabelas que podem ter SELECT por authenticated (definição do instrumento,
-- não revelam respostas):
--   - psy_instruments
--   - psy_dimensions
--   - psy_questions
--   - psy_thresholds
--   - psy_action_plans
--   - psy_campaigns
--   - psy_campaign_areas
--
-- Migração aditiva, idempotente. Aplica REVOKE (sem erro se já revogado) e
-- DROP POLICY IF EXISTS (sem erro se policy não existir).
--
-- Como aplicar: Supabase Studio > SQL Editor > este ficheiro > Run.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1. REVOKE ALL para o role `authenticated` nas três tabelas sensíveis.
--    Cobre SELECT, INSERT, UPDATE, DELETE, REFERENCES, TRIGGER e TRUNCATE.
--    TRUNCATE é particularmente importante revogar: apaga todas as linhas
--    sem passar pelas policies RLS. Service role bypassa grants e RLS, não
--    é afectado.
-- -----------------------------------------------------------------------------

REVOKE ALL ON public.psy_responses       FROM authenticated;
REVOKE ALL ON public.psy_answers         FROM authenticated;
REVOKE ALL ON public.psy_dispatch_tokens FROM authenticated;

-- -----------------------------------------------------------------------------
-- 2. DROP POLICY de qualquer policy que tenha sido aplicada para o role
--    `authenticated` nestas tabelas (defesa em profundidade). O bloco de
--    policies da v11 estava comentado, mas pode ter sido descomentado.
-- -----------------------------------------------------------------------------

DROP POLICY IF EXISTS psy_responses_tenant_select       ON public.psy_responses;
DROP POLICY IF EXISTS psy_responses_tenant_all          ON public.psy_responses;
DROP POLICY IF EXISTS psy_answers_tenant_select         ON public.psy_answers;
DROP POLICY IF EXISTS psy_answers_tenant_all            ON public.psy_answers;
DROP POLICY IF EXISTS psy_dispatch_tokens_tenant_select ON public.psy_dispatch_tokens;
DROP POLICY IF EXISTS psy_dispatch_tokens_tenant_all    ON public.psy_dispatch_tokens;

-- -----------------------------------------------------------------------------
-- 3. Garantir que a RLS continua habilitada nestas três tabelas (idempotente).
-- -----------------------------------------------------------------------------

ALTER TABLE public.psy_responses       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.psy_answers         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.psy_dispatch_tokens ENABLE ROW LEVEL SECURITY;

-- =============================================================================
-- Queries de validação (correr depois de aplicar)
-- =============================================================================

-- V.1: confirmar que `authenticated` NÃO tem SELECT/INSERT/UPDATE/DELETE em
-- nenhuma das três tabelas. Esperado: 0 linhas.
SELECT grantee, table_name, privilege_type
FROM information_schema.role_table_grants
WHERE table_schema = 'public'
  AND table_name IN ('psy_responses', 'psy_answers', 'psy_dispatch_tokens')
  AND grantee = 'authenticated'
  AND privilege_type IN ('SELECT', 'INSERT', 'UPDATE', 'DELETE');

-- V.2: confirmar que NÃO há policies para o role `authenticated` nas três
-- tabelas. Esperado: 0 linhas.
SELECT pol.polname,
       cls.relname AS table_name,
       pol.polroles::regrole[] AS roles
FROM pg_policy pol
JOIN pg_class  cls ON cls.oid = pol.polrelid
JOIN pg_namespace ns ON ns.oid = cls.relnamespace
WHERE ns.nspname = 'public'
  AND cls.relname IN ('psy_responses', 'psy_answers', 'psy_dispatch_tokens')
  AND 'authenticated'::regrole = ANY(pol.polroles);

-- V.3: confirmar RLS ainda habilitada nas três tabelas. Esperado:
--   psy_answers          | t
--   psy_dispatch_tokens  | t
--   psy_responses        | t
SELECT tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename IN ('psy_responses', 'psy_answers', 'psy_dispatch_tokens')
ORDER BY tablename;

-- V.4: confirmar que `authenticated` AINDA TEM SELECT nas tabelas de
-- definição do instrumento (estas podem ser lidas para mostrar perguntas
-- ao admin). Pode haver 0 linhas se o Supabase tiver revogado por defeito,
-- ou várias linhas, ambos OK. Se 0 e for preciso, conceder explicitamente:
--   GRANT SELECT ON public.psy_dimensions TO authenticated;
SELECT grantee, table_name, privilege_type
FROM information_schema.role_table_grants
WHERE table_schema = 'public'
  AND table_name IN (
      'psy_instruments', 'psy_dimensions', 'psy_questions',
      'psy_thresholds', 'psy_action_plans', 'psy_campaigns',
      'psy_campaign_areas'
  )
  AND grantee = 'authenticated'
  AND privilege_type = 'SELECT'
ORDER BY table_name;

-- =============================================================================
-- ROLLBACK (não executar a menos que seja preciso desfazer este bloqueio,
-- por exemplo para debug em ambiente de desenvolvimento isolado)
-- =============================================================================
--
-- GRANT SELECT ON public.psy_responses       TO authenticated;
-- GRANT SELECT ON public.psy_answers         TO authenticated;
-- GRANT SELECT ON public.psy_dispatch_tokens TO authenticated;
-- (NÃO re-conceder INSERT/UPDATE/DELETE: ainda assim viola a invariante A1.)
-- =============================================================================
