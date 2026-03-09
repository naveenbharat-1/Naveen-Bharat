# Error Analysis & Fixes — Mahima Academy

## Date: 2026-03-01

---

## 1. 500 Internal Server Error (CRITICAL — FIXED)

**Cause:** `package.json` had `"dev": "tsx server/index.ts"` which tried to launch an Express/Node.js server. Lovable runs Vite directly and cannot execute server-side code. The `server/` and `shared/` directories imported packages (`drizzle-orm`, `pg`, `express`, `passport`) that were not installed, crashing Vite's module resolution.

**Fix:**
- Changed `"dev"` script to `"vite"`
- Removed `tsx` dependency
- Removed `db:push` script (Drizzle CLI — not used)
- Deleted dead server files: `server/`, `shared/schema.ts`, `drizzle.config.ts`, `backend/`

---

## 2. Materials Upload — Private Bucket URL Issue (FIXED)

**Cause:** The `course-materials` storage bucket is **private** (not public). The `useMaterials.ts` hook called `getPublicUrl()` which returns a URL that requires no auth — but private buckets reject unauthenticated requests, so uploaded files were inaccessible.

**Fix:** Replaced `getPublicUrl()` with `createSignedUrl()` (1-year expiry) so that uploaded materials generate valid, authenticated download URLs.

---

## 3. Dead Backend Code (CLEANED)

**Cause:** The project had a dual backend: `server/` (Express/Passport/Drizzle) and Supabase. The Express backend was non-functional in Lovable's frontend-only runtime. All auth and data logic already worked through Supabase (AuthContext, RLS policies, edge functions).

**Removed files:**
- `server/index.ts`, `server/auth.ts`, `server/db.ts`, `server/routes.ts`, `server/storage.ts`, `server/vite.ts`
- `shared/schema.ts` (Drizzle ORM schema)
- `drizzle.config.ts`
- `backend/` directory (Express routes, middleware, config)

---

## 4. YouTube Video Player — No Issues Found

The `MahimaGhostPlayer` and `MahimaVideoPlayer` components correctly use the YouTube IFrame API via `postMessage`. The `react-player` package is installed. Video playback works correctly once the app builds successfully.

---

## 5. Supabase Auth — Working Correctly

- `AuthContext.tsx` handles login/signup/logout via Supabase Auth
- `user_roles` table stores role assignments (admin/teacher/student)
- `handle_new_user` trigger auto-creates profiles
- `handle_new_user_role` trigger auto-assigns 'student' role
- RLS policies are in place across tables

---

## Storage Buckets Status

| Bucket | Public | Status |
|--------|--------|--------|
| book-covers | ✅ Yes | OK — `getPublicUrl()` works |
| content | ✅ Yes | OK |
| avatars | ✅ Yes | OK |
| notices | ✅ Yes | OK |
| chat-attachments | ✅ Yes | OK |
| comment-images | ✅ Yes | OK |
| course-materials | ❌ No | FIXED — now uses `createSignedUrl()` |
| course-videos | ❌ No | OK — videos use YouTube embed, not storage URLs |
| receipts | ❌ No | OK — admin-only access |
