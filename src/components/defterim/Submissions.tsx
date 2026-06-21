import { useEffect, useState, useCallback } from "react";
import { Inbox, GraduationCap, Award, CheckCircle2, Clock, MessageSquare, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { useRoles } from "@/lib/role-context";
import type { Block } from "@/lib/defterim-data";
import { BlockEditor } from "./Editor";

type Submission = {
  id: string;
  note_id: string;
  student_id: string;
  teacher_id: string;
  note_title: string;
  course_name: string | null;
  blocks: Block[];
  status: string;
  submitted_at: string;
};

type Grade = {
  id: string;
  submission_id: string;
  rank: number;
  comment: string | null;
};

export function Submissions() {
  const { isTeacher } = useRoles();
  return isTeacher ? <TeacherInbox /> : <StudentInbox />;
}

function StudentInbox() {
  const { user } = useAuth();
  const [items, setItems] = useState<(Submission & { grade?: Grade; teacher_name?: string })[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    const { data: subs } = await supabase.from("submissions").select("*").eq("student_id", user.id).order("submitted_at", { ascending: false });
    const list = (subs ?? []) as unknown as Submission[];
    const subIds = list.map(s => s.id);
    const teacherIds = [...new Set(list.map(s => s.teacher_id))];
    const [{ data: grades }, { data: profiles }] = await Promise.all([
      subIds.length ? supabase.from("grades").select("*").in("submission_id", subIds) : Promise.resolve({ data: [] as Grade[] }),
      teacherIds.length ? supabase.from("profiles").select("id, display_name").in("id", teacherIds) : Promise.resolve({ data: [] as { id: string; display_name: string | null }[] }),
    ]);
    const gradeMap = new Map((grades ?? []).map(g => [g.submission_id, g as Grade]));
    const nameMap = new Map((profiles ?? []).map(p => [p.id, p.display_name ?? ""]));
    setItems(list.map(s => ({ ...s, grade: gradeMap.get(s.id), teacher_name: nameMap.get(s.teacher_id) ?? "—" })));
    setLoading(false);
  }, [user]);

  useEffect(() => { load(); }, [load]);

  const cancel = async (id: string) => {
    if (!confirm("Bu tabşyrygy yza almak?")) return;
    await supabase.from("submissions").delete().eq("id", id);
    load();
  };

  return (
    <div className="scrollbar-thin h-full overflow-y-auto">
      <div className="mx-auto max-w-4xl px-6 py-10">
        <div className="mb-8 flex items-center gap-2">
          <GraduationCap className="h-6 w-6 text-primary" />
          <h1 className="text-2xl font-bold tracking-tight">Tabşyrylanlar</h1>
        </div>
        {loading ? (
          <div className="text-muted-foreground">Ýüklenýär...</div>
        ) : items.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border p-10 text-center text-muted-foreground">
            Henize çenli ýazgy iberilmedik. Ýazgyňyzy açyp <strong>Mugallyma iber</strong> düwmesine basyň.
          </div>
        ) : (
          <div className="space-y-3">
            {items.map(s => (
              <div key={s.id} className="rounded-xl border border-border bg-card p-4">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div className="truncate text-base font-semibold">{s.note_title}</div>
                    <div className="mt-0.5 text-xs text-muted-foreground">
                      {s.course_name && <span>{s.course_name} · </span>}
                      Mugallym: <span className="text-foreground">{s.teacher_name}</span> · {new Date(s.submitted_at).toLocaleString("tk-TM")}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {s.grade ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/15 px-3 py-1 text-sm font-semibold text-emerald-600">
                        <Award className="h-4 w-4" /> {s.grade.rank}-nji orun
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/15 px-3 py-1 text-xs font-medium text-amber-600">
                        <Clock className="h-3 w-3" /> Garaşylýar
                      </span>
                    )}
                    {!s.grade && (
                      <button onClick={() => cancel(s.id)} className="rounded p-1 text-muted-foreground hover:bg-accent hover:text-destructive" title="Yza al">
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>
                </div>
                {s.grade?.comment && (
                  <div className="mt-3 flex items-start gap-2 rounded-md border border-border bg-background p-3 text-sm">
                    <MessageSquare className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                    <span>{s.grade.comment}</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function TeacherInbox() {
  const { user } = useAuth();
  const [items, setItems] = useState<(Submission & { grade?: Grade; student_name?: string })[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    const { data: subs } = await supabase.from("submissions").select("*").eq("teacher_id", user.id).order("submitted_at", { ascending: false });
    const list = (subs ?? []) as unknown as Submission[];
    const subIds = list.map(s => s.id);
    const studentIds = [...new Set(list.map(s => s.student_id))];
    const [{ data: grades }, { data: profiles }] = await Promise.all([
      subIds.length ? supabase.from("grades").select("*").in("submission_id", subIds) : Promise.resolve({ data: [] as Grade[] }),
      studentIds.length ? supabase.from("profiles").select("id, display_name").in("id", studentIds) : Promise.resolve({ data: [] as { id: string; display_name: string | null }[] }),
    ]);
    const gradeMap = new Map((grades ?? []).map(g => [g.submission_id, g as Grade]));
    const nameMap = new Map((profiles ?? []).map(p => [p.id, p.display_name ?? ""]));
    setItems(list.map(s => ({ ...s, grade: gradeMap.get(s.id), student_name: nameMap.get(s.student_id) ?? "—" })));
    setLoading(false);
  }, [user]);

  useEffect(() => { load(); }, [load]);

  const usedRanks = new Set(items.map(i => i.grade?.rank).filter((r): r is number => !!r));

  const grade = async (submission: Submission, rank: number, comment: string, existingId?: string) => {
    if (!user) return;
    if (existingId) {
      const { error } = await supabase.from("grades").update({ rank, comment }).eq("id", existingId);
      if (error) { alert(error.message); return; }
    } else {
      const { error } = await supabase.from("grades").insert({
        submission_id: submission.id, teacher_id: user.id, student_id: submission.student_id, rank, comment,
      });
      if (error) { alert(error.code === "23505" ? "Bu orun eýýäm berlen." : error.message); return; }
    }
    await supabase.from("submissions").update({ status: "graded" }).eq("id", submission.id);
    load();
    setExpanded(null);
  };

  return (
    <div className="scrollbar-thin h-full overflow-y-auto">
      <div className="mx-auto max-w-4xl px-6 py-10">
        <div className="mb-8 flex items-center gap-2">
          <Inbox className="h-6 w-6 text-primary" />
          <h1 className="text-2xl font-bold tracking-tight">Gelýän işler</h1>
        </div>
        {loading ? (
          <div className="text-muted-foreground">Ýüklenýär...</div>
        ) : items.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border p-10 text-center text-muted-foreground">
            Henize çenli tabşyrylan iş ýok.
          </div>
        ) : (
          <div className="space-y-3">
            {items.map(s => (
              <div key={s.id} className="rounded-xl border border-border bg-card">
                <button onClick={() => setExpanded(e => e === s.id ? null : s.id)} className="flex w-full items-start justify-between gap-3 p-4 text-left">
                  <div className="min-w-0">
                    <div className="truncate text-base font-semibold">{s.note_title}</div>
                    <div className="mt-0.5 text-xs text-muted-foreground">
                      {s.course_name && <span>{s.course_name} · </span>}
                      Talyp: <span className="text-foreground">{s.student_name}</span> · {new Date(s.submitted_at).toLocaleString("tk-TM")}
                    </div>
                  </div>
                  {s.grade ? (
                    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/15 px-3 py-1 text-sm font-semibold text-emerald-600">
                      <CheckCircle2 className="h-4 w-4" /> {s.grade.rank}-nji orun
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/15 px-3 py-1 text-xs font-medium text-amber-600">
                      <Clock className="h-3 w-3" /> Garaşýar
                    </span>
                  )}
                </button>
                {expanded === s.id && (
                  <div className="border-t border-border p-4 space-y-4">
                    <div className="space-y-3">
                      {s.blocks.map((b, i) => (
                        <BlockEditor key={(b as { id?: string }).id ?? i} block={b} readonly onChange={() => {}} />
                      ))}
                    </div>
                    <GradeForm submission={s} existing={s.grade} usedRanks={usedRanks} onSubmit={grade} />
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function GradeForm({ submission, existing, usedRanks, onSubmit }: {
  submission: Submission;
  existing?: Grade;
  usedRanks: Set<number>;
  onSubmit: (s: Submission, rank: number, comment: string, existingId?: string) => Promise<void>;
}) {
  const [rank, setRank] = useState<number>(existing?.rank ?? nextRank(usedRanks));
  const [comment, setComment] = useState(existing?.comment ?? "");

  function nextRank(used: Set<number>): number {
    for (let i = 1; i < 1000; i++) if (!used.has(i)) return i;
    return 1;
  }

  const isInvalid = rank < 1 || (rank !== existing?.rank && usedRanks.has(rank));

  return (
    <div className="rounded-lg border border-border bg-background p-4 space-y-3">
      <div className="flex items-center gap-2 text-sm font-medium"><Award className="h-4 w-4 text-primary" /> Baha bermek</div>
      <p className="text-xs text-muted-foreground">Her tabşyryga özboluşly orun beriň (1-nji ýer, 2-nji ýer, ...). Hiç bir iki tabşyryk birmeňzeş orun alyp bilmez.</p>
      <div className="flex flex-wrap items-end gap-3">
        <label className="flex flex-col gap-1 text-xs">
          <span className="text-muted-foreground">Orun</span>
          <input
            type="number" min={1} value={rank} onChange={e => setRank(Number(e.target.value))}
            className="w-24 rounded-md border border-border bg-card px-3 py-1.5 text-sm outline-none focus:ring-2 focus:ring-ring"
          />
        </label>
        <label className="flex flex-1 min-w-[200px] flex-col gap-1 text-xs">
          <span className="text-muted-foreground">Düşündiriş (hökmany däl)</span>
          <input
            value={comment} onChange={e => setComment(e.target.value)} placeholder="Yzarlama ýazyň..."
            className="rounded-md border border-border bg-card px-3 py-1.5 text-sm outline-none focus:ring-2 focus:ring-ring"
          />
        </label>
        <button
          disabled={isInvalid}
          onClick={() => onSubmit(submission, rank, comment, existing?.id)}
          className="rounded-md bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-40"
        >
          {existing ? "Üýtgetmek" : "Baha ber"}
        </button>
      </div>
      {isInvalid && <p className="text-xs text-destructive">Bu orun başga tabşyryga eýýäm berlen.</p>}
    </div>
  );
}