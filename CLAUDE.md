# workout-tracker – notes for Claude

## Testing (required)
- **Every new feature or bug fix must ship with Vitest tests** in the same change. Do not consider work done without them.
- Tests live next to the code in `__tests__/` folders (e.g. `lib/__tests__/days.test.ts`) and are named `*.test.ts`.
- Run `npm test` (single run) or `npm run test:watch` while developing. Run `npm test` and `npm run typecheck` before committing.
- Prefer testing pure logic (formatting, validation, input cleaning). For code that touches the DB, mock `lib/db` with `vi.mock` instead of hitting a real database.
- `npm run build` runs the tests first, so a failing test fails the Vercel deployment. Never skip, disable or delete a test just to get green.
