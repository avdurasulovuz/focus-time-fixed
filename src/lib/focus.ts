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

