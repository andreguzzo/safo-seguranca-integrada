-- Adicionar campo para valor customizado por operador em cada OGMO
ALTER TABLE public.ogmos ADD COLUMN IF NOT EXISTS valor_por_operador DECIMAL(10,2);