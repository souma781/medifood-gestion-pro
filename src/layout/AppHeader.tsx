import { Bell } from "lucide-react";
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

const titles: Record<string, string> = {
  "/dashboard": "Tableau de bord",
  "/production": "Production",
  "/inventaire": "Inventaire",
  "/commandes": "Commandes",
  "/bons-de-livraison": "Bons de livraison",
  "/clients": "Clients",
  "/parametres": "Paramètres",
};

export function AppHeader() {
  const location = useLocation();
  const navigate = useNavigate();
  const logout = useAuth((s) => s.logout);
  const user = useAuth((s) => s.user);

  const matched = Object.keys(titles).find((k) => location.pathname.startsWith(k));
  const title = matched ? titles[matched] : "MEDIFOOD";

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-border bg-card px-4 md:px-6">
      <SidebarTrigger className="text-foreground" />
      <div className="flex-1">
        <h1 className="text-lg font-semibold text-foreground">{title}</h1>
      </div>
      <Button variant="ghost" size="icon" className="relative">
        <Bell className="h-5 w-5" />
        <Badge className="absolute -right-1 -top-1 h-4 min-w-4 rounded-full bg-accent px-1 text-[10px] text-accent-foreground">3</Badge>
      </Button>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button className="flex items-center gap-2 rounded-full pl-1 pr-2 py-1 hover:bg-muted transition">
            <Avatar className="h-8 w-8">
              <AvatarFallback className="bg-primary text-primary-foreground text-xs font-semibold">AD</AvatarFallback>
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