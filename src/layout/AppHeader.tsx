import { Bell, CheckCheck } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/store/auth";
import { useData } from "@/store/data";
import { cn } from "@/lib/utils";

const titles: Record<string, string> = {
  "/dashboard": "Tableau de bord",
  "/production": "Production",
  "/inventaire": "Inventaire",
  "/commandes": "Commandes",
  "/bons-de-livraison": "Bons de livraison",
  "/clients": "Clients",
  "/parametres": "Paramètres",
};

const NOTIF_ICONS: Record<string, string> = {
  panne_machine: "🔧",
  stock_insuffisant: "⚠️",
  commande_refusée: "❌",
  manque_ouvriers: "👷",
  autre: "📝",
};

function formatRelativeTime(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 60) return `Il y a ${minutes} min`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `Il y a ${hours}h`;
  return `Il y a ${Math.floor(hours / 24)}j`;
}

export function AppHeader() {
  const location = useLocation();
  const navigate = useNavigate();
  const logout = useAuth((s) => s.logout);
  const user = useAuth((s) => s.user);
  const { notifications, markNotificationRead, markAllNotificationsRead } = useData();

  const matched = Object.keys(titles).find((k) => location.pathname.startsWith(k));
  const title = matched ? titles[matched] : "MEDIFOOD";

  const recipientRole =
    user?.role === "Admin"
      ? "Admin"
      : user?.role === "Responsable Commercial"
      ? "Responsable Commercial"
      : null;

  const myNotifications = notifications.filter(
    (n) => n.recipientRole === recipientRole || user?.role === "Admin",
  );
  const unreadCount = myNotifications.filter((n) => !n.read).length;
  const initials = (user?.name ?? "??").split(" ").map((s) => s[0]).slice(0, 2).join("").toUpperCase();

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-border bg-card px-4 md:px-6">
      <SidebarTrigger className="text-foreground" />
      <div className="flex-1">
        <h1 className="text-lg font-semibold text-foreground">{title}</h1>
      </div>

      {recipientRole !== null && (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="relative">
              <Bell className="h-5 w-5" />
              {unreadCount > 0 && (
                <Badge className="absolute -right-1 -top-1 h-4 min-w-4 rounded-full bg-accent px-1 text-[10px] text-accent-foreground">
                  {unreadCount}
                </Badge>
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-80">
            <div className="flex items-center justify-between px-2 py-1.5">
              <DropdownMenuLabel className="p-0">Notifications</DropdownMenuLabel>
              {unreadCount > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 gap-1 px-2 text-xs text-muted-foreground"
                  onClick={() => markAllNotificationsRead(recipientRole)}
                >
                  <CheckCheck className="h-3 w-3" />
                  Tout marquer lu
                </Button>
              )}
            </div>
            <DropdownMenuSeparator />
            {myNotifications.length === 0 && (
              <div className="py-6 text-center text-sm text-muted-foreground">Aucune notification</div>
            )}
            <div className="max-h-80 overflow-y-auto">
              {myNotifications.slice(0, 15).map((n) => (
                <DropdownMenuItem
                  key={n.id}
                  className={cn("flex flex-col items-start gap-0.5 p-3 cursor-pointer", !n.read && "bg-accent/20")}
                  onClick={() => markNotificationRead(n.id)}
                >
                  <div className="flex w-full items-start gap-2">
                    <span className="mt-0.5 text-sm">{NOTIF_ICONS[n.type]}</span>
                    <div className="flex-1 min-w-0">
                      <p className={cn("text-sm leading-snug", !n.read && "font-medium")}>{n.message}</p>
                      <p className="mt-1 text-xs text-muted-foreground">{formatRelativeTime(n.date)}</p>
                    </div>
                    {!n.read && <div className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-accent" />}
                  </div>
                </DropdownMenuItem>
              ))}
            </div>
          </DropdownMenuContent>
        </DropdownMenu>
      )}

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button className="flex items-center gap-2 rounded-full pl-1 pr-2 py-1 hover:bg-muted transition">
            <Avatar className="h-8 w-8">
              <AvatarFallback className="bg-primary text-primary-foreground text-xs font-semibold">{initials}</AvatarFallback>
            </Avatar>
            <span className="hidden text-sm font-medium md:inline">{user?.name ?? "Admin"}</span>
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48">
          <DropdownMenuLabel>Mon compte</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => navigate("/parametres")}>Profil</DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => {
              logout();
              navigate("/login");
            }}
          >
            Se déconnecter
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </header>
  );
}
