import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { getProfile } from "@/lib/local-store";
import { TreeArt } from "@/components/TreeArt";
import { TREE_STAGES, stageForStreak, nextStageProgress } from "@/lib/focus";
import { Sparkles, Flame, CheckCircle2, Lock } from "lucide-react";

export const Route = createFileRoute("/_authenticated/tree")({
  component: TreePage,
});

function TreePage() {
  const { user } = useAuth();
  const { data: profile } = useQuery({
    queryKey: ["profile", user?.id],
    enabled: !!user,
    queryFn: () => getProfile(),
  });

  const streak = profile?.current_streak ?? 0;
  const stage = stageForStreak(streak);
  const prog = nextStageProgress(streak);

  return (
    <div className="p-4 sm:p-8 max-w-6xl mx-auto">
      <div className="flex items-end justify-between flex-wrap gap-3 mb-6">
        <div>
          <h1 className="text-3xl sm:text-4xl font-display font-bold">Sizning daraxtingiz</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Har kuni fokus qiling — daraxt streak bo'yicha o'sadi!
          </p>
        </div>
        <div className="glass rounded-2xl px-4 py-2 flex items-center gap-3 text-sm flex-wrap">
          <Flame className="w-4 h-4 text-primary" />
          <span><b>{streak}</b> kun streak</span>
          <span className="text-muted-foreground">· bosqich {stage + 1}/{TREE_STAGES.length}</span>
        </div>
      </div>

      <div className="grid lg:grid-cols-[1fr_360px] gap-6">
        <div className="glass rounded-3xl p-4 sm:p-8 relative overflow-hidden">
          <div className="absolute inset-0 grain opacity-[0.04]" />
          <div className="relative">
            <div className="aspect-square max-w-[520px] mx-auto">
              <TreeArt stage={stage} className="w-full h-full" />
            </div>
            <div className="text-center mt-4">
              <div className="text-xs uppercase tracking-widest text-muted-foreground">Bosqich {stage + 1}/{TREE_STAGES.length}</div>
              <div className="text-2xl font-display font-bold mt-1">{TREE_STAGES[stage].name}</div>
              {prog.next != null && (
                <div className="mt-4 max-w-md mx-auto">
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div className="h-full bg-primary transition-all" style={{ width: `${prog.pct}%` }} />
                  </div>
                  <div className="text-xs text-muted-foreground mt-2">
                    Keyingi bosqich uchun yana <b>{prog.next - streak}</b> kun streak kerak
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="glass rounded-3xl p-5">
          <div className="text-xs uppercase tracking-wider text-muted-foreground mb-3 flex items-center gap-2">
            <Sparkles className="w-3.5 h-3.5" /> O'sish bosqichlari
          </div>
          <div className="space-y-2">
            {TREE_STAGES.map((s, i) => {
              const reached = streak >= s.threshold;
              const current = i === stage;
              return (
                <div key={s.name}
                  className={`flex items-center gap-3 p-3 rounded-xl border transition ${current ? "border-primary/40 bg-primary/10" : "border-border"}`}>
                  <div className="w-10 h-10 rounded-lg bg-muted/40 flex items-center justify-center">
                    <TreeArt stage={i} className="w-full h-full" withGround={false} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium">{s.name}</div>
                    <div className="text-[11px] text-muted-foreground">{s.threshold}+ kun streak</div>
                  </div>
                  {reached ? (
                    <CheckCircle2 className="w-4 h-4 text-primary" />
                  ) : (
                    <Lock className="w-4 h-4 text-muted-foreground" />
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
