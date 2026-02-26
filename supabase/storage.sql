-- ============================================================
-- PARÓQUIA EM DIA — Storage Buckets + Policies
-- ============================================================

-- Create buckets
insert into storage.buckets (id, name, public) values ('avatars', 'avatars', true);
insert into storage.buckets (id, name, public) values ('paroquias', 'paroquias', true);
insert into storage.buckets (id, name, public) values ('avisos', 'avisos', true);
insert into storage.buckets (id, name, public) values ('eventos', 'eventos', true);
insert into storage.buckets (id, name, public) values ('comprovantes', 'comprovantes', false);
insert into storage.buckets (id, name, public) values ('produtos', 'produtos', true);

-- Avatars: user can upload own avatar
create policy "Users can upload avatars" on storage.objects for insert
  with check (bucket_id = 'avatars' and auth.uid()::text = (storage.foldername(name))[1]);
create policy "Avatars are public" on storage.objects for select
  using (bucket_id = 'avatars');
create policy "Users can update own avatar" on storage.objects for update
  using (bucket_id = 'avatars' and auth.uid()::text = (storage.foldername(name))[1]);

-- Paroquias: admin can upload
create policy "Admin can upload paroquia files" on storage.objects for insert
  with check (bucket_id = 'paroquias' and auth.role() = 'authenticated');
create policy "Paroquia files are public" on storage.objects for select
  using (bucket_id = 'paroquias');

-- Avisos: admin can upload
create policy "Admin can upload aviso files" on storage.objects for insert
  with check (bucket_id = 'avisos' and auth.role() = 'authenticated');
create policy "Aviso files are public" on storage.objects for select
  using (bucket_id = 'avisos');

-- Eventos: admin can upload
create policy "Admin can upload evento files" on storage.objects for insert
  with check (bucket_id = 'eventos' and auth.role() = 'authenticated');
create policy "Evento files are public" on storage.objects for select
  using (bucket_id = 'eventos');

-- Comprovantes: private
create policy "User can upload comprovante" on storage.objects for insert
  with check (bucket_id = 'comprovantes' and auth.role() = 'authenticated');
create policy "Admin can view comprovantes" on storage.objects for select
  using (bucket_id = 'comprovantes' and auth.role() = 'authenticated');

-- Produtos: admin can upload
create policy "Admin can upload produto files" on storage.objects for insert
  with check (bucket_id = 'produtos' and auth.role() = 'authenticated');
create policy "Produto files are public" on storage.objects for select
  using (bucket_id = 'produtos');
