-- Adicionar campo bloqueado na tabela ogmos
ALTER TABLE public.ogmos ADD COLUMN IF NOT EXISTS bloqueado BOOLEAN DEFAULT false;

-- Criar tabela de operadores portuários
CREATE TABLE IF NOT EXISTS public.operadores_portuarios (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ogmo_id UUID NOT NULL REFERENCES public.ogmos(id) ON DELETE CASCADE,
  nome TEXT NOT NULL,
  cpf TEXT NOT NULL,
  email TEXT,
  telefone TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(cpf, ogmo_id)
);

ALTER TABLE public.operadores_portuarios ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view all operadores"
  ON public.operadores_portuarios FOR SELECT
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can insert operadores"
  ON public.operadores_portuarios FOR INSERT
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update operadores"
  ON public.operadores_portuarios FOR UPDATE
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete operadores"
  ON public.operadores_portuarios FOR DELETE
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Criar tabela de configurações financeiras
CREATE TABLE IF NOT EXISTS public.configuracoes_financeiras (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  valor_por_operador DECIMAL(10,2) NOT NULL DEFAULT 50.00,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.configuracoes_financeiras ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view config"
  ON public.configuracoes_financeiras FOR SELECT
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update config"
  ON public.configuracoes_financeiras FOR UPDATE
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Inserir configuração padrão
INSERT INTO public.configuracoes_financeiras (valor_por_operador) 
VALUES (50.00) ON CONFLICT DO NOTHING;

-- Criar tabela de mensalidades
CREATE TABLE IF NOT EXISTS public.mensalidades_ogmo (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ogmo_id UUID NOT NULL REFERENCES public.ogmos(id) ON DELETE CASCADE,
  mes_referencia DATE NOT NULL,
  quantidade_operadores INTEGER NOT NULL DEFAULT 0,
  valor_total DECIMAL(10,2) NOT NULL,
  data_vencimento DATE NOT NULL,
  data_pagamento DATE,
  status TEXT NOT NULL DEFAULT 'pendente' CHECK (status IN ('pendente', 'pago', 'atrasado')),
  cnpj_pagador TEXT,
  observacoes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(ogmo_id, mes_referencia)
);

ALTER TABLE public.mensalidades_ogmo ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view all mensalidades"
  ON public.mensalidades_ogmo FOR SELECT
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can insert mensalidades"
  ON public.mensalidades_ogmo FOR INSERT
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update mensalidades"
  ON public.mensalidades_ogmo FOR UPDATE
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete mensalidades"
  ON public.mensalidades_ogmo FOR DELETE
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Criar tabela de extratos importados
CREATE TABLE IF NOT EXISTS public.extratos_bancarios (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  data_importacao TIMESTAMP WITH TIME ZONE DEFAULT now(),
  nome_arquivo TEXT NOT NULL,
  quantidade_registros INTEGER NOT NULL DEFAULT 0,
  quantidade_conciliados INTEGER NOT NULL DEFAULT 0,
  importado_por UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.extratos_bancarios ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view extratos"
  ON public.extratos_bancarios FOR SELECT
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can insert extratos"
  ON public.extratos_bancarios FOR INSERT
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Trigger para atualizar updated_at
CREATE TRIGGER update_operadores_updated_at
  BEFORE UPDATE ON public.operadores_portuarios
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER update_mensalidades_updated_at
  BEFORE UPDATE ON public.mensalidades_ogmo
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER update_config_updated_at
  BEFORE UPDATE ON public.configuracoes_financeiras
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();