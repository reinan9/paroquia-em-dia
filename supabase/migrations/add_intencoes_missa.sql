-- ============ INTENÇÕES DE MISSA ============
-- Run this migration to add the intencoes_missa table

-- Enum for intention type
DO $$ BEGIN
    CREATE TYPE intencao_tipo AS ENUM ('falecido', 'vivo', 'acao_gracas', 'outro');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

-- Table
CREATE TABLE IF NOT EXISTS intencoes_missa (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    paroquia_id uuid NOT NULL REFERENCES paroquias(id) ON DELETE CASCADE,
    user_id uuid REFERENCES auth.users(id),
    solicitante_nome text NOT NULL,
    intencao text NOT NULL,
    tipo intencao_tipo DEFAULT 'falecido',
    data_missa date,
    horario_missa text,
    status oracao_status DEFAULT 'pendente',
    observacao text,
    created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_intencoes_paroquia ON intencoes_missa(paroquia_id);
CREATE INDEX IF NOT EXISTS idx_intencoes_data ON intencoes_missa(data_missa);

-- Updated at trigger
CREATE TRIGGER set_updated_at_intencoes BEFORE UPDATE ON intencoes_missa 
    FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();
