-- Add department column to profiles table
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS department TEXT;
