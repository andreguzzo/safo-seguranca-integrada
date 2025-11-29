-- Remover a constraint de primary key composta atual
ALTER TABLE public.profiles 
DROP CONSTRAINT profiles_pkey;

-- Adicionar nova primary key apenas com id
ALTER TABLE public.profiles 
ADD PRIMARY KEY (id);

-- Manter Matricula como UNIQUE mas nullable
ALTER TABLE public.profiles 
ALTER COLUMN "Matricula" DROP NOT NULL;

-- Tornar nome_completo nullable também
ALTER TABLE public.profiles 
ALTER COLUMN nome_completo DROP NOT NULL;

-- Criar profiles para usuários existentes que não têm profile
INSERT INTO public.profiles (id)
SELECT u.id 
FROM auth.users u
LEFT JOIN public.profiles p ON p.id = u.id
WHERE p.id IS NULL;