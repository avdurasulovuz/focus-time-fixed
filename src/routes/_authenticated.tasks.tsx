import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { getTasks, addTask, toggleTask, removeTask } from "@/lib/local-store";
import { Plus, Trash2, ListChecks, Circle, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/tasks")({
  component: TasksPage,
});

function TasksPage() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [title, setTitle] = useState("");
  const [filter, setFilter] = useState<"all" | "active" | "done">("all");

  const { data: tasks = [], isLoading } = useQuery({
    queryKey: ["tasks", user?.id],
    enabled: !!user?.id,
    queryFn: () => getTasks(),
  });

  function add() {
    if (!title.trim()) return;
    addTask(title.trim());
    setTitle("");
    qc.invalidateQueries({ queryKey: ["tasks", user?.id] });
  }

  function toggle(id: string) {
    toggleTask(id);
    qc.invalidateQueries({ queryKey: ["tasks", user?.id] });
  }

  function remove(id: string) {
    removeTask(id);
    qc.invalidateQueries({ queryKey: ["tasks", user?.id] });
  }

  const filtered = tasks.filter((t) =>
    filter === "all" ? true : filter === "done" ? t.done : !t.done
  );
  const doneCount = tasks.filter((t) => t.done).length;

  return (
    <div className="p-4 sm:p-8 max-w-3xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl bg-primary/15 flex items-center justify-center">
          <ListChecks className="w-5 h-5 text-primary" />
        </div>
        <div>
          <h1 className="text-3xl font-display font-bold">Vazifalar</h1>
          <p className="text-sm text-muted-foreground">{doneCount}/{tasks.length} bajarildi</p>
        </div>
      </div>

      <div className="glass rounded-2xl p-3 mb-4 flex gap-2">
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && add()}
          placeholder="Yangi vazifa qo'shish..."
          className="flex-1 px-4 py-2.5 rounded-xl bg-input border border-border focus:border-primary outline-none text-sm"
        />
        <button
          onClick={add}
          disabled={!title.trim()}
          className="px-4 py-2.5 rounded-xl bg-primary text-primary-foreground font-medium flex items-center gap-2 disabled:opacity-50"
        >
          <Plus className="w-4 h-4" /> Qo'shish
        </button>
      </div>

      <div className="flex gap-2 mb-3">
        {(["all", "active", "done"] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium transition ${filter === f ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-muted/70"}`}
          >
            {f === "all" ? "Hammasi" : f === "active" ? "Bajarilmagan" : "Bajarilgan"}
          </button>
        ))}
      </div>

      <div className="space-y-2">
        {isLoading && (
          <div className="text-center py-12 text-sm text-muted-foreground">Yuklanmoqda...</div>
        )}
        {!isLoading && filtered.length === 0 && (
          <div className="glass rounded-2xl p-12 text-center">
            <ListChecks className="w-10 h-10 text-primary mx-auto mb-3 opacity-50" />
            <p className="text-sm text-muted-foreground">
              {filter === "all" ? "Hali vazifa yo'q. Birinchisini qo'shing!" : "Bu bo'limda vazifa yo'q"}
            </p>
          </div>
        )}
        {filtered.map((t) => (
          <div key={t.id} className="glass rounded-xl p-3 flex items-center gap-3 group hover:border-primary/20 border border-transparent transition">
            <button onClick={() => toggle(t.id)} className="flex-shrink-0">
              {t.done
                ? <CheckCircle2 className="w-5 h-5 text-primary" />
                : <Circle className="w-5 h-5 text-muted-foreground hover:text-primary transition" />
              }
            </button>
            <span className={`flex-1 text-sm ${t.done ? "line-through text-muted-foreground" : ""}`}>
              {t.title}
            </span>
            <button
              onClick={() => remove(t.id)}
              className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive transition p-1 rounded-lg hover:bg-destructive/10"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
