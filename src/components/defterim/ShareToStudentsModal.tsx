import { useEffect, useState } from "react";
import { X, Send, Users } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { useDefterim } from "@/lib/defterim-store";

type Student = { id: string; display_name: string | null; email: string | null };

export function ShareToStudentsModal({ noteId, onClose }: { noteId: string; onClose: () => void }) {
  const { user } = useAuth();
  const { findNote } = useDefterim();
  const [students, setStudents] = useState<Student[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState("");

  useEffect(() => {
    (async () => {
      const { data: roleRows } = await supabase.from("user_roles").select("user_id").eq("role", "student");
      const ids = (roleRows ?? []).map(r => r.user_id);
      if (ids.length === 0) { setStudents([]); setLoading(false); return; }
      const { data: profiles } = await supabase.from("profiles").select("id, display_name, email").in("id", ids);
      setStudents(profiles ?? []);
      setLoading(false);
    })();
  }, []);

  const found = findNote(noteId);
  if (!found) return null;
  const { note, course } = found;

  const toggle = (id: string) => {
    setSelected(s => { const n = new Set(s); if (n.has(id)) n.delete(id); else n.add(id); return n; });
  };

  const handleSend = async () => {
    if (!user || selected.size === 0) return;
    setSending(true); setError(null);
    const rows = [...selected].map(sid => ({
      teacher_id: user.id,
      student_id: sid,
      source_note_id: note.id,
      note_title: note.title,
      course_name: course.name,
      blocks: note.blocks as unknown as never,
    }));
    const { error } = await supabase.from("teacher_shares").insert(rows);
    setSending(false);
    if (error) { setError(error.message); return; }
    setDone(true);
    setTimeout(onClose, 1200);
  };

  const visible = students.filter(s =>
    !filter || (s.display_name ?? "").toLowerCase().includes(filter.toLowerCase()) || (s.email ?? "").toLowerCase().includes(filter.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/50 p-4" onClick={onClose}>
      <div className="w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-2xl" onClick={e => e.stopPropagation()}>
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Users className="h-5 w-5 text-primary" />
            <h2 className="text-lg font-semibold">Talyplara paýlaş</h2>
          </div>
          <button onClick={onClose} className="rounded p-1 hover:bg-accent"><X className="h-4 w-4" /></button>
        </div>
        <p className="mb-3 text-sm text-muted-foreground">
          <span className="font-medium text-foreground">"{note.title}"</span> ýazgysynyň nusgasy saýlanan talyplara iberiler.
        </p>
        <input
          value={filter} onChange={e => setFilter(e.target.value)} placeholder="Talyp gözle..."
          className="mb-3 w-full rounded-md border border-border bg-background px-3 py-1.5 text-sm outline-none focus:ring-2 focus:ring-ring"
        />
        {loading ? (
          <div className="py-6 text-center text-sm text-muted-foreground">Talyplar gözlenýär...</div>
        ) : visible.length === 0 ? (
          <div className="rounded-md border border-dashed border-border p-4 text-center text-sm text-muted-foreground">Talyp tapylmady.</div>
        ) : (
          <div className="space-y-1.5 max-h-64 overflow-y-auto">
            {visible.map(s => (
              <label key={s.id} className="flex cursor-pointer items-center gap-3 rounded-md border border-border p-2.5 hover:bg-accent">
                <input type="checkbox" checked={selected.has(s.id)} onChange={() => toggle(s.id)} />
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm">{s.display_name || "Atsyz"}</div>
                  <div className="truncate text-[11px] text-muted-foreground">{s.email}</div>
                </div>
              </label>
            ))}
          </div>
        )}
        {error && <p className="mt-3 text-sm text-destructive">{error}</p>}
        {done && <p className="mt-3 text-sm text-emerald-600">Üstünlikli iberildi ✓</p>}
        <div className="mt-5 flex items-center justify-between">
          <span className="text-xs text-muted-foreground">{selected.size} talyp saýlandy</span>
          <div className="flex gap-2">
            <button onClick={onClose} className="rounded-md border border-border px-3 py-1.5 text-sm hover:bg-accent">Goý bolsun</button>
            <button
              onClick={handleSend}
              disabled={selected.size === 0 || sending || done}
              className="inline-flex items-center gap-1.5 rounded-md bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-40"
            >
              <Send className="h-3.5 w-3.5" /> Iber
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
