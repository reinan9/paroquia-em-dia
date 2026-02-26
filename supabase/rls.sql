-- ============================================================
-- PARÓQUIA EM DIA — RLS (Row Level Security)
-- ============================================================

-- ============ HELPER FUNCTIONS ============

-- Check if user is super_admin
create or replace function is_super_admin()
returns boolean as $$
  select exists (
    select 1 from membros_paroquia
    where user_id = auth.uid()
    and role = 'super_admin'
    and status = 'active'
  );
$$ language sql security definer stable;

-- Check if user is member of a paroquia
create or replace function is_member_of_paroquia(p_paroquia_id uuid)
returns boolean as $$
  select exists (
    select 1 from membros_paroquia
    where user_id = auth.uid()
    and paroquia_id = p_paroquia_id
    and status = 'active'
  );
$$ language sql security definer stable;

-- Get role in paroquia
create or replace function role_in_paroquia(p_paroquia_id uuid)
returns membro_role as $$
  select role from membros_paroquia
  where user_id = auth.uid()
  and paroquia_id = p_paroquia_id
  and status = 'active'
  limit 1;
$$ language sql security definer stable;

-- Check if paroquia has active subscription
create or replace function assinatura_ativa(p_paroquia_id uuid)
returns boolean as $$
  select exists (
    select 1 from assinaturas
    where paroquia_id = p_paroquia_id
    and status = 'active'
  );
$$ language sql security definer stable;

-- Check if user can manage a paroquia (admin or secretaria)
create or replace function can_manage_paroquia(p_paroquia_id uuid)
returns boolean as $$
  select exists (
    select 1 from membros_paroquia
    where user_id = auth.uid()
    and paroquia_id = p_paroquia_id
    and status = 'active'
    and role in ('super_admin', 'paroquia_admin', 'secretaria')
  );
$$ language sql security definer stable;

-- Check if user can operate a PDV
create or replace function can_operate_pdv(p_ponto_venda_id uuid)
returns boolean as $$
  select exists (
    select 1 from eventos_pontos_venda pv
    join membros_paroquia mp on mp.paroquia_id = pv.paroquia_id and mp.user_id = auth.uid()
    where pv.id = p_ponto_venda_id
    and mp.status = 'active'
    and (
      pv.operador_id = auth.uid()
      or mp.role in ('super_admin', 'paroquia_admin', 'secretaria')
    )
  );
$$ language sql security definer stable;

-- ============ ENABLE RLS ON ALL TABLES ============
alter table profiles enable row level security;
alter table paroquias enable row level security;
alter table membros_paroquia enable row level security;
alter table planos enable row level security;
alter table assinaturas enable row level security;
alter table faturas enable row level security;
alter table pagamentos enable row level security;
alter table avisos enable row level security;
alter table banners enable row level security;
alter table eventos enable row level security;
alter table pastorais enable row level security;
alter table pastoral_membros enable row level security;
alter table pedidos_oracao enable row level security;
alter table dizimistas enable row level security;
alter table dizimo_planos enable row level security;
alter table dizimo_parcelas enable row level security;
alter table eventos_pontos_venda enable row level security;
alter table eventos_produtos enable row level security;
alter table eventos_pedidos enable row level security;
alter table eventos_pedido_itens enable row level security;
alter table eventos_mov_estoque enable row level security;
alter table device_tokens enable row level security;

-- ============ POLICIES ============

-- PROFILES
create policy "Users can view own profile" on profiles for select using (id = auth.uid());
create policy "Users can update own profile" on profiles for update using (id = auth.uid());
create policy "Members can view other profiles" on profiles for select using (
  exists (
    select 1 from membros_paroquia m1
    join membros_paroquia m2 on m1.paroquia_id = m2.paroquia_id
    where m1.user_id = auth.uid() and m2.user_id = profiles.id
  )
);

-- PLANOS (public read)
create policy "Anyone can view plans" on planos for select using (true);

-- PARÓQUIAS
create policy "Members can view their paroquias" on paroquias for select using (
  is_member_of_paroquia(id) or is_super_admin()
);
create policy "Authenticated can create paroquia" on paroquias for insert with check (auth.uid() = criado_por);
create policy "Admin can update paroquia" on paroquias for update using (can_manage_paroquia(id));

-- MEMBROS_PAROQUIA
create policy "Members can view members" on membros_paroquia for select using (
  is_member_of_paroquia(paroquia_id) or is_super_admin()
);
create policy "Admin can manage members" on membros_paroquia for insert with check (can_manage_paroquia(paroquia_id));
create policy "Admin can update members" on membros_paroquia for update using (can_manage_paroquia(paroquia_id));
create policy "Admin can delete members" on membros_paroquia for delete using (can_manage_paroquia(paroquia_id));
create policy "User can insert own membership" on membros_paroquia for insert with check (user_id = auth.uid());

-- ASSINATURAS
create policy "Admin can view assinaturas" on assinaturas for select using (
  can_manage_paroquia(paroquia_id) or is_super_admin()
);
create policy "System can manage assinaturas" on assinaturas for all using (is_super_admin());

-- FATURAS
create policy "Admin can view faturas" on faturas for select using (
  exists (
    select 1 from assinaturas a where a.id = faturas.assinatura_id and can_manage_paroquia(a.paroquia_id)
  ) or is_super_admin()
);

-- PAGAMENTOS
create policy "Admin can view pagamentos" on pagamentos for select using (
  can_manage_paroquia(paroquia_id) or is_super_admin()
);
create policy "Members can view own pagamentos" on pagamentos for select using (
  is_member_of_paroquia(paroquia_id)
);

-- AVISOS
create policy "Members can view avisos" on avisos for select using (
  is_member_of_paroquia(paroquia_id)
);
create policy "Admin can manage avisos" on avisos for insert with check (can_manage_paroquia(paroquia_id));
create policy "Admin can update avisos" on avisos for update using (can_manage_paroquia(paroquia_id));
create policy "Admin can delete avisos" on avisos for delete using (can_manage_paroquia(paroquia_id));

-- BANNERS
create policy "Members can view banners" on banners for select using (
  is_member_of_paroquia(paroquia_id)
);
create policy "Admin can manage banners" on banners for all using (can_manage_paroquia(paroquia_id));

-- EVENTOS
create policy "Members can view eventos" on eventos for select using (
  is_member_of_paroquia(paroquia_id)
);
create policy "Admin can manage eventos" on eventos for insert with check (can_manage_paroquia(paroquia_id));
create policy "Admin can update eventos" on eventos for update using (can_manage_paroquia(paroquia_id));
create policy "Admin can delete eventos" on eventos for delete using (can_manage_paroquia(paroquia_id));

-- PASTORAIS
create policy "Members can view pastorais" on pastorais for select using (
  is_member_of_paroquia(paroquia_id)
);
create policy "Admin can manage pastorais" on pastorais for insert with check (can_manage_paroquia(paroquia_id));
create policy "Admin can update pastorais" on pastorais for update using (can_manage_paroquia(paroquia_id));
create policy "Admin can delete pastorais" on pastorais for delete using (can_manage_paroquia(paroquia_id));

-- PASTORAL_MEMBROS
create policy "Members can view pastoral members" on pastoral_membros for select using (
  exists (
    select 1 from pastorais p where p.id = pastoral_membros.pastoral_id
    and is_member_of_paroquia(p.paroquia_id)
  )
);
create policy "Coord can manage pastoral members" on pastoral_membros for all using (
  exists (
    select 1 from pastorais p where p.id = pastoral_membros.pastoral_id
    and (can_manage_paroquia(p.paroquia_id) or p.coordenador_id = auth.uid())
  )
);

-- PEDIDOS DE ORAÇÃO
create policy "Members can view approved requests" on pedidos_oracao for select using (
  is_member_of_paroquia(paroquia_id) and (status = 'aprovado' or user_id = auth.uid())
);
create policy "Members can create prayer requests" on pedidos_oracao for insert with check (
  is_member_of_paroquia(paroquia_id)
);
create policy "Admin can moderate prayers" on pedidos_oracao for update using (can_manage_paroquia(paroquia_id));

-- DIZIMISTAS
create policy "User can view own dizimista" on dizimistas for select using (
  user_id = auth.uid() or can_manage_paroquia(paroquia_id)
);
create policy "Members can register as dizimista" on dizimistas for insert with check (
  user_id = auth.uid() and is_member_of_paroquia(paroquia_id)
);

-- DIZIMO_PLANOS
create policy "User can view own dizimo plans" on dizimo_planos for select using (
  exists (select 1 from dizimistas d where d.id = dizimo_planos.dizimista_id and d.user_id = auth.uid())
  or can_manage_paroquia(paroquia_id)
);
create policy "User can create dizimo plan" on dizimo_planos for insert with check (
  exists (select 1 from dizimistas d where d.id = dizimo_planos.dizimista_id and d.user_id = auth.uid())
);
create policy "Admin can manage dizimo plans" on dizimo_planos for all using (can_manage_paroquia(paroquia_id));

-- DIZIMO_PARCELAS
create policy "User can view own parcelas" on dizimo_parcelas for select using (
  exists (
    select 1 from dizimo_planos dp
    join dizimistas d on d.id = dp.dizimista_id
    where dp.id = dizimo_parcelas.plano_id
    and d.user_id = auth.uid()
  ) or can_manage_paroquia(paroquia_id)
);
create policy "Admin can manage parcelas" on dizimo_parcelas for all using (can_manage_paroquia(paroquia_id));

-- PDV: PONTOS DE VENDA
create policy "Members can view pdv" on eventos_pontos_venda for select using (
  is_member_of_paroquia(paroquia_id)
);
create policy "Admin can manage pdv" on eventos_pontos_venda for all using (can_manage_paroquia(paroquia_id));

-- PDV: PRODUTOS
create policy "Members can view products" on eventos_produtos for select using (
  is_member_of_paroquia(paroquia_id)
);
create policy "Admin can manage products" on eventos_produtos for all using (can_manage_paroquia(paroquia_id));

-- PDV: PEDIDOS
create policy "Operator can view orders" on eventos_pedidos for select using (
  can_operate_pdv(ponto_venda_id) or can_manage_paroquia(paroquia_id)
);
create policy "Operator can create orders" on eventos_pedidos for insert with check (
  can_operate_pdv(ponto_venda_id)
);
create policy "Operator can update orders" on eventos_pedidos for update using (
  can_operate_pdv(ponto_venda_id)
);

-- PDV: PEDIDO ITENS
create policy "Operator can view order items" on eventos_pedido_itens for select using (
  exists (
    select 1 from eventos_pedidos ep where ep.id = eventos_pedido_itens.pedido_id
    and (can_operate_pdv(ep.ponto_venda_id) or can_manage_paroquia(ep.paroquia_id))
  )
);
create policy "Operator can manage order items" on eventos_pedido_itens for all using (
  exists (
    select 1 from eventos_pedidos ep where ep.id = eventos_pedido_itens.pedido_id
    and can_operate_pdv(ep.ponto_venda_id)
  )
);

-- ESTOQUE
create policy "Admin can manage stock" on eventos_mov_estoque for all using (
  exists (
    select 1 from eventos_produtos ep where ep.id = eventos_mov_estoque.produto_id
    and can_manage_paroquia(ep.paroquia_id)
  )
);

-- DEVICE TOKENS
create policy "User can manage own tokens" on device_tokens for all using (user_id = auth.uid());
