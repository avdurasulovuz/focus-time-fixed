import { todayISO, diffDays, stageForStreak } from "@/lib/focus";
import { getStoredTheme } from "@/lib/themes";

const DATA_KEY = "focus-time-data-v1";

export interface PomodoroSettings {
  focus: number;
  short: number;
  long: number;
  interval: number;
  sound: boolean;
  autobreak: boolean;
  dailyGoalMinutes: number;
  theme?: string;
}

export interface Profile {
  id: string;
  display_name: string;
  avatar_url: string | null;
  settings: PomodoroSettings;
  total_focus_minutes: number;
  total_pomos: number;
  current_streak: number;
  longest_streak: number;
  last_active_date: string | null;
  tree_planted_at: string;
  tree_stage: number;
}

export interface Task {
  id: string;
  user_id: string;
  title: string;
  done: boolean;
  created_at: string;
}

export interface Book {
  id: string;
  user_id: string;
  title: string;
  author: string | null;
  cover_url: string | null;
  status: string;
  total_pages: number;
  pages_read: number;
  created_at: string;
}

export interface DailyStat {
  user_id: string;
  date: string;
  focus_minutes: number;
  pomos: number;
}

interface AppData {
  profile: Profile;
  tasks: Task[];
  books: Book[];
  dailyStats: DailyStat[];
}

const DEFAULT_SETTINGS: PomodoroSettings = {
  focus: 25,
  short: 5,
  long: 15,
  interval: 4,
  sound: true,
  autobreak: false,
  dailyGoalMinutes: 60,
  theme: "forest",
};

function newId() {
  return crypto.randomUUID();
}

function defaultProfile(id: string): Profile {
  const today = todayISO();
  return {
    id,
    display_name: "",
    avatar_url: null,
    settings: { ...DEFAULT_SETTINGS },
    total_focus_minutes: 0,
    total_pomos: 0,
    current_streak: 0,
    longest_streak: 0,
    last_active_date: null,
    tree_planted_at: today,
    tree_stage: 0,
  };
}

function loadRaw(): AppData | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(DATA_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as AppData;
  } catch {
    return null;
  }
}

function saveRaw(data: AppData) {
  localStorage.setItem(DATA_KEY, JSON.stringify(data));
}

export function getUserId(): string {
  const data = loadRaw();
  if (data?.profile?.id) return data.profile.id;
  const id = newId();
  saveRaw({
    profile: defaultProfile(id),
    tasks: [],
    books: [],
    dailyStats: [],
  });
  return id;
}

export function getProfile(): Profile {
  const id = getUserId();
  const data = loadRaw();
  if (!data) {
    const profile = defaultProfile(id);
    saveRaw({ profile, tasks: [], books: [], dailyStats: [] });
    return profile;
  }
  if (!data.profile.settings) {
    data.profile.settings = { ...DEFAULT_SETTINGS };
  }
  if (!data.profile.tree_planted_at) {
    data.profile.tree_planted_at = todayISO();
    saveRaw(data);
  }
  if (!data.profile.settings.theme) {
    data.profile.settings.theme = getStoredTheme();
    saveRaw(data);
  }
  return data.profile;
}

export function updateProfile(patch: Partial<Profile>): Profile {
  const data = loadRaw()!;
  data.profile = { ...data.profile, ...patch };
  saveRaw(data);
  return data.profile;
}

export function getTasks(): Task[] {
  return loadRaw()?.tasks ?? [];
}

export function addTask(title: string): Task {
  const data = loadRaw()!;
  const task: Task = {
    id: newId(),
    user_id: data.profile.id,
    title,
    done: false,
    created_at: new Date().toISOString(),
  };
  data.tasks.unshift(task);
  saveRaw(data);
  return task;
}

export function toggleTask(id: string): void {
  const data = loadRaw()!;
  const t = data.tasks.find((x) => x.id === id);
  if (t) t.done = !t.done;
  saveRaw(data);
}

export function removeTask(id: string): void {
  const data = loadRaw()!;
  data.tasks = data.tasks.filter((t) => t.id !== id);
  saveRaw(data);
}

export function getBooks(): Book[] {
  const data = loadRaw();
  if (!data) return [];
  let changed = false;
  for (const b of data.books) {
    if (b.total_pages == null) { b.total_pages = 0; changed = true; }
    if (b.pages_read == null) { b.pages_read = 0; changed = true; }
  }
  if (changed) saveRaw(data);
  return data.books;
}

export function addBook(book: Omit<Book, "id" | "user_id" | "created_at">): Book {
  const data = loadRaw()!;
  const b: Book = {
    id: newId(),
    user_id: data.profile.id,
    created_at: new Date().toISOString(),
    ...book,
    total_pages: book.total_pages ?? 0,
    pages_read: book.pages_read ?? 0,
  };
  data.books.unshift(b);
  saveRaw(data);
  return b;
}

export function updateBook(id: string, patch: Partial<Book>): void {
  const data = loadRaw()!;
  const b = data.books.find((x) => x.id === id);
  if (b) Object.assign(b, patch);
  saveRaw(data);
}

export function removeBook(id: string): void {
  const data = loadRaw()!;
  data.books = data.books.filter((b) => b.id !== id);
  saveRaw(data);
}

export function getTodayFocusMinutes(): number {
  const data = loadRaw();
  if (!data) return 0;
  const today = todayISO();
  const row = data.dailyStats.find((d) => d.date === today);
  return row?.focus_minutes ?? 0;
}

export function getWeekStats(): { date: string; label: string; minutes: number; pomos: number }[] {
  const data = loadRaw();
  const days: { date: string; label: string; minutes: number; pomos: number }[] = [];
  const labels = ["Yak", "Du", "Se", "Cho", "Pa", "Ju", "Sha"];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const date = d.toISOString().slice(0, 10);
    const row = data?.dailyStats.find((x) => x.date === date);
    days.push({
      date,
      label: labels[d.getDay()],
      minutes: row?.focus_minutes ?? 0,
      pomos: row?.pomos ?? 0,
    });
  }
  return days;
}

export function recordFocusSession(minutes: number): Profile {
  const data = loadRaw()!;
  const today = todayISO();
  const p = data.profile;

  const existing = data.dailyStats.find((d) => d.date === today);
  if (existing) {
    existing.focus_minutes += minutes;
    existing.pomos += 1;
  } else {
    data.dailyStats.push({
      user_id: p.id,
      date: today,
      focus_minutes: minutes,
      pomos: 1,
    });
  }

  let streak = p.current_streak;
  if (p.last_active_date !== today) {
    if (p.last_active_date) {
      const d = diffDays(p.last_active_date, today);
      if (d === 1) streak = streak + 1;
      else if (d > 1) streak = 1;
    } else {
      streak = 1;
    }
  } else if (streak === 0) {
    streak = 1;
  }

  const longest = Math.max(p.longest_streak, streak);
  const newStage = stageForStreak(streak);

  p.total_focus_minutes += minutes;
  p.total_pomos += 1;
  p.current_streak = streak;
  p.longest_streak = longest;
  p.last_active_date = today;
  p.tree_stage = newStage;

  saveRaw(data);
  return p;
}

export function deleteAllUserData(): void {
  localStorage.removeItem(DATA_KEY);
  getUserId();
}

export function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}
