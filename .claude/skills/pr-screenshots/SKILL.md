---
name: pr-screenshots
description: Add before/after screenshots to a pull request. Use whenever you are about to create or update a PR that changes anything the user sees (UI, layout, CSS, copy), or when the user asks for before/after images in a PR.
---

# PR before/after screenshots

Every PR that changes what the user sees needs a **before** and **after** screenshot in its description.

## Steps
1. **Capture "before" first**, from the base branch (`git show <base>:path` or `git stash`), before the change is lost from view.
2. **Render the page.**
   - If the app runs (DB/env available), use Playwright against it: `chromium.launch()` needs no options, viewport 430×760, `deviceScaleFactor: 2`, dark mode if the app is dark.
   - If it can't run (no database), build a static HTML page that uses the project's **real CSS and fonts** (`@font-face` with `file://` paths to `node_modules`), fill it with realistic data, and compute any logic-driven values by calling the real function (e.g. `node --experimental-strip-types`). Do not hand-type values the code would compute.
3. **Look at both images** (Read tool) before using them. Check RTL/bidi text, overflow and cut-off content. Fix and re-shoot if wrong.
4. **Commit** the images to the PR branch under `docs/pr/before.png` and `docs/pr/after.png`, and push. Note the commit SHA: `git rev-parse HEAD`.
5. **Link them in the PR body** as a table:
   `![](https://github.com/<owner>/<repo>/blob/<sha>/docs/pr/after.png?raw=true)`
   Always use the **commit SHA** from step 4, never the branch name. A branch link breaks once `docs/pr/` is deleted before merging; a SHA link keeps working forever.
6. **State honestly how they were made.** If they came from a static page and not the running app, say so in the PR.
7. **Remind the user** to delete `docs/pr/` before or when merging (or squash and remove). The SHA links keep working after that.
8. When a PR changes again, re-shoot "after", push it, and update the PR body to the new commit SHA.

## Notes
- Say which screens were not captured (e.g. an edit page) rather than implying coverage.
- Never commit scratch files other than the two images.
