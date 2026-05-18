## Plan: Add Media Uploads step to /register

Add a new **Step 7 — Media Uploads** to the existing multi-step registration form, covering all required casting media plus an external showreel link.

### Fields to add

| Field | Type | Notes |
|---|---|---|
| Headshot | single image upload | required; jpg/png/webp; max 5MB |
| Medium Shots | multi-image upload (up to 4) | optional; jpg/png/webp; max 5MB each |
| Full-Body Photo | single image upload | required; jpg/png/webp; max 5MB |
| Voice Reel | single audio upload | optional; mp3/wav/m4a; max 15MB |
| CV / Resume | single document upload | optional; pdf/doc/docx; max 5MB |
| Showreel Link | URL text field | optional; validated as URL (YouTube/Vimeo/etc.) |

### Files to change

1. **`src/components/register/schema.ts`**
   - Add Zod fields: `headshot` (File, required), `mediumShots` (File[] max 4, optional), `fullBodyPhoto` (File, required), `voiceReel` (File, optional), `cv` (File, optional), `showreelLink` (URL string, optional).
   - Per-file size + MIME validation via `.refine`.
   - Append a new `STEP_FIELDS` entry for step 7 listing these field names.

2. **`src/components/register/Steps.tsx`**
   - Add a `MultiFileField` helper (new) that wraps `<Input type="file" multiple>`, enforces max-file count, and lists selected file names with remove buttons.
   - Reuse existing `FileField` and `TextField` for single-file and URL inputs.
   - Export a new `Step7()` component with bilingual labels (English + Kurdish) and a small "Upload guidelines" note (accepted formats / size limits).

3. **`src/routes/register.tsx`**
   - Add `Step7` to the `STEPS` array with label `"Media"`.
   - Extend `defaultValues` with `mediumShots: []`, `showreelLink: ""` (file fields stay `undefined`).
   - No other logic changes — the existing `next()` validator already drives off `STEP_FIELDS`.

### Out of scope (not in this change)
- Actual file upload to Supabase Storage (no bucket exists yet) — files will only be validated client-side and logged in the existing `onSubmit` handler.
- Image cropping / previews beyond filename display.
- Backend persistence.

Once approved I'll implement the three file edits above.