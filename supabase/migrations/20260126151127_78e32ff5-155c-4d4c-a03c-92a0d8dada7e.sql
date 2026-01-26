-- Add missing intervention details columns to invoices table
ALTER TABLE public.invoices 
ADD COLUMN IF NOT EXISTS work_description text,
ADD COLUMN IF NOT EXISTS intervention_description text,
ADD COLUMN IF NOT EXISTS frequency text,
ADD COLUMN IF NOT EXISTS findings text;