-- 1) Link definitive invoice to its originating pro forma (optional for traceability)
alter table public.invoices
  add column if not exists proforma_id uuid references public.invoices(id);

-- 2) Ensure numbers stay unique within each type, but pro forma and definitive sequences are independent
drop index if exists invoices_unique_number_per_type;
create unique index invoices_unique_number_per_type
  on public.invoices (invoice_number, is_pro_forma);

-- (no policy changes needed; existing RLS remains)