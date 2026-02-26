-- Add missing columns to paroquias table
ALTER TABLE paroquias ADD COLUMN IF NOT EXISTS cor_primaria text DEFAULT '#2563EB';
ALTER TABLE paroquias ADD COLUMN IF NOT EXISTS pix_chave text;
ALTER TABLE paroquias ADD COLUMN IF NOT EXISTS pix_recebedor text;
ALTER TABLE paroquias ADD COLUMN IF NOT EXISTS logo_url text;
