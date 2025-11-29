-- Adicionar coluna ogmo_id na tabela profiles para associar funcionários a OGMOs
ALTER TABLE public.profiles
ADD COLUMN ogmo_id uuid REFERENCES public.ogmos(id) ON DELETE CASCADE;

-- Criar índice para melhorar performance nas consultas
CREATE INDEX idx_profiles_ogmo_id ON public.profiles(ogmo_id);