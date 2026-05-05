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
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import { Logo } from "@/components/medifood/Logo";
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

  return (
    <Sidebar collapsible="icon" className="border-r-0">
      <SidebarHeader className="border-b border-sidebar-border bg-sidebar px-4 py-4">
        <Logo compact={collapsed} />
      </SidebarHeader>
      <SidebarContent className="bg-sidebar">
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu className="gap-1 px-2 pt-3">
              {items.map((item) => {
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
    </Sidebar>
  );
}