export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      alertas_operadores: {
        Row: {
          cpf_operador: string
          created_at: string
          data_evento: string
          descricao: string | null
          documento_id: string | null
          id: string
          lida: boolean | null
          nome_operador: string
          ogmo_id: string
          operador_id: string | null
          tipo: string
          tipo_documento: string | null
          visualizado: boolean
        }
        Insert: {
          cpf_operador: string
          created_at?: string
          data_evento?: string
          descricao?: string | null
          documento_id?: string | null
          id?: string
          lida?: boolean | null
          nome_operador: string
          ogmo_id: string
          operador_id?: string | null
          tipo: string
          tipo_documento?: string | null
          visualizado?: boolean
        }
        Update: {
          cpf_operador?: string
          created_at?: string
          data_evento?: string
          descricao?: string | null
          documento_id?: string | null
          id?: string
          lida?: boolean | null
          nome_operador?: string
          ogmo_id?: string
          operador_id?: string | null
          tipo?: string
          tipo_documento?: string | null
          visualizado?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "alertas_operadores_ogmo_id_fkey"
            columns: ["ogmo_id"]
            isOneToOne: false
            referencedRelation: "ogmos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "alertas_operadores_operador_id_fkey"
            columns: ["operador_id"]
            isOneToOne: false
            referencedRelation: "operadores_portuarios"
            referencedColumns: ["id"]
          },
        ]
      }
      configuracoes_financeiras: {
        Row: {
          id: string
          updated_at: string | null
          valor_por_operador: number
        }
        Insert: {
          id?: string
          updated_at?: string | null
          valor_por_operador?: number
        }
        Update: {
          id?: string
          updated_at?: string | null
          valor_por_operador?: number
        }
        Relationships: []
      }
      extratos_bancarios: {
        Row: {
          created_at: string | null
          data_importacao: string | null
          id: string
          importado_por: string | null
          nome_arquivo: string
          quantidade_conciliados: number
          quantidade_registros: number
        }
        Insert: {
          created_at?: string | null
          data_importacao?: string | null
          id?: string
          importado_por?: string | null
          nome_arquivo: string
          quantidade_conciliados?: number
          quantidade_registros?: number
        }
        Update: {
          created_at?: string | null
          data_importacao?: string | null
          id?: string
          importado_por?: string | null
          nome_arquivo?: string
          quantidade_conciliados?: number
          quantidade_registros?: number
        }
        Relationships: []
      }
      mensalidades_ogmo: {
        Row: {
          cnpj_pagador: string | null
          created_at: string | null
          data_pagamento: string | null
          data_vencimento: string
          id: string
          mes_referencia: string
          nf_emitida: boolean
          observacoes: string | null
          ogmo_id: string
          quantidade_operadores: number
          status: string
          updated_at: string | null
          valor_total: number
        }
        Insert: {
          cnpj_pagador?: string | null
          created_at?: string | null
          data_pagamento?: string | null
          data_vencimento: string
          id?: string
          mes_referencia: string
          nf_emitida?: boolean
          observacoes?: string | null
          ogmo_id: string
          quantidade_operadores?: number
          status?: string
          updated_at?: string | null
          valor_total: number
        }
        Update: {
          cnpj_pagador?: string | null
          created_at?: string | null
          data_pagamento?: string | null
          data_vencimento?: string
          id?: string
          mes_referencia?: string
          nf_emitida?: boolean
          observacoes?: string | null
          ogmo_id?: string
          quantidade_operadores?: number
          status?: string
          updated_at?: string | null
          valor_total?: number
        }
        Relationships: [
          {
            foreignKeyName: "mensalidades_ogmo_ogmo_id_fkey"
            columns: ["ogmo_id"]
            isOneToOne: false
            referencedRelation: "ogmos"
            referencedColumns: ["id"]
          },
        ]
      }
      ogmos: {
        Row: {
          bloqueado: boolean | null
          cnpj: string
          contato_emergencia: string | null
          created_at: string
          email: string | null
          endereco: string | null
          id: string
          nome: string
          telefone: string | null
          updated_at: string
          user_id: string | null
          valor_por_operador: number | null
        }
        Insert: {
          bloqueado?: boolean | null
          cnpj: string
          contato_emergencia?: string | null
          created_at?: string
          email?: string | null
          endereco?: string | null
          id?: string
          nome: string
          telefone?: string | null
          updated_at?: string
          user_id?: string | null
          valor_por_operador?: number | null
        }
        Update: {
          bloqueado?: boolean | null
          cnpj?: string
          contato_emergencia?: string | null
          created_at?: string
          email?: string | null
          endereco?: string | null
          id?: string
          nome?: string
          telefone?: string | null
          updated_at?: string
          user_id?: string | null
          valor_por_operador?: number | null
        }
        Relationships: []
      }
      operadores_portuarios: {
        Row: {
          cpf: string
          created_at: string | null
          email: string | null
          id: string
          nome: string
          ogmo_id: string
          telefone: string | null
          updated_at: string | null
        }
        Insert: {
          cpf: string
          created_at?: string | null
          email?: string | null
          id?: string
          nome: string
          ogmo_id: string
          telefone?: string | null
          updated_at?: string | null
        }
        Update: {
          cpf?: string
          created_at?: string | null
          email?: string | null
          id?: string
          nome?: string
          ogmo_id?: string
          telefone?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "operadores_portuarios_ogmo_id_fkey"
            columns: ["ogmo_id"]
            isOneToOne: false
            referencedRelation: "ogmos"
            referencedColumns: ["id"]
          },
        ]
      }
      perfis_usuario: {
        Row: {
          created_at: string | null
          descricao: string | null
          id: string
          nome: string
          ogmo_id: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          descricao?: string | null
          id?: string
          nome: string
          ogmo_id: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          descricao?: string | null
          id?: string
          nome?: string
          ogmo_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "perfis_usuario_ogmo_id_fkey"
            columns: ["ogmo_id"]
            isOneToOne: false
            referencedRelation: "ogmos"
            referencedColumns: ["id"]
          },
        ]
      }
      permissoes_perfil: {
        Row: {
          created_at: string | null
          id: string
          perfil_id: string
          pode_criar: boolean | null
          pode_editar: boolean | null
          pode_excluir: boolean | null
          pode_visualizar: boolean | null
          recurso: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          perfil_id: string
          pode_criar?: boolean | null
          pode_editar?: boolean | null
          pode_excluir?: boolean | null
          pode_visualizar?: boolean | null
          recurso: string
        }
        Update: {
          created_at?: string | null
          id?: string
          perfil_id?: string
          pode_criar?: boolean | null
          pode_editar?: boolean | null
          pode_excluir?: boolean | null
          pode_visualizar?: boolean | null
          recurso?: string
        }
        Relationships: [
          {
            foreignKeyName: "permissoes_perfil_perfil_id_fkey"
            columns: ["perfil_id"]
            isOneToOne: false
            referencedRelation: "perfis_usuario"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          cpf: string | null
          created_at: string
          id: string
          Matricula: number | null
          nome_completo: string | null
          ogmo_id: string | null
          senha_alterada: boolean | null
          updated_at: string
        }
        Insert: {
          cpf?: string | null
          created_at?: string
          id: string
          Matricula?: number | null
          nome_completo?: string | null
          ogmo_id?: string | null
          senha_alterada?: boolean | null
          updated_at?: string
        }
        Update: {
          cpf?: string | null
          created_at?: string
          id?: string
          Matricula?: number | null
          nome_completo?: string | null
          ogmo_id?: string | null
          senha_alterada?: boolean | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "profiles_ogmo_id_fkey"
            columns: ["ogmo_id"]
            isOneToOne: false
            referencedRelation: "ogmos"
            referencedColumns: ["id"]
          },
        ]
      }
      terminais_portuarios: {
        Row: {
          bloqueado: boolean | null
          cnpj: string
          created_at: string
          email: string | null
          endereco: string | null
          id: string
          nome: string
          ogmo_id: string | null
          telefone: string | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          bloqueado?: boolean | null
          cnpj: string
          created_at?: string
          email?: string | null
          endereco?: string | null
          id?: string
          nome: string
          ogmo_id?: string | null
          telefone?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          bloqueado?: boolean | null
          cnpj?: string
          created_at?: string
          email?: string | null
          endereco?: string | null
          id?: string
          nome?: string
          ogmo_id?: string | null
          telefone?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "terminais_portuarios_ogmo_id_fkey"
            columns: ["ogmo_id"]
            isOneToOne: false
            referencedRelation: "ogmos"
            referencedColumns: ["id"]
          },
        ]
      }
      tpas: {
        Row: {
          celular: string | null
          cpf: string
          created_at: string | null
          email: string
          id: string
          matricula: string
          nome: string
          ogmo_id: string
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          celular?: string | null
          cpf: string
          created_at?: string | null
          email: string
          id?: string
          matricula: string
          nome: string
          ogmo_id: string
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          celular?: string | null
          cpf?: string
          created_at?: string | null
          email?: string
          id?: string
          matricula?: string
          nome?: string
          ogmo_id?: string
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "tpas_ogmo_id_fkey"
            columns: ["ogmo_id"]
            isOneToOne: false
            referencedRelation: "ogmos"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      usuario_perfis: {
        Row: {
          created_at: string | null
          id: string
          perfil_id: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          perfil_id: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          perfil_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "usuario_perfis_perfil_id_fkey"
            columns: ["perfil_id"]
            isOneToOne: false
            referencedRelation: "perfis_usuario"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      count_billable_operators: {
        Args: { _ogmo_id: string; _reference_month: string }
        Returns: number
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role:
        | "admin"
        | "operador_portuario"
        | "terminal"
        | "ogmo"
        | "trabalhador_avulso"
        | "trabalhador_terceirizado"
        | "sindicato"
        | "usuario"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: [
        "admin",
        "operador_portuario",
        "terminal",
        "ogmo",
        "trabalhador_avulso",
        "trabalhador_terceirizado",
        "sindicato",
        "usuario",
      ],
    },
  },
} as const
