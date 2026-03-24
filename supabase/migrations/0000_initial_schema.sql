-- INITIAL SCHEMA FOR SKILLSWAP MVP

-- 1. Create custom types
DO $$ BEGIN
    CREATE TYPE request_status AS ENUM ('pending', 'accepted', 'rejected');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 2. Create the Profiles table which links to auth.users
CREATE TABLE IF NOT EXISTS profiles (
    id UUID REFERENCES auth.users ON DELETE CASCADE NOT NULL PRIMARY KEY,
    name TEXT NOT NULL,
    avatar_url TEXT,
    gives TEXT[] DEFAULT '{}',
    gets TEXT[] DEFAULT '{}',
    vibes TEXT[] DEFAULT '{}',
    availability JSONB DEFAULT '{}'::jsonb,
    latitude FLOAT,
    longitude FLOAT,
    radius INTEGER DEFAULT 5000,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 3. Create the Session Requests table
CREATE TABLE IF NOT EXISTS session_requests (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    provider_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
    learner_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
    skill_requested TEXT NOT NULL,
    status request_status DEFAULT 'pending',
    meet_link TEXT,
    proposed_time TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 4. Enable Row Level Security (RLS)
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE session_requests ENABLE ROW LEVEL SECURITY;

-- 5. Create Policies for Profile
-- Anyone can read profiles (needed for discovery)
CREATE POLICY "Public profiles are viewable by everyone."
ON profiles FOR SELECT
USING ( true );

-- Users can insert their own profile
CREATE POLICY "Users can insert their own profile."
ON profiles FOR INSERT
WITH CHECK ( auth.uid() = id );

-- Users can update their own profile
CREATE POLICY "Users can update own profile."
ON profiles FOR UPDATE
USING ( auth.uid() = id );

-- 6. Create Policies for Session Requests
-- Users can see requests they sent or received
CREATE POLICY "Users view own requests."
ON session_requests FOR SELECT
USING ( auth.uid() = provider_id OR auth.uid() = learner_id );

-- Users can insert requests as a learner
CREATE POLICY "Learners can insert requests."
ON session_requests FOR INSERT
WITH CHECK ( auth.uid() = learner_id );

-- Providers can update requests (to accept/reject them)
CREATE POLICY "Providers can update requests."
ON session_requests FOR UPDATE
USING ( auth.uid() = provider_id );

-- 7. Trigger for updated_at on profiles
CREATE OR REPLACE FUNCTION handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS on_profiles_updated ON profiles;
CREATE TRIGGER on_profiles_updated
BEFORE UPDATE ON profiles
FOR EACH ROW EXECUTE PROCEDURE handle_updated_at();

DROP TRIGGER IF EXISTS on_session_requests_updated ON session_requests;
CREATE TRIGGER on_session_requests_updated
BEFORE UPDATE ON session_requests
FOR EACH ROW EXECUTE PROCEDURE handle_updated_at();

-- 8. Trigger to create a profile automatically when a user signs up
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

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();