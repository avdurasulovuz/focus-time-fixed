import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect, useRef } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import {
  getProfile,
  updateProfile,
  deleteAllUserData,
  fileToDataUrl,
} from "@/lib/local-store";
import { Settings as SettingsIcon, User as UserIcon, Save, Camera, Trash2 } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/settings")({
  component: SettingsPage,
});

const READ_PRESETS = [25, 50, 80];

function SettingsPage() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const fileRef = useRef<HTMLInputElement>(null);

  const { data: profile } = useQuery({
    queryKey: ["profile", user?.id],
    enabled: !!user?.id,
    queryFn: () => getProfile(),
  });

  const [name, setName] = useState("");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [s, setS] = useState({
    focus: 25, short: 5, long: 15, interval: 4,
    sound: true, autobreak: false, dailyGoalMinutes: 60,
  });
  const [busy, setBusy] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  useEffect(() => {
    if (profile) {
      setName(profile.display_name || "");
      setAvatarUrl(profile.avatar_url || null);
      setS((prev) => ({ ...prev, ...profile.settings }));
    }
  }, [profile]);

  function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    setAvatarFile(f);
    const reader = new FileReader();
    reader.onload = (ev) => setAvatarPreview(ev.target?.result as string);
    reader.readAsDataURL(f);
  }

  async function save() {
    setBusy(true);
    try {
      let newAvatarUrl = avatarUrl;
      if (avatarFile) {
        newAvatarUrl = await fileToDataUrl(avatarFile);
      }

      updateProfile({
        display_name: name,
        settings: s,
        ...(newAvatarUrl !== avatarUrl ? { avatar_url: newAvatarUrl } : {}),
      });

      setAvatarUrl(newAvatarUrl);
      setAvatarFile(null);
      setAvatarPreview(null);
      toast.success("Saqlandi ✓");
      qc.invalidateQueries({ queryKey: ["profile"] });
    } catch (e: any) {
      toast.error(e.message || "Xatolik");
    } finally {
      setBusy(false);
    }
  }

  function handleDeleteData() {
    if (!confirmDelete) {
      setConfirmDelete(true);
      toast.warning("Yana bir marta bosing — barcha ma'lumotlar o'chadi");
      return;
    }
    deleteAllUserData();
    setConfirmDelete(false);
    setName("");
    setAvatarUrl(null);
    toast.success("Barcha ma'lumotlar o'chirildi");
    qc.invalidateQueries();
    window.location.href = "/app";
  }

  const displayAvatar = avatarPreview || avatarUrl;
  const initials = name ? name.slice(0, 2).toUpperCase() : "FT";

  return (
    <div className="p-4 sm:p-6 max-w-2xl mx-auto pt-5">
      <div className="flex items-center gap-3 mb-5">
        <div className="w-10 h-10 rounded-2xl bg-primary/15 flex items-center justify-center">
          <SettingsIcon className="w-5 h-5 text-primary" />
        </div>
        <h1 className="text-2xl font-display font-bold">Sozlamalar</h1>
      </div>

      <div className="glass rounded-2xl p-5 mb-3">
        <div className="text-xs uppercase tracking-wider text-muted-foreground mb-4 flex items-center gap-2">
          <UserIcon className="w-3.5 h-3.5" /> Profil
        </div>

        <div className="flex items-center gap-4 mb-4">
          <div className="relative">
            <div className="w-16 h-16 rounded-2xl overflow-hidden bg-primary/20 flex items-center justify-center border-2 border-border">
              {displayAvatar ? (
                <img src={displayAvatar} alt="Avatar" className="w-full h-full object-cover" />
              ) : (
                <span className="text-xl font-display font-bold text-primary">{initials}</span>
              )}
            </div>
            <button
              onClick={() => fileRef.current?.click()}
              className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow-md hover:opacity-90 transition"
            >
              <Camera className="w-3 h-3" />
            </button>
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleAvatarChange}
            />
          </div>
          <div>
            <p className="font-medium text-sm">{name || "Ism belgilanmagan"}</p>
            <p className="text-xs text-muted-foreground">Ma'lumotlar brauzerda saqlanadi</p>
            {avatarPreview && (
              <p className="text-xs text-primary mt-1">✓ Yangi rasm tanlandi</p>
            )}
          </div>
        </div>

        <div className="space-y-3">
          <label className="flex items-center justify-between gap-4 flex-wrap">
            <span className="text-sm text-muted-foreground">Ism</span>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="inp min-w-[140px]"
              placeholder="Ismingiz..."
            />
          </label>
        </div>
      </div>

      <div className="glass rounded-2xl p-5 mb-3">
        <div className="text-xs uppercase tracking-wider text-muted-foreground mb-3">
          O'qish vaqti presetlari
        </div>
        <p className="text-xs text-muted-foreground mb-3">Qancha vaqt o'qimoqchisiz?</p>
        <div className="flex gap-2">
          {READ_PRESETS.map((min) => (
            <button
              key={min}
              onClick={() => setS({ ...s, focus: min })}
              className={`flex-1 py-3 rounded-2xl text-sm font-semibold transition border ${
                s.focus === min
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-muted/50 text-muted-foreground border-border hover:bg-muted"
              }`}
            >
              {min} daq
            </button>
          ))}
        </div>
      </div>

      <div className="glass rounded-2xl p-5 mb-3">
        <div className="text-xs uppercase tracking-wider text-muted-foreground mb-3">
          Pomodoro sozlamalari
        </div>
        <div className="space-y-3">
          <Field label="Fokus vaqti (daqiqa)">
            <NumIn value={s.focus} on={(v) => setS({ ...s, focus: v })} min={1} max={120} />
          </Field>
          <Field label="Qisqa dam (daqiqa)">
            <NumIn value={s.short} on={(v) => setS({ ...s, short: v })} min={1} max={60} />
          </Field>
          <Field label="Uzun dam (daqiqa)">
            <NumIn value={s.long} on={(v) => setS({ ...s, long: v })} min={1} max={60} />
          </Field>
          <Field label="Uzun damgacha pomodoro">
            <NumIn value={s.interval} on={(v) => setS({ ...s, interval: v })} min={2} max={10} />
          </Field>
          <Field label="Kunlik maqsad (daqiqa)">
            <NumIn value={s.dailyGoalMinutes} on={(v) => setS({ ...s, dailyGoalMinutes: v })} min={15} max={600} />
          </Field>
          <div className="border-t border-border pt-3 space-y-3">
            <Toggle label="Tugaganda ovoz" value={s.sound} on={(v) => setS({ ...s, sound: v })} />
            <Toggle label="Avto dam boshlash" value={s.autobreak} on={(v) => setS({ ...s, autobreak: v })} />
          </div>
        </div>
      </div>

      <button
        onClick={save}
        disabled={busy}
        className="w-full mt-2 py-3.5 rounded-2xl bg-primary text-primary-foreground font-semibold flex items-center justify-center gap-2 disabled:opacity-50 hover:opacity-90 transition"
      >
        <Save className="w-4 h-4" /> {busy ? "Saqlanmoqda..." : "Saqlash"}
      </button>

      <button
        onClick={handleDeleteData}
        className={`w-full mt-2 py-3 rounded-2xl font-medium flex items-center justify-center gap-2 transition ${
          confirmDelete
            ? "bg-destructive text-destructive-foreground"
            : "bg-muted text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
        }`}
      >
        <Trash2 className="w-4 h-4" />
        {confirmDelete ? "Ha, barchasini o'chirish" : "Ma'lumotlarni o'chirish"}
      </button>

      <style>{`
        .inp { width:100%; padding:0.6rem 1rem; border-radius:0.85rem; background:var(--input); border:1px solid var(--border); font-size:0.875rem; outline:none; }
        .inp:focus { border-color:var(--primary); }
      `}</style>
    </div>
  );
}

function Field({ label, children }: any) {
  return (
    <label className="flex items-center justify-between gap-4 flex-wrap">
      <span className="text-sm text-muted-foreground">{label}</span>
      <div className="min-w-[140px]">{children}</div>
    </label>
  );
}

function NumIn({ value, on, min, max }: { value: number; on: (v: number) => void; min: number; max: number }) {
  return (
    <input
      type="number"
      value={value}
      min={min}
      max={max}
      onChange={(e) => on(Number(e.target.value))}
      className="inp text-right font-mono"
    />
  );
}

function Toggle({ label, value, on }: { label: string; value: boolean; on: (v: boolean) => void }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-sm text-muted-foreground">{label}</span>
      <button
        onClick={() => on(!value)}
        type="button"
        className={`w-11 h-6 rounded-full transition-colors relative flex-shrink-0 ${value ? "bg-primary" : "bg-muted"}`}
      >
        <span
          className={`absolute top-0.5 w-5 h-5 rounded-full bg-background shadow transition-all ${value ? "left-[22px]" : "left-0.5"}`}
        />
      </button>
    </div>
  );
}
