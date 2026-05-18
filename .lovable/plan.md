## Goal

In the read-only profile preview, show a snapshot label with submission date and version number, and let the user switch between two views:

- **Draft** — the current in-progress profile data
- **Last submitted** — a frozen snapshot of what was sent for review

## What needs to change

### 1. Database — store submitted snapshots

Currently `talent_profiles` holds only the live working row. There is no record of what the talent looked like at submission time, so "switch to last submitted" cannot be reconstructed.

Add a new table `talent_submissions`:

- `id uuid pk`
- `talent_id uuid` (the profile)
- `user_id uuid` (owner, for RLS)
- `version int` (1, 2, 3… auto-incremented per talent)
- `submitted_at timestamptz`
- `snapshot jsonb` — full copy of the talent_profiles row at submit time
- `media_snapshot jsonb` — array of media_uploads rows at submit time

RLS:
- Owner can SELECT their own submissions
- Staff can SELECT all
- INSERT only via a SECURITY DEFINER function called from the submit server fn

Trigger / function: when the existing `submitTalent` server function flips status from `draft`/`needs_revision` → `submitted`, also insert a snapshot row with the next version number.

### 2. Server function

- Extend `getMyTalent` (or add `getMyTalentWithSubmissions`) to also return the list of submissions (id, version, submitted_at) and the latest submission's full snapshot + media_snapshot.

### 3. Preview UI (`src/routes/_authenticated/preview.tsx`)

- Add a snapshot label badge at the top:
  - Draft view: "Draft — last edited {updated_at}"
  - Submitted view: "Submitted v{version} — {submitted_at}"
- Add a toggle (segmented control: "Draft" / "Last submitted v{n}"). The submitted option is disabled with a tooltip when no submission exists yet.
- When "Last submitted" is selected, render `TalentPublicView` and the directory card preview from the snapshot data instead of the live draft.
- Keep the existing approval-gating rule (VIP/Featured hidden unless status is approved/published) for both views.

## Technical details

- Migration file: `supabase/migrations/<ts>_talent_submissions.sql`
- New SECURITY DEFINER function `record_talent_submission(_talent_id uuid)` that copies the current row + media into the new table and returns the new version number.
- `submitTalent` server fn calls this function inside the same flow after the status update succeeds.
- New file: `src/components/PreviewSnapshotSwitcher.tsx` — the segmented toggle + label.
- `preview.tsx` holds local state `view: "draft" | "submitted"` and picks the data source accordingly.

## Out of scope

- Full revision history browser (only "latest submitted" is exposed in the toggle, even though all versions are stored).
- Diffing between draft and submitted.
- Restoring a submission back into the draft.