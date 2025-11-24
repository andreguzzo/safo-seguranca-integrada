-- Add ogmo_id to terminais_portuarios table
ALTER TABLE public.terminais_portuarios
ADD COLUMN ogmo_id UUID REFERENCES public.ogmos(id) ON DELETE CASCADE;

-- Create index for better query performance
CREATE INDEX idx_terminais_portuarios_ogmo_id ON public.terminais_portuarios(ogmo_id);