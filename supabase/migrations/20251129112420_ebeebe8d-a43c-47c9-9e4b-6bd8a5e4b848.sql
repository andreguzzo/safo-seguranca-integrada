-- Atualizar profile de Mariana para ser funcionária do OGMO-ES
UPDATE public.profiles
SET 
  nome_completo = 'Mariana Ribeiro',
  "Matricula" = 12345,
  ogmo_id = 'a1cd38ff-f44f-4b8c-97f7-04308a661347'
WHERE id = '5d15e8d1-b0d7-4471-abb3-5a33b9f6878c';

-- Remover entrada da tabela ogmos (ela não deve ser um OGMO master)
DELETE FROM public.ogmos
WHERE user_id = '5d15e8d1-b0d7-4471-abb3-5a33b9f6878c';