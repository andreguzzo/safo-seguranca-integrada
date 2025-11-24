-- Create alerts table for operator changes
CREATE TABLE IF NOT EXISTS public.alertas_operadores (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  ogmo_id UUID NOT NULL REFERENCES public.ogmos(id) ON DELETE CASCADE,
  operador_id UUID REFERENCES public.operadores_portuarios(id) ON DELETE SET NULL,
  tipo TEXT NOT NULL CHECK (tipo IN ('cadastro', 'descadastramento')),
  nome_operador TEXT NOT NULL,
  cpf_operador TEXT NOT NULL,
  data_evento TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  visualizado BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add indexes for better query performance
CREATE INDEX idx_alertas_operadores_ogmo_id ON public.alertas_operadores(ogmo_id);
CREATE INDEX idx_alertas_operadores_visualizado ON public.alertas_operadores(visualizado);
CREATE INDEX idx_alertas_operadores_data_evento ON public.alertas_operadores(data_evento);

-- Enable RLS
ALTER TABLE public.alertas_operadores ENABLE ROW LEVEL SECURITY;

-- RLS policies for alertas_operadores
CREATE POLICY "Admins can view all alerts"
  ON public.alertas_operadores
  FOR SELECT
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can insert alerts"
  ON public.alertas_operadores
  FOR INSERT
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update alerts"
  ON public.alertas_operadores
  FOR UPDATE
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete alerts"
  ON public.alertas_operadores
  FOR DELETE
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Function to create alert when operator is added
CREATE OR REPLACE FUNCTION public.create_operator_alert()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.alertas_operadores (
    ogmo_id,
    operador_id,
    tipo,
    nome_operador,
    cpf_operador,
    data_evento
  ) VALUES (
    NEW.ogmo_id,
    NEW.id,
    'cadastro',
    NEW.nome,
    NEW.cpf,
    NEW.created_at
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Function to create alert when operator is deleted
CREATE OR REPLACE FUNCTION public.create_operator_removal_alert()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.alertas_operadores (
    ogmo_id,
    operador_id,
    tipo,
    nome_operador,
    cpf_operador,
    data_evento
  ) VALUES (
    OLD.ogmo_id,
    NULL,
    'descadastramento',
    OLD.nome,
    OLD.cpf,
    now()
  );
  RETURN OLD;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create triggers for operator changes
CREATE TRIGGER trigger_operator_added
  AFTER INSERT ON public.operadores_portuarios
  FOR EACH ROW
  EXECUTE FUNCTION public.create_operator_alert();

CREATE TRIGGER trigger_operator_removed
  BEFORE DELETE ON public.operadores_portuarios
  FOR EACH ROW
  EXECUTE FUNCTION public.create_operator_removal_alert();

-- Function to count active operators for billing
-- Only counts operators registered before the 1st of the current month
-- OR operators registered in previous months
CREATE OR REPLACE FUNCTION public.count_billable_operators(
  _ogmo_id UUID,
  _reference_month DATE
)
RETURNS INTEGER AS $$
DECLARE
  first_day_of_month DATE;
BEGIN
  -- Get first day of the reference month
  first_day_of_month := DATE_TRUNC('month', _reference_month)::DATE;
  
  -- Count operators that were created before the first day of the reference month
  RETURN (
    SELECT COUNT(*)
    FROM public.operadores_portuarios
    WHERE ogmo_id = _ogmo_id
      AND created_at < first_day_of_month
  );
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public;