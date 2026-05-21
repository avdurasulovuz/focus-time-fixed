import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { recordFocusSession, getProfile, getTodayFocusMinutes } from "@/lib/local-store";
import { stageForStreak, nextStageProgress, TREE_STAGES } from "@/lib/focus";
import { Play, Pause, RotateCcw, Coffee, Brain, Moon, Flame, Target, Trophy } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/app")({
  component: PomodoroPage,
});

type Mode = "focus" | "short" | "long";
const READ_PRESETS = [25, 50, 80];

function PomodoroPage() {
  const { user } = useAuth();
  const qc = useQueryClient();

  const { data: profile } = useQuery({
    queryKey: ["profile", user?.id],
    enabled: !!user?.id,
    queryFn: () => getProfile(),
  });

  const settings = profile?.settings || {
    focus: 25, short: 5, long: 15, interval: 4, sound: true, autobreak: false,
  };

  const [mode, setMode] = useState<Mode>("focus");
  const [seconds, setSeconds] = useState(settings.focus * 60);
  const [running, setRunning] = useState(false);
  const [pomoCount, setPomoCount] = useState(0);
  const [customFocus, setCustomFocus] = useState<number | null>(null);

  const focusMinutes = customFocus ?? settings.focus;
  const total =
    (mode === "focus" ? focusMinutes : mode === "short" ? settings.short : settings.long) * 60;
  const startedAtRef = useRef<number | null>(null);

  useEffect(() => {
    if (!running)
      setSeconds(
        (mode === "focus" ? focusMinutes : mode === "short" ? settings.short : settings.long) * 60
      );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [settings.focus, settings.short, settings.long, customFocus]);

  useEffect(() => {
    if (!running) return;
    const id = setInterval(() => {
      setSeconds((s) => {
        if (s <= 1) {
          clearInterval(id);
          onDone();
          return 0;
        }
        return s - 1;
      });
    }, 1000);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [running, mode]);

  function onDone() {
    setRunning(false);
    if (settings.sound) playBell();
    if (mode === "focus") {
      const minutes = focusMinutes;
      recordFocusSession(minutes);
      qc.invalidateQueries({ queryKey: ["profile"] });
      qc.invalidateQueries({ queryKey: ["weekStats"] });
      qc.invalidateQueries({ queryKey: ["todayFocus"] });
      toast.success(`🌱 +${minutes} daqiqa fokus!`);
      const next = pomoCount + 1;
      setPomoCount(next);
      const newMode: Mode = next % settings.interval === 0 ? "long" : "short";
      setMode(newMode);
      setSeconds((newMode === "long" ? settings.long : settings.short) * 60);
      if (settings.autobreak) setRunning(true);
    } else {
      toast("⏰ Dam tugadi. Fokusga qayt!");
      setMode("focus");
      setSeconds(focusMinutes * 60);
    }
  }

  function switchMode(m: Mode) {
    if (running) return;
    setMode(m);
    const sec =
      m === "focus" ? focusMinutes : m === "short" ? settings.short : settings.long;
    setSeconds(sec * 60);
  }

  function selectPreset(min: number) {
    if (running) return;
    setCustomFocus(min);
    setMode("focus");
    setSeconds(min * 60);
  }

  function toggle() {
    if (!running) startedAtRef.current = Date.now();
    setRunning((r) => !r);
  }

  function reset() {
    setRunning(false);
    setSeconds(total);
  }

  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  const pct = ((total - seconds) / total) * 100;

  return (
    <div className="p-3 sm:p-6 max-w-3xl mx-auto pt-4">
      <Header profile={profile} />

      <div className="mt-4">
        <div className="glass rounded-3xl p-5 sm:p-8 text-center">
          <div className="flex justify-center gap-2 mb-6 flex-wrap">
            {(
              [
                { id: "focus", label: "Fokus", icon: Brain },
                { id: "short", label: "Qisqa dam", icon: Coffee },
                { id: "long", label: "Uzun dam", icon: Moon },
              ] as const
            ).map((t) => {
              const Icon = t.icon;
              return (
                <button
                  key={t.id}
                  onClick={() => switchMode(t.id as Mode)}
                  className={`px-4 py-2 rounded-full text-sm flex items-center gap-2 transition ${mode === t.id ? "bg-primary text-primary-foreground" : "bg-muted/50 text-muted-foreground hover:bg-muted"}`}
                >
                  <Icon className="w-4 h-4" /> {t.label}
                </button>
              );
            })}
          </div>

          <div className="relative mx-auto w-[240px] sm:w-[300px] aspect-square">
            <svg viewBox="0 0 200 200" className="w-full h-full -rotate-90">
              <circle cx="100" cy="100" r="92" stroke="var(--muted)" strokeWidth="6" fill="none" />
              <circle
                cx="100" cy="100" r="92"
                stroke="var(--primary)" strokeWidth="6" fill="none"
                strokeLinecap="round"
                strokeDasharray={`${(pct / 100) * 2 * Math.PI * 92} ${2 * Math.PI * 92}`}
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <div className="font-mono text-5xl sm:text-6xl font-bold tracking-tight">
                {String(mins).padStart(2, "0")}:{String(secs).padStart(2, "0")}
              </div>
              <div className="text-xs text-muted-foreground mt-2 uppercase tracking-wider">
                {mode === "focus" ? "Fokus" : mode === "short" ? "Qisqa dam" : "Uzun dam"}
              </div>
            </div>
          </div>

          <div className="flex justify-center gap-2 mt-5">
            {READ_PRESETS.map((min) => (
              <button
                key={min}
                onClick={() => selectPreset(min)}
                disabled={running}
                className={`px-5 py-2.5 rounded-2xl text-sm font-semibold transition border ${
                  focusMinutes === min && mode === "focus"
                    ? "bg-primary text-primary-foreground border-primary"
                    : "bg-muted/40 text-muted-foreground border-border hover:bg-muted disabled:opacity-40"
                }`}
              >
                {min} daq
              </button>
            ))}
          </div>

          <div className="flex justify-center items-center gap-3 mt-5 w-full max-w-xs mx-auto -translate-x-2 sm:-translate-x-3">
            <button
              onClick={toggle}
              className="px-8 py-3 rounded-full bg-primary text-primary-foreground font-semibold flex items-center gap-2 hover:opacity-90 transition shadow-md shadow-primary/20"
            >
              {running ? (
                <><Pause className="w-4 h-4" /> To'xtat</>
              ) : (
                <><Play className="w-4 h-4" /> Boshlash</>
              )}
            </button>
            <button
              onClick={reset}
              className="px-4 py-3 rounded-full bg-muted hover:bg-muted/70 flex items-center gap-2 transition"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>

          <div className="flex justify-center gap-1.5 mt-5">
            {Array.from({ length: settings.interval }).map((_, i) => (
              <div
                key={i}
                className={`w-2.5 h-2.5 rounded-full transition ${i < pomoCount % settings.interval ? "bg-primary" : "bg-muted"}`}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function Header({ profile }: { profile: ReturnType<typeof getProfile> | undefined }) {
  const streak = profile?.current_streak ?? 0;
  const stage = stageForStreak(streak);
  const p = nextStageProgress(streak);
  return (
    <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
      <Stat icon={Flame} label="Hozirgi streak" value={`${streak} kun`} accent />
      <Stat icon={Target} label="Bugungi fokus">
        <TodayFocus />
      </Stat>
      <Stat icon={Trophy} label="Eng uzun streak" value={`${profile?.longest_streak ?? 0} kun`} />
      <Stat icon={Brain} label="Jami pomodoro" value={`${profile?.total_pomos ?? 0}`} />
      <div className="sm:col-span-2 lg:col-span-4 glass rounded-2xl p-3 px-4 flex items-center gap-3 text-xs">
        <span className="text-muted-foreground">Keyingi bosqich:</span>
        <span className="font-medium">
          {TREE_STAGES[Math.min(stage + 1, TREE_STAGES.length - 1)].name}
        </span>
        <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
          <div className="h-full bg-primary transition-all" style={{ width: `${p.pct}%` }} />
        </div>
        <span className="text-muted-foreground font-mono">
          {p.next ? `${streak}/${p.next}` : "MAX"}
        </span>
      </div>
    </div>
  );
}

function Stat({ icon: Icon, label, value, accent, children }: any) {
  return (
    <div className={`glass rounded-2xl p-4 ${accent ? "border-primary/30 border" : ""}`}>
      <div className="flex items-center gap-2 text-[11px] uppercase tracking-wider text-muted-foreground">
        <Icon className={`w-3.5 h-3.5 ${accent ? "text-primary" : ""}`} /> {label}
      </div>
      <div className="text-xl font-display font-bold mt-1">{children || value}</div>
    </div>
  );
}

function TodayFocus() {
  const { data } = useQuery({
    queryKey: ["todayFocus"],
    queryFn: () => getTodayFocusMinutes(),
  });
  return <span>{data ?? 0} daq</span>;
}

let audioCtx: AudioContext | null = null;
function playBell() {
  try {
    audioCtx = audioCtx || new (window.AudioContext || (window as any).webkitAudioContext)();
    const o = audioCtx.createOscillator();
    const g = audioCtx.createGain();
    o.connect(g);
    g.connect(audioCtx.destination);
    o.frequency.value = 880;
    g.gain.value = 0.15;
    o.start();
    o.frequency.exponentialRampToValueAtTime(220, audioCtx.currentTime + 0.6);
    g.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + 0.7);
    o.stop(audioCtx.currentTime + 0.7);
  } catch {}
}
