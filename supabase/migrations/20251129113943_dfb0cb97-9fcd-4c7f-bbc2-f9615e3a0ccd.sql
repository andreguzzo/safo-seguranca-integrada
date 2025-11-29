-- Criar tabela de perfis de usuário
CREATE TABLE public.perfis_usuario (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT NOT NULL,
  descricao TEXT,
  ogmo_id UUID NOT NULL REFERENCES public.ogmos(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Criar tabela de permissões por perfil
CREATE TABLE public.permissoes_perfil (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  perfil_id UUID NOT NULL REFERENCES public.perfis_usuario(id) ON DELETE CASCADE,
  recurso TEXT NOT NULL,
  pode_criar BOOLEAN DEFAULT false,
  pode_editar BOOLEAN DEFAULT false,
  pode_excluir BOOLEAN DEFAULT false,
  pode_visualizar BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(perfil_id, recurso)
);

-- Criar tabela de associação entre usuários e perfis
CREATE TABLE public.usuario_perfis (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  perfil_id UUID NOT NULL REFERENCES public.perfis_usuario(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(user_id, perfil_id)
);

-- Habilitar RLS
ALTER TABLE public.perfis_usuario ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.permissoes_perfil ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.usuario_perfis ENABLE ROW LEVEL SECURITY;

-- Políticas para perfis_usuario
CREATE POLICY "Admins can manage perfis"
ON public.perfis_usuario
FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "OGMOs can manage their perfis"
ON public.perfis_usuario
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.ogmos
    WHERE ogmos.id = perfis_usuario.ogmo_id
    AND ogmos.user_id = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.ogmos
    WHERE ogmos.id = perfis_usuario.ogmo_id
    AND ogmos.user_id = auth.uid()
  )
);

-- Políticas para permissoes_perfil
CREATE POLICY "Admins can manage permissoes"
ON public.permissoes_perfil
FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "OGMOs can manage their permissoes"
ON public.permissoes_perfil
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.perfis_usuario
    JOIN public.ogmos ON ogmos.id = perfis_usuario.ogmo_id
    WHERE perfis_usuario.id = permissoes_perfil.perfil_id
    AND ogmos.user_id = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.perfis_usuario
    JOIN public.ogmos ON ogmos.id = perfis_usuario.ogmo_id
    WHERE perfis_usuario.id = permissoes_perfil.perfil_id
    AND ogmos.user_id = auth.uid()
  )
);

-- Políticas para usuario_perfis
CREATE POLICY "Admins can manage usuario_perfis"
ON public.usuario_perfis
FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "OGMOs can manage their usuario_perfis"
ON public.usuario_perfis
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.perfis_usuario
    JOIN public.ogmos ON ogmos.id = perfis_usuario.ogmo_id
    WHERE perfis_usuario.id = usuario_perfis.perfil_id
    AND ogmos.user_id = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.perfis_usuario
    JOIN public.ogmos ON ogmos.id = perfis_usuario.ogmo_id
    WHERE perfis_usuario.id = usuario_perfis.perfil_id
    AND ogmos.user_id = auth.uid()
  )
);

-- Trigger para updated_at em perfis_usuario
CREATE TRIGGER update_perfis_usuario_updated_at
  BEFORE UPDATE ON public.perfis_usuario
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();