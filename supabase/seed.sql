-- ============================================================
-- PARÓQUIA EM DIA — Seed Data
-- ============================================================

-- Planos
insert into planos (nome, descricao, preco_mensal, limites) values
('Básico', 'Ideal para paróquias pequenas. Inclui avisos, agenda e pedidos de oração.', 49.90, '{"membros": 100, "pastorais": 5, "eventos_mes": 10, "pdv": false}'::jsonb),
('Pro', 'Para paróquias médias. Todos os recursos do Básico + dízimo online + PDV.', 99.90, '{"membros": 500, "pastorais": 20, "eventos_mes": 50, "pdv": true}'::jsonb),
('Premium', 'Para paróquias grandes. Recursos ilimitados + suporte prioritário.', 199.90, '{"membros": -1, "pastorais": -1, "eventos_mes": -1, "pdv": true}'::jsonb);

-- Storage Buckets (execute via Supabase Dashboard ou CLI)
-- insert into storage.buckets (id, name, public) values ('avatars', 'avatars', true);
-- insert into storage.buckets (id, name, public) values ('paroquias', 'paroquias', true);
-- insert into storage.buckets (id, name, public) values ('avisos', 'avisos', true);
-- insert into storage.buckets (id, name, public) values ('eventos', 'eventos', true);
-- insert into storage.buckets (id, name, public) values ('comprovantes', 'comprovantes', false);
-- insert into storage.buckets (id, name, public) values ('produtos', 'produtos', true);
