GRANT INSERT ON public.casting_requests TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.casting_requests TO authenticated;
GRANT ALL ON public.casting_requests TO service_role;

DROP POLICY IF EXISTS "Anyone submits casting request" ON public.casting_requests;
CREATE POLICY "Anyone can submit casting requests"
ON public.casting_requests
FOR INSERT
TO anon, authenticated
WITH CHECK (true);