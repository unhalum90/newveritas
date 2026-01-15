-- Fix 1: Make credit_balances view respect RLS of the invoker
-- Only works on Postgres 15+ (Supabase default)
ALTER VIEW public.credit_balances SET (security_invoker = true);

-- Fix 2: Enable RLS on cultural_data
ALTER TABLE public.cultural_data ENABLE ROW LEVEL SECURITY;

-- Allow everyone to read cultural_data (it appears to be public reference data)
CREATE POLICY "Public read access for cultural_data"
ON public.cultural_data FOR SELECT
TO anon, authenticated
USING (true);

-- Fix 3: Enable RLS on memories
ALTER TABLE public.memories ENABLE ROW LEVEL SECURITY;

-- Enable public read for memories (assuming this is a public timeline feature)
-- If this was private, we'd need a user_id column.
CREATE POLICY "Public read access for memories"
ON public.memories FOR SELECT
TO anon, authenticated
USING (true);

-- Note: Writes for these tables remain restricted to Postgres Admin / Service Role by default
-- since no INSERT/UPDATE policies are creating for anon/authenticated.
