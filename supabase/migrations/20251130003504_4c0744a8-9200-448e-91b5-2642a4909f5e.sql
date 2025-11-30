-- Remove Matricula column and add cpf column to profiles table
ALTER TABLE public.profiles DROP COLUMN IF EXISTS Matricula;

ALTER TABLE public.profiles ADD COLUMN cpf text;

-- Add index for cpf for better query performance
CREATE INDEX IF NOT EXISTS idx_profiles_cpf ON public.profiles(cpf);