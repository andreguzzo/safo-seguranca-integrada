-- Verificar e adicionar role 'usuario' caso não exista no enum
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_enum 
    WHERE enumlabel = 'usuario' 
    AND enumtypid = 'app_role'::regtype
  ) THEN
    ALTER TYPE app_role ADD VALUE 'usuario';
  END IF;
END $$;