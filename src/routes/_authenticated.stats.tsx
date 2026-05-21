import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { getProfile, getWeekStats } from "@/lib/local-store";
import { BarChart3, Flame, Clock, Brain, Trophy, Timer } from "lucide-react";

export const Route = createFileRoute("/_authenticated/stats")({
  component: StatsPage,
});

function StatsPage() {
  const { user } = useAuth();

  const { data: profile, isLoading: profileLoading } = useQuery({
    queryKey: ["profile", user?.id],
    enabled: !!user?.id,
    queryFn: () => getProfile(),
  });

  const { data: week = [], isLoading: weekLoading } = useQuery({
    queryKey: ["weekStats", user?.id],
    enabled: !!user?.id,
    queryFn: () => getWeekStats(),
  });

  const max = Math.max(60, ...week.map((d) => d.minutes));
  const weekTotal = week.reduce((s, d) => s + d.minutes, 0);
  const weekPomos = week.reduce((s, d) => s + d.pomos, 0);
  const hasAnyData = (profile?.total_pomos ?? 0) > 0;

  if (profileLoading || weekLoading) {
    return (
      <div className="p-4 sm:p-8 max-w-5xl mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-primary/15 flex items-center justify-center">
            <BarChart3 className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h1 className="text-3xl font-display font-bold">Statistika</h1>
            <p className="text-sm text-muted-foreground">Yuklanmoqda...</p>
          </div>
        </div>
        <div className="grid sm:grid-cols-4 gap-3 mb-6">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="glass rounded-2xl p-4 animate-pulse">
              <div className="h-3 bg-muted rounded mb-3 w-2/3" />
              <div className="h-8 bg-muted rounded w-1/2" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-8 max-w-5xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl bg-primary/15 flex items-center justify-center">
          <BarChart3 className="w-5 h-5 text-primary" />
        </div>
        <div>
          <h1 className="text-3xl font-display font-bold">Statistika</h1>
          <p className="text-sm text-muted-foreground">Sizning fokus safaringiz</p>
        </div>
      </div>

      <div className="grid sm:grid-cols-4 gap-3 mb-6">
        <Card icon={Flame}  label="Joriy streak"   value={`${profile?.current_streak ?? 0} kun`} />
        <Card icon={Trophy} label="Eng uzun streak" value={`${profile?.longest_streak ?? 0} kun`} />
        <Card icon={Clock}  label="Jami daqiqa"     value={`${profile?.total_focus_minutes ?? 0}`} />
        <Card icon={Brain}  label="Jami pomodoro"   value={`${profile?.total_pomos ?? 0}`} />
      </div>

      <div className="glass rounded-3xl p-6 mb-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-display font-semibold text-lg">Haftalik fokus</h2>
          <div className="text-sm text-muted-foreground">
            <b className="text-foreground">{weekTotal}</b> daq ·{" "}
            <b className="text-foreground">{weekPomos}</b> pomo
          </div>
        </div>
        <div className="flex items-end justify-between h-48 gap-2">
          {week.map((d) => (
            <div key={d.date} className="flex-1 flex flex-col items-center gap-2">
              <div className="text-[10px] font-mono text-muted-foreground">
                {d.minutes > 0 ? d.minutes : ""}
              </div>
              <div className="w-full bg-muted rounded-t-lg overflow-hidden flex-1 flex items-end">
                <div
                  className="w-full bg-gradient-to-t from-primary to-primary/60 transition-all rounded-t-lg"
                  style={{
                    height: `${(d.minutes / max) * 100}%`,
                    minHeight: d.minutes > 0 ? "4px" : "0",
                  }}
                />
              </div>
              <div className="text-[11px] text-muted-foreground font-medium">{d.label}</div>
            </div>
          ))}
        </div>

        {!hasAnyData && (
          <div className="mt-4 text-center py-6 border-t border-border">
            <Timer className="w-8 h-8 text-primary/50 mx-auto mb-2" />
            <p className="text-sm text-muted-foreground mb-3">
              Hali fokus sessiyangiz yozilmagan. Birinchi pomodoringizni boshlang!
            </p>
            <Link
              to="/app"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition"
            >
              Pomodoroga o'tish
            </Link>
          </div>
        )}
      </div>

      <div className="glass rounded-3xl p-5">
        <h2 className="font-display font-semibold text-base mb-4">Umumiy natijalar</h2>
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-primary/10 rounded-2xl p-4">
            <p className="text-xs text-muted-foreground mb-1">O'rtacha kunlik fokus</p>
            <p className="text-2xl font-display font-bold">
              {weekTotal > 0
                ? Math.round(weekTotal / (week.filter((d) => d.minutes > 0).length || 1))
                : 0}{" "}
              daq
            </p>
          </div>
          <div className="bg-primary/10 rounded-2xl p-4">
            <p className="text-xs text-muted-foreground mb-1">Aktiv kunlar (hafta)</p>
            <p className="text-2xl font-display font-bold">
              {week.filter((d) => d.minutes > 0).length}/7
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function Card({ icon: Icon, label, value }: { icon: React.ComponentType<{ className?: string }>; label: string; value: string }) {
  return (
    <div className="glass rounded-2xl p-4">
      <div className="flex items-center gap-2 text-[11px] uppercase tracking-wider text-muted-foreground">
        <Icon className="w-3.5 h-3.5" /> {label}
      </div>
      <div className="text-2xl font-display font-bold mt-1">{value}</div>
    </div>
  );
}
