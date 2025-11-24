-- Create terminais_portuarios table
CREATE TABLE public.terminais_portuarios (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  nome TEXT NOT NULL,
  cnpj TEXT NOT NULL UNIQUE,
  endereco TEXT,
  telefone TEXT,
  email TEXT,
  user_id UUID,
  bloqueado BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.terminais_portuarios ENABLE ROW LEVEL SECURITY;

-- Create policies for admins
CREATE POLICY "Admins can view all terminais"
ON public.terminais_portuarios
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can insert terminais"
ON public.terminais_portuarios
FOR INSERT
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update terminais"
ON public.terminais_portuarios
FOR UPDATE
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete terminais"
ON public.terminais_portuarios
FOR DELETE
USING (has_role(auth.uid(), 'admin'::app_role));

-- Create trigger for updated_at
CREATE TRIGGER update_terminais_portuarios_updated_at
BEFORE UPDATE ON public.terminais_portuarios
FOR EACH ROW
EXECUTE FUNCTION public.handle_updated_at();

-- Add role for terminal users
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'terminal';