import { useEffect, useState } from "react";
import { X, Send, GraduationCap } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { useDefterim } from "@/lib/defterim-store";

type Teacher = { id: string; display_name: string | null };
type Term = { id: string; name: string };
type Course = { id: string; name: string; term_id: string };

export function SubmitNoteModal({ noteId, onClose }: { noteId: string; onClose: () => void }) {
  const { user } = useAuth();
  const { findNote } = useDefterim();
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [selectedTeacher, setSelectedTeacher] = useState<string>("");
  const [terms, setTerms] = useState<Term[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [selectedTerm, setSelectedTerm] = useState<string>("");
  const [selectedCourse, setSelectedCourse] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [loadingTree, setLoadingTree] = useState(false);
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

  useEffect(() => {
    if (!selectedTeacher) { setTerms([]); setCourses([]); setSelectedTerm(""); setSelectedCourse(""); return; }
    (async () => {
      setLoadingTree(true);
      const [{ data: t }, { data: c }] = await Promise.all([
        supabase.from("terms").select("id, name").eq("user_id", selectedTeacher).order("position").order("created_at"),
        supabase.from("courses").select("id, name, term_id").eq("user_id", selectedTeacher).order("position").order("created_at"),
      ]);
      setTerms(t ?? []);
      setCourses(c ?? []);
      setSelectedTerm(""); setSelectedCourse("");
      setLoadingTree(false);
    })();
  }, [selectedTeacher]);

  const found = findNote(noteId);
  if (!found) return null;
  const { note } = found;
  const termCourses = courses.filter(c => c.term_id === selectedTerm);

  const handleSubmit = async () => {
    if (!user || !selectedTeacher || !selectedTerm || !selectedCourse) return;
    const term = terms.find(t => t.id === selectedTerm);
    const course = courses.find(c => c.id === selectedCourse);
    setSubmitting(true); setError(null);
    const { error } = await supabase.from("submissions").insert({
      note_id: note.id,
      student_id: user.id,
      teacher_id: selectedTeacher,
      note_title: note.title,
      course_name: course?.name ?? null,
      teacher_term_id: selectedTerm,
      teacher_course_id: selectedCourse,
      teacher_term_name: term?.name ?? null,
      teacher_course_name: course?.name ?? null,
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
          <span className="font-medium text-foreground">"{note.title}"</span> ýazgysy mugallymyň möwsümi we sapagy boýunça iberiler.
        </p>

        {loading ? (
          <div className="py-6 text-center text-sm text-muted-foreground">Mugallymlar gözlenýär...</div>
        ) : teachers.length === 0 ? (
          <div className="rounded-md border border-dashed border-border p-4 text-center text-sm text-muted-foreground">
            Hasaba alnan mugallym ýok.
          </div>
        ) : (
          <div className="space-y-4">
            <div>
              <label className="mb-1.5 block text-xs font-medium text-muted-foreground">Mugallym</label>
              <select
                value={selectedTeacher} onChange={e => setSelectedTeacher(e.target.value)}
                className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
              >
                <option value="">— Saýla —</option>
                {teachers.map(t => <option key={t.id} value={t.id}>{t.display_name || "Atsyz"}</option>)}
              </select>
            </div>

            {selectedTeacher && (
              loadingTree ? (
                <div className="text-center text-sm text-muted-foreground">Mugallymyň möwsümleri ýüklenýär...</div>
              ) : terms.length === 0 ? (
                <div className="rounded-md border border-dashed border-border p-3 text-center text-xs text-muted-foreground">
                  Bu mugallymyň möwsümi we sapagy ýok. Başga mugallym saýlaň.
                </div>
              ) : (
                <>
                  <div>
                    <label className="mb-1.5 block text-xs font-medium text-muted-foreground">Möwsüm</label>
                    <select
                      value={selectedTerm} onChange={e => { setSelectedTerm(e.target.value); setSelectedCourse(""); }}
                      className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
                    >
                      <option value="">— Saýla —</option>
                      {terms.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                    </select>
                  </div>

                  {selectedTerm && (
                    <div>
                      <label className="mb-1.5 block text-xs font-medium text-muted-foreground">Sapak</label>
                      {termCourses.length === 0 ? (
                        <div className="rounded-md border border-dashed border-border p-2 text-center text-xs text-muted-foreground">
                          Bu möwsümde sapak ýok.
                        </div>
                      ) : (
                        <select
                          value={selectedCourse} onChange={e => setSelectedCourse(e.target.value)}
                          className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
                        >
                          <option value="">— Saýla —</option>
                          {termCourses.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                        </select>
                      )}
                    </div>
                  )}
                </>
              )
            )}
          </div>
        )}

        {error && <p className="mt-3 text-sm text-destructive">{error}</p>}
        {done && <p className="mt-3 text-sm text-emerald-600">Üstünlikli iberildi ✓</p>}
        <div className="mt-5 flex justify-end gap-2">
          <button onClick={onClose} className="rounded-md border border-border px-3 py-1.5 text-sm hover:bg-accent">Goý bolsun</button>
          <button
            onClick={handleSubmit}
            disabled={!selectedTeacher || !selectedTerm || !selectedCourse || submitting || done}
            className="inline-flex items-center gap-1.5 rounded-md bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-40"
          >
            <Send className="h-3.5 w-3.5" /> Iber
          </button>
        </div>
      </div>
    </div>
  );
}
