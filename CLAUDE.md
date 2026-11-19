# workout-tracker – notes for Claude

## Testing (required)
- **Every new feature or bug fix must ship with Vitest tests** in the same change. Do not consider work done without them.
- Tests live next to the code in `__tests__/` folders (e.g. `lib/__tests__/days.test.ts`) and are named `*.test.ts`.
- Run `npm test` (single run) or `npm run test:watch` while developing. Run `npm test` and `npm run typecheck` before committing.
- Prefer testing pure logic (formatting, validation, input cleaning). For code that touches the DB, mock `lib/db` with `vi.mock` instead of hitting a real database.
- `npm run build` runs the tests first, so a failing test fails the Vercel deployment. Never skip, disable or delete a test just to get green.

## Workflow
- Never push to `main`. Work on a branch and open a pull request; `main` only changes through merged PRs.
- The Vercel preview build runs `npm test`, so check that the PR's deployment is green before merging.

## Pull requests with UI changes
- Every PR that changes what the user sees must include **before and after screenshots** in its description (mobile width, ~430px, dark mode).
- Commit the images under `docs/pr/` on the PR branch and link them with `https://github.com/<owner>/<repo>/blob/<branch>/docs/pr/<file>.png?raw=true`. Remove `docs/pr/` before or when merging.
- If the app can't run (no database), render a static page with the real CSS/fonts and say so in the PR.
