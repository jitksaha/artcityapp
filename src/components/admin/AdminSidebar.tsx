import { Link } from "@tanstack/react-router";
import {
  LayoutDashboard,
  Users,
  Megaphone,
  UserCog,
  Settings,
  Sparkles,
  LogOut,
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import { supabase } from "@/integrations/supabase/client";

export type AdminView =
  | "overview"
  | "applications"
  | "casting"
  | "users"
  | "settings";

const PRIMARY: Array<{ key: AdminView; label: string; icon: any }> = [
  { key: "overview", label: "Dashboard", icon: LayoutDashboard },
  { key: "applications", label: "Applications", icon: Users },
  { key: "casting", label: "Casting Requests", icon: Megaphone },
];

const ADMIN_ONLY: Array<{ key: AdminView; label: string; icon: any }> = [
  { key: "users", label: "Users & Roles", icon: UserCog },
  { key: "settings", label: "Settings", icon: Settings },
];

export function AdminSidebar({
  view,
  onChange,
  isAdmin,
}: {
  view: AdminView;
  onChange: (v: AdminView) => void;
  isAdmin: boolean;
}) {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";

  const itemBtn = (k: AdminView, label: string, Icon: any) => (
    <SidebarMenuItem key={k}>
      <SidebarMenuButton
        isActive={view === k}
        onClick={() => onChange(k)}
        tooltip={label}
        className="data-[active=true]:bg-primary/10 data-[active=true]:text-primary data-[active=true]:font-medium"
      >
        <Icon className="h-4 w-4" />
        {!collapsed && <span>{label}</span>}
      </SidebarMenuButton>
    </SidebarMenuItem>
  );

  return (
    <Sidebar collapsible="icon" className="border-r">
      <SidebarHeader className="border-b">
        <Link
          to="/"
          className="flex items-center gap-2 px-2 py-1.5 text-sm font-semibold tracking-tight"
        >
          <div className="grid h-7 w-7 place-items-center rounded-md bg-gradient-to-br from-primary to-primary/60 text-primary-foreground">
            <Sparkles className="h-3.5 w-3.5" />
          </div>
          {!collapsed && <span>Art City Admin</span>}
        </Link>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Workspace</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>{PRIMARY.map((i) => itemBtn(i.key, i.label, i.icon))}</SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
        {isAdmin && (
          <SidebarGroup>
            <SidebarGroupLabel>Administration</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>{ADMIN_ONLY.map((i) => itemBtn(i.key, i.label, i.icon))}</SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}
      </SidebarContent>
      <SidebarFooter className="border-t">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              tooltip="Sign out"
              onClick={async () => {
                await supabase.auth.signOut();
                window.location.href = "/login";
              }}
            >
              <LogOut className="h-4 w-4" />
              {!collapsed && <span>Sign out</span>}
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}