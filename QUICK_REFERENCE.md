# Quick Reference: Auth System Overview

## What Happens When Someone Signs Up

1. User visits `/login`
2. User enters email/password or clicks Google
3. **Email/Password Flow**:
   - First tries to login with `supabase.auth.signInWithPassword()`
   - If fails with "Invalid login credentials", tries signup
   - On signup success, automatically logs in
4. **Google OAuth Flow**:
   - Redirects to Google
   - Google redirects back to `/auth/callback?code=...`
   - Code is exchanged for session
   - Redirects to home page
5. **Database Trigger** (this is the critical part):
   - When `auth.users` row is inserted, trigger fires
   - Automatically creates a `profiles` row with user's name
   - User now has both auth account AND profile ready to use

## Key Files

| File | Purpose |
|------|---------|
| `src/app/login/page.tsx` | Login/signup form (email/password + Google button) |
| `src/app/auth/callback/route.ts` | Handles OAuth callback from Google |
| `src/middleware.ts` | Redirects unauthenticated users to /login |
| `src/utils/supabase/client.ts` | Browser-side Supabase client |
| `src/utils/supabase/server.ts` | Server-side Supabase client |
| `src/utils/supabase/middleware.ts` | Session management middleware |
| `supabase/migrations/0000_initial_schema.sql` | Database schema + triggers |
| `supabase/migrations/fix_trigger.sql` | Reference for the trigger fix |

## Database Schema

### auth.users (managed by Supabase)
- `id` - UUID
- `email` - user's email
- `raw_user_meta_data` - JSON with full_name, avatar_url, etc.

### profiles (your table)
- `id` - UUID (references auth.users)
- `name` - extracted from email or metadata
- `avatar_url` - from Google/OAuth provider
- `gives` - skills they teach (array)
- `gets` - skills they want to learn (array)
- `vibes` - personality traits (array)
- `availability` - schedule as JSON
- `latitude/longitude` - location
- `radius` - search radius in meters
- `created_at/updated_at` - timestamps

## The Trigger (handle_new_user)

```sql
-- When a new row is inserted into auth.users...
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  -- This function automatically runs
  EXECUTE PROCEDURE public.handle_new_user();
```

This trigger:
1. Gets the new user's ID from auth.users
2. Extracts their name from metadata or email
3. Gets their avatar if they provided one
4. Creates a row in profiles table
5. All happens automatically!

## Status Checks

### Is auth working?
- Try signing up at `/login` → If redirected home, auth works ✓
- Check browser console for errors
- Check Supabase Logs dashboard

### Is the trigger working?
- Sign up a user
- Go to Supabase → Table Editor → profiles
- Do you see a new row? If yes, trigger works ✓
- If no, the trigger didn't fire (see SQL fix in AUTH_FIX_GUIDE.md)

### Is the profile created?
- Sign up/login
- Go to `/profile` page
- Do you see your profile? (or at least a user ID?)
- If yes, profile loading works ✓

## Error Messages & Fixes

| Error | Cause | Fix |
|-------|-------|-----|
| "Invalid login credentials" on first login | User doesn't exist | This is expected, app tries signup |
| "User already exists" on signup | User already signed up | Try logging in instead |
| Sign up succeeds but no redirect | Session not set properly | Clear cookies, try again |
| No profile created | Trigger not running | Run the SQL fix (see AUTH_FIX_GUIDE.md) |
| Type errors on build | TypeScript issue | `npm install` then `npm run build` |

## Testing Checklist

- [ ] Run SQL fix in Supabase
- [ ] `npm run dev` starts without errors
- [ ] Can visit `http://localhost:3000/login`
- [ ] Can signup with email/password
- [ ] Auto-login works after signup
- [ ] Can login again with same credentials
- [ ] Google button appears and is clickable
- [ ] New profile appears in Supabase (Table Editor)
- [ ] Home page loads without errors
- [ ] `/profile` page shows user info

---

**TL;DR**: Fix is complete. Just run the SQL in Supabase and test!
