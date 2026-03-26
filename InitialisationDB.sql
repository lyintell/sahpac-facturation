-- Enable UUID generation
create extension if not exists "pgcrypto";

-- Clients
create table if not exists public.clients (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  address text,
  phone text,
  email text,
  created_at timestamptz not null default now()
);

-- Zones
create table if not exists public.zones (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  created_at timestamptz not null default now()
);

-- Intervention types
create table if not exists public.intervention_types (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  name text not null,
  description text not null default '',
  is_default boolean not null default false,
  standard_price numeric not null default 0,
  created_at timestamptz not null default now()
);

-- Invoices
create table if not exists public.invoices (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  invoice_number text not null,
  client_id uuid not null references public.clients(id) on delete cascade,
  client_name text not null,
  client_address text,
  date timestamptz not null default now(),
  intervention_type_id text not null,
  intervention_type_name text not null,
  work_description text,
  intervention_description text,
  frequency text,
  findings text,
  zone_ids text[] not null default '{}',
  zone_names text[] not null default '{}',
  items jsonb not null default '[]'::jsonb,
  subtotal numeric not null default 0,
  tva_rate numeric not null default 18,
  tva_amount numeric not null default 0,
  total_amount numeric not null default 0,
  include_tva boolean not null default true,
  observations text,
  is_pro_forma boolean not null default true,
  status text default 'pending',
  paid_amount numeric not null default 0,
  paid_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Timestamp trigger
create or replace function public.update_updated_at_column()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql set search_path = public;

drop trigger if exists update_invoices_updated_at on public.invoices;
create trigger update_invoices_updated_at
  before update on public.invoices
  for each row
  execute function public.update_updated_at_column();

-- Enable RLS
alter table public.clients enable row level security;
alter table public.zones enable row level security;
alter table public.intervention_types enable row level security;
alter table public.invoices enable row level security;

-- Policies (shared access model)
drop policy if exists "Authenticated users can view all clients" on public.clients;
drop policy if exists "Authenticated users can create clients" on public.clients;
drop policy if exists "Authenticated users can update all clients" on public.clients;
drop policy if exists "Authenticated users can delete all clients" on public.clients;

create policy "Authenticated users can view all clients"
  on public.clients for select to authenticated using (true);
create policy "Authenticated users can create clients"
  on public.clients for insert to authenticated with check (auth.uid() = user_id);
create policy "Authenticated users can update all clients"
  on public.clients for update to authenticated using (true);
create policy "Authenticated users can delete all clients"
  on public.clients for delete to authenticated using (true);

drop policy if exists "Authenticated users can view all zones" on public.zones;
drop policy if exists "Authenticated users can create zones" on public.zones;
drop policy if exists "Authenticated users can update all zones" on public.zones;
drop policy if exists "Authenticated users can delete all zones" on public.zones;

create policy "Authenticated users can view all zones"
  on public.zones for select to authenticated using (true);
create policy "Authenticated users can create zones"
  on public.zones for insert to authenticated with check (auth.uid() = user_id);
create policy "Authenticated users can update all zones"
  on public.zones for update to authenticated using (true);
create policy "Authenticated users can delete all zones"
  on public.zones for delete to authenticated using (true);

drop policy if exists "Authenticated users can view all intervention types" on public.intervention_types;
drop policy if exists "Authenticated users can create intervention types" on public.intervention_types;
drop policy if exists "Authenticated users can update all intervention types" on public.intervention_types;
drop policy if exists "Authenticated users can delete all intervention types" on public.intervention_types;

create policy "Authenticated users can view all intervention types"
  on public.intervention_types for select to authenticated using (true);
create policy "Authenticated users can create intervention types"
  on public.intervention_types for insert to authenticated with check (auth.uid() = user_id);
create policy "Authenticated users can update all intervention types"
  on public.intervention_types for update to authenticated using (true);
create policy "Authenticated users can delete all intervention types"
  on public.intervention_types for delete to authenticated using (true);

drop policy if exists "Authenticated users can view all invoices" on public.invoices;
drop policy if exists "Authenticated users can create invoices" on public.invoices;
drop policy if exists "Authenticated users can update all invoices" on public.invoices;
drop policy if exists "Authenticated users can delete all invoices" on public.invoices;

create policy "Authenticated users can view all invoices"
  on public.invoices for select to authenticated using (true);
create policy "Authenticated users can create invoices"
  on public.invoices for insert to authenticated with check (auth.uid() = user_id);
create policy "Authenticated users can update all invoices"
  on public.invoices for update to authenticated using (true);
create policy "Authenticated users can delete all invoices"
  on public.invoices for delete to authenticated using (true);