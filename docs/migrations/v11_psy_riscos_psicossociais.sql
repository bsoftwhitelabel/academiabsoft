-- =============================================================================
-- Migration v11: Módulo Saúde Mental, riscos psicossociais NR-1, Modelo A
-- =============================================================================
--
-- Cria 10 tabelas com prefixo `psy_*` para o módulo de avaliação de riscos
-- psicossociais. Migração ADITIVA e IDEMPOTENTE (CREATE TABLE IF NOT EXISTS,
-- CREATE INDEX IF NOT EXISTS). Não toca nas tabelas existentes.
--
-- INVARIANTES DE ANONIMATO (rules/bsoft/anonimato):
--   1. psy_responses NÃO tem FK para psy_dispatch_tokens, nem para tabela
--      com identidade (users, trainees, trainers, client_orgs como pessoa).
--   2. psy_responses NÃO tem coluna IP, userAgent, email, ou qualquer ID
--      directo ou indirecto de pessoa.
--   3. psy_dispatch_tokens NÃO tem coluna IP nem userAgent.
--   4. Token é marcado usado em psy_dispatch_tokens.estado='usado' SEM que
--      o tokenId seja gravado na resposta.
--   5. Gating N>=5 será aplicado nas queries de agregação na camada de app.
--
-- Como aplicar: Supabase Studio > SQL Editor > este ficheiro > Run.
-- ESPERAR confirmação antes de prosseguir com endpoints Hono ou UI.
-- =============================================================================

-- =============================================================================
-- 1. psy_instruments — definição do instrumento (NR-1 Modelo A, versionado)
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.psy_instruments (
    id                    text        PRIMARY KEY,
    "tenantId"            text        NOT NULL REFERENCES public.tenants(id) ON DELETE RESTRICT,
    versao                text        NOT NULL,
    estado                text        NOT NULL DEFAULT 'rascunho',
    etiqueta_validacao    text        NOT NULL DEFAULT 'em validação',
    "criadoPor"           text        REFERENCES public.users(id) ON DELETE SET NULL,
    "criadoEm"            timestamp without time zone NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS psy_instruments_tenant_idx
    ON public.psy_instruments ("tenantId");

-- =============================================================================
-- 2. psy_dimensions — dimensões avaliadas, agrupadas em blocos/grupos
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.psy_dimensions (
    id              text     PRIMARY KEY,
    "instrumentId"  text     NOT NULL REFERENCES public.psy_instruments(id) ON DELETE CASCADE,
    codigo          text     NOT NULL,
    nome            text     NOT NULL,
    bloco           text,
    grupo           text     NOT NULL CHECK (grupo IN ('Essencial', 'Complementar', 'ComplementarII')),
    tipo            text     NOT NULL CHECK (tipo IN ('Risco', 'Protetiva')),
    impacto         integer  NOT NULL CHECK (impacto IN (2, 3, 4)),
    ordem           integer  NOT NULL DEFAULT 0
);
CREATE UNIQUE INDEX IF NOT EXISTS psy_dimensions_instrument_codigo_uq
    ON public.psy_dimensions ("instrumentId", codigo);

-- =============================================================================
-- 3. psy_questions — perguntas dentro de cada dimensão
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.psy_questions (
    id             text     PRIMARY KEY,
    "dimensionId"  text     NOT NULL REFERENCES public.psy_dimensions(id) ON DELETE CASCADE,
    codigo         text     NOT NULL,
    texto          text     NOT NULL,
    direcao        text     NOT NULL CHECK (direcao IN ('Direta', 'Inversa')),
    ordem          integer  NOT NULL DEFAULT 0
);
CREATE UNIQUE INDEX IF NOT EXISTS psy_questions_dimension_codigo_uq
    ON public.psy_questions ("dimensionId", codigo);

-- =============================================================================
-- 4. psy_thresholds — limiares de classificação por instrumento
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.psy_thresholds (
    id              text     PRIMARY KEY,
    "instrumentId"  text     NOT NULL REFERENCES public.psy_instruments(id) ON DELETE CASCADE,
    tipo            text     NOT NULL CHECK (tipo IN ('classificacao', 'igrp', 'criticidade')),
    chave           text     NOT NULL,
    valor           numeric  NOT NULL
);
CREATE INDEX IF NOT EXISTS psy_thresholds_instrument_idx
    ON public.psy_thresholds ("instrumentId", tipo);

-- =============================================================================
-- 5. psy_action_plans — planos de acção por dimensão x classificação
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.psy_action_plans (
    id              text  PRIMARY KEY,
    "dimensionId"   text  NOT NULL REFERENCES public.psy_dimensions(id) ON DELETE CASCADE,
    classificacao   text  NOT NULL,
    texto           text  NOT NULL
);
CREATE INDEX IF NOT EXISTS psy_action_plans_dimension_idx
    ON public.psy_action_plans ("dimensionId");

-- =============================================================================
-- 6. psy_campaigns — campanhas de avaliação por cliente
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.psy_campaigns (
    id                    text     PRIMARY KEY,
    "tenantId"            text     NOT NULL REFERENCES public.tenants(id) ON DELETE RESTRICT,
    "clientOrgId"         text     NOT NULL REFERENCES public.client_orgs(id) ON DELETE RESTRICT,
    "instrumentId"        text     NOT NULL REFERENCES public.psy_instruments(id) ON DELETE RESTRICT,
    comprimento           text     NOT NULL CHECK (comprimento IN ('curto', 'medio', 'longo')),
    inicio                date,
    fim                   date,
    "metaAmostragemPct"   integer  CHECK ("metaAmostragemPct" BETWEEN 0 AND 100),
    estado                text     NOT NULL DEFAULT 'rascunho'
                                   CHECK (estado IN ('rascunho', 'em_curso', 'encerrada')),
    "criadoEm"            timestamp without time zone NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS psy_campaigns_tenant_idx
    ON public.psy_campaigns ("tenantId");
CREATE INDEX IF NOT EXISTS psy_campaigns_client_idx
    ON public.psy_campaigns ("clientOrgId");

-- =============================================================================
-- 7. psy_campaign_areas — áreas por campanha (denominador para amostragem)
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.psy_campaign_areas (
    id            text     PRIMARY KEY,
    "campaignId"  text     NOT NULL REFERENCES public.psy_campaigns(id) ON DELETE CASCADE,
    area          text     NOT NULL,
    esperados     integer  NOT NULL CHECK (esperados >= 0)
);
CREATE UNIQUE INDEX IF NOT EXISTS psy_campaign_areas_campaign_area_uq
    ON public.psy_campaign_areas ("campaignId", area);

-- =============================================================================
-- 8. psy_dispatch_tokens — tokens públicos por área. SEM IP. SEM userAgent.
-- =============================================================================
-- emailTemp: anulável; deve ser apagado (UPDATE ... SET "emailTemp" = NULL)
-- pela camada de aplicação assim que o convite for disparado com sucesso.
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.psy_dispatch_tokens (
    id            text     PRIMARY KEY,
    "campaignId"  text     NOT NULL REFERENCES public.psy_campaigns(id) ON DELETE CASCADE,
    token         text     NOT NULL UNIQUE CHECK (length(token) >= 32),
    "areaId"      text     NOT NULL REFERENCES public.psy_campaign_areas(id) ON DELETE CASCADE,
    estado        text     NOT NULL DEFAULT 'pendente'
                           CHECK (estado IN ('pendente', 'enviado', 'usado')),
    "emailTemp"   text,
    "expiraEm"    timestamp without time zone,
    "usadoEm"     timestamp without time zone
);
CREATE INDEX IF NOT EXISTS psy_dispatch_tokens_campaign_idx
    ON public.psy_dispatch_tokens ("campaignId");
CREATE INDEX IF NOT EXISTS psy_dispatch_tokens_area_idx
    ON public.psy_dispatch_tokens ("areaId");

-- =============================================================================
-- 9. psy_responses — respostas anonimizadas
-- =============================================================================
-- INVARIANTE DE ANONIMATO: esta tabela NÃO tem coluna nem FK que ligue
-- uma resposta ao token, à pessoa, ou ao email. NUNCA adicionar
-- "tokenId", "dispatchTokenId", "userId", "traineeId", "respondentIp",
-- "respondentUserAgent", "email", ou qualquer outro identificador.
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.psy_responses (
    id                  text  PRIMARY KEY,
    "campaignId"        text  NOT NULL REFERENCES public.psy_campaigns(id) ON DELETE RESTRICT,
    "areaId"            text  NOT NULL REFERENCES public.psy_campaign_areas(id) ON DELETE RESTRICT,
    "instrumentVersao"  text  NOT NULL,
    "submetidoEm"       timestamp without time zone NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS psy_responses_campaign_idx
    ON public.psy_responses ("campaignId");
CREATE INDEX IF NOT EXISTS psy_responses_area_idx
    ON public.psy_responses ("areaId");

-- =============================================================================
-- 10. psy_answers — valores individuais 1 a 5 por pergunta
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.psy_answers (
    id            text     PRIMARY KEY,
    "responseId"  text     NOT NULL REFERENCES public.psy_responses(id) ON DELETE CASCADE,
    "questionId"  text     NOT NULL REFERENCES public.psy_questions(id) ON DELETE RESTRICT,
    valor         integer  NOT NULL CHECK (valor BETWEEN 1 AND 5)
);
CREATE UNIQUE INDEX IF NOT EXISTS psy_answers_response_question_uq
    ON public.psy_answers ("responseId", "questionId");

-- =============================================================================
-- HARDENING (R1, R4, R5): defesa em profundidade ao nível da BD.
-- Aplicado antes do RLS para que as invariantes sejam estruturais, não
-- dependentes apenas das policies.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- R1: truncar à hora os timestamps que podem correlacionar token e resposta.
-- Aplicado ao nível da BD via trigger BEFORE, garantido mesmo se a aplicação
-- (ou um cliente SQL directo) inserir/actualizar com precisão de microssegundos.
-- Escolhido trigger em vez de coluna gerada para evitar coluna "raw" adicional
-- e para cobrir UPDATE em psy_dispatch_tokens.usadoEm.
--
-- Purga dos tokens usados: NÃO automatizada nesta migração. Será feita no
-- fecho da campanha (ex: UPDATE psy_dispatch_tokens SET "emailTemp"=NULL ...
-- ou DELETE de tokens usados) pela camada de aplicação ou job dedicado.
-- -----------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.psy_trunc_hour_submetido_em()
RETURNS trigger AS $$
BEGIN
  IF NEW."submetidoEm" IS NOT NULL THEN
    NEW."submetidoEm" := date_trunc('hour', NEW."submetidoEm");
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS psy_responses_trunc_submetido_em ON public.psy_responses;
CREATE TRIGGER psy_responses_trunc_submetido_em
  BEFORE INSERT ON public.psy_responses
  FOR EACH ROW EXECUTE FUNCTION public.psy_trunc_hour_submetido_em();

CREATE OR REPLACE FUNCTION public.psy_trunc_hour_usado_em()
RETURNS trigger AS $$
BEGIN
  IF NEW."usadoEm" IS NOT NULL THEN
    NEW."usadoEm" := date_trunc('hour', NEW."usadoEm");
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS psy_dispatch_tokens_trunc_usado_em ON public.psy_dispatch_tokens;
CREATE TRIGGER psy_dispatch_tokens_trunc_usado_em
  BEFORE INSERT OR UPDATE ON public.psy_dispatch_tokens
  FOR EACH ROW EXECUTE FUNCTION public.psy_trunc_hour_usado_em();

-- -----------------------------------------------------------------------------
-- R4: garantir comprimento mínimo do token. O CHECK inline já está em
-- CREATE TABLE acima (para BDs novas). Este bloco garante o CHECK em BDs
-- onde a tabela já foi criada antes deste hardening (idempotente).
-- -----------------------------------------------------------------------------
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'psy_dispatch_tokens_token_min_length'
  ) THEN
    ALTER TABLE public.psy_dispatch_tokens
      ADD CONSTRAINT psy_dispatch_tokens_token_min_length
      CHECK (length(token) >= 32);
  END IF;
END $$;

-- -----------------------------------------------------------------------------
-- R5: bloqueio explícito de escritas no role `authenticated` para
-- psy_responses e psy_answers. As policies abaixo NÃO definem INSERT/UPDATE/
-- DELETE para authenticated (RLS deny-by-default bloqueia o que não tem
-- policy), mas este REVOKE garante bloqueio mesmo se a RLS for desactivada
-- por engano. Escritas só via SERVICE_ROLE_KEY (que bypassa RLS e bypassa
-- também os grants normais de role).
-- -----------------------------------------------------------------------------
REVOKE INSERT, UPDATE, DELETE ON public.psy_responses FROM authenticated;
REVOKE INSERT, UPDATE, DELETE ON public.psy_answers   FROM authenticated;

-- =============================================================================
-- RLS: ENABLE em todas as tabelas psy_*. Policies em secção separada (revisar).
-- =============================================================================

ALTER TABLE public.psy_instruments      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.psy_dimensions       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.psy_questions        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.psy_thresholds       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.psy_action_plans     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.psy_campaigns        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.psy_campaign_areas   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.psy_dispatch_tokens  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.psy_responses        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.psy_answers          ENABLE ROW LEVEL SECURITY;

-- =============================================================================
-- POLICIES (SINALIZADAS PARA REVISÃO ANTES DE APLICAR)
-- =============================================================================
-- As policies abaixo assumem que o JWT do Supabase Auth tem o claim `tenantId`.
-- Confirmar com o sistema de auth do projecto e ajustar se for diferente.
--
-- Os endpoints públicos (/api/q/psy/:token) usarão SERVICE_ROLE_KEY no backend
-- e BYPASSAM RLS, por isso estas policies aplicam-se apenas a acessos com
-- sessão autenticada (painel admin).
--
-- IMPORTANTE (R5): para psy_responses e psy_answers SÓ está definida policy
-- de SELECT para `authenticated`. NÃO se define INSERT/UPDATE/DELETE para
-- esse role. RLS deny-by-default bloqueia o que não tem policy explícita.
-- Como defesa em profundidade, REVOKE INSERT/UPDATE/DELETE foi aplicado em
-- cima na secção HARDENING. Qualquer policy futura de escrita para
-- `authenticated` nestas tabelas viola o invariante A1 (anonimato) e exige
-- justificação documentada e revisão de segurança.
--
-- Para aplicar, descomentar o bloco entre BEGIN e COMMIT e executar.
-- =============================================================================

-- BEGIN;
--
-- -- 1. psy_instruments
-- CREATE POLICY psy_instruments_tenant_all ON public.psy_instruments
--   FOR ALL TO authenticated
--   USING ("tenantId" = (auth.jwt() ->> 'tenantId'))
--   WITH CHECK ("tenantId" = (auth.jwt() ->> 'tenantId'));
--
-- -- 2. psy_dimensions (via instrumento)
-- CREATE POLICY psy_dimensions_tenant_all ON public.psy_dimensions
--   FOR ALL TO authenticated
--   USING (EXISTS (
--     SELECT 1 FROM public.psy_instruments i
--     WHERE i.id = psy_dimensions."instrumentId"
--       AND i."tenantId" = (auth.jwt() ->> 'tenantId')
--   ))
--   WITH CHECK (EXISTS (
--     SELECT 1 FROM public.psy_instruments i
--     WHERE i.id = psy_dimensions."instrumentId"
--       AND i."tenantId" = (auth.jwt() ->> 'tenantId')
--   ));
--
-- -- 3. psy_questions (via dimensão -> instrumento)
-- CREATE POLICY psy_questions_tenant_all ON public.psy_questions
--   FOR ALL TO authenticated
--   USING (EXISTS (
--     SELECT 1 FROM public.psy_dimensions d
--     JOIN public.psy_instruments i ON i.id = d."instrumentId"
--     WHERE d.id = psy_questions."dimensionId"
--       AND i."tenantId" = (auth.jwt() ->> 'tenantId')
--   ))
--   WITH CHECK (EXISTS (
--     SELECT 1 FROM public.psy_dimensions d
--     JOIN public.psy_instruments i ON i.id = d."instrumentId"
--     WHERE d.id = psy_questions."dimensionId"
--       AND i."tenantId" = (auth.jwt() ->> 'tenantId')
--   ));
--
-- -- 4. psy_thresholds (via instrumento)
-- CREATE POLICY psy_thresholds_tenant_all ON public.psy_thresholds
--   FOR ALL TO authenticated
--   USING (EXISTS (
--     SELECT 1 FROM public.psy_instruments i
--     WHERE i.id = psy_thresholds."instrumentId"
--       AND i."tenantId" = (auth.jwt() ->> 'tenantId')
--   ))
--   WITH CHECK (EXISTS (
--     SELECT 1 FROM public.psy_instruments i
--     WHERE i.id = psy_thresholds."instrumentId"
--       AND i."tenantId" = (auth.jwt() ->> 'tenantId')
--   ));
--
-- -- 5. psy_action_plans (via dimensão -> instrumento)
-- CREATE POLICY psy_action_plans_tenant_all ON public.psy_action_plans
--   FOR ALL TO authenticated
--   USING (EXISTS (
--     SELECT 1 FROM public.psy_dimensions d
--     JOIN public.psy_instruments i ON i.id = d."instrumentId"
--     WHERE d.id = psy_action_plans."dimensionId"
--       AND i."tenantId" = (auth.jwt() ->> 'tenantId')
--   ))
--   WITH CHECK (EXISTS (
--     SELECT 1 FROM public.psy_dimensions d
--     JOIN public.psy_instruments i ON i.id = d."instrumentId"
--     WHERE d.id = psy_action_plans."dimensionId"
--       AND i."tenantId" = (auth.jwt() ->> 'tenantId')
--   ));
--
-- -- 6. psy_campaigns
-- CREATE POLICY psy_campaigns_tenant_all ON public.psy_campaigns
--   FOR ALL TO authenticated
--   USING ("tenantId" = (auth.jwt() ->> 'tenantId'))
--   WITH CHECK ("tenantId" = (auth.jwt() ->> 'tenantId'));
--
-- -- 7. psy_campaign_areas (via campanha)
-- CREATE POLICY psy_campaign_areas_tenant_all ON public.psy_campaign_areas
--   FOR ALL TO authenticated
--   USING (EXISTS (
--     SELECT 1 FROM public.psy_campaigns c
--     WHERE c.id = psy_campaign_areas."campaignId"
--       AND c."tenantId" = (auth.jwt() ->> 'tenantId')
--   ))
--   WITH CHECK (EXISTS (
--     SELECT 1 FROM public.psy_campaigns c
--     WHERE c.id = psy_campaign_areas."campaignId"
--       AND c."tenantId" = (auth.jwt() ->> 'tenantId')
--   ));
--
-- -- 8. psy_dispatch_tokens (via campanha)
-- CREATE POLICY psy_dispatch_tokens_tenant_all ON public.psy_dispatch_tokens
--   FOR ALL TO authenticated
--   USING (EXISTS (
--     SELECT 1 FROM public.psy_campaigns c
--     WHERE c.id = psy_dispatch_tokens."campaignId"
--       AND c."tenantId" = (auth.jwt() ->> 'tenantId')
--   ))
--   WITH CHECK (EXISTS (
--     SELECT 1 FROM public.psy_campaigns c
--     WHERE c.id = psy_dispatch_tokens."campaignId"
--       AND c."tenantId" = (auth.jwt() ->> 'tenantId')
--   ));
--
-- -- 9. psy_responses (via campanha). Painel só LÊ agregados (gating N>=5 na app).
-- CREATE POLICY psy_responses_tenant_select ON public.psy_responses
--   FOR SELECT TO authenticated
--   USING (EXISTS (
--     SELECT 1 FROM public.psy_campaigns c
--     WHERE c.id = psy_responses."campaignId"
--       AND c."tenantId" = (auth.jwt() ->> 'tenantId')
--   ));
-- -- Sem policy de INSERT/UPDATE/DELETE para authenticated: inserts vêm
-- -- exclusivamente do backend via SERVICE_ROLE_KEY (endpoint público).
--
-- -- 10. psy_answers (via response -> campanha). Idem.
-- CREATE POLICY psy_answers_tenant_select ON public.psy_answers
--   FOR SELECT TO authenticated
--   USING (EXISTS (
--     SELECT 1 FROM public.psy_responses r
--     JOIN public.psy_campaigns c ON c.id = r."campaignId"
--     WHERE r.id = psy_answers."responseId"
--       AND c."tenantId" = (auth.jwt() ->> 'tenantId')
--   ));
--
-- COMMIT;

-- =============================================================================
-- Queries de validação (correr depois de aplicar)
-- =============================================================================

-- V.1: confirmar que as 10 tabelas existem.
SELECT table_name FROM information_schema.tables
 WHERE table_schema='public' AND table_name LIKE 'psy_%'
 ORDER BY table_name;
-- Esperado: 10 linhas.

-- V.2: confirmar invariante de anonimato em psy_responses.
-- Esperado: SÓ id, campaignId, areaId, instrumentVersao, submetidoEm.
-- NUNCA deve ter ip, userAgent, email, traineeId, userId, tokenId, dispatchTokenId.
SELECT column_name FROM information_schema.columns
 WHERE table_schema='public' AND table_name='psy_responses'
 ORDER BY ordinal_position;

-- V.3: confirmar invariante em psy_dispatch_tokens (sem IP, sem UA).
SELECT column_name FROM information_schema.columns
 WHERE table_schema='public' AND table_name='psy_dispatch_tokens'
 ORDER BY ordinal_position;

-- V.4: listar FKs de psy_responses. Esperado APENAS psy_campaigns e psy_campaign_areas.
SELECT
    tc.constraint_name,
    kcu.column_name,
    ccu.table_name  AS foreign_table,
    ccu.column_name AS foreign_column
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu
  ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage ccu
  ON ccu.constraint_name = tc.constraint_name
WHERE tc.constraint_type='FOREIGN KEY'
  AND tc.table_schema='public'
  AND tc.table_name='psy_responses';

-- V.5: RLS habilitado em todas as tabelas psy_*.
SELECT tablename, rowsecurity FROM pg_tables
 WHERE schemaname='public' AND tablename LIKE 'psy_%'
 ORDER BY tablename;
-- Esperado: rowsecurity = true em todas.

-- V.6: contagem inicial.
SELECT 'psy_instruments'      AS t, COUNT(*) FROM public.psy_instruments
UNION ALL SELECT 'psy_dimensions',      COUNT(*) FROM public.psy_dimensions
UNION ALL SELECT 'psy_questions',       COUNT(*) FROM public.psy_questions
UNION ALL SELECT 'psy_thresholds',      COUNT(*) FROM public.psy_thresholds
UNION ALL SELECT 'psy_action_plans',    COUNT(*) FROM public.psy_action_plans
UNION ALL SELECT 'psy_campaigns',       COUNT(*) FROM public.psy_campaigns
UNION ALL SELECT 'psy_campaign_areas',  COUNT(*) FROM public.psy_campaign_areas
UNION ALL SELECT 'psy_dispatch_tokens', COUNT(*) FROM public.psy_dispatch_tokens
UNION ALL SELECT 'psy_responses',       COUNT(*) FROM public.psy_responses
UNION ALL SELECT 'psy_answers',         COUNT(*) FROM public.psy_answers;

-- V.7: confirmar triggers de truncate à hora.
-- Esperado: 2 linhas (psy_responses_trunc_submetido_em BEFORE INSERT,
--                     psy_dispatch_tokens_trunc_usado_em BEFORE INSERT/UPDATE).
SELECT trigger_name, event_manipulation, action_timing, event_object_table
FROM information_schema.triggers
WHERE trigger_schema='public' AND trigger_name LIKE 'psy_%trunc%'
ORDER BY trigger_name, event_manipulation;

-- V.8: confirmar CHECK do comprimento mínimo do token.
-- Esperado: 1 linha com pg_get_constraintdef = 'CHECK ((length(token) >= 32))'.
SELECT conname, pg_get_constraintdef(oid)
FROM pg_constraint
WHERE conrelid='public.psy_dispatch_tokens'::regclass
  AND conname='psy_dispatch_tokens_token_min_length';

-- V.9: confirmar que `authenticated` NÃO tem INSERT/UPDATE/DELETE em
-- psy_responses ou psy_answers. Esperado: 0 linhas.
SELECT grantee, table_name, privilege_type
FROM information_schema.role_table_grants
WHERE table_schema='public'
  AND table_name IN ('psy_responses', 'psy_answers')
  AND grantee='authenticated'
  AND privilege_type IN ('INSERT', 'UPDATE', 'DELETE');

-- V.10: confirmar truncate a funcionar com um teste seco (ROLLBACK no fim).
-- Esperado: a linha mostrada terá submetidoEm com minuto e segundos a zero.
BEGIN;
INSERT INTO public.psy_responses (id, "campaignId", "areaId", "instrumentVersao", "submetidoEm")
SELECT '__test_v10__',
       c.id, a.id, 'v-test',
       now() + interval '37 minutes 19 seconds 123 microseconds'
FROM public.psy_campaigns c
JOIN public.psy_campaign_areas a ON a."campaignId"=c.id
LIMIT 1;
SELECT id, "submetidoEm" FROM public.psy_responses WHERE id='__test_v10__';
ROLLBACK;
-- Nota: esta query só devolve linha se já existir pelo menos uma campanha
-- com área. Caso contrário, salta sem erro (LIMIT 1 sobre conjunto vazio).

-- =============================================================================
-- ROLLBACK (não executar a menos que seja preciso desfazer)
-- =============================================================================
--
-- BEGIN;
-- DROP TRIGGER IF EXISTS psy_responses_trunc_submetido_em      ON public.psy_responses;
-- DROP TRIGGER IF EXISTS psy_dispatch_tokens_trunc_usado_em    ON public.psy_dispatch_tokens;
-- DROP FUNCTION IF EXISTS public.psy_trunc_hour_submetido_em() CASCADE;
-- DROP FUNCTION IF EXISTS public.psy_trunc_hour_usado_em()     CASCADE;
-- DROP TABLE IF EXISTS public.psy_answers         CASCADE;
-- DROP TABLE IF EXISTS public.psy_responses       CASCADE;
-- DROP TABLE IF EXISTS public.psy_dispatch_tokens CASCADE;
-- DROP TABLE IF EXISTS public.psy_campaign_areas  CASCADE;
-- DROP TABLE IF EXISTS public.psy_campaigns       CASCADE;
-- DROP TABLE IF EXISTS public.psy_action_plans    CASCADE;
-- DROP TABLE IF EXISTS public.psy_thresholds      CASCADE;
-- DROP TABLE IF EXISTS public.psy_questions       CASCADE;
-- DROP TABLE IF EXISTS public.psy_dimensions      CASCADE;
-- DROP TABLE IF EXISTS public.psy_instruments     CASCADE;
-- COMMIT;
-- =============================================================================
