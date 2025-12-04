-- Add username column to profiles table
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS username text UNIQUE;

-- Make sure zip_code is nullable (it should be already, but just in case)
ALTER TABLE public.profiles ALTER COLUMN zip_code DROP NOT NULL;

-- Add index for faster lookups by username
CREATE INDEX IF NOT EXISTS profiles_username_idx ON public.profiles (username);
