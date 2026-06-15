-- =============================================================================
-- Migration v10: Preparar questionnaire_responses para resposta pública
-- =============================================================================
--
-- Contexto: a Fase 2b da Avaliação Automatizada permite que formandos e
-- formadores respondam a questionários via magic link (`/q/:token`) sem
-- autenticação. Esta migration adiciona 3 colunas necessárias para:
--   1) expirar tokens antigos (default sugerido: 30 dias)
--   2) registar a origem da resposta para auditoria LGPD
--
-- Esta migration é idempotente (ADD COLUMN IF NOT EXISTS). Pode correr
-- duas vezes sem erro. Não destrói dados existentes.
--
-- Como aplicar: Supabase Studio > SQL Editor > cola este ficheiro > Run.
-- =============================================================================

-- expiresAt: data limite para responder ao questionário.
-- NULL = sem expiração explícita; aplicação trata como ainda válido.
-- Recomendado: preencher com (createdAt + interval '30 days') no INSERT
-- futuro, feito pelo endpoint que cria a campanha.
ALTER TABLE public.questionnaire_responses
    ADD COLUMN IF NOT EXISTS "expiresAt" timestamp without time zone;

-- respondentIp: IP de quem submeteu a resposta (capturado pelo Hono no
-- endpoint POST /api/q/:token). Necessário para auditoria e prevenção
-- de abuso. Tratamento LGPD: justifica-se por interesse legítimo de
-- garantir autenticidade da avaliação certificada DGERT.
ALTER TABLE public.questionnaire_responses
    ADD COLUMN IF NOT EXISTS "respondentIp" text;

-- respondentUserAgent: user-agent do browser do respondente. Útil para
-- distinguir submissões automatizadas de respostas reais e para suporte
-- (ex: rever bug específico de browser).
ALTER TABLE public.questionnaire_responses
    ADD COLUMN IF NOT EXISTS "respondentUserAgent" text;

-- =============================================================================
-- Queries de validação (correr depois da migration)
-- =============================================================================

-- V.1: confirmar que as 3 colunas existem com o tipo certo.
-- Esperado: 3 linhas (expiresAt timestamp, respondentIp text, respondentUserAgent text).
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'questionnaire_responses'
  AND column_name IN ('expiresAt', 'respondentIp', 'respondentUserAgent')
ORDER BY column_name;

-- V.2: contar respostas existentes e quantas já têm campos novos populados.
-- Esperado logo após migration: total inalterado, with_expires/with_ip/with_ua = 0.
SELECT
    COUNT(*)                                                                  AS total,
    COUNT(*) FILTER (WHERE "expiresAt" IS NOT NULL)                           AS with_expires,
    COUNT(*) FILTER (WHERE "respondentIp" IS NOT NULL)                        AS with_ip,
    COUNT(*) FILTER (WHERE "respondentUserAgent" IS NOT NULL)                 AS with_ua
FROM public.questionnaire_responses;

-- =============================================================================
-- ROLLBACK (não executar a menos que seja preciso desfazer)
-- =============================================================================
--
-- ALTER TABLE public.questionnaire_responses DROP COLUMN IF EXISTS "expiresAt";
-- ALTER TABLE public.questionnaire_responses DROP COLUMN IF EXISTS "respondentIp";
-- ALTER TABLE public.questionnaire_responses DROP COLUMN IF EXISTS "respondentUserAgent";
--
-- Nota: dropar estas colunas perde dados de auditoria. Considera primeiro
-- exportar para CSV.
-- =============================================================================
