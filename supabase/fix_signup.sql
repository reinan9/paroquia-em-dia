-- ============================================================
-- DIAGNÓSTICO E CORREÇÃO — Erro de Signup
-- Execute este script no SQL Editor do Supabase
-- ============================================================

-- 1. Limpar usuários órfãos de tentativas anteriores
DELETE FROM auth.users
WHERE id NOT IN (SELECT id FROM public.profiles);

-- 2. Adicionar policy de INSERT na tabela profiles
-- (o trigger handle_new_user precisa inserir aqui)
DROP POLICY IF EXISTS "Service can insert profiles" ON profiles;
CREATE POLICY "Service can insert profiles" ON profiles
  FOR INSERT WITH CHECK (true);

-- 3. Verificar que o trigger existe
SELECT tgname FROM pg_trigger WHERE tgname = 'on_auth_user_created';
