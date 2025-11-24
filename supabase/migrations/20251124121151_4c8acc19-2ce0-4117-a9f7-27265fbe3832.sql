-- Add column to track if NF (Nota Fiscal) has been issued
ALTER TABLE public.mensalidades_ogmo 
ADD COLUMN IF NOT EXISTS nf_emitida BOOLEAN NOT NULL DEFAULT false;