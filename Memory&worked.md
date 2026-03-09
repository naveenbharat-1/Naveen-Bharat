# Memory.md — Mahima Online School Audit Log

## Date: 2026-02-27

---

## 1. Login Reliability Issues

### Root Cause
- `Login.tsx` used `Promise.race()` with a 30s timeout that would show "timeout" error even when Supabase auth was still processing and would eventually succeed.
- On slow networks (common for Indian students on mobile), the timeout would fire before Supabase responded, causing false login failures.
- Admin login (`AdminLogin.tsx`) had a client-side email check via `ADMIN_CONFIG.isAuthorizedAdmin()` that blocked login BEFORE even attempting auth.

### Fix Applied
- **Removed `Promise.race()` timeout pattern** from `Login.tsx`.
- **Added "session probe" fallback**: After 30 seconds, if Supabase hasn't responded, we check `supabase.auth.getSession()`. If a session exists (login succeeded silently), we navigate to dashboard. If not, we show a clear "slow connection" message.
- **Added `navigator.onLine` guard** to show offline message before attempting login.
- **Better error mapping** with specific messages for common Supabase errors.
- Same pattern applied to `AdminLogin.tsx`.

---

## 2. Role Storage Violation (Privilege Escalation Risk)

### Finding
- `profiles.role` column existed and was being written by:
  - `handle_new_user()` trigger (set `role: 'student'` on signup)
  - `setup-admin/index.ts` edge function (set `role: 'admin'` on admin bootstrap)
  - Client code in `AuthContext.tsx` read `profile.role` as fallback
- Multiple pages used `profile?.role` instead of the secure `user_roles` table:
  - `LectureListing.tsx`, `LessonView.tsx`, `MyCourseDetail.tsx`, `Profile.tsx`
- `ADMIN_CONFIG.isAuthorizedAdmin()` always returned `true` (was a no-op but misleading)

### Fix Applied
- **`AuthContext.tsx`**: Removed `role` from `UserProfile` interface. Now fetches role exclusively via `supabase.rpc('get_user_role')` (security definer function — no RLS recursion).
- **`handle_new_user()`**: Updated to only insert `id, full_name, email` (no role).
- **`get_user_profiles_admin()`**: Updated to JOIN `user_roles` instead of reading `profiles.role`.
- **`setup-admin/index.ts`**: Removed `role: 'admin'` from profiles upsert.
- **All UI pages**: Replaced `profile?.role` with `isAdmin`/`isTeacher` from `useAuth()`.
- **Removed `ADMIN_CONFIG.isAuthorizedAdmin()`** checks from all admin pages.

---

## 3. Security Scan Findings Addressed

### 3a. `profiles_public` View
- **Before**: Was a table/view exposing `id, full_name, role, created_at` with NO RLS.
- **After**: Recreated as a secure VIEW with `security_invoker=on`, exposing only `id, full_name, avatar_url`. No role, no email, no mobile.

### 3b. Students & Attendance Tables
- **Before**: Had "Authenticated users can view students/attendance" policies (any logged-in user could read all student records).
- **After**: Removed those broad SELECT policies. Only `admin` and `teacher` roles can access these tables via existing `has_role()` policies.

### 3c. `payment_requests.user_id` Nullability
- **Before**: `user_id` was nullable, creating a "nullable owner" risk where RLS ownership checks could be bypassed.
- **After**: Set `user_id` to NOT NULL.

### 3d. Admin Page Access Control
- **Before**: Admin pages checked `ADMIN_CONFIG.isAuthorizedAdmin(email)` (client-side, always returned true) plus `isAdmin` from auth context.
- **After**: Single source of truth — `isAdmin` from `useAuth()` which queries `user_roles` table. No client-side email checks.

### 3e. Leaked Password Protection
- **Status**: Supabase "Leaked Password Protection" is a **Pro-plan only** feature (not available on free tier).
- **Fix**: Implemented client-side password strength validator in `src/lib/passwordStrength.ts` that checks for common passwords, minimum length, and character variety. Integrated into Signup page with visual strength meter.
- **Note**: This does NOT replace server-side protection but provides reasonable client-side defense for free-tier projects.

---

## 4. Verification Checklist

| Test | Status | Notes |
|------|--------|-------|
| Student login (anujkumar75yadav@gmail.com) | Pending | No more false timeouts |
| Admin login (naveenbharatprism@gmail.com) | Pending | ADMIN_CONFIG removed, DB role check only |
| `/admin` loads for admin | Pending | |
| `/admin/upload` loads and upload works | Pending | Content bucket is public, upload should work |
| `/admin/cms` loads | Pending | |
| `/admin/schedule` loads | Pending | |
| Student cannot read `students` table | Expected pass | RLS policy removed |
| Student cannot read `attendance` table | Expected pass | RLS policy removed |
| `profiles_public` doesn't expose role/email | Done | View recreated |
| `payment_requests.user_id` NOT NULL | Done | Migration applied |

---

## 5. Architecture Notes

- **Role source of truth**: `public.user_roles` table + `has_role()` / `get_user_role()` security definer functions.
- **Auth flow**: `supabase.auth.onAuthStateChange()` → `fetchUserData()` → parallel fetch of `profiles` + `rpc('get_user_role')` with graceful fallback to `student` role (no artificial timeout).
- **Login resilience**: No hard timeout. After 30s, session probe checks if auth succeeded silently. Only shows error if session truly doesn't exist.
- **Network resilience**: Supabase client uses custom `resilientFetch` wrapper with 15s AbortController timeout per attempt, up to 2 retries with exponential backoff (1s, 3s) on network-level failures (`TypeError: Failed to fetch`). HTTP errors are not retried.
- **Password strength**: Client-side validator (`src/lib/passwordStrength.ts`) replaces Supabase Pro "Leaked Password Protection". Checks common passwords, length, character variety. Visual strength meter on signup page.

---

## 6. Video Player Fixes & PWA Setup (2026-03-02)

### 6a. Build Error Fix
- **`tsconfig.app.json`**: Added `exclude: ["src/test/**", "src/**/*.test.*", "src/**/*.spec.*"]` to prevent test files from causing TS2307 errors during build.

### 6b. Video Player Fixes (`src/components/video/MahimaGhostPlayer.tsx`)
- **Progress bar hit area**: Increased from `h-3 md:h-4` to `h-6 md:h-7` for reliable click/touch seeking.
- **Watermark repositioning**: Moved both bottom watermarks from `bottom-[42px]` to `bottom-[38px]` to precisely cover YouTube's infinity logo (left) and YouTube text (right). Removed visible backgrounds, set `pointer-events-none` on both.
- **Dashboard redirect fix**: Removed `window.open('/', '_blank')` from right watermark click handler and removed `pointer-events-auto` / `cursor-pointer` from both watermark patches. They are now purely visual overlays with no click handlers.

### 6c. PWA Implementation
- **`public/manifest.json`**: Created with `display: standalone`, `start_url: /dashboard`, icons, theme color `#4E93FF`.
- **`public/sw.js`**: Service worker with cache-first for static assets, network-first for Supabase API calls, and network-first with cache fallback for HTML navigation.
- **`index.html`**: Added `<link rel="manifest">` and inline service worker registration script.
- **Session persistence**: Supabase auth tokens persist via `localStorage` — no additional work needed for PWA re-launch.
