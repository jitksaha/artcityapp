REVOKE SELECT, UPDATE, DELETE ON public.casting_requests FROM anon;
GRANT INSERT ON public.casting_requests TO anon;
GRANT SELECT (id, created_at) ON public.casting_requests TO anon;

DROP POLICY IF EXISTS "Anonymous reads casting request receipts" ON public.casting_requests;
CREATE POLICY "Anonymous reads casting request receipts"
ON public.casting_requests
FOR SELECT
TO anon
USING (true);