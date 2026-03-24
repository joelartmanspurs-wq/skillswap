# SkillSwap Auth Fix - Complete Setup Guide

## What Was Fixed

Your authentication system wasn't working because of three main issues:

1. **Broken Database Schema** - The trigger function to auto-create profiles when users sign up was incomplete/corrupted in the migration file
2. **TypeScript Type Error** - The mapbox type definitions were causing build failures
3. **Weak Auth Logic** - The login page didn't properly handle the sign-up flow

All three have been fixed. Here's what you need to do now:

---

## IMMEDIATE ACTION REQUIRED: Update Your Supabase Database

### ⚠️ THIS IS CRITICAL - YOUR DATABASE TRIGGER IS BROKEN

Go to your Supabase Dashboard and run this SQL in the SQL Editor:

**URL**: https://supabase.com/dashboard/project/bcfajisdglapasswffcp/sql/new

Copy and paste this entire SQL block:

```sql
-- Drop existing broken trigger and function
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();

-- Create the corrected function
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, name, avatar_url)
  VALUES (
    new.id,
    COALESCE(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name', split_part(new.email, '@', 1), 'Anonymous User'),
    new.raw_user_meta_data->>'avatar_url'
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create the trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();
```

Click **Run** and wait for the success message (green checkmark).

---

## What This Fix Does

When a user signs up or logs in via email/password or Google OAuth:

1. Supabase authenticates them in `auth.users`
2. The trigger automatically creates a profile in the `profiles` table
3. The profile extracts the user's name from their email or metadata
4. User is immediately logged in and redirected to the home page

---

## Testing the Authentication

### Test 1: Email/Password Signup

1. Go to `http://localhost:3000/login`
2. Enter any email: `test@example.com`
3. Enter any password: `password123`
4. Click "Sign In / Sign Up"
5. **Expected**: You're redirected to the home page and logged in

### Test 2: Email/Password Login

1. Go to `http://localhost:3000/login`
2. Use the same email/password from Test 1
3. Click "Sign In / Sign Up"
4. **Expected**: You're logged in and at home page (no signup required)

### Test 3: Google OAuth

1. Go to `http://localhost:3000/login`
2. Click "Continue with Google"
3. Log in with your Google account
4. **Expected**: Redirected to home page, logged in, profile created

### Test 4: Profile Created

1. After signing up/logging in, go to your Supabase Dashboard
2. Go to **Table Editor** → **profiles**
3. **Expected**: You should see a new row with your user ID and name

---

## Code Changes Made

### 1. Fixed Database Schema
- **File**: `supabase/migrations/0000_initial_schema.sql`
- **Change**: Completed the broken `handle_new_user()` trigger function
- **Result**: Profiles are now created automatically when users sign up

### 2. Improved Login Logic
- **File**: `src/app/login/page.tsx`
- **Change**: Better handling of signup vs login flow
- **Result**: Users can sign up or log in with email/password seamlessly

### 3. Enhanced Auth Callback
- **File**: `src/app/auth/callback/route.ts`
- **Change**: Added error handling and delays to ensure session is set
- **Result**: Google OAuth now works reliably

### 4. Fixed TypeScript Config
- **File**: `tsconfig.json`
- **Change**: Removed problematic type declarations
- **Result**: Build now succeeds without type errors

---

## How to Run the App

```bash
# Install dependencies (if not done)
npm install

# Start development server
npm run dev

# The app will be at http://localhost:3000
```

---

## Environment Variables (Already Set)

Your `.env.local` already has:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

No changes needed here.

---

## Troubleshooting

### Problem: "Sign up failed" error
- **Check**: Did you run the SQL in Supabase? The trigger must be created first
- **Check**: Are there errors in Supabase Logs? (Dashboard → Logs)

### Problem: User created but no profile
- **Cause**: The trigger didn't fire
- **Fix**: Run the SQL fix above again
- **Check**: Go to Supabase → SQL Editor → run:
  ```sql
  SELECT * FROM auth.users;
  SELECT * FROM public.profiles;
  ```

### Problem: "Cannot find module @supabase/ssr"
- **Fix**: Run `npm install`

### Problem: Still getting type errors
- **Fix**: Run `npm run build` - it should work now

---

## Next Steps (After Auth Works)

1. **Email Verification**: Add email confirmation before allowing access
2. **Profile Completion**: Ask users to fill in skills, availability, location
3. **Password Reset**: Implement forgot password flow
4. **OAuth Providers**: Add Apple, GitHub, or other OAuth providers
5. **Rate Limiting**: Add request rate limiting to prevent abuse

---

## Files Modified

- ✅ `src/app/login/page.tsx` - Better signup/login flow
- ✅ `src/app/auth/callback/route.ts` - OAuth callback fix
- ✅ `supabase/migrations/0000_initial_schema.sql` - Database schema fix
- ✅ `supabase/migrations/fix_trigger.sql` - Trigger fix reference
- ✅ `tsconfig.json` - TypeScript config fix

---

## Questions?

Check the browser console (F12) for detailed error messages. The most helpful debugging info comes from:

1. Browser Console (F12)
2. Supabase Logs (Dashboard → Logs)
3. Network tab (F12 → Network) to see API responses

If you get stuck, share the exact error message and which test failed.
