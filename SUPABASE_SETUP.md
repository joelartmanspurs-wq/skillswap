# Supabase Setup Instructions

## CRITICAL: You must run these SQL commands in your Supabase SQL Editor

The authentication system is broken because the database schema was incomplete. Follow these steps:

### Step 1: Drop and Recreate the Trigger Function

Go to your Supabase dashboard → SQL Editor and run this:

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

### Step 2: Enable Required Extensions

Still in SQL Editor, run:

```sql
-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
```

### Step 3: Test the Setup

Create a test user via the Supabase Auth dashboard or signup form. Go to:
- Supabase Dashboard → Authentication → Users
- Check that a new profile was automatically created in the `profiles` table

### Step 4: Environment Variables

Make sure `.env.local` exists with:

```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
```

## How Auth Now Works

1. **Email/Password Login Page** (`/login`)
   - User enters email and password
   - First tries to login
   - If user doesn't exist (invalid credentials error), automatically tries to signup
   - On successful signup, auto-logs in and redirects to home page

2. **Google OAuth**
   - Redirects to `/auth/callback` on success
   - Exchange code for session
   - Redirect to home page

3. **Profile Creation**
   - When user signs up, the `handle_new_user()` trigger automatically creates a profile
   - Name is extracted from email or metadata
   - User is ready to use the app

## Troubleshooting

If signup still doesn't work:

1. Check Supabase Logs: Dashboard → Logs → Check for errors
2. Check profiles table: Does it have rows? If not, the trigger isn't firing
3. Check auth.users: Are users being created? If not, signup request is failing
4. Check browser console for errors in `/login` page
5. Verify environment variables are loaded in Next.js

## Next Steps

Once this works:
- Add email verification if needed
- Add password reset functionality
- Customize the profile creation with more fields
