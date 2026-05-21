import { createFileRoute, Outlet, Link, useLocation } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { getProfile } from "@/lib/local-store";
import { Timer, ListChecks, Trees, BookOpen, BarChart3, Settings, Clock } from "lucide-react";

export const Route = createFileRoute("/_authenticated")({
  component: AuthLayout,
});

const nav = [
  { to: "/app", label: "Pomodoro", short: "Pomo", icon: Timer },
  { to: "/tasks", label: "Vazifalar", short: "Vazifa", icon: ListChecks },
  { to: "/tree", label: "Daraxt", short: "Daraxt", icon: Trees },
  { to: "/library", label: "Kutubxona", short: "Kutub", icon: BookOpen },
  { to: "/stats", label: "Statistika", short: "Stat", icon: BarChart3 },
  { to: "/settings", label: "Sozlamalar", short: "Sozlama", icon: Settings },
] as const;

function AuthLayout() {
  const { user, loading } = useAuth();
  const location = useLocation();

  const { data: profile } = useQuery({
    queryKey: ["profile", user?.id],
    enabled: !!user?.id,
    queryFn: () => getProfile(),
  });

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Clock className="w-8 h-8 text-primary animate-pulse" />
      </div>
    );
  }

  const displayName = profile?.display_name || "Foydalanuvchi";
  const avatarUrl = profile?.avatar_url;
  const initials = displayName.slice(0, 2).toUpperCase();

  return (
    <div className="min-h-screen flex flex-col md:flex-row">
      <aside className="hidden md:flex w-64 flex-col glass border-r p-4 sticky top-0 h-screen shrink-0">
        <Link to="/app" className="flex items-center gap-2 mb-6 px-2">
          <div className="w-9 h-9 rounded-xl bg-primary/15 border border-primary/30 flex items-center justify-center">
            <Clock className="w-5 h-5 text-primary" />
          </div>
          <div>
            <div className="font-display font-bold leading-tight">Focus Time</div>
            <div className="text-[10px] text-muted-foreground">Fokus · O'sish · Hosil</div>
          </div>
        </Link>

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
            <div className="text-[10px] text-muted-foreground truncate">Mahalliy saqlash</div>
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
                <Icon className="w-4 h-4 shrink-0" />
                {n.label}
              </Link>
            );
          })}
        </nav>
      </aside>

      <div className="flex-1 flex flex-col min-w-0 min-h-screen md:min-h-0">
        <main className="flex-1 min-w-0 pb-[4.75rem] md:pb-0">
          <Outlet />
        </main>

        <nav
          className="md:hidden fixed bottom-0 left-0 right-0 z-50 glass border-t border-border/80 backdrop-blur-md"
          style={{ paddingBottom: "max(0.5rem, env(safe-area-inset-bottom))" }}
        >
          <div className="flex justify-around px-1 pt-1.5 max-w-lg mx-auto">
            {nav.map((n) => {
              const Icon = n.icon;
              const active = location.pathname === n.to;
              return (
                <Link
                  key={n.to}
                  to={n.to}
                  className={`flex flex-col items-center flex-1 min-w-0 py-1.5 rounded-xl transition ${
                    active ? "text-primary bg-primary/15" : "text-muted-foreground"
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span className="text-[8px] sm:text-[9px] mt-0.5 font-medium truncate max-w-full px-0.5">
                    {n.short}
                  </span>
                </Link>
              );
            })}
          </div>
        </nav>
      </div>
    </div>
  );
}
