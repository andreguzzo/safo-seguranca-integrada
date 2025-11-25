import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface Notification {
  id: string;
  tipo: string;
  tipo_documento: string | null;
  documento_id: string | null;
  descricao: string | null;
  nome_operador: string;
  cpf_operador: string;
  data_evento: string;
  lida: boolean;
  visualizado: boolean;
}

export interface NotificationCounts {
  acidentes: number;
  incidentes: number;
  rnc: number;
  top: number;
  rds: number;
  checklists: number;
  pt: number;
  investigacoes: number;
  reunioes: number;
  operadores: number;
}

export const useNotifications = (ogmoId: string | undefined) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [countsByType, setCountsByType] = useState<NotificationCounts>({
    acidentes: 0,
    incidentes: 0,
    rnc: 0,
    top: 0,
    rds: 0,
    checklists: 0,
    pt: 0,
    investigacoes: 0,
    reunioes: 0,
    operadores: 0,
  });

  useEffect(() => {
    if (!ogmoId) return;

    fetchNotifications();
  }, [ogmoId]);

  const fetchNotifications = async () => {
    let query = supabase
      .from("alertas_operadores")
      .select("*")
      .eq("lida", false)
      .order("data_evento", { ascending: false });

    // Se ogmoId for fornecido, filtra por ele, senão busca todos
    if (ogmoId) {
      query = query.eq("ogmo_id", ogmoId);
    }

    const { data, error } = await query;

    if (error) {
      console.error("Erro ao carregar notificações:", error);
      return;
    }

    setNotifications(data || []);
    setUnreadCount(data?.length || 0);
    
    // Calcular contadores por tipo
    const counts: NotificationCounts = {
      acidentes: 0,
      incidentes: 0,
      rnc: 0,
      top: 0,
      rds: 0,
      checklists: 0,
      pt: 0,
      investigacoes: 0,
      reunioes: 0,
      operadores: 0,
    };

    data?.forEach((notification) => {
      const tipo = notification.tipo_documento;
      if (tipo === "novo_acidente") counts.acidentes++;
      else if (tipo === "novo_incidente") counts.incidentes++;
      else if (tipo === "nova_rnc") counts.rnc++;
      else if (tipo === "novo_top") counts.top++;
      else if (tipo === "nova_rds") counts.rds++;
      else if (tipo === "novo_checklist") counts.checklists++;
      else if (tipo === "nova_pt") counts.pt++;
      else if (tipo === "nova_investigacao") counts.investigacoes++;
      else if (tipo === "nova_reuniao") counts.reunioes++;
      else if (notification.tipo === "cadastro" || notification.tipo === "descadastramento") {
        counts.operadores++;
      }
    });

    setCountsByType(counts);
  };

  const markAsRead = async (notificationId: string) => {
    const { error } = await supabase
      .from("alertas_operadores")
      .update({ lida: true, visualizado: true })
      .eq("id", notificationId);

    if (error) {
      console.error("Erro ao marcar notificação como lida:", error);
      return;
    }

    await fetchNotifications();
  };

  const markAllAsRead = async () => {
    let query = supabase
      .from("alertas_operadores")
      .update({ lida: true, visualizado: true })
      .eq("lida", false);

    if (ogmoId) {
      query = query.eq("ogmo_id", ogmoId);
    }

    const { error } = await query;

    if (error) {
      console.error("Erro ao marcar todas como lidas:", error);
      return;
    }

    await fetchNotifications();
  };

  const markTypeAsRead = async (tipoDocumento: string) => {
    let query = supabase
      .from("alertas_operadores")
      .update({ lida: true, visualizado: true })
      .eq("tipo_documento", tipoDocumento)
      .eq("lida", false);

    if (ogmoId) {
      query = query.eq("ogmo_id", ogmoId);
    }

    const { error } = await query;

    if (error) {
      console.error("Erro ao marcar tipo como lido:", error);
      return;
    }

    await fetchNotifications();
  };

  const markOperatorAlertsAsRead = async () => {
    let query = supabase
      .from("alertas_operadores")
      .update({ lida: true, visualizado: true })
      .in("tipo", ["cadastro", "descadastramento"])
      .eq("lida", false);

    if (ogmoId) {
      query = query.eq("ogmo_id", ogmoId);
    }

    const { error } = await query;

    if (error) {
      console.error("Erro ao marcar alertas de operadores como lidos:", error);
      return;
    }

    await fetchNotifications();
  };

  return {
    notifications,
    unreadCount,
    countsByType,
    markAsRead,
    markAllAsRead,
    markTypeAsRead,
    markOperatorAlertsAsRead,
    refetch: fetchNotifications,
  };
};
