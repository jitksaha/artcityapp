DROP POLICY IF EXISTS "Anyone can submit casting requests" ON public.casting_requests;

CREATE POLICY "Anyone can submit valid casting requests"
ON public.casting_requests
FOR INSERT
TO anon, authenticated
WITH CHECK (
  contact_person IS NOT NULL
  AND length(contact_person) BETWEEN 1 AND 150
  AND email IS NOT NULL
  AND length(email) BETWEEN 5 AND 255
  AND email LIKE '%@%'
  AND production_title IS NOT NULL
  AND length(production_title) BETWEEN 1 AND 200
  AND (phone IS NULL OR length(phone) <= 40)
  AND (company_name IS NULL OR length(company_name) <= 200)
  AND (message IS NULL OR length(message) <= 5000)
  AND (role_description IS NULL OR length(role_description) <= 5000)
  AND (shooting_location IS NULL OR length(shooting_location) <= 200)
  AND (shooting_dates IS NULL OR length(shooting_dates) <= 200)
  AND (production_type IS NULL OR length(production_type) <= 80)
  AND (budget_range IS NULL OR length(budget_range) <= 80)
  AND (requested_talent_name IS NULL OR length(requested_talent_name) <= 200)
);