# Cloudflare baad — Static SPA + Supabase Edge Functions migration

Apnar app ekhon TanStack Start SSR mode-e Cloudflare Workers chalachhe. cPanel-e static `dist/` upload korte hole pura architecture change korte hobe. Eta boro kaj — sob server function ar `/api/public/*` route Supabase Edge Functions-e port korte hobe.

## Scope

### 1. Build system — SSR theke SPA mode

- `vite.config.ts` theke `@lovable.dev/vite-tanstack-config` baad diye plain `@tanstack/router-plugin` + `@vitejs/plugin-react` use korbo
- TanStack Router-er `spa: true` / prerender disabled
- Cloudflare-related file delete: `wrangler.jsonc`, `src/server.ts`, `src/start.ts`
- `package.json` theke `@cloudflare/vite-plugin`, `wrangler`, `@lovable.dev/vite-tanstack-config` remove
- `npm run build` shudhu `dist/` (static files) banabe — kono Worker bundle na
- `public/.htaccess` add korbo Apache SPA fallback-er jonno (cPanel-e darkar)

### 2. Server functions → Supabase Edge Functions migrate

Ei file gulor logic Edge Functions-e move korte hobe:

| Current server fn / route | Naya Edge Function |
|---|---|
| `src/lib/casting-requests.functions.ts` | `submit-casting-request` |
| `src/lib/admin.functions.ts` (listUsersWithRoles, setUserRole, updateAppSettings) | `admin-users`, `admin-settings` |
| `src/lib/talents.functions.ts` | `talents-crud` |
| `src/lib/public-talents.functions.ts` | `public-talents` |
| `src/lib/applicant-auth.functions.ts` | `applicant-auth` |
| `src/routes/api/public/talents.ts` + `v1/talents.ts` | `public-talents` (same fn) |
| `src/routes/api/public/talents.$slug.ts` + v1 | `public-talents` (?slug=) |
| `src/routes/api/public/casting-requests.ts` + v1 | `submit-casting-request` |
| `src/routes/api/public/applications.ts` + v1 | `applicant-apply` |
| `src/routes/api/public/auth.login.ts` + v1 | `applicant-auth` (?action=login) |

WordPress embed code (`DeveloperApiTab.tsx`) update korbo new Supabase Edge Function URL diye: `https://cgpahbxeumfwutkbocjk.supabase.co/functions/v1/public-talents`

### 3. Frontend refactor

- Sob `useServerFn(...)` call replace korte hobe `supabase.functions.invoke(...)` diye
- Auth middleware (`requireSupabaseAuth`) Edge Functions e port — manually JWT verify
- Admin client (`supabaseAdmin`) eki vabe — Edge Functions-e service role key access kore
- `_authenticated` route layout same thakbe (client-side gate already `ssr: false`)
- Loader-based data fetching → component-level `useQuery` (since no SSR)

### 4. SEO impact (⚠️ guruttopurno)

SSR chole jachhe = social share-e OG tags blank dekhabe, search engine crawl-e shudhu empty shell pabe initially. Public talent profile pages (`/talents/$slug`) — search ranking-e khoti hote pare. Kintu cPanel static hosting-e ei trade-off lagbei.

## Technical Details

**File changes (estimate):**
- DELETE: `src/server.ts`, `src/start.ts`, `wrangler.jsonc`, `src/lib/error-capture.ts`, all `src/routes/api/` (10 files), all `*.functions.ts` (6 files), `src/integrations/supabase/auth-middleware.ts`, `auth-attacher.ts`, `client.server.ts`
- CREATE: 6 new Edge Functions under `supabase/functions/`
- EDIT: `vite.config.ts`, `package.json`, `src/router.tsx`, `src/routes/__root.tsx`, every component using `useServerFn` (~10 files), `public/.htaccess`

**After migration, user workflow:**
```bash
npm install
npm run build      # produces dist/ — pure static HTML/JS/CSS
# Upload dist/* + .htaccess to cPanel public_html
```

Edge Functions auto-deploy from Lovable when changed.

**404 fix:** `public/.htaccess` will rewrite all non-file URLs to `index.html` so deep links work on cPanel Apache.

## Risks

1. **Big refactor** — 25+ files. Bug come kora ar test korar somoy lagbe.
2. **No SSR SEO** — Public talent pages crawl/share preview lose hobe.
3. **Auth flows** — Login/signup chalu rakhar jonno Edge Functions thik kore JWT verify korte hobe.
4. **Email verification, password reset** — Supabase Auth direct-e cholbe, but redirect URLs cPanel domain-e set korte hobe Supabase dashboard-e.

## Question

Eta confirm korle ami sob ekbar-e refactor korbo (boro patch). Confirm korar age — apnar **cPanel-er final domain ki**? Edge Functions CORS ar Supabase Auth redirect URL ote configure korte hobe.