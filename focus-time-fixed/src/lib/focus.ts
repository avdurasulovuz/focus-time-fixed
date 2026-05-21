import { supabase } from "@/integrations/supabase/client";

export const TREE_STAGES = [
  { name: "Urug'",          threshold: 0  },
  { name: "Ko'chat",        threshold: 1  },
  { name: "Niholcha",       threshold: 3  },
  { name: "Yosh daraxt",    threshold: 7  },
  { name: "Yetuk daraxt",   threshold: 14 },
  { name: "Gullagan daraxt",threshold: 21 },
  { name: "Hosilli daraxt", threshold: 30 },
] as const;

/** Kunlar soniga qarab bosqich (streak uchun ham, ekilgan kundan hisoblaganda ham) */
export function stageForStreak(days: number): number {
  let s = 0;
  for (let i = 0; i < TREE_STAGES.length; i++) {
    if (days >= TREE_STAGES[i].threshold) s = i;
  }
  return s;
}

/** Ekilgan sanadan bugungi kunga qadar necha kun o'tganiga qarab bosqich */
export function stageForPlantedDate(tree_planted_at: string): number {
  const days = diffDays(tree_planted_at, todayISO());
  return stageForStreak(Math.max(0, days));
}

/** Keyingi bosqichga qancha qolganini hisoblaydi */
export function nextStageProgress(days: number): {
  current: number;
  next: number | null;
  pct: number;
} {
  const stage = stageForStreak(days);
  const cur  = TREE_STAGES[stage].threshold;
  const next = TREE_STAGES[stage + 1]?.threshold ?? null;
  if (next == null) return { current: cur, next: null, pct: 100 };
  return {
    current: cur,
    next,
    pct: Math.round(((days - cur) / (next - cur)) * 100),
  };
}

export function todayISO() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export function diffDays(a: string, b: string) {
  const da = new Date(a + "T00:00:00");
  const db = new Date(b + "T00:00:00");
  return Math.round((db.getTime() - da.getTime()) / 86400000);
}

// Tugallangan fokus sessiyasini yozib oladi: pomodoro_sessions, daily_stats va profiles ni yangilaydi
export async function recordFocusSession(userId: string, minutes: number) {
  const today = todayISO();

  await supabase.from("pomodoro_sessions").insert({
    user_id: userId, duration_minutes: minutes, mode: "focus",
  });

  // daily_stats ni yangilash
  const { data: existing } = await supabase
    .from("daily_stats").select("*").eq("user_id", userId).eq("date", today).maybeSingle();
  if (existing) {
    await supabase.from("daily_stats").update({
      focus_minutes: existing.focus_minutes + minutes,
      pomos: existing.pomos + 1,
    }).eq("user_id", userId).eq("date", today);
  } else {
    await supabase.from("daily_stats").insert({
      user_id: userId, date: today, focus_minutes: minutes, pomos: 1,
    });
  }

  // Profilni yangilash
  const { data: profile } = await supabase
    .from("profiles").select("*").eq("id", userId).single();
  if (!profile) return;

  // Streak hisoblash (statistika uchun saqlanadi)
  let streak = profile.current_streak;
  if (profile.last_active_date !== today) {
    if (profile.last_active_date) {
      const d = diffDays(profile.last_active_date as string, today);
      if (d === 1) streak = streak + 1;
      else if (d > 1) streak = 1;
    } else {
      streak = 1;
    }
  } else if (streak === 0) {
    streak = 1;
  }

  const longest = Math.max(profile.longest_streak, streak);

  // Daraxt bosqichi: ekilgan sanadan bugunga qadar necha kun o'tgan
  const plantedAt = (profile.tree_planted_at as string) ?? today;
  const daysSincePlanted = Math.max(0, diffDays(plantedAt, today));
  const newStage = stageForStreak(daysSincePlanted);

  await supabase.from("profiles").update({
    total_focus_minutes: profile.total_focus_minutes + minutes,
    total_pomos:         profile.total_pomos + 1,
    current_streak:      streak,
    longest_streak:      longest,
    last_active_date:    today,
    tree_stage:          newStage,
  }).eq("id", userId);
}
