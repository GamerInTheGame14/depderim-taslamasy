import { useEffect, useState } from "react";
import { X, Send, GraduationCap } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { useDefterim } from "@/lib/defterim-store";

type Teacher = { id: string; display_name: string | null };

export function SubmitNoteModal({ noteId, onClose }: { noteId: string; onClose: () => void }) {
  const { user } = useAuth();
  const { findNote } = useDefterim();
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [selectedTeacher, setSelectedTeacher] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  useEffect(() => {
    (async () => {
      const { data: roleRows } = await supabase.from("user_roles").select("user_id").eq("role", "teacher");
      const ids = (roleRows ?? []).map(r => r.user_id);
      if (ids.length === 0) { setTeachers([]); setLoading(false); return; }
      const { data: profiles } = await supabase.from("profiles").select("id, display_name").in("id", ids);
      setTeachers(profiles ?? []);
      setLoading(false);
    })();
  }, []);

  const found = findNote(noteId);
  if (!found) return null;
  const { note, course } = found;

  const handleSubmit = async () => {
    if (!user || !selectedTeacher) return;
    setSubmitting(true); setError(null);
    const { error } = await supabase.from("submissions").insert({
      note_id: note.id,
      student_id: user.id,
      teacher_id: selectedTeacher,
      note_title: note.title,
      course_name: course.name,
      blocks: note.blocks as unknown as never,
      status: "pending",
    });
    setSubmitting(false);
    if (error) {
      if (error.code === "23505") setError("Bu ýazgy bu mugallyma eýýäm tabşyrylan.");
      else setError(error.message);
      return;
    }
    setDone(true);
    setTimeout(onClose, 1200);
  };

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/50 p-4" onClick={onClose}>
      <div className="w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-2xl" onClick={e => e.stopPropagation()}>
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <GraduationCap className="h-5 w-5 text-primary" />
            <h2 className="text-lg font-semibold">Mugallyma iber</h2>
          </div>
          <button onClick={onClose} className="rounded p-1 hover:bg-accent"><X className="h-4 w-4" /></button>
        </div>
        <p className="mb-4 text-sm text-muted-foreground">
          <span className="font-medium text-foreground">"{note.title}"</span> ýazgysynyň häzirki nusgasy mugallyma iberiler.
        </p>
        {loading ? (
          <div className="py-6 text-center text-sm text-muted-foreground">Mugallymlar gözlenýär...</div>
        ) : teachers.length === 0 ? (
          <div className="rounded-md border border-dashed border-border p-4 text-center text-sm text-muted-foreground">
            Hasaba alnan mugallym ýok.
          </div>
        ) : (
          <div className="space-y-2 max-h-60 overflow-y-auto">
            {teachers.map(t => (
              <label key={t.id} className="flex cursor-pointer items-center gap-3 rounded-md border border-border p-3 hover:bg-accent">
                <input type="radio" name="teacher" value={t.id} checked={selectedTeacher === t.id} onChange={() => setSelectedTeacher(t.id)} />
                <span className="text-sm">{t.display_name || "Atsyz mugallym"}</span>
              </label>
            ))}
          </div>
        )}
        {error && <p className="mt-3 text-sm text-destructive">{error}</p>}
        {done && <p className="mt-3 text-sm text-emerald-600">Üstünlikli iberildi ✓</p>}
        <div className="mt-5 flex justify-end gap-2">
          <button onClick={onClose} className="rounded-md border border-border px-3 py-1.5 text-sm hover:bg-accent">Goý bolsun</button>
          <button
            onClick={handleSubmit}
            disabled={!selectedTeacher || submitting || done}
            className="inline-flex items-center gap-1.5 rounded-md bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-40"
          >
            <Send className="h-3.5 w-3.5" /> Iber
          </button>
        </div>
      </div>
    </div>
  );
}