-- ============================================================
-- MIGRATION — Módulo Central (Oporto Forte)
-- Correr no SQL Editor do Supabase. Idempotente (IF NOT EXISTS).
-- Só DDL: não altera RLS nem dados. Colunas nullable para não
-- partir registos históricos (ações/sessões sem estes dados).
-- ============================================================

-- 1. Contrato associado à ação de formação.
--    Regra de negócio: contrato obrigatório para gravar uma NOVA ação
--    (validado na app). Coluna nullable: ações históricas não têm.
ALTER TABLE public.training_actions
  ADD COLUMN IF NOT EXISTS "contractId" text;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'training_actions_contractId_fkey'
  ) THEN
    ALTER TABLE public.training_actions
      ADD CONSTRAINT "training_actions_contractId_fkey"
      FOREIGN KEY ("contractId") REFERENCES public.contracts(id)
      ON DELETE SET NULL;
  END IF;
END $$;

-- 2. Módulo do curso associado a cada sessão (Step 2 do cronograma).
ALTER TABLE public.training_sessions
  ADD COLUMN IF NOT EXISTS "moduleId" text;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'training_sessions_moduleId_fkey'
  ) THEN
    ALTER TABLE public.training_sessions
      ADD CONSTRAINT "training_sessions_moduleId_fkey"
      FOREIGN KEY ("moduleId") REFERENCES public.course_modules(id)
      ON DELETE SET NULL;
  END IF;
END $$;

-- 3. Tipo de sessão: Teórica / Prática.
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'SessionType') THEN
    CREATE TYPE "SessionType" AS ENUM ('TEORICA', 'PRATICA');
  END IF;
END $$;

ALTER TABLE public.training_sessions
  ADD COLUMN IF NOT EXISTS "sessionType" "SessionType";

-- Recarregar a cache de schema da PostgREST (Supabase normalmente
-- auto-recarrega; isto força para os novos campos aparecerem já).
NOTIFY pgrst, 'reload schema';

-- ------------------------------------------------------------
-- NOTA: se após correr isto a app não conseguir ler/escrever as
-- novas colunas (raro — os GRANTs do Supabase são ao nível da
-- tabela e abrangem colunas novas), correr também:
--   GRANT SELECT, INSERT, UPDATE ("contractId")
--     ON public.training_actions TO authenticated;
--   GRANT SELECT, INSERT, UPDATE ("moduleId","sessionType")
--     ON public.training_sessions TO authenticated;
-- (Não mexe em policies RLS, só privilégios de coluna.)
-- ------------------------------------------------------------
