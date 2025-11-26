-- Create TPAs table
CREATE TABLE public.tpas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID UNIQUE,
  ogmo_id UUID NOT NULL REFERENCES public.ogmos(id) ON DELETE CASCADE,
  nome TEXT NOT NULL,
  cpf TEXT NOT NULL,
  matricula TEXT NOT NULL,
  email TEXT NOT NULL,
  celular TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(ogmo_id, cpf),
  UNIQUE(ogmo_id, matricula),
  UNIQUE(ogmo_id, email)
);

-- Enable RLS
ALTER TABLE public.tpas ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Admins can view all TPAs"
  ON public.tpas
  FOR SELECT
  USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can insert TPAs"
  ON public.tpas
  FOR INSERT
  WITH CHECK (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update TPAs"
  ON public.tpas
  FOR UPDATE
  USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete TPAs"
  ON public.tpas
  FOR DELETE
  USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "OGMOs can view their own TPAs"
  ON public.tpas
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.ogmos
      WHERE ogmos.id = tpas.ogmo_id
      AND ogmos.user_id = auth.uid()
    )
  );

CREATE POLICY "OGMOs can insert their own TPAs"
  ON public.tpas
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.ogmos
      WHERE ogmos.id = tpas.ogmo_id
      AND ogmos.user_id = auth.uid()
    )
  );

CREATE POLICY "OGMOs can update their own TPAs"
  ON public.tpas
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.ogmos
      WHERE ogmos.id = tpas.ogmo_id
      AND ogmos.user_id = auth.uid()
    )
  );

CREATE POLICY "OGMOs can delete their own TPAs"
  ON public.tpas
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.ogmos
      WHERE ogmos.id = tpas.ogmo_id
      AND ogmos.user_id = auth.uid()
    )
  );

-- Add trigger for updated_at
CREATE TRIGGER update_tpas_updated_at
  BEFORE UPDATE ON public.tpas
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();