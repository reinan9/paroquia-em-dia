-- Add profile fields to membros_paroquia
ALTER TABLE membros_paroquia ADD COLUMN IF NOT EXISTS nome text;
ALTER TABLE membros_paroquia ADD COLUMN IF NOT EXISTS telefone text;
ALTER TABLE membros_paroquia ADD COLUMN IF NOT EXISTS endereco text;
ALTER TABLE membros_paroquia ADD COLUMN IF NOT EXISTS foto_url text;

-- Allow user to update their own membership record
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'User can update own profile' AND tablename = 'membros_paroquia') THEN
        CREATE POLICY "User can update own profile" ON membros_paroquia FOR UPDATE USING (user_id = auth.uid());
    END IF;
END $$;
