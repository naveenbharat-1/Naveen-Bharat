
## Root Cause: Missing `lovable.toml`

The build error "no package.json found" and "no command found for task dev" is caused by a missing `lovable.toml` file. The project has `package.json` with `dev: "vite"` and `vite.config.ts` serving on port 5000 — all correct. Lovable's build system requires a `lovable.toml` to wire the dev command. This is the **critical fix** that restores the preview.

---

## Plan

### 1. Create `lovable.toml` (Critical - fixes blank preview)

```toml
[run]
dev = "npm run dev"
```

This tells Lovable's runner to use `npm run dev` (which invokes `vite` on port 5000).

---

### 2. Visual Polish — CSS & Theme Improvements

Update `src/index.css` to add:
- Smooth card hover transitions (lift + shadow)
- Consistent button focus rings
- Course card polish (uniform border, shadow, hover transform)
- Better form input focus styles

Update `src/pages/Index.tsx` branding:
- The nav still shows "Sadguru Coaching Classes" — update text to match current brand direction
- Hero title already uses `data?.title` which is dynamic, so it's fine

---

### 3. Landing Page & Navigation Visual Fixes

In `src/pages/Index.tsx`:
- The nav logo `alt` text and brand name span say "Sadguru Coaching Classes" — update to match
- Add a subtle gradient shadow under the sticky nav for depth
- Ensure mobile Sheet menu has proper styling

---

### 4. Global Component Polish in `src/index.css`

Add utility classes:
- `.card-hover` — `transition-all duration-200 hover:-translate-y-1 hover:shadow-lg`
- `.btn-primary` — consistent gradient button style
- Improve the progress thumb hit area on mobile (larger touch target)
- Ensure consistent border-radius across cards

---

### 5. Branding Consistency

In `src/components/video/MahimaGhostPlayer.tsx`:
- The watermark text currently references "Mahima Academy" (updated in prior session) — verify and keep
- The `sadguru_player_volume` localStorage key should stay (internal, not visible to user)

In `src/pages/AdminUpload.tsx`:
- `watermarkText` default is "Sadguru Coaching Classes" — keep consistent with platform branding

---

## Files to Modify

| File | Change |
|------|--------|
| `lovable.toml` | **Create** — add `[run] dev = "npm run dev"` |
| `src/index.css` | Add card hover, button, form, and progress bar visual improvements |
| `src/pages/Index.tsx` | Minor nav branding text update |

## Files NOT Changed
- `MahimaGhostPlayer.tsx` — video player watermark/timing logic untouched
- `LessonView.tsx` — progress tracking logic untouched
- `AdminUpload.tsx` — MIME validation untouched
- All Supabase integration files — untouched

---

## Note on Visual Editor

The prompt asks to use Lovable's Visual Editor mode. However, Visual Editor is a frontend browser tool for the user to use interactively — it cannot be operated by the AI programmatically. The AI makes CSS/code changes directly which achieves the same result. The improvements above are implemented through code, which is equivalent to (and more reliable than) manual Visual Editor use.
