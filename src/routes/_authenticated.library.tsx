import { createFileRoute } from "@tanstack/react-router";
import { useState, useRef } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { getBooks, addBook, updateBook, removeBook, fileToDataUrl, type Book } from "@/lib/local-store";
import { Plus, BookOpen, Trash2, Upload, Link2, X, BookMarked } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/library")({
  component: LibraryPage,
});

const STATUS_LABELS: Record<string, string> = {
  reading: "O'qilyapti",
  done: "Tugallangan",
  want: "Rejada",
};

function LibraryPage() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState<"all" | "reading" | "done" | "want">("all");

  const { data: books = [], isLoading } = useQuery({
    queryKey: ["books", user?.id],
    enabled: !!user?.id,
    queryFn: () => getBooks(),
  });

  function remove(id: string) {
    removeBook(id);
    qc.invalidateQueries({ queryKey: ["books", user?.id] });
    toast.success("Kitob o'chirildi");
  }

  function updateStatus(id: string, status: string) {
    updateBook(id, { status });
    qc.invalidateQueries({ queryKey: ["books", user?.id] });
  }

  const filtered = statusFilter === "all" ? books : books.filter((b) => b.status === statusFilter);

  return (
    <div className="p-4 sm:p-8 max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/15 flex items-center justify-center">
            <BookOpen className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h1 className="text-3xl font-display font-bold">Shaxsiy kutubxona</h1>
            <p className="text-sm text-muted-foreground">{books.length} kitob</p>
          </div>
        </div>
        <button
          onClick={() => setOpen(true)}
          className="px-4 py-2.5 rounded-xl bg-primary text-primary-foreground font-medium flex items-center gap-2 hover:opacity-90 transition"
        >
          <Plus className="w-4 h-4" /> Kitob qo'shish
        </button>
      </div>

      <div className="flex gap-2 mb-5 flex-wrap">
        {(["all", "reading", "done", "want"] as const).map((s) => (
          <button
            key={s}
            onClick={() => setStatusFilter(s)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium transition ${statusFilter === s ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-muted/70"}`}
          >
            {s === "all" ? "Hammasi" : STATUS_LABELS[s]}
            <span className="ml-1.5 opacity-70">
              {s === "all" ? books.length : books.filter((b) => b.status === s).length}
            </span>
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="animate-pulse">
              <div className="aspect-[2/3] rounded-xl bg-muted" />
              <div className="h-3 bg-muted rounded mt-2 w-3/4" />
            </div>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="glass rounded-3xl p-12 text-center">
          <BookMarked className="w-12 h-12 text-primary mx-auto mb-3 opacity-60" />
          <p className="font-medium mb-1">
            {statusFilter === "all" ? "Kutubxonangiz bo'sh" : `${STATUS_LABELS[statusFilter]} kitoblar yo'q`}
          </p>
          <p className="text-sm text-muted-foreground">
            {statusFilter === "all" ? "Birinchi kitobingizni qo'shing!" : "Boshqa kategoriyani tanlang"}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {filtered.map((b) => (
            <BookCard
              key={b.id}
              book={b}
              onRemove={() => remove(b.id)}
              onStatusChange={(status) => updateStatus(b.id, status)}
              onPagesChange={() => qc.invalidateQueries({ queryKey: ["books", user?.id] })}
            />
          ))}
        </div>
      )}

      {open && (
        <AddBookModal
          onClose={() => {
            setOpen(false);
            qc.invalidateQueries({ queryKey: ["books", user?.id] });
          }}
        />
      )}
    </div>
  );
}

function BookCard({
  book,
  onRemove,
  onStatusChange,
  onPagesChange,
}: {
  book: Book;
  onRemove: () => void;
  onStatusChange: (status: string) => void;
  onPagesChange: () => void;
}) {
  const [alert, setAlert] = useState(false);
  const prevRead = useRef(book.pages_read);

  function setPagesRead(val: number) {
    const next = Math.max(0, val);
    if (next < prevRead.current) {
      setAlert(true);
      setTimeout(() => setAlert(false), 2500);
    }
    prevRead.current = next;
    updateBook(book.id, { pages_read: next });
    onPagesChange();
  }

  function setTotalPages(val: number) {
    updateBook(book.id, { total_pages: Math.max(0, val) });
    onPagesChange();
  }

  const pct =
    book.total_pages > 0
      ? Math.min(100, Math.round((book.pages_read / book.total_pages) * 100))
      : null;

  return (
    <div className="group relative">
      <div
        className={`aspect-[2/3] rounded-xl overflow-hidden bg-muted border relative transition-colors duration-300 ${
          alert ? "border-destructive ring-2 ring-destructive/60" : "border-border"
        }`}
      >
        {book.cover_url ? (
          <img src={book.cover_url} alt={book.title} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center p-3 text-center bg-gradient-to-br from-primary/20 to-accent/20">
            <BookOpen className="w-8 h-8 text-primary mb-2" />
            <div className="text-xs font-display font-semibold line-clamp-3">{book.title}</div>
          </div>
        )}
        <div
          className={`absolute top-2 left-2 px-2 py-0.5 rounded-full text-[9px] font-semibold ${
            book.status === "done"
              ? "bg-green-500/90 text-white"
              : book.status === "reading"
                ? "bg-primary/90 text-primary-foreground"
                : "bg-muted/90 text-muted-foreground"
          }`}
        >
          {STATUS_LABELS[book.status] || book.status}
        </div>
        <div className="absolute inset-0 bg-background/60 opacity-0 group-hover:opacity-100 transition flex flex-col items-center justify-center gap-2">
          <select
            value={book.status}
            onChange={(e) => onStatusChange(e.target.value)}
            onClick={(e) => e.stopPropagation()}
            className="text-xs px-2 py-1 rounded-lg bg-background border border-border outline-none"
          >
            <option value="want">Rejada</option>
            <option value="reading">O'qilyapti</option>
            <option value="done">Tugallangan</option>
          </select>
          <button
            onClick={onRemove}
            className="w-8 h-8 rounded-full bg-destructive/90 flex items-center justify-center text-white"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
      <div className="mt-2 text-sm font-medium line-clamp-1">{book.title}</div>
      {book.author && <div className="text-xs text-muted-foreground line-clamp-1">{book.author}</div>}

      <div
        className={`mt-2 p-2 rounded-xl border text-xs transition-colors duration-300 ${
          alert
            ? "bg-destructive/20 border-destructive text-destructive"
            : "bg-muted/30 border-border"
        }`}
      >
        <div className="flex items-center justify-between gap-1 mb-1.5">
          <span className="text-muted-foreground">Varoqlar</span>
          {alert && <span className="font-semibold animate-pulse">Kamaydi!</span>}
        </div>
        <div className="flex items-center gap-1">
          <input
            type="number"
            min={0}
            value={book.pages_read || ""}
            onChange={(e) => setPagesRead(Number(e.target.value) || 0)}
            className={`w-12 px-1 py-0.5 rounded-md bg-input border text-center font-mono ${
              alert ? "border-destructive" : "border-border"
            }`}
            title="O'qilgan"
          />
          <span className="text-muted-foreground">/</span>
          <input
            type="number"
            min={0}
            value={book.total_pages || ""}
            onChange={(e) => setTotalPages(Number(e.target.value) || 0)}
            className="w-12 px-1 py-0.5 rounded-md bg-input border border-border text-center font-mono"
            title="Jami"
          />
        </div>
        {pct != null && (
          <div className="mt-1.5 h-1 bg-muted rounded-full overflow-hidden">
            <div
              className={`h-full transition-all ${alert ? "bg-destructive" : "bg-primary"}`}
              style={{ width: `${pct}%` }}
            />
          </div>
        )}
      </div>
    </div>
  );
}

function AddBookModal({ onClose }: { onClose: () => void }) {
  const [title, setTitle] = useState("");
  const [author, setAuthor] = useState("");
  const [coverUrl, setCoverUrl] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [mode, setMode] = useState<"upload" | "url">("upload");
  const [status, setStatus] = useState("reading");
  const [totalPages, setTotalPages] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit() {
    if (!title.trim()) return toast.error("Sarlavha kerak");
    setBusy(true);
    try {
      let cover = coverUrl.trim() || null;
      if (mode === "upload" && file) {
        cover = await fileToDataUrl(file);
      }
      addBook({
        title: title.trim(),
        author: author.trim() || null,
        cover_url: cover,
        status,
        total_pages: Number(totalPages) || 0,
        pages_read: 0,
      });
      toast.success("Kitob qo'shildi!");
      onClose();
    } catch {
      toast.error("Xatolik yuz berdi");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="glass rounded-2xl p-6 max-w-md w-full shadow-2xl"
      >
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-display font-bold">Kitob qo'shish</h2>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-muted transition">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="space-y-3">
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Sarlavha *"
            className="w-full px-4 py-2.5 rounded-xl bg-input border border-border focus:border-primary outline-none text-sm"
          />
          <input
            value={author}
            onChange={(e) => setAuthor(e.target.value)}
            placeholder="Muallif"
            className="w-full px-4 py-2.5 rounded-xl bg-input border border-border focus:border-primary outline-none text-sm"
          />
          <input
            type="number"
            min={0}
            value={totalPages}
            onChange={(e) => setTotalPages(e.target.value)}
            placeholder="Jami varoqlar"
            className="w-full px-4 py-2.5 rounded-xl bg-input border border-border focus:border-primary outline-none text-sm"
          />
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="w-full px-4 py-2.5 rounded-xl bg-input border border-border focus:border-primary outline-none text-sm"
          >
            <option value="want">Rejada</option>
            <option value="reading">O'qilyapti</option>
            <option value="done">Tugallangan</option>
          </select>

          <div className="flex gap-2 p-1 bg-muted/50 rounded-xl">
            <button
              onClick={() => setMode("upload")}
              className={`flex-1 py-1.5 rounded-lg text-xs flex items-center justify-center gap-1.5 transition ${mode === "upload" ? "bg-primary text-primary-foreground" : "text-muted-foreground"}`}
            >
              <Upload className="w-3.5 h-3.5" /> Rasm yuklash
            </button>
            <button
              onClick={() => setMode("url")}
              className={`flex-1 py-1.5 rounded-lg text-xs flex items-center justify-center gap-1.5 transition ${mode === "url" ? "bg-primary text-primary-foreground" : "text-muted-foreground"}`}
            >
              <Link2 className="w-3.5 h-3.5" /> URL kiritish
            </button>
          </div>

          {mode === "upload" ? (
            <div className="w-full">
              <input
                type="file"
                accept="image/*"
                onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                className="w-full text-xs file:mr-3 file:py-2 file:px-3 file:rounded-lg file:border-0 file:bg-muted file:text-foreground file:text-xs cursor-pointer"
              />
              {file && <p className="text-xs text-primary mt-1">✓ {file.name}</p>}
            </div>
          ) : (
            <input
              value={coverUrl}
              onChange={(e) => setCoverUrl(e.target.value)}
              placeholder="https://..."
              className="w-full px-4 py-2.5 rounded-xl bg-input border border-border focus:border-primary outline-none text-sm"
            />
          )}

          <button
            onClick={submit}
            disabled={busy || !title.trim()}
            className="w-full py-2.5 rounded-xl bg-primary text-primary-foreground font-medium disabled:opacity-50 hover:opacity-90 transition"
          >
            {busy ? "Saqlanmoqda..." : "Saqlash"}
          </button>
        </div>
      </div>
    </div>
  );
}
