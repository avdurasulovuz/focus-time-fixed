import { createFileRoute, Outlet, Link, useLocation, redirect } from "@tanstack/react-router";
import { useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { Timer, ListChecks, Trees, BookOpen, BarChart3, Settings, Clock } from "lucide-react";

export const Route = createFileRoute("/_authenticated")({
  beforeLoad: async () => {
    const { data } = await supabase.auth.getSession();
    if (!data.session) {
      throw redirect({ to: "/login" });
    }
  },
  component: AuthLayout,
});

const nav = [
  { to: "/app", label: "Pomodoro", icon: Timer },
  { to: "/tasks", label: "Vazifalar", icon: ListChecks },
  { to: "/tree", label: "Daraxt", icon: Trees },
  { to: "/library", label: "Kutubxona", icon: BookOpen },
  { to: "/stats", label: "Statistika", icon: BarChart3 },
  { to: "/settings", label: "Sozlamalar", icon: Settings },
] as const;

function AuthLayout() {
  const { user, loading } = useAuth();
  const qc = useQueryClient();
  const location = useLocation();

  // Profile mavjudligini tekshirib, kerak bo'lsa yaratamiz
  useEffect(() => {
    if (!user) return;
    supabase
      .from("profiles")
      .select("id")
      .eq("id", user.id)
      .maybeSingle()
      .then(({ data }) => {
        if (!data) {
          supabase.from("profiles").insert({
            id: user.id,
            display_name: user.user_metadata?.display_name || user.email?.split("@")[0] || "Foydalanuvchi",
          }).then(() => {
            qc.invalidateQueries({ queryKey: ["profile"] });
          });
        }
      });
  }, [user, qc]);

  const { data: profile } = useQuery({
    queryKey: ["profile", user?.id],
    enabled: !!user?.id,
    queryFn: async () => {
      const { data } = await supabase.from("profiles").select("*").eq("id", user!.id).single();
      return data;
    },
  });

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Clock className="w-8 h-8 text-primary animate-pulse" />
      </div>
    );
  }

  const displayName = profile?.display_name || user?.email?.split("@")[0] || "Foydalanuvchi";
  const avatarUrl = (profile as any)?.avatar_url;
  const initials = displayName.slice(0, 2).toUpperCase();

  return (
    <div className="min-h-screen flex flex-col md:flex-row">
      {/* Desktop sidebar */}
      <aside className="hidden md:flex w-64 flex-col glass border-r p-4 sticky top-0 h-screen">
        <Link to="/app" className="flex items-center gap-2 mb-6 px-2">
          <div className="w-9 h-9 rounded-xl bg-primary/15 border border-primary/30 flex items-center justify-center">
            <Clock className="w-5 h-5 text-primary" />
          </div>
          <div>
            <div className="font-display font-bold leading-tight">Focus Time</div>
            <div className="text-[10px] text-muted-foreground">Fokus · O'sish · Hosil</div>
          </div>
        </Link>

        {/* User info */}
        <Link to="/settings" className="flex items-center gap-3 px-3 py-2.5 mb-4 rounded-xl hover:bg-muted transition border border-border">
          <div className="w-8 h-8 rounded-xl overflow-hidden bg-primary/20 flex items-center justify-center flex-shrink-0">
            {avatarUrl ? (
              <img src={avatarUrl} alt="avatar" className="w-full h-full object-cover" />
            ) : (
              <span className="text-xs font-bold text-primary">{initials}</span>
            )}
          </div>
          <div className="min-w-0">
            <div className="text-sm font-medium truncate">{displayName}</div>
            <div className="text-[10px] text-muted-foreground truncate">{user?.email}</div>
          </div>
        </Link>

        <nav className="flex-1 space-y-1">
          {nav.map((n) => {
            const Icon = n.icon;
            const active = location.pathname === n.to;
            return (
              <Link
                key={n.to}
                to={n.to}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition ${
                  active
                    ? "bg-primary/20 text-primary border border-primary/30"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                }`}
              >
                <Icon className="w-4 h-4" />
                {n.label}
              </Link>
            );
          })}
        </nav>
      </aside>

      {/* Mobile top nav */}
      <nav className="md:hidden sticky top-0 z-50 glass border-b flex justify-around py-1.5 px-1">
        {nav.map((n) => {
          const Icon = n.icon;
          const active = location.pathname === n.to;
          return (
            <Link
              key={n.to}
              to={n.to}
              className={`flex flex-col items-center justify-center px-2 py-1.5 rounded-xl flex-1 transition ${
                active ? "text-primary bg-primary/10" : "text-muted-foreground"
              }`}
            >
              <Icon className="w-5 h-5" />
              <span className="text-[9px] mt-0.5 font-medium">{n.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* Main content */}
      <main className="flex-1 min-w-0">
        <Outlet />
      </main>
    </div>
  );
}
