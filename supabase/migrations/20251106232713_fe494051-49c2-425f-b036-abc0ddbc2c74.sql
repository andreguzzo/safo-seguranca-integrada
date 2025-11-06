-- Create OGMO table
CREATE TABLE public.ogmos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT NOT NULL,
  cnpj TEXT UNIQUE NOT NULL,
  endereco TEXT,
  telefone TEXT,
  email TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Enable RLS
ALTER TABLE public.ogmos ENABLE ROW LEVEL SECURITY;

-- RLS Policies for OGMO
CREATE POLICY "Admins can view all ogmos"
  ON public.ogmos
  FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can insert ogmos"
  ON public.ogmos
  FOR INSERT
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update ogmos"
  ON public.ogmos
  FOR UPDATE
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete ogmos"
  ON public.ogmos
  FOR DELETE
  USING (public.has_role(auth.uid(), 'admin'));

-- Add trigger for updated_at
CREATE TRIGGER set_ogmos_updated_at
  BEFORE UPDATE ON public.ogmos
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();