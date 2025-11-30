-- Add column to track if password has been changed from initial CPF
ALTER TABLE public.profiles ADD COLUMN senha_alterada boolean DEFAULT false;

-- Update existing users to require password change
UPDATE public.profiles SET senha_alterada = false WHERE senha_alterada IS NULL;