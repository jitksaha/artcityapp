# Data loading optimization plan

Refactor the four targeted areas to use the canonical TanStack pattern: route `loader` calls `queryClient.ensureQueryData(queryOptions)`, component reads via `useSuspenseQuery(queryOptions)`. This gives:

- SSR-rendered first paint (no client loading spinner on initial visit for public pages)
- Shared `queryOptions` across loaders + components + prefetch
- Automatic prefetch on `Link` hover (`defaultPreload: "intent"`)
- Background revalidation via Query, not manual `useEffect` refetches

## 1. Shared query-options modules

Create co-located `*.queries.ts` files exporting `queryOptions(...)` factories so loader and component share the exact same key + fn:

- `src/lib/queries/public-talents.queries.ts` — `talentsListQuery(filters)`, `talentBySlugQuery(slug)`
- `src/lib/queries/admin.queries.ts` — `adminAnalyticsQuery`, `applicationsListQuery(filters)`, `castingListQuery(filters)`, `usersWithRolesQuery`, `appSettingsQuery`
- `src/lib/queries/dashboard.queries.ts` — `myProfileQuery`, `myMediaQuery`, `myStatusLogsQuery`

Each file wraps the existing server fn — no server-side changes.

## 2. Public talents directory (`/talents`)

- Add `validateSearch` (zod) for: `q, gender, category, language, location, nationality, playing_age, age_min, age_max, vip, featured, sort` → URL becomes the source of truth, filters are shareable, browser back/forward works.
- Add `loaderDeps` returning the validated search.
- `loader` calls `ensureQueryData(talentsListQuery(deps))`.
- Component reads with `useSuspenseQuery`; debounced inputs call `navigate({ search })` instead of local `useState`.
- Keep `placeholderData: prev` for smooth filter transitions.
- Define `errorComponent` + `notFoundComponent` (required by stack rules).

## 3. Single talent (`/talents/$slug`)

- `loader` ensures `talentBySlugQuery(slug)`; throws `notFound()` if missing.
- Component uses `useSuspenseQuery`.
- Add `errorComponent` + `notFoundComponent`.
- Hover on a `TalentCard` already triggers preload via router; no extra wiring needed because directory `<Link>` to this route resolves via the shared query key.

## 4. Authenticated dashboard (`/_authenticated/dashboard`)

- `loader` runs parallel prefetches via `ensureQueryData` (profile) + non-blocking `prefetchQuery` (media, status logs).
- Convert tab data reads to `useSuspenseQuery`.
- Replace existing `useQuery({ enabled })` chains with shared `queryOptions`.
- Add `errorComponent` + `notFoundComponent`.

## 5. Superadmin tables (`/_authenticated/superadmin`)

- Overview tab: loader `ensureQueryData(adminAnalyticsQuery)`.
- Other tabs (applications, casting, users, settings): wire shared `queryOptions`; prefetch the active tab's data in a `useEffect` when `view` changes (lightweight) + on sidebar hover via `queryClient.prefetchQuery`.
- Mutations call `queryClient.invalidateQueries` against the shared keys (already partly done) — standardize so list + detail keys invalidate together.

## 6. Router config

In `src/router.tsx`, confirm/set:
- `defaultPreload: "intent"`
- `defaultPreloadDelay: 50`
- `defaultPreloadStaleTime: 0` (let Query own freshness)
- `defaultPendingMs: 300`, `defaultPendingMinMs: 200`

## Out of scope

- No server-side changes (server fns + RLS untouched)
- No new tables, no schema changes
- No virtualization for superadmin tables (mentioned in the option but adds risk; can be a follow-up if any list exceeds ~200 rows in practice)

## Risk + rollout

- Public routes first (talents directory + slug) — easy to verify, biggest user-visible win.
- Then dashboard, then superadmin (behind auth, lower share-link risk).
- After each area, smoke-check in preview: first paint has data, filter changes don't blank the grid, deep links work.

## Estimated diff

~6 new query-options files (~30 lines each), 4 route files edited (~150 lines diff each), 1 router config tweak. No deletions of existing server logic.
