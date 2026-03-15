
-- Drop existing restrictive policies on invoices
DROP POLICY IF EXISTS "Users can view their own invoices" ON public.invoices;
DROP POLICY IF EXISTS "Users can create their own invoices" ON public.invoices;
DROP POLICY IF EXISTS "Users can update their own invoices" ON public.invoices;
DROP POLICY IF EXISTS "Users can delete their own invoices" ON public.invoices;

-- Drop existing restrictive policies on clients
DROP POLICY IF EXISTS "Users can view their own clients" ON public.clients;
DROP POLICY IF EXISTS "Users can create their own clients" ON public.clients;
DROP POLICY IF EXISTS "Users can update their own clients" ON public.clients;
DROP POLICY IF EXISTS "Users can delete their own clients" ON public.clients;

-- Drop existing restrictive policies on zones
DROP POLICY IF EXISTS "Users can view their own zones" ON public.zones;
DROP POLICY IF EXISTS "Users can create their own zones" ON public.zones;
DROP POLICY IF EXISTS "Users can update their own zones" ON public.zones;
DROP POLICY IF EXISTS "Users can delete their own zones" ON public.zones;

-- New shared policies for invoices
CREATE POLICY "Authenticated users can view all invoices" ON public.invoices FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can create invoices" ON public.invoices FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Authenticated users can update all invoices" ON public.invoices FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Authenticated users can delete all invoices" ON public.invoices FOR DELETE TO authenticated USING (true);

-- New shared policies for clients
CREATE POLICY "Authenticated users can view all clients" ON public.clients FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can create clients" ON public.clients FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Authenticated users can update all clients" ON public.clients FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Authenticated users can delete all clients" ON public.clients FOR DELETE TO authenticated USING (true);

-- New shared policies for zones
CREATE POLICY "Authenticated users can view all zones" ON public.zones FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can create zones" ON public.zones FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Authenticated users can update all zones" ON public.zones FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Authenticated users can delete all zones" ON public.zones FOR DELETE TO authenticated USING (true);
