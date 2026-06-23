import { useEffect, useState, useCallback, useMemo } from "react";
import { Inbox, GraduationCap, Award, CheckCircle2, Clock, MessageSquare, Trash2, Send, Eye, MailOpen, Mail, Shield, Activity } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { useRoles } from "@/lib/role-context";
import type { Block } from "@/lib/defterim-data";
import { BlockEditor } from "./Editor";
import { cn } from "@/lib/utils";

type Submission = {
  id: string;
  note_id: string;
  student_id: string;
  teacher_id: string;
  note_title: string;
  course_name: string | null;
  teacher_term_name: string | null;
  teacher_course_name: string | null;
  blocks: Block[];
  status: string;
  submitted_at: string;
  read_at: string | null;
};
type Grade = { id: string; submission_id: string; rank: number; comment: string | null };
type Share = {
  id: string;
  teacher_id: string;
  student_id: string;
  note_title: string;
  course_name: string | null;
  blocks: Block[];
  read_at: string | null;
  created_at: string;
};

export function Submissions() {
  const { isAdmin, isTeacher } = useRoles();
  if (isAdmin) return <AdminActivity />;
  return isTeacher ? <TeacherInbox /> : <StudentInbox />;
}

/* ---------------- STUDENT ---------------- */
function StudentInbox() {
  const { user } = useAuth();
  const [tab, setTab] = useState<"sent" | "received">("sent");
  const [subs, setSubs] = useState<(Submission & { grade?: Grade; teacher_name?: string })[]>([]);
  const [shares, setShares] = useState<(Share & { teacher_name?: string })[]>([]);
  const [open, setOpen] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    const [{ data: s }, { data: sh }] = await Promise.all([
      supabase.from("submissions").select("*").eq("student_id", user.id).order("submitted_at", { ascending: false }),
      supabase.from("teacher_shares").select("*").eq("student_id", user.id).order("created_at", { ascending: false }),
    ]);
    const sList = (s ?? []) as unknown as Submission[];
    const shList = (sh ?? []) as unknown as Share[];
    const subIds = sList.map(x => x.id);
    const teacherIds = [...new Set([...sList.map(x => x.teacher_id), ...shList.map(x => x.teacher_id)])];
    const [{ data: grades }, { data: profiles }] = await Promise.all([
      subIds.length ? supabase.from("grades").select("*").in("submission_id", subIds) : Promise.resolve({ data: [] as Grade[] }),
      teacherIds.length ? supabase.from("profiles").select("id, display_name").in("id", teacherIds) : Promise.resolve({ data: [] as { id: string; display_name: string | null }[] }),
    ]);
    const gradeMap = new Map((grades ?? []).map(g => [g.submission_id, g as Grade]));
    const nameMap = new Map((profiles ?? []).map(p => [p.id, p.display_name ?? ""]));
    setSubs(sList.map(x => ({ ...x, grade: gradeMap.get(x.id), teacher_name: nameMap.get(x.teacher_id) ?? "—" })));
    setShares(shList.map(x => ({ ...x, teacher_name: nameMap.get(x.teacher_id) ?? "—" })));
    setLoading(false);
  }, [user]);

  useEffect(() => { load(); }, [load]);

  const unread = shares.filter(s => !s.read_at).length;

  const cancel = async (id: string) => {
    if (!confirm("Bu tabşyrygy yza almak?")) return;
    await supabase.from("submissions").delete().eq("id", id);
    load();
  };

  const openShare = async (s: Share) => {
    setOpen(o => o === s.id ? null : s.id);
    if (!s.read_at) {
      await supabase.from("teacher_shares").update({ read_at: new Date().toISOString() }).eq("id", s.id);
      setShares(arr => arr.map(x => x.id === s.id ? { ...x, read_at: new Date().toISOString() } : x));
    }
  };

  return (
    <div className="scrollbar-thin h-full overflow-y-auto">
      <div className="mx-auto max-w-4xl px-6 py-10">
        <div className="mb-6 flex items-center gap-2">
          <GraduationCap className="h-6 w-6 text-primary" />
          <h1 className="text-2xl font-bold tracking-tight">Iş tagtam</h1>
        </div>
        <div className="mb-6 flex gap-1 rounded-md border border-border bg-card p-0.5">
          <TabBtn active={tab === "sent"} onClick={() => setTab("sent")} icon={<Send className="h-3.5 w-3.5" />} label={`Tabşyrylanlar (${subs.length})`} />
          <TabBtn active={tab === "received"} onClick={() => setTab("received")} icon={<Inbox className="h-3.5 w-3.5" />} label={`Mugallymdan gelenler (${shares.length})`} badge={unread} />
        </div>

        {loading ? <div className="text-muted-foreground">Ýüklenýär...</div> : tab === "sent" ? (
          subs.length === 0 ? <Empty text="Henize çenli ýazgy iberilmedik." /> : (
            <div className="space-y-3">
              {subs.map(s => (
                <div key={s.id} className="rounded-xl border border-border bg-card p-4">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className="truncate text-base font-semibold">{s.note_title}</div>
                      <div className="mt-0.5 text-xs text-muted-foreground">
                        Mugallym: <span className="text-foreground">{s.teacher_name}</span>
                        {s.teacher_term_name && <> · {s.teacher_term_name}</>}
                        {s.teacher_course_name && <> · {s.teacher_course_name}</>}
                        {" · "}{new Date(s.submitted_at).toLocaleString("tk-TM")}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {s.grade ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/15 px-3 py-1 text-sm font-semibold text-emerald-600">
                          <Award className="h-4 w-4" /> {s.grade.rank}-nji orun
                        </span>
                      ) : (
                        <span className={cn("inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-medium",
                          s.read_at ? "bg-sky-500/15 text-sky-600" : "bg-amber-500/15 text-amber-600")}>
                          {s.read_at ? <><Eye className="h-3 w-3" /> Görüldi</> : <><Clock className="h-3 w-3" /> Garaşylýar</>}
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
          )
        ) : (
          shares.length === 0 ? <Empty text="Mugallymdan ýazgy gelen däl." /> : (
            <div className="space-y-3">
              {shares.map(s => (
                <div key={s.id} className={cn("rounded-xl border bg-card", !s.read_at ? "border-primary/60" : "border-border")}>
                  <button onClick={() => openShare(s)} className="flex w-full items-start justify-between gap-3 p-4 text-left">
                    <div className="min-w-0 flex items-start gap-3">
                      {s.read_at ? <MailOpen className="mt-0.5 h-4 w-4 text-muted-foreground" /> : <Mail className="mt-0.5 h-4 w-4 text-primary" />}
                      <div className="min-w-0">
                        <div className={cn("truncate text-base", !s.read_at ? "font-bold" : "font-semibold")}>{s.note_title}</div>
                        <div className="mt-0.5 text-xs text-muted-foreground">
                          Mugallym: <span className="text-foreground">{s.teacher_name}</span>
                          {s.course_name && <> · {s.course_name}</>}
                          {" · "}{new Date(s.created_at).toLocaleString("tk-TM")}
                        </div>
                      </div>
                    </div>
                    {!s.read_at && <span className="rounded-full bg-primary px-2 py-0.5 text-[10px] font-medium uppercase text-primary-foreground">Täze</span>}
                  </button>
                  {open === s.id && (
                    <div className="space-y-3 border-t border-border p-4">
                      {s.blocks.map((b, i) => <BlockEditor key={(b as { id?: string }).id ?? i} block={b} readonly onChange={() => {}} />)}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )
        )}
      </div>
    </div>
  );
}

/* ---------------- TEACHER ---------------- */
function TeacherInbox() {
  const { user } = useAuth();
  const [tab, setTab] = useState<"incoming" | "outgoing">("incoming");
  const [items, setItems] = useState<(Submission & { grade?: Grade; student_name?: string })[]>([]);
  const [outgoing, setOutgoing] = useState<(Share & { student_name?: string })[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    const [{ data: s }, { data: sh }] = await Promise.all([
      supabase.from("submissions").select("*").eq("teacher_id", user.id).order("submitted_at", { ascending: false }),
      supabase.from("teacher_shares").select("*").eq("teacher_id", user.id).order("created_at", { ascending: false }),
    ]);
    const list = (s ?? []) as unknown as Submission[];
    const shList = (sh ?? []) as unknown as Share[];
    const subIds = list.map(x => x.id);
    const studentIds = [...new Set([...list.map(x => x.student_id), ...shList.map(x => x.student_id)])];
    const [{ data: grades }, { data: profiles }] = await Promise.all([
      subIds.length ? supabase.from("grades").select("*").in("submission_id", subIds) : Promise.resolve({ data: [] as Grade[] }),
      studentIds.length ? supabase.from("profiles").select("id, display_name").in("id", studentIds) : Promise.resolve({ data: [] as { id: string; display_name: string | null }[] }),
    ]);
    const gradeMap = new Map((grades ?? []).map(g => [g.submission_id, g as Grade]));
    const nameMap = new Map((profiles ?? []).map(p => [p.id, p.display_name ?? ""]));
    setItems(list.map(x => ({ ...x, grade: gradeMap.get(x.id), student_name: nameMap.get(x.student_id) ?? "—" })));
    setOutgoing(shList.map(x => ({ ...x, student_name: nameMap.get(x.student_id) ?? "—" })));
    setLoading(false);
  }, [user]);

  useEffect(() => { load(); }, [load]);

  const unreadIncoming = items.filter(i => !i.read_at).length;
  const usedRanks = new Set(items.map(i => i.grade?.rank).filter((r): r is number => !!r));

  const toggleExpand = async (s: Submission) => {
    setExpanded(e => e === s.id ? null : s.id);
    if (!s.read_at) {
      await supabase.from("submissions").update({ read_at: new Date().toISOString() }).eq("id", s.id);
      setItems(arr => arr.map(x => x.id === s.id ? { ...x, read_at: new Date().toISOString() } : x));
    }
  };

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
        <div className="mb-6 flex items-center gap-2">
          <Inbox className="h-6 w-6 text-primary" />
          <h1 className="text-2xl font-bold tracking-tight">Mugallym tagtasy</h1>
        </div>
        <div className="mb-6 flex gap-1 rounded-md border border-border bg-card p-0.5">
          <TabBtn active={tab === "incoming"} onClick={() => setTab("incoming")} icon={<Inbox className="h-3.5 w-3.5" />} label={`Gelýän işler (${items.length})`} badge={unreadIncoming} />
          <TabBtn active={tab === "outgoing"} onClick={() => setTab("outgoing")} icon={<Send className="h-3.5 w-3.5" />} label={`Iberen ýazgylarym (${outgoing.length})`} />
        </div>

        {loading ? <div className="text-muted-foreground">Ýüklenýär...</div> : tab === "incoming" ? (
          items.length === 0 ? <Empty text="Henize çenli tabşyrylan iş ýok." /> : (
            <div className="space-y-3">
              {items.map(s => (
                <div key={s.id} className={cn("rounded-xl border bg-card", !s.read_at ? "border-primary/60" : "border-border")}>
                  <button onClick={() => toggleExpand(s)} className="flex w-full items-start justify-between gap-3 p-4 text-left">
                    <div className="min-w-0 flex items-start gap-3">
                      {s.read_at ? <MailOpen className="mt-0.5 h-4 w-4 text-muted-foreground" /> : <Mail className="mt-0.5 h-4 w-4 text-primary" />}
                      <div className="min-w-0">
                        <div className={cn("truncate text-base", !s.read_at ? "font-bold" : "font-semibold")}>{s.note_title}</div>
                        <div className="mt-0.5 text-xs text-muted-foreground">
                          Talyp: <span className="text-foreground">{s.student_name}</span>
                          {s.teacher_term_name && <> · {s.teacher_term_name}</>}
                          {s.teacher_course_name && <> · {s.teacher_course_name}</>}
                          {" · "}{new Date(s.submitted_at).toLocaleString("tk-TM")}
                        </div>
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
                        {s.blocks.map((b, i) => <BlockEditor key={(b as { id?: string }).id ?? i} block={b} readonly onChange={() => {}} />)}
                      </div>
                      <GradeForm submission={s} existing={s.grade} usedRanks={usedRanks} onSubmit={grade} />
                    </div>
                  )}
                </div>
              ))}
            </div>
          )
        ) : (
          outgoing.length === 0 ? <Empty text="Henize çenli talyplara hiç zat iberilmedik. Ýazgyňyzy açyp 'Talyplara paýlaş' düwmesine basyň." /> : (
            <div className="space-y-3">
              {outgoing.map(s => (
                <div key={s.id} className="rounded-xl border border-border bg-card p-4">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className="truncate text-base font-semibold">{s.note_title}</div>
                      <div className="mt-0.5 text-xs text-muted-foreground">
                        Talyp: <span className="text-foreground">{s.student_name}</span>
                        {s.course_name && <> · {s.course_name}</>}
                        {" · "}{new Date(s.created_at).toLocaleString("tk-TM")}
                      </div>
                    </div>
                    {s.read_at ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/15 px-3 py-1 text-xs font-medium text-emerald-600">
                        <MailOpen className="h-3 w-3" /> Okady · {new Date(s.read_at).toLocaleDateString("tk-TM")}
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 rounded-full bg-muted px-3 py-1 text-xs font-medium text-muted-foreground">
                        <Mail className="h-3 w-3" /> Okalmady
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )
        )}
      </div>
    </div>
  );
}

/* ---------------- ADMIN ---------------- */
function AdminActivity() {
  type SubRow = Submission & { student_name?: string; teacher_name?: string; grade?: Grade };
  type ShRow = Share & { student_name?: string; teacher_name?: string };
  const [subs, setSubs] = useState<SubRow[]>([]);
  const [shares, setShares] = useState<ShRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"submissions" | "shares">("submissions");

  const load = useCallback(async () => {
    setLoading(true);
    const [{ data: s }, { data: sh }, { data: profiles }, { data: grades }] = await Promise.all([
      supabase.from("submissions").select("*").order("submitted_at", { ascending: false }),
      supabase.from("teacher_shares").select("*").order("created_at", { ascending: false }),
      supabase.from("profiles").select("id, display_name"),
      supabase.from("grades").select("*"),
    ]);
    const nameMap = new Map((profiles ?? []).map(p => [p.id, p.display_name ?? ""]));
    const gradeMap = new Map((grades ?? []).map(g => [g.submission_id, g as Grade]));
    setSubs(((s ?? []) as unknown as Submission[]).map(x => ({
      ...x, student_name: nameMap.get(x.student_id) ?? "—", teacher_name: nameMap.get(x.teacher_id) ?? "—", grade: gradeMap.get(x.id),
    })));
    setShares(((sh ?? []) as unknown as Share[]).map(x => ({
      ...x, student_name: nameMap.get(x.student_id) ?? "—", teacher_name: nameMap.get(x.teacher_id) ?? "—",
    })));
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const stats = useMemo(() => ({
    submissions: subs.length,
    graded: subs.filter(s => s.grade).length,
    pending: subs.filter(s => !s.grade).length,
    shares: shares.length,
    sharesRead: shares.filter(s => s.read_at).length,
  }), [subs, shares]);

  return (
    <div className="scrollbar-thin h-full overflow-y-auto">
      <div className="mx-auto max-w-5xl px-6 py-10">
        <div className="mb-6 flex items-center gap-2">
          <Shield className="h-6 w-6 text-primary" />
          <h1 className="text-2xl font-bold tracking-tight">Hereket işjeňligi</h1>
        </div>
        <div className="mb-6 grid gap-3 sm:grid-cols-4">
          <StatTile icon={<Activity className="h-4 w-4" />} label="Tabşyryklar" value={stats.submissions} />
          <StatTile icon={<Clock className="h-4 w-4" />} label="Garaşylýan" value={stats.pending} />
          <StatTile icon={<Award className="h-4 w-4" />} label="Bahalanan" value={stats.graded} />
          <StatTile icon={<Send className="h-4 w-4" />} label="Paýlaşmalar" value={`${stats.sharesRead}/${stats.shares}`} />
        </div>
        <div className="mb-6 flex gap-1 rounded-md border border-border bg-card p-0.5">
          <TabBtn active={tab === "submissions"} onClick={() => setTab("submissions")} icon={<Inbox className="h-3.5 w-3.5" />} label={`Tabşyryklar (${subs.length})`} />
          <TabBtn active={tab === "shares"} onClick={() => setTab("shares")} icon={<Send className="h-3.5 w-3.5" />} label={`Mugallym paýlaşmalary (${shares.length})`} />
        </div>

        {loading ? <div className="text-muted-foreground">Ýüklenýär...</div> : tab === "submissions" ? (
          subs.length === 0 ? <Empty text="Henize çenli tabşyryk ýok." /> : (
            <div className="overflow-hidden rounded-xl border border-border bg-card">
              <table className="w-full text-sm">
                <thead className="bg-muted/40 text-left text-xs uppercase tracking-wider text-muted-foreground">
                  <tr>
                    <th className="px-4 py-3">Ýazgy</th>
                    <th className="px-4 py-3">Talyp → Mugallym</th>
                    <th className="px-4 py-3">Sapak</th>
                    <th className="px-4 py-3">Wagt</th>
                    <th className="px-4 py-3 text-right">Ýagdaý</th>
                  </tr>
                </thead>
                <tbody>
                  {subs.map(s => (
                    <tr key={s.id} className="border-t border-border">
                      <td className="px-4 py-3 font-medium">{s.note_title}</td>
                      <td className="px-4 py-3 text-muted-foreground">{s.student_name} → <span className="text-foreground">{s.teacher_name}</span></td>
                      <td className="px-4 py-3 text-muted-foreground">{s.teacher_term_name ?? "—"} / {s.teacher_course_name ?? "—"}</td>
                      <td className="px-4 py-3 text-xs text-muted-foreground">{new Date(s.submitted_at).toLocaleString("tk-TM")}</td>
                      <td className="px-4 py-3 text-right">
                        {s.grade ? (
                          <span className="rounded-full bg-emerald-500/15 px-2 py-0.5 text-xs font-semibold text-emerald-600">{s.grade.rank}-nji orun</span>
                        ) : s.read_at ? (
                          <span className="rounded-full bg-sky-500/15 px-2 py-0.5 text-xs text-sky-600">Okaldy</span>
                        ) : (
                          <span className="rounded-full bg-amber-500/15 px-2 py-0.5 text-xs text-amber-600">Garaşylýar</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )
        ) : (
          shares.length === 0 ? <Empty text="Henize çenli paýlaşma ýok." /> : (
            <div className="overflow-hidden rounded-xl border border-border bg-card">
              <table className="w-full text-sm">
                <thead className="bg-muted/40 text-left text-xs uppercase tracking-wider text-muted-foreground">
                  <tr>
                    <th className="px-4 py-3">Ýazgy</th>
                    <th className="px-4 py-3">Mugallym → Talyp</th>
                    <th className="px-4 py-3">Wagt</th>
                    <th className="px-4 py-3 text-right">Okaldy</th>
                  </tr>
                </thead>
                <tbody>
                  {shares.map(s => (
                    <tr key={s.id} className="border-t border-border">
                      <td className="px-4 py-3 font-medium">{s.note_title}</td>
                      <td className="px-4 py-3 text-muted-foreground">{s.teacher_name} → <span className="text-foreground">{s.student_name}</span></td>
                      <td className="px-4 py-3 text-xs text-muted-foreground">{new Date(s.created_at).toLocaleString("tk-TM")}</td>
                      <td className="px-4 py-3 text-right text-xs">
                        {s.read_at
                          ? <span className="text-emerald-600">{new Date(s.read_at).toLocaleString("tk-TM")}</span>
                          : <span className="text-muted-foreground">—</span>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )
        )}
      </div>
    </div>
  );
}

/* ---------------- shared bits ---------------- */
function TabBtn({ active, onClick, icon, label, badge }: { active: boolean; onClick: () => void; icon: React.ReactNode; label: string; badge?: number }) {
  return (
    <button onClick={onClick} className={cn("flex flex-1 items-center justify-center gap-1.5 rounded px-3 py-1.5 text-xs font-medium transition-colors",
      active ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground")}>
      {icon} {label}
      {!!badge && badge > 0 && <span className="ml-1 rounded-full bg-destructive px-1.5 py-0.5 text-[10px] text-destructive-foreground">{badge}</span>}
    </button>
  );
}
function Empty({ text }: { text: string }) {
  return <div className="rounded-xl border border-dashed border-border p-10 text-center text-muted-foreground">{text}</div>;
}
function StatTile({ icon, label, value }: { icon: React.ReactNode; label: string; value: string | number }) {
  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <div className="flex items-center gap-2 text-xs text-muted-foreground">{icon}{label}</div>
      <div className="mt-1.5 text-xl font-semibold">{value}</div>
    </div>
  );
}

function GradeForm({ submission, existing, usedRanks, onSubmit }: {
  submission: Submission; existing?: Grade; usedRanks: Set<number>;
  onSubmit: (s: Submission, rank: number, comment: string, existingId?: string) => Promise<void>;
}) {
  function nextRank(used: Set<number>): number { for (let i = 1; i < 1000; i++) if (!used.has(i)) return i; return 1; }
  const [rank, setRank] = useState<number>(existing?.rank ?? nextRank(usedRanks));
  const [comment, setComment] = useState(existing?.comment ?? "");
  const isInvalid = rank < 1 || (rank !== existing?.rank && usedRanks.has(rank));
  return (
    <div className="rounded-lg border border-border bg-background p-4 space-y-3">
      <div className="flex items-center gap-2 text-sm font-medium"><Award className="h-4 w-4 text-primary" /> Baha bermek</div>
      <p className="text-xs text-muted-foreground">Her tabşyryga özboluşly orun beriň (1-nji ýer, 2-nji ýer, ...). Hiç bir iki tabşyryk birmeňzeş orun alyp bilmez.</p>
      <div className="flex flex-wrap items-end gap-3">
        <label className="flex flex-col gap-1 text-xs">
          <span className="text-muted-foreground">Orun</span>
          <input type="number" min={1} value={rank} onChange={e => setRank(Number(e.target.value))}
            className="w-24 rounded-md border border-border bg-card px-3 py-1.5 text-sm outline-none focus:ring-2 focus:ring-ring" />
        </label>
        <label className="flex flex-1 min-w-[200px] flex-col gap-1 text-xs">
          <span className="text-muted-foreground">Düşündiriş (hökmany däl)</span>
          <input value={comment} onChange={e => setComment(e.target.value)} placeholder="Yzarlama ýazyň..."
            className="rounded-md border border-border bg-card px-3 py-1.5 text-sm outline-none focus:ring-2 focus:ring-ring" />
        </label>
        <button disabled={isInvalid} onClick={() => onSubmit(submission, rank, comment, existing?.id)}
          className="rounded-md bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-40">
          {existing ? "Üýtgetmek" : "Baha ber"}
        </button>
      </div>
      {isInvalid && <p className="text-xs text-destructive">Bu orun başga tabşyryga eýýäm berlen.</p>}
    </div>
  );
}
