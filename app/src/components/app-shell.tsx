import { useState } from "react";
import { Link, NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Bell, ChevronDown, CircleUserRound, Compass, FileText, FolderKanban, LayoutDashboard, LogOut, Menu, Plus, Search, X } from "lucide-react";
import { Brand } from "@/components/brand";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/components/auth-provider";
import { cn } from "@/lib/utils";
import { api } from "@/lib/api";
import { useTranslation } from "react-i18next";
import { LanguageSwitcher } from "@/components/language-switcher";

const links = [
  { to: "/", key: "overview", icon: LayoutDashboard, end: true },
  { to: "/jobs", key: "exploreJobs", icon: Compass },
  { to: "/proposals", key: "proposals", icon: FileText },
  { to: "/projects", key: "projects", icon: FolderKanban },
  { to: "/profile", key: "myProfile", icon: CircleUserRound }
];

export function AppShell() {
  const { user, logout } = useAuth();
  const [open, setOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { t } = useTranslation();
  const displayName = user?.profile?.name ?? user?.email.split("@")[0] ?? "there";
  const { data: notifications } = useQuery({ queryKey: ["notifications"], queryFn: api.getNotifications, refetchInterval: 30_000 });
  const markRead = useMutation({ mutationFn: api.markNotificationRead, onSuccess: () => void queryClient.invalidateQueries({ queryKey: ["notifications"] }) });

  function openNotification(notification: { id: string; payload: string | null }) {
    markRead.mutate(notification.id);
    setNotificationsOpen(false);
    try {
      const payload = notification.payload ? JSON.parse(notification.payload) as { proposalId?: string; projectId?: string } : {};
      navigate(payload.proposalId ? `/proposals/${payload.proposalId}` : payload.projectId ? `/projects/${payload.projectId}` : "/proposals");
    } catch {
      navigate("/proposals");
    }
  }

  return <div className="min-h-screen bg-background">
    <aside className={cn("fixed inset-y-0 left-0 z-40 flex w-72 -translate-x-full flex-col border-r border-border/70 bg-sidebar p-5 transition-transform lg:translate-x-0", open && "translate-x-0")}>
      <div className="flex items-center justify-between px-2 pb-10"><Brand /><Button size="icon" variant="ghost" className="lg:hidden" onClick={() => setOpen(false)} aria-label="Close menu"><X className="h-5 w-5" /></Button></div>
      <div className="mb-8 rounded-2xl border border-primary/15 bg-primary/[.07] p-4"><div className="mb-3 flex items-center justify-between"><span className="text-xs font-semibold uppercase tracking-[.15em] text-primary">{t("dashboard.workspace")}</span><span className="h-2 w-2 rounded-full bg-emerald-400" /></div><p className="text-sm font-medium">{user?.role === "CLIENT" ? t("common.clientWorkspace") : t("common.freelancerWorkspace")}</p><p className="mt-1 text-xs leading-5 text-muted-foreground">{t("common.workspaceSubtitle")}</p></div>
      <nav className="space-y-1">{links.map(({ to, key, icon: Icon, end }) => <NavLink key={to} to={to} end={end} onClick={() => setOpen(false)} className={({ isActive }) => cn("flex items-center gap-3 rounded-xl px-3.5 py-3 text-sm font-medium text-muted-foreground transition hover:bg-accent hover:text-foreground", isActive && "bg-accent text-foreground shadow-sm")}><Icon className="h-4.5 w-4.5" />{key === "proposals" && user?.role === "CLIENT" ? t("common.proposalRequests") : t(`common.${key}`)}</NavLink>)}</nav>
      <div className="mt-auto space-y-3"><Link to="/jobs/new" className="flex items-center justify-center gap-2 rounded-xl bg-primary px-4 py-3 text-sm font-bold text-primary-foreground shadow-[0_12px_28px_-14px_hsl(var(--primary)/.8)] transition hover:bg-primary/90"><Plus className="h-4 w-4" />{t("common.postProject")}</Link><button className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium text-muted-foreground transition hover:bg-accent hover:text-foreground" onClick={() => void logout()}><LogOut className="h-4 w-4" />{t("common.signOut")}</button></div>
    </aside>
    {open && <button className="fixed inset-0 z-30 bg-background/70 backdrop-blur-sm lg:hidden" onClick={() => setOpen(false)} aria-label="Close navigation" />}
    <div className="lg:pl-72"><header className="sticky top-0 z-20 flex min-h-20 items-center justify-between border-b border-border/60 bg-background/85 px-5 py-3 backdrop-blur-xl sm:px-8"><div className="flex items-center gap-3"><Button size="icon" variant="ghost" className="lg:hidden" onClick={() => setOpen(true)} aria-label="Open menu"><Menu className="h-5 w-5" /></Button><div className="hidden items-center gap-2 text-sm text-muted-foreground sm:flex"><Search className="h-4 w-4" />{t("common.searchHint")}</div><span className="text-sm font-medium text-muted-foreground sm:hidden">{location.pathname === "/" ? t("common.overview") : location.pathname.includes("jobs") ? t("common.exploreJobs") : location.pathname.includes("proposals") ? t("common.proposals") : location.pathname.includes("projects") ? t("common.projects") : "Archer"}</span></div><div className="flex items-center gap-3"><LanguageSwitcher compact /><div className="relative"><Button size="icon" variant="ghost" aria-label={t("common.notifications")} onClick={() => setNotificationsOpen(!notificationsOpen)}><Bell className="h-4.5 w-4.5" />{Boolean(notifications?.unread) && <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-primary ring-2 ring-background" />}</Button>{notificationsOpen && <div className="absolute right-0 top-12 z-50 w-[min(22rem,calc(100vw-2rem))] overflow-hidden rounded-2xl border border-border bg-card shadow-2xl"><div className="flex items-center justify-between border-b border-border/70 px-4 py-3"><div><p className="text-sm font-semibold">{t("common.notifications")}</p><p className="text-xs text-muted-foreground">{t("common.unread", { count: notifications?.unread ?? 0 })}</p></div><button className="text-xs font-semibold text-primary hover:underline" onClick={() => api.markAllNotificationsRead().then(() => queryClient.invalidateQueries({ queryKey: ["notifications"] }))}>{t("common.markAllRead")}</button></div><div className="max-h-80 overflow-y-auto">{notifications?.items.length ? notifications.items.slice(0, 8).map((notification) => <button key={notification.id} onClick={() => openNotification(notification)} className={cn("flex w-full gap-3 border-b border-border/50 px-4 py-3 text-left transition hover:bg-accent", !notification.readAt && "bg-primary/[.05]")}><span className="mt-1 grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary"><Bell className="h-3.5 w-3.5" /></span><span className="min-w-0"><span className="block text-sm font-medium leading-5">{notification.title}</span><span className="mt-1 block text-xs text-muted-foreground">{notification.readAt ? t("common.read") : t("common.newNotification")}</span></span></button>) : <p className="px-4 py-8 text-center text-sm text-muted-foreground">{t("common.allCaughtUp")}</p>}</div></div>}</div><div className="hidden h-7 w-px bg-border sm:block" /><Link to="/profile" className="flex items-center gap-2 rounded-xl px-2 py-1.5 transition hover:bg-accent"><span className="grid h-8 w-8 place-items-center rounded-full bg-primary/15 text-sm font-bold text-primary">{displayName.slice(0, 1).toUpperCase()}</span><span className="hidden text-left sm:block"><span className="block text-sm font-semibold">{displayName}</span><span className="text-[11px] capitalize text-muted-foreground">{user?.role.toLowerCase()}</span></span><ChevronDown className="hidden h-4 w-4 text-muted-foreground sm:block" /></Link></div></header><main className="mx-auto max-w-[1440px] p-5 sm:p-8"><Outlet /></main></div>
  </div>;
}
