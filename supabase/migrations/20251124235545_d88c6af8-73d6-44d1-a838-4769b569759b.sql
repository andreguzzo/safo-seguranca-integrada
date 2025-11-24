-- Expandir tabela alertas_operadores para suportar notificações genéricas
ALTER TABLE alertas_operadores 
ADD COLUMN IF NOT EXISTS tipo_documento text,
ADD COLUMN IF NOT EXISTS documento_id uuid,
ADD COLUMN IF NOT EXISTS descricao text,
ADD COLUMN IF NOT EXISTS lida boolean DEFAULT false;

-- Criar índices para melhor performance nas queries
CREATE INDEX IF NOT EXISTS idx_alertas_ogmo_visualizado 
ON alertas_operadores(ogmo_id, visualizado);

CREATE INDEX IF NOT EXISTS idx_alertas_ogmo_tipo 
ON alertas_operadores(ogmo_id, tipo_documento);

CREATE INDEX IF NOT EXISTS idx_alertas_ogmo_lida 
ON alertas_operadores(ogmo_id, lida);

-- Comentários para documentação
COMMENT ON COLUMN alertas_operadores.tipo_documento IS 'Tipo de documento: novo_acidente, novo_incidente, nova_rnc, novo_top, nova_rds, novo_checklist, nova_pt, nova_investigacao, nova_reuniao, operador_criado, operador_removido';
COMMENT ON COLUMN alertas_operadores.documento_id IS 'ID do documento relacionado à notificação';
COMMENT ON COLUMN alertas_operadores.descricao IS 'Descrição detalhada da notificação';
COMMENT ON COLUMN alertas_operadores.lida IS 'Indica se a notificação foi lida pelo usuário';