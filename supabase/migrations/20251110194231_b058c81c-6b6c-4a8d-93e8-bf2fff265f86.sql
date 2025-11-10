-- Add user_id column to ogmos table to reference the master user
ALTER TABLE public.ogmos 
ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;

-- Add index for better query performance
CREATE INDEX idx_ogmos_user_id ON public.ogmos(user_id);