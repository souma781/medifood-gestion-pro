import { NavLink, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  Factory,
  Package,
  ShoppingCart,
  Truck,
  Users,
  Settings,
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import { Logo } from "@/components/medifood/Logo";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useAuth } from "@/store/auth";
import { canAccess, ROLE_BADGE, ROLE_SHORT } from "@/lib/rbac";
import { cn } from "@/lib/utils";

const items = [
  { title: "Tableau de bord", url: "/dashboard", icon: LayoutDashboard },
  { title: "Production", url: "/production", icon: Factory },
  { title: "Inventaire", url: "/inventaire", icon: Package },
  { title: "Commandes", url: "/commandes", icon: ShoppingCart },
  { title: "Bons de livraison", url: "/bons-de-livraison", icon: Truck },
  { title: "Clients", url: "/clients", icon: Users },
  { title: "Paramètres", url: "/parametres", icon: Settings },
];

export function AppSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const location = useLocation();
  const user = useAuth((s) => s.user);

  const visible = items.filter((i) => canAccess(user?.role, i.url));
  const initials = (user?.name ?? "??").split(" ").map((s) => s[0]).slice(0, 2).join("").toUpperCase();

  return (
    <Sidebar collapsible="icon" className="border-r-0">
      <SidebarHeader className="border-b border-sidebar-border bg-sidebar px-4 py-4">
        <Logo compact={collapsed} />
      </SidebarHeader>
      <SidebarContent className="bg-sidebar">
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu className="gap-1 px-2 pt-3">
              {visible.map((item) => {
                const active = location.pathname.startsWith(item.url);
                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton
                      asChild
                      tooltip={item.title}
                      className={cn(
                        "h-10 rounded-md text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                        active &&
                          "bg-sidebar-accent text-sidebar-accent-foreground font-medium border-l-2 border-accent",
                      )}
                    >
                      <NavLink to={item.url} end={false}>
                        <item.icon className="h-5 w-5 shrink-0" />
                        {!collapsed && <span>{item.title}</span>}
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      {user && !collapsed && (
        <SidebarFooter className="border-t border-sidebar-border bg-sidebar p-3">
          <div className="flex items-center gap-3">
            <Avatar className="h-9 w-9">
              <AvatarFallback className="bg-primary text-primary-foreground text-xs font-semibold">
                {initials}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1">
              <div className="truncate text-sm font-medium text-sidebar-foreground">{user.name}</div>
              <span className={cn("inline-block mt-0.5 rounded-full border px-2 py-0.5 text-[10px] font-medium", ROLE_BADGE[user.role])}>
                {ROLE_SHORT[user.role]}{user.assignedProducts?.length ? ` · ${user.assignedProducts.join(", ")}` : ""}
              </span>
            </div>
          </div>
        </SidebarFooter>
      )}
    </Sidebar>
  );
}
