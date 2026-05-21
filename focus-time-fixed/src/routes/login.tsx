import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useState, type FormEvent, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Clock, Mail, Lock, Loader2 } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/login")({
  component: LoginPage,
});

function LoginPage() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) navigate({ to: "/app" });
    });
  }, [navigate]);

  async function handleEmail(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      if (mode === "signup") {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { display_name: name || email.split("@")[0] },
          },
        });
        if (error) throw error;
        // Profil qo'lda yaratamiz (trigger ishlamasa ham)
        if (data.user) {
          await ensureProfile(data.user.id, name || email.split("@")[0]);
        }
        toast.success("Hisob yaratildi! Emailingizni tasdiqlang, keyin kiring.");
        setMode("login");
      } else {
        const { data, error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        if (data.user) {
          await ensureProfile(data.user.id, name || email.split("@")[0]);
        }
        toast.success("Xush kelibsiz!");
        navigate({ to: "/app" });
      }
    } catch (err: any) {
      toast.error(err.message || "Xatolik yuz berdi");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 sm:p-8 bg-background">
      <div className="flex items-center gap-3 mb-8">
        <div className="w-12 h-12 rounded-2xl bg-primary/15 border border-primary/30 flex items-center justify-center">
          <Clock className="w-7 h-7 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-display font-bold">Focus Time</h1>
          <p className="text-xs text-muted-foreground">Fokus · O'sish · Hosil</p>
        </div>
      </div>

      <div className="w-full max-w-md glass rounded-2xl p-6 sm:p-8 shadow-2xl">
        <div className="flex gap-2 p-1 bg-muted/50 rounded-xl mb-6">
          {(["login", "signup"] as const).map((m) => (
            <button
              key={m}
              onClick={() => setMode(m)}
              className={`flex-1 py-2 rounded-lg text-sm font-medium transition ${mode === m ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"}`}
            >
              {m === "login" ? "Kirish" : "Ro'yxatdan o'tish"}
            </button>
          ))}
        </div>

        <form onSubmit={handleEmail} className="space-y-3">
          {mode === "signup" && (
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ismingiz"
              className="w-full px-4 py-3 rounded-xl bg-input border border-border focus:border-primary outline-none text-sm"
            />
          )}
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              required
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="email@example.com"
              className="w-full pl-10 pr-4 py-3 rounded-xl bg-input border border-border focus:border-primary outline-none text-sm"
            />
          </div>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              required
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Parol (kamida 6 belgi)"
              minLength={6}
              className="w-full pl-10 pr-4 py-3 rounded-xl bg-input border border-border focus:border-primary outline-none text-sm"
            />
          </div>
          <button
            disabled={loading}
            className="w-full py-3 rounded-xl bg-primary text-primary-foreground font-semibold hover:opacity-90 transition disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loading && <Loader2 className="w-4 h-4 animate-spin" />}
            {mode === "login" ? "Kirish" : "Hisob ochish"}
          </button>
        </form>

        {mode === "login" && (
          <p className="text-center text-xs text-muted-foreground mt-4">
            Hisob yo'qmi?{" "}
            <button onClick={() => setMode("signup")} className="text-primary hover:underline">
              Ro'yxatdan o'ting
            </button>
          </p>
        )}
        {mode === "signup" && (
          <p className="text-center text-xs text-muted-foreground mt-4">
            Hisobingiz bormi?{" "}
            <button onClick={() => setMode("login")} className="text-primary hover:underline">
              Kiring
            </button>
          </p>
        )}
      </div>
    </div>
  );
}

// Profil mavjud emasligini tekshirib, yaratadi
async function ensureProfile(userId: string, displayName: string) {
  const { data } = await supabase
    .from("profiles")
    .select("id")
    .eq("id", userId)
    .maybeSingle();
  if (!data) {
    await supabase.from("profiles").insert({
      id: userId,
      display_name: displayName,
    });
  }
}
