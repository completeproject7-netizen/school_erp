import { type ReactNode, type KeyboardEvent, useEffect, useMemo, useState } from "react";
import { Link, useLocation, useNavigate } from "@tanstack/react-router";
import { GraduationCap, LogOut, Bell, Search, ChevronRight } from "lucide-react";
import {
  Sidebar, SidebarContent, SidebarFooter, SidebarGroup, SidebarGroupContent,
  SidebarGroupLabel, SidebarHeader, SidebarInset, SidebarMenu, SidebarMenuButton,
  SidebarMenuItem, SidebarProvider, SidebarTrigger,
} from "@/components/ui/sidebar";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import { useAuth, ROLE_LABELS, type Role } from "@/lib/auth";
import { getNavForRole, type NavGroup } from "@/lib/nav";
import { getNotificationsForRole, loadNotificationsForRole, saveNotificationsForRole, type NotificationItem } from "@/lib/notifications";

export function RoleDashboardLayout({
  title,
  breadcrumbs,
  children,
}: {
  title: string;
  breadcrumbs?: { label: string; to?: string }[];
  children: ReactNode;
}) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchQuery, setSearchQuery] = useState("");

  if (!user) return null;

  const groups = getNavForRole(user.role);
  const navItems = useMemo(() => groups.flatMap((group) => group.items), [groups]);
  const searchResults = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return [];
    return navItems.filter((item) => item.title.toLowerCase().includes(query)).slice(0, 6);
  }, [navItems, searchQuery]);

  const [notifications, setNotifications] = useState<NotificationItem[]>([]);

  useEffect(() => {
    setNotifications(loadNotificationsForRole(user.role));
  }, [user.role]);

  const initials = user.name.split(" ").map((p) => p[0]).slice(0, 2).join("");

  const handleNotificationClick = (index: number) => {
    setNotifications((current) => {
      const updated = current.filter((_, i) => i !== index);
      saveNotificationsForRole(user.role, updated);
      return updated;
    });
  };

  const handleSearchKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key !== "Enter") return;
    const query = searchQuery.trim();
    if (!query) return;

    if (searchResults.length > 0) {
      navigate({ to: searchResults[0].to });
      setSearchQuery("");
    } else {
      toast.error(`No page found for "${query}"`);
    }
  };

  const handleLogout = () => {
    logout();
    navigate({ to: "/login" });
  };

  return (
    <SidebarProvider>
      <Sidebar collapsible="icon">
        <SidebarHeader className="border-b border-sidebar-border">
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton size="lg" asChild>
                <Link to="/dashboard">
                  <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
                    <GraduationCap className="size-4" />
                  </div>
                  <div className="flex flex-col gap-0.5 leading-none">
                    <span className="font-display font-semibold text-base">EduCore</span>
                    <span className="text-xs text-sidebar-foreground/70">{ROLE_LABELS[user.role]}</span>
                  </div>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarHeader>
        <SidebarContent>
          {groups.map((g: NavGroup) => (
            <SidebarGroup key={g.label}>
              <SidebarGroupLabel>{g.label}</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {g.items.map((item) => {
                    const Icon = item.icon;
                    const active = location.pathname === item.to;
                    return (
                      <SidebarMenuItem key={item.to}>
                        <SidebarMenuButton asChild isActive={active} tooltip={item.title}>
                          <Link to={item.to}>
                            <Icon className="size-4" />
                            <span>{item.title}</span>
                          </Link>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    );
                  })}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          ))}
        </SidebarContent>
        <SidebarFooter className="border-t border-sidebar-border">
          <SidebarMenu>
            <SidebarMenuItem>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <SidebarMenuButton size="lg">
                    <Avatar className="size-8">
                      <AvatarFallback className="bg-sidebar-primary text-sidebar-primary-foreground text-xs">
                        {initials}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex flex-col text-left leading-tight">
                      <span className="text-sm font-medium truncate">{user.name}</span>
                      <span className="text-xs text-sidebar-foreground/70 truncate">{user.email}</span>
                    </div>
                  </SidebarMenuButton>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" side="top" className="w-56">
                  <DropdownMenuLabel>{ROLE_LABELS[user.role]}</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleLogout}>
                    <LogOut className="size-4 mr-2" />Log out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarFooter>
      </Sidebar>

      <SidebarInset>
        <header className="sticky top-0 z-40 flex h-16 items-center gap-2 border-b bg-background/95 backdrop-blur px-4">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="mr-2 h-4" />
          <div className="flex items-center gap-2 text-sm">
            {breadcrumbs?.length ? (
              breadcrumbs.map((b, i) => (
                <span key={b.label} className="flex items-center gap-2">
                  {i > 0 && <ChevronRight className="size-3 text-muted-foreground" />}
                  {b.to ? (
                    <Link to={b.to} className="text-muted-foreground hover:text-foreground">{b.label}</Link>
                  ) : (
                    <span className="font-medium">{b.label}</span>
                  )}
                </span>
              ))
            ) : (
              <h1 className="font-semibold">{title}</h1>
            )}
          </div>
          <div className="ml-auto flex items-center gap-2">
            <div className="relative hidden md:block">
              <Search className="absolute left-2.5 top-2.5 size-4 text-muted-foreground" />
              <Input
                placeholder="Search pages..."
                className="w-56 pl-8 bg-secondary/50"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={handleSearchKeyDown}
              />
              {searchQuery.trim().length > 0 && (
                <div className="absolute left-0 right-0 z-50 mt-1 max-h-60 overflow-hidden overflow-y-auto rounded-xl border bg-background shadow-lg">
                  {searchResults.length > 0 ? (
                    searchResults.map((result) => (
                      <button
                        key={result.to}
                        type="button"
                        onClick={() => {
                          navigate({ to: result.to });
                          setSearchQuery("");
                        }}
                        className="w-full text-left px-4 py-3 text-sm text-foreground hover:bg-accent/70"
                      >
                        {result.title}
                      </button>
                    ))
                  ) : (
                    <div className="px-4 py-3 text-sm text-muted-foreground">No pages match your search.</div>
                  )}
                </div>
              )}
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="relative">
                  <Bell className="size-5" />
                  {notifications.length > 0 && (
                    <Badge variant="destructive" className="absolute -top-1 -right-1 size-4 rounded-full p-0 text-[10px] flex items-center justify-center">
                      {notifications.length}
                    </Badge>
                  )}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" side="bottom" className="w-72">
                <DropdownMenuLabel>Notifications</DropdownMenuLabel>
                {notifications.length > 0 ? (
                  notifications.map((item, index) => (
                    <DropdownMenuItem key={`${item.to}-${index}`} asChild>
                      <Link
                        to={item.to}
                        onClick={() => handleNotificationClick(index)}
                        className="w-full"
                      >
                        {item.title}
                      </Link>
                    </DropdownMenuItem>
                  ))
                ) : (
                  <DropdownMenuItem disabled>No new notifications</DropdownMenuItem>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onSelect={() => toast(`Search for pages with the top bar or visit your dashboard.`)}
                >
                  Quick search tips
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>
        <main key={location.pathname} className="flex-1 overflow-auto p-4 md:p-6 animate-fade-in-up">{children}</main>
      </SidebarInset>
    </SidebarProvider>
  );
}

export function RoleBadge({ role }: { role: Role }) {
  return <Badge variant="secondary">{ROLE_LABELS[role]}</Badge>;
}
