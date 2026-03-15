
CREATE TABLE public.intervention_types (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  name text NOT NULL,
  description text NOT NULL DEFAULT '',
  is_default boolean NOT NULL DEFAULT false,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.intervention_types ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view all intervention types"
  ON public.intervention_types FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can create intervention types"
  ON public.intervention_types FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Authenticated users can update all intervention types"
  ON public.intervention_types FOR UPDATE TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can delete all intervention types"
  ON public.intervention_types FOR DELETE TO authenticated
  USING (true);
