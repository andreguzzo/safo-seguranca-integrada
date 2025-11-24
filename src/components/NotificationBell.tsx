import { Bell, CheckCheck, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { useNotifications } from "@/hooks/useNotifications";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useState } from "react";

interface NotificationBellProps {
  ogmoId: string | undefined;
}

export const NotificationBell = ({ ogmoId }: NotificationBellProps) => {
  const [open, setOpen] = useState(false);
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications(ogmoId);

  const getNotificationIcon = (tipo: string, tipoDocumento: string | null) => {
    if (tipo === "cadastro") return "👤";
    if (tipo === "descadastramento") return "👤❌";
    if (tipoDocumento === "novo_acidente") return "⚠️";
    if (tipoDocumento === "novo_incidente") return "🔔";
    if (tipoDocumento === "nova_rnc") return "📋";
    if (tipoDocumento === "novo_top") return "📄";
    if (tipoDocumento === "nova_rds") return "🗣️";
    if (tipoDocumento === "novo_checklist") return "✅";
    if (tipoDocumento === "nova_pt") return "🎫";
    if (tipoDocumento === "nova_investigacao") return "🔍";
    if (tipoDocumento === "nova_reuniao") return "👥";
    return "📢";
  };

  const getNotificationTitle = (tipo: string, tipoDocumento: string | null) => {
    if (tipo === "cadastro") return "Novo Operador Cadastrado";
    if (tipo === "descadastramento") return "Operador Removido";
    if (tipoDocumento === "novo_acidente") return "Novo Acidente de Trabalho";
    if (tipoDocumento === "novo_incidente") return "Novo Incidente";
    if (tipoDocumento === "nova_rnc") return "Nova RNC";
    if (tipoDocumento === "novo_top") return "Novo TOP";
    if (tipoDocumento === "nova_rds") return "Nova RDS";
    if (tipoDocumento === "novo_checklist") return "Novo Checklist";
    if (tipoDocumento === "nova_pt") return "Nova Permissão de Trabalho";
    if (tipoDocumento === "nova_investigacao") return "Nova Investigação";
    if (tipoDocumento === "nova_reuniao") return "Nova Reunião";
    return "Nova Notificação";
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button 
          variant="ghost" 
          size="icon" 
          className="relative hover:bg-muted/50 transition-colors"
        >
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge 
              variant="destructive" 
              className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs animate-pulse"
            >
              {unreadCount > 9 ? "9+" : unreadCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-96 p-0" align="end">
        <div className="flex items-center justify-between p-4 border-b border-border">
          <h3 className="font-semibold text-lg">Notificações</h3>
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={markAllAsRead}
              className="text-xs hover:bg-muted/50"
            >
              <CheckCheck className="h-4 w-4 mr-1" />
              Marcar todas como lidas
            </Button>
          )}
        </div>

        <ScrollArea className="h-[400px]">
          {notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
              <Bell className="h-12 w-12 mb-4 opacity-20" />
              <p className="text-sm">Nenhuma notificação nova</p>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {notifications.slice(0, 15).map((notification) => (
                <div
                  key={notification.id}
                  className="p-4 hover:bg-muted/30 transition-colors cursor-pointer"
                  onClick={() => markAsRead(notification.id)}
                >
                  <div className="flex gap-3">
                    <div className="text-2xl flex-shrink-0">
                      {getNotificationIcon(notification.tipo, notification.tipo_documento)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm mb-1">
                        {getNotificationTitle(notification.tipo, notification.tipo_documento)}
                      </p>
                      {notification.descricao && (
                        <p className="text-xs text-muted-foreground mb-2">
                          {notification.descricao}
                        </p>
                      )}
                      {(notification.tipo === "cadastro" || notification.tipo === "descadastramento") && (
                        <p className="text-xs text-muted-foreground mb-2">
                          {notification.nome_operador} - CPF: {notification.cpf_operador}
                        </p>
                      )}
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Clock className="h-3 w-3" />
                        {formatDistanceToNow(new Date(notification.data_evento), {
                          addSuffix: true,
                          locale: ptBR,
                        })}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>

        {notifications.length > 0 && (
          <>
            <Separator />
            <div className="p-3 text-center">
              <Button variant="ghost" size="sm" className="w-full text-xs">
                Ver todas as notificações
              </Button>
            </div>
          </>
        )}
      </PopoverContent>
    </Popover>
  );
};
