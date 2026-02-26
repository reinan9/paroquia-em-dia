-- ============================================================
-- PARÓQUIA EM DIA — Supabase Schema Completo
-- ============================================================

-- ============ EXTENSÕES ============
create extension if not exists "uuid-ossp";

-- ============ ENUM TYPES ============
create type paroquia_status as enum ('pending_payment', 'active', 'blocked');
create type assinatura_status as enum ('pending_payment', 'active', 'past_due', 'canceled', 'trialing');
create type membro_role as enum ('super_admin', 'paroquia_admin', 'secretaria', 'coordenador', 'membro', 'operador_pdv');
create type membro_status as enum ('active', 'inactive', 'pending');
create type parcela_status as enum ('aberta', 'aguardando_pagamento', 'paga', 'vencida', 'cancelada');
create type pagamento_origem as enum ('assinatura', 'dizimo_parcela', 'pedido_evento');
create type pagamento_metodo as enum ('pix', 'cartao', 'dinheiro', 'manual');
create type pagamento_status as enum ('pending', 'approved', 'rejected', 'cancelled', 'refunded');
create type pedido_status as enum ('aberto', 'pago', 'entregue', 'cancelado');
create type oracao_status as enum ('pendente', 'aprovado', 'rejeitado');
create type fatura_status as enum ('pending', 'paid', 'overdue', 'cancelled');

-- ============ PROFILES ============
create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  nome text not null,
  telefone text,
  avatar_url text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- ============ PLANOS ============
create table planos (
  id uuid primary key default uuid_generate_v4(),
  nome text not null unique,
  descricao text,
  preco_mensal numeric(10,2) not null,
  limites jsonb default '{}'::jsonb,
  ativo boolean default true,
  created_at timestamptz default now()
);

-- ============ PARÓQUIAS ============
create table paroquias (
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

create index idx_paroquias_slug on paroquias(slug);

-- ============ MEMBROS PARÓQUIA ============
create table membros_paroquia (
  id uuid primary key default uuid_generate_v4(),
  paroquia_id uuid not null references paroquias(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role membro_role default 'membro',
  status membro_status default 'active',
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique(paroquia_id, user_id)
);

create index idx_membros_paroquia_user on membros_paroquia(user_id);
create index idx_membros_paroquia_paroquia on membros_paroquia(paroquia_id);

-- ============ ASSINATURAS ============
create table assinaturas (
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

create index idx_assinaturas_paroquia on assinaturas(paroquia_id);

-- ============ FATURAS ============
create table faturas (
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

-- ============ PAGAMENTOS ============
create table pagamentos (
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

create index idx_pagamentos_origem on pagamentos(origem_tipo, origem_id);
create index idx_pagamentos_paroquia on pagamentos(paroquia_id);

-- ============ AVISOS ============
create table avisos (
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

create index idx_avisos_paroquia on avisos(paroquia_id);

-- ============ BANNERS ============
create table banners (
  id uuid primary key default uuid_generate_v4(),
  paroquia_id uuid not null references paroquias(id) on delete cascade,
  titulo text,
  imagem_url text not null,
  link text,
  ordem integer default 0,
  ativo boolean default true,
  created_at timestamptz default now()
);

-- ============ EVENTOS ============
create table eventos (
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

create index idx_eventos_paroquia on eventos(paroquia_id);
create index idx_eventos_data on eventos(data_inicio);

-- ============ PASTORAIS ============
create table pastorais (
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

create index idx_pastorais_paroquia on pastorais(paroquia_id);

-- ============ PASTORAL MEMBROS ============
create table pastoral_membros (
  id uuid primary key default uuid_generate_v4(),
  pastoral_id uuid not null references pastorais(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  funcao text default 'membro',
  created_at timestamptz default now(),
  unique(pastoral_id, user_id)
);

-- ============ PEDIDOS DE ORAÇÃO ============
create table pedidos_oracao (
  id uuid primary key default uuid_generate_v4(),
  paroquia_id uuid not null references paroquias(id) on delete cascade,
  user_id uuid references auth.users(id),
  nome_solicitante text not null,
  intencao text not null,
  status oracao_status default 'pendente',
  moderado_por uuid references auth.users(id),
  created_at timestamptz default now()
);

create index idx_oracao_paroquia on pedidos_oracao(paroquia_id);

-- ============ DIZIMISTAS ============
create table dizimistas (
  id uuid primary key default uuid_generate_v4(),
  paroquia_id uuid not null references paroquias(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  nome text not null,
  created_at timestamptz default now(),
  unique(paroquia_id, user_id)
);

-- ============ DÍZIMO PLANOS ============
create table dizimo_planos (
  id uuid primary key default uuid_generate_v4(),
  dizimista_id uuid not null references dizimistas(id) on delete cascade,
  paroquia_id uuid not null references paroquias(id) on delete cascade,
  valor_mensal numeric(10,2) not null,
  dia_vencimento integer not null check (dia_vencimento between 1 and 28),
  ativo boolean default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- ============ DÍZIMO PARCELAS ============
create table dizimo_parcelas (
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

create index idx_parcelas_plano on dizimo_parcelas(plano_id);
create index idx_parcelas_status on dizimo_parcelas(status);

-- ============ EVENTOS — PONTOS DE VENDA ============
create table eventos_pontos_venda (
  id uuid primary key default uuid_generate_v4(),
  evento_id uuid not null references eventos(id) on delete cascade,
  paroquia_id uuid not null references paroquias(id) on delete cascade,
  nome text not null,
  descricao text,
  operador_id uuid references auth.users(id),
  created_at timestamptz default now()
);

create index idx_pdv_evento on eventos_pontos_venda(evento_id);

-- ============ EVENTOS — PRODUTOS ============
create table eventos_produtos (
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

-- ============ EVENTOS — PEDIDOS ============
create table eventos_pedidos (
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

-- ============ EVENTOS — PEDIDO ITENS ============
create table eventos_pedido_itens (
  id uuid primary key default uuid_generate_v4(),
  pedido_id uuid not null references eventos_pedidos(id) on delete cascade,
  produto_id uuid not null references eventos_produtos(id),
  quantidade integer not null default 1,
  preco_unitario numeric(10,2) not null,
  subtotal numeric(10,2) not null
);

-- ============ EVENTOS — MOVIMENTAÇÃO DE ESTOQUE ============
create table eventos_mov_estoque (
  id uuid primary key default uuid_generate_v4(),
  produto_id uuid not null references eventos_produtos(id) on delete cascade,
  tipo text not null check (tipo in ('entrada', 'saida', 'ajuste')),
  quantidade integer not null,
  motivo text,
  created_at timestamptz default now()
);

-- ============ DEVICE TOKENS (push futuro) ============
create table device_tokens (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users(id) on delete cascade,
  token text not null unique,
  plataforma text,
  created_at timestamptz default now()
);

-- ============ VIEWS ============

-- Dízimo total por mês
create or replace view vw_dizimo_total_por_mes as
select
  dp.paroquia_id,
  date_trunc('month', dp.competencia) as mes,
  sum(dp.valor) filter (where dp.status = 'paga') as total_pago,
  count(*) filter (where dp.status = 'paga') as qtd_pagas,
  count(*) as qtd_total
from dizimo_parcelas dp
group by dp.paroquia_id, date_trunc('month', dp.competencia);

-- Dizimistas inadimplentes
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

-- Vendas evento resumo
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

-- Vendas por ponto de venda
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

-- Auto update updated_at
create or replace function trigger_set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- Apply to tables with updated_at
create trigger set_updated_at before update on profiles for each row execute function trigger_set_updated_at();
create trigger set_updated_at before update on paroquias for each row execute function trigger_set_updated_at();
create trigger set_updated_at before update on membros_paroquia for each row execute function trigger_set_updated_at();
create trigger set_updated_at before update on assinaturas for each row execute function trigger_set_updated_at();
create trigger set_updated_at before update on faturas for each row execute function trigger_set_updated_at();
create trigger set_updated_at before update on pagamentos for each row execute function trigger_set_updated_at();
create trigger set_updated_at before update on avisos for each row execute function trigger_set_updated_at();
create trigger set_updated_at before update on eventos for each row execute function trigger_set_updated_at();
create trigger set_updated_at before update on pastorais for each row execute function trigger_set_updated_at();
create trigger set_updated_at before update on dizimo_planos for each row execute function trigger_set_updated_at();
create trigger set_updated_at before update on dizimo_parcelas for each row execute function trigger_set_updated_at();
create trigger set_updated_at before update on eventos_pedidos for each row execute function trigger_set_updated_at();

-- Auto create profile on signup
create or replace function handle_new_user()
returns trigger as $$
begin
  insert into profiles (id, nome)
  values (new.id, coalesce(new.raw_user_meta_data->>'nome', new.email));
  return new;
end;
$$ language plpgsql security definer;

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

create trigger update_total_on_item_change
  after insert or update or delete on eventos_pedido_itens
  for each row execute function update_pedido_total();
