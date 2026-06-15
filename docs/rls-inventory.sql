-- ============================================================
-- INVENTÁRIO RLS — correr no SQL Editor do Supabase
-- Projecto: ecqptnirekuiibhmnbaq (Academia Digital V2)
-- Objectivo: estado autoritativo antes de escrever as policies.
-- Instruções: correr tudo, copiar o output de cada bloco e colar
-- de volta. Não altera nada na base de dados (só SELECT).
-- ============================================================

-- 1. RLS status por tabela
SELECT schemaname, tablename, rowsecurity
FROM pg_tables
WHERE schemaname='public'
ORDER BY tablename;

-- 2. Policies existentes
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies
WHERE schemaname='public'
ORDER BY tablename, policyname;

-- 3. Confirmar enum UserRole
SELECT enum_range(NULL::"UserRole");

-- 4. Confirmar tipo de tenantId em training_actions (amostra representativa)
SELECT column_name, data_type, udt_name
FROM information_schema.columns
WHERE table_schema='public'
  AND table_name='training_actions'
  AND column_name='tenantId';

-- 5. Confirmar que nao ha indice unico em users.email
SELECT indexname, indexdef
FROM pg_indexes
WHERE schemaname='public' AND tablename='users';

-- 6. Estrutura completa de course_modules e training_sessions
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_schema='public'
  AND table_name IN ('course_modules', 'training_sessions')
ORDER BY table_name, ordinal_position;
