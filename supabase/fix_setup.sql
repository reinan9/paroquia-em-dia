-- ============================================================
-- PARÓQUIA EM DIA — Script de Correção (idempotente)
-- Execute este script se o schema.sql falhou parcialmente
-- ============================================================

-- ============ EXTENSÕES ============
create extension if not exists "uuid-ossp";

-- ============ ENUM TYPES (criar apenas se não existirem) ============
DO $$ BEGIN CREATE TYPE paroquia_status AS ENUM ('pending_payment', 'active', 'blocked'); EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN CREATE TYPE assinatura_status AS ENUM ('pending_payment', 'active', 'past_due', 'canceled', 'trialing'); EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN CREATE TYPE membro_role AS ENUM ('super_admin', 'paroquia_admin', 'secretaria', 'coordenador', 'membro', 'operador_pdv'); EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN CREATE TYPE membro_status AS ENUM ('active', 'inactive', 'pending'); EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN CREATE TYPE parcela_status AS ENUM ('aberta', 'aguardando_pagamento', 'paga', 'vencida', 'cancelada'); EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN CREATE TYPE pagamento_origem AS ENUM ('assinatura', 'dizimo_parcela', 'pedido_evento'); EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN CREATE TYPE pagamento_metodo AS ENUM ('pix', 'cartao', 'dinheiro', 'manual'); EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN CREATE TYPE pagamento_status AS ENUM ('pending', 'approved', 'rejected', 'cancelled', 'refunded'); EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN CREATE TYPE pedido_status AS ENUM ('aberto', 'pago', 'entregue', 'cancelado'); EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN CREATE TYPE oracao_status AS ENUM ('pendente', 'aprovado', 'rejeitado'); EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN CREATE TYPE fatura_status AS ENUM ('pending', 'paid', 'overdue', 'cancelled'); EXCEPTION WHEN duplicate_object THEN null; END $$;

-- ============ TABELAS (if not exists) ============

create table if not exists profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  nome text not null,
  telefone text,
  avatar_url text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists planos (
  id uuid primary key default uuid_generate_v4(),
  nome text not null unique,
  descricao text,
  preco_mensal numeric(10,2) not null,
  limites jsonb default '{}'::jsonb,
  ativo boolean default true,
  created_at timestamptz default now()
);

create table if not exists paroquias (
  id uuid primary key default uuid_generate_v4(),
  nome text not null,
  slug text not null unique,
  endereco text,
  cidade text,
  estado text default 'AL',
  telefone text,
  email text,
  logo_url text,
  status paroquia_status default 'active',
  plano_id uuid references planos(id),
  criado_por uuid references auth.users(id),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index if not exists idx_paroquias_slug on paroquias(slug);

create table if not exists membros_paroquia (
  id uuid primary key default uuid_generate_v4(),
  paroquia_id uuid not null references paroquias(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role membro_role default 'membro',
  status membro_status default 'active',
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique(paroquia_id, user_id)
);

create index if not exists idx_membros_paroquia_user on membros_paroquia(user_id);
create index if not exists idx_membros_paroquia_paroquia on membros_paroquia(paroquia_id);

create table if not exists assinaturas (
  id uuid primary key default uuid_generate_v4(),
  paroquia_id uuid not null references paroquias(id) on delete cascade,
  plano_id uuid not null references planos(id),
  status assinatura_status default 'pending_payment',
  mp_subscription_id text,
  mp_preapproval_id text,
  periodo_inicio timestamptz,
  periodo_fim timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index if not exists idx_assinaturas_paroquia on assinaturas(paroquia_id);

create table if not exists faturas (
  id uuid primary key default uuid_generate_v4(),
  assinatura_id uuid not null references assinaturas(id) on delete cascade,
  status fatura_status default 'pending',
  valor numeric(10,2) not null,
  vencimento date,
  mp_payment_id text,
  mp_invoice_id text,
  pix_qr text,
  copia_cola text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists pagamentos (
  id uuid primary key default uuid_generate_v4(),
  origem_tipo pagamento_origem not null,
  origem_id uuid not null,
  paroquia_id uuid not null references paroquias(id),
  metodo pagamento_metodo,
  status pagamento_status default 'pending',
  valor numeric(10,2) not null,
  mp_payment_id text,
  mp_preference_id text,
  comprovante_url text,
  dados_extras jsonb default '{}'::jsonb,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index if not exists idx_pagamentos_origem on pagamentos(origem_tipo, origem_id);
create index if not exists idx_pagamentos_paroquia on pagamentos(paroquia_id);

create table if not exists avisos (
  id uuid primary key default uuid_generate_v4(),
  paroquia_id uuid not null references paroquias(id) on delete cascade,
  titulo text not null,
  conteudo text not null,
  imagem_url text,
  publicado boolean default false,
  autor_id uuid references auth.users(id),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index if not exists idx_avisos_paroquia on avisos(paroquia_id);

create table if not exists banners (
  id uuid primary key default uuid_generate_v4(),
  paroquia_id uuid not null references paroquias(id) on delete cascade,
  titulo text,
  imagem_url text not null,
  link text,
  ordem integer default 0,
  ativo boolean default true,
  created_at timestamptz default now()
);

create table if not exists eventos (
  id uuid primary key default uuid_generate_v4(),
  paroquia_id uuid not null references paroquias(id) on delete cascade,
  titulo text not null,
  descricao text,
  local text,
  data_inicio timestamptz not null,
  data_fim timestamptz,
  imagem_url text,
  tipo text default 'geral',
  tem_vendas boolean default false,
  criado_por uuid references auth.users(id),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index if not exists idx_eventos_paroquia on eventos(paroquia_id);
create index if not exists idx_eventos_data on eventos(data_inicio);

create table if not exists pastorais (
  id uuid primary key default uuid_generate_v4(),
  paroquia_id uuid not null references paroquias(id) on delete cascade,
  nome text not null,
  descricao text,
  imagem_url text,
  coordenador_id uuid references auth.users(id),
  dia_reuniao text,
  horario_reuniao text,
  ativa boolean default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index if not exists idx_pastorais_paroquia on pastorais(paroquia_id);

create table if not exists pastoral_membros (
  id uuid primary key default uuid_generate_v4(),
  pastoral_id uuid not null references pastorais(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  funcao text default 'membro',
  created_at timestamptz default now(),
  unique(pastoral_id, user_id)
);

create table if not exists pedidos_oracao (
  id uuid primary key default uuid_generate_v4(),
  paroquia_id uuid not null references paroquias(id) on delete cascade,
  user_id uuid references auth.users(id),
  nome_solicitante text not null,
  intencao text not null,
  status oracao_status default 'pendente',
  moderado_por uuid references auth.users(id),
  created_at timestamptz default now()
);

create index if not exists idx_oracao_paroquia on pedidos_oracao(paroquia_id);

create table if not exists dizimistas (
  id uuid primary key default uuid_generate_v4(),
  paroquia_id uuid not null references paroquias(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  nome text not null,
  created_at timestamptz default now(),
  unique(paroquia_id, user_id)
);

create table if not exists dizimo_planos (
  id uuid primary key default uuid_generate_v4(),
  dizimista_id uuid not null references dizimistas(id) on delete cascade,
  paroquia_id uuid not null references paroquias(id) on delete cascade,
  valor_mensal numeric(10,2) not null,
  dia_vencimento integer not null check (dia_vencimento between 1 and 28),
  ativo boolean default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists dizimo_parcelas (
  id uuid primary key default uuid_generate_v4(),
  plano_id uuid not null references dizimo_planos(id) on delete cascade,
  paroquia_id uuid not null references paroquias(id) on delete cascade,
  competencia date not null,
  vencimento date not null,
  valor numeric(10,2) not null,
  status parcela_status default 'aberta',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index if not exists idx_parcelas_plano on dizimo_parcelas(plano_id);
create index if not exists idx_parcelas_status on dizimo_parcelas(status);

create table if not exists eventos_pontos_venda (
  id uuid primary key default uuid_generate_v4(),
  evento_id uuid not null references eventos(id) on delete cascade,
  paroquia_id uuid not null references paroquias(id) on delete cascade,
  nome text not null,
  descricao text,
  operador_id uuid references auth.users(id),
  created_at timestamptz default now()
);

create index if not exists idx_pdv_evento on eventos_pontos_venda(evento_id);

create table if not exists eventos_produtos (
  id uuid primary key default uuid_generate_v4(),
  ponto_venda_id uuid not null references eventos_pontos_venda(id) on delete cascade,
  paroquia_id uuid not null references paroquias(id) on delete cascade,
  nome text not null,
  preco numeric(10,2) not null,
  imagem_url text,
  estoque_inicial integer,
  estoque_atual integer,
  ativo boolean default true,
  created_at timestamptz default now()
);

create table if not exists eventos_pedidos (
  id uuid primary key default uuid_generate_v4(),
  ponto_venda_id uuid not null references eventos_pontos_venda(id) on delete cascade,
  paroquia_id uuid not null references paroquias(id) on delete cascade,
  comprador_nome text,
  comprador_id uuid references auth.users(id),
  status pedido_status default 'aberto',
  total numeric(10,2) default 0,
  metodo_pagamento pagamento_metodo,
  operador_id uuid references auth.users(id),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists eventos_pedido_itens (
  id uuid primary key default uuid_generate_v4(),
  pedido_id uuid not null references eventos_pedidos(id) on delete cascade,
  produto_id uuid not null references eventos_produtos(id),
  quantidade integer not null default 1,
  preco_unitario numeric(10,2) not null,
  subtotal numeric(10,2) not null
);

create table if not exists eventos_mov_estoque (
  id uuid primary key default uuid_generate_v4(),
  produto_id uuid not null references eventos_produtos(id) on delete cascade,
  tipo text not null check (tipo in ('entrada', 'saida', 'ajuste')),
  quantidade integer not null,
  motivo text,
  created_at timestamptz default now()
);

create table if not exists device_tokens (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users(id) on delete cascade,
  token text not null unique,
  plataforma text,
  created_at timestamptz default now()
);

-- ============ VIEWS ============
create or replace view vw_dizimo_total_por_mes as
select
  dp.paroquia_id,
  date_trunc('month', dp.competencia) as mes,
  sum(dp.valor) filter (where dp.status = 'paga') as total_pago,
  count(*) filter (where dp.status = 'paga') as qtd_pagas,
  count(*) as qtd_total
from dizimo_parcelas dp
group by dp.paroquia_id, date_trunc('month', dp.competencia);

create or replace view vw_dizimo_inadimplentes as
select
  d.paroquia_id,
  d.user_id,
  d.nome as dizimista_nome,
  count(*) filter (where dp.status = 'vencida') as parcelas_vencidas,
  sum(dp.valor) filter (where dp.status = 'vencida') as valor_total_vencido
from dizimistas d
join dizimo_planos pl on pl.dizimista_id = d.id
join dizimo_parcelas dp on dp.plano_id = pl.id
group by d.paroquia_id, d.user_id, d.nome
having count(*) filter (where dp.status = 'vencida') > 0;

create or replace view vw_vendas_evento_resumo as
select
  pv.paroquia_id,
  e.id as evento_id,
  e.titulo as evento_titulo,
  count(distinct ep.id) as total_pedidos,
  sum(ep.total) filter (where ep.status in ('pago', 'entregue')) as total_vendas
from eventos e
join eventos_pontos_venda pv on pv.evento_id = e.id
join eventos_pedidos ep on ep.ponto_venda_id = pv.id
group by pv.paroquia_id, e.id, e.titulo;

create or replace view vw_vendas_por_ponto_venda as
select
  pv.paroquia_id,
  pv.evento_id,
  pv.id as ponto_venda_id,
  pv.nome as ponto_venda_nome,
  count(distinct ep.id) as total_pedidos,
  sum(ep.total) filter (where ep.status in ('pago', 'entregue')) as total_vendas
from eventos_pontos_venda pv
left join eventos_pedidos ep on ep.ponto_venda_id = pv.id
group by pv.paroquia_id, pv.evento_id, pv.id, pv.nome;

-- ============ TRIGGERS ============

create or replace function trigger_set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- Drop and recreate triggers to avoid errors
DO $$ BEGIN
  drop trigger if exists set_updated_at on profiles;
  create trigger set_updated_at before update on profiles for each row execute function trigger_set_updated_at();
  drop trigger if exists set_updated_at on paroquias;
  create trigger set_updated_at before update on paroquias for each row execute function trigger_set_updated_at();
  drop trigger if exists set_updated_at on membros_paroquia;
  create trigger set_updated_at before update on membros_paroquia for each row execute function trigger_set_updated_at();
  drop trigger if exists set_updated_at on assinaturas;
  create trigger set_updated_at before update on assinaturas for each row execute function trigger_set_updated_at();
  drop trigger if exists set_updated_at on faturas;
  create trigger set_updated_at before update on faturas for each row execute function trigger_set_updated_at();
  drop trigger if exists set_updated_at on pagamentos;
  create trigger set_updated_at before update on pagamentos for each row execute function trigger_set_updated_at();
  drop trigger if exists set_updated_at on avisos;
  create trigger set_updated_at before update on avisos for each row execute function trigger_set_updated_at();
  drop trigger if exists set_updated_at on eventos;
  create trigger set_updated_at before update on eventos for each row execute function trigger_set_updated_at();
  drop trigger if exists set_updated_at on pastorais;
  create trigger set_updated_at before update on pastorais for each row execute function trigger_set_updated_at();
  drop trigger if exists set_updated_at on dizimo_planos;
  create trigger set_updated_at before update on dizimo_planos for each row execute function trigger_set_updated_at();
  drop trigger if exists set_updated_at on dizimo_parcelas;
  create trigger set_updated_at before update on dizimo_parcelas for each row execute function trigger_set_updated_at();
  drop trigger if exists set_updated_at on eventos_pedidos;
  create trigger set_updated_at before update on eventos_pedidos for each row execute function trigger_set_updated_at();
END $$;

-- Auto create profile on signup
create or replace function handle_new_user()
returns trigger as $$
begin
  insert into profiles (id, nome)
  values (new.id, coalesce(new.raw_user_meta_data->>'nome', new.email));
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();

-- Auto update pedido total
create or replace function update_pedido_total()
returns trigger as $$
begin
  update eventos_pedidos
  set total = (
    select coalesce(sum(subtotal), 0)
    from eventos_pedido_itens
    where pedido_id = coalesce(new.pedido_id, old.pedido_id)
  )
  where id = coalesce(new.pedido_id, old.pedido_id);
  return coalesce(new, old);
end;
$$ language plpgsql;

drop trigger if exists update_total_on_item_change on eventos_pedido_itens;
create trigger update_total_on_item_change
  after insert or update or delete on eventos_pedido_itens
  for each row execute function update_pedido_total();

-- ============ RLS ON PROFILES ============
alter table profiles enable row level security;

drop policy if exists "Users can view own profile" on profiles;
create policy "Users can view own profile" on profiles for select using (id = auth.uid());

drop policy if exists "Users can update own profile" on profiles;
create policy "Users can update own profile" on profiles for update using (id = auth.uid());

drop policy if exists "Members can view other profiles" on profiles;
create policy "Members can view other profiles" on profiles for select using (
  exists (
    select 1 from membros_paroquia m1
    join membros_paroquia m2 on m1.paroquia_id = m2.paroquia_id
    where m1.user_id = auth.uid() and m2.user_id = profiles.id
  )
);
