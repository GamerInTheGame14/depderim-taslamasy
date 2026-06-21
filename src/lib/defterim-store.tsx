import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { type Term, type Note, type Course, type Block, type ScheduleEntry } from "./defterim-data";
import { useAuth } from "./auth-context";
import { useHereketTheme } from "./hereket-theme";
import { supabase } from "@/integrations/supabase/client";

export type View = "dashboard" | "schedule" | "submissions";

interface Store {
  terms: Term[];
  loading: boolean;
  selectedNoteId: string | null;
  selectNote: (id: string | null) => void;
  view: View;
  setView: (v: View) => void;
  theme: "dark" | "light";
  toggleTheme: () => void;
  addTerm: (name: string) => Promise<void>;
  deleteTerm: (termId: string) => Promise<void>;
  addCourse: (termId: string, name: string, code: string) => void;
  deleteCourse: (courseId: string) => Promise<void>;
  addNote: (courseId: string) => string;
  deleteNote: (noteId: string) => Promise<void>;
  updateNoteTitle: (noteId: string, title: string) => void;
  updateBlock: (noteId: string, blockId: string, content: string) => void;
  addBlock: (noteId: string, type: Block["type"]) => void;
  addImageBlocks: (noteId: string, images: { src: string; caption: string }[]) => void;
  addVideoBlock: (noteId: string, video: { src: string; caption: string; start: number; end: number }) => void;
  deleteBlock: (noteId: string, blockId: string) => void;
  findNote: (id: string) => { note: Note; course: Course; term: Term } | null;
  schedule: ScheduleEntry[];
  addScheduleEntry: (e: Omit<ScheduleEntry, "id">) => void;
  updateScheduleEntry: (id: string, patch: Partial<ScheduleEntry>) => void;
  deleteScheduleEntry: (id: string) => void;
}

const Ctx = createContext<Store | null>(null);
const uid = () => Math.random().toString(36).slice(2, 10);

export function DefterimProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const { resolved: themeResolved, toggle: toggleHereketTheme } = useHereketTheme();
  const scheduleKey = user ? `depderim:schedule:${user.id}` : "depderim:schedule:guest";

  const [terms, setTerms] = useState<Term[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedNoteId, setSelectedNoteId] = useState<string | null>(null);
  const [view, setViewState] = useState<View>("dashboard");
  const [schedule, setSchedule] = useState<ScheduleEntry[]>([]);

  // Load Depderim data from DB per user
  useEffect(() => {
    if (!user) { setTerms([]); setLoading(false); return; }
    let cancelled = false;
    (async () => {
      setLoading(true);
      const [{ data: termRows }, { data: courseRows }, { data: noteRows }] = await Promise.all([
        supabase.from("terms").select("*").eq("user_id", user.id).order("position").order("created_at"),
        supabase.from("courses").select("*").eq("user_id", user.id).order("position").order("created_at"),
        supabase.from("notes").select("*").eq("user_id", user.id).order("created_at"),
      ]);
      if (cancelled) return;
      const assembled: Term[] = (termRows ?? []).map(t => ({
        id: t.id,
        name: t.name,
        courses: (courseRows ?? []).filter(c => c.term_id === t.id).map(c => ({
          id: c.id,
          name: c.name,
          code: c.code,
          color: c.color,
          notes: (noteRows ?? []).filter(n => n.course_id === c.id).map(n => ({
            id: n.id,
            title: n.title,
            week: n.week,
            updatedAt: (n.updated_at ?? n.created_at ?? "").slice(0, 10),
            tags: n.tags ?? [],
            blocks: (n.blocks as unknown as Block[]) ?? [],
          })),
        })),
      }));
      setTerms(assembled);
      setLoading(false);
    })();
    return () => { cancelled = true; };
  }, [user?.id]);

  // Load schedule from localStorage per user
  useEffect(() => {
    try {
      const raw = localStorage.getItem(scheduleKey);
      setSchedule(raw ? JSON.parse(raw) : []);
    } catch {
      setSchedule([]);
    }
  }, [scheduleKey]);

  useEffect(() => {
    try { localStorage.setItem(scheduleKey, JSON.stringify(schedule)); } catch {}
  }, [schedule, scheduleKey]);

  const findNote = (id: string) => {
    for (const term of terms) for (const course of term.courses) {
      const note = course.notes.find(n => n.id === id);
      if (note) return { note, course, term };
    }
    return null;
  };

  const persistNote = async (noteId: string, patch: { title?: string; blocks?: Block[] }) => {
    const dbPatch: { title?: string; blocks?: unknown } = {};
    if (patch.title !== undefined) dbPatch.title = patch.title;
    if (patch.blocks !== undefined) dbPatch.blocks = patch.blocks;
    await supabase.from("notes").update(dbPatch as never).eq("id", noteId);
  };

  const store: Store = {
    terms,
    loading,
    selectedNoteId,
    selectNote: (id) => { setSelectedNoteId(id); if (id) setViewState("dashboard"); },
    view,
    setView: (v) => { setViewState(v); setSelectedNoteId(null); },
    theme: themeResolved,
    toggleTheme: toggleHereketTheme,
    addTerm: async (name) => {
      if (!user) return;
      const { data } = await supabase.from("terms").insert({ user_id: user.id, name, position: terms.length }).select().single();
      if (data) setTerms(ts => [...ts, { id: data.id, name: data.name, courses: [] }]);
    },
    deleteTerm: async (termId) => {
      await supabase.from("terms").delete().eq("id", termId);
      setTerms(ts => ts.filter(t => t.id !== termId));
    },
    addCourse: async (termId, name, code) => {
      if (!user) return;
      const palette = ["oklch(0.7 0.17 268)", "oklch(0.72 0.16 165)", "oklch(0.72 0.15 50)", "oklch(0.7 0.18 15)"];
      const term = terms.find(t => t.id === termId);
      const color = palette[(term?.courses.length ?? 0) % palette.length];
      const { data } = await supabase.from("courses").insert({ user_id: user.id, term_id: termId, name, code, color, position: term?.courses.length ?? 0 }).select().single();
      if (data) setTerms(ts => ts.map(t => t.id === termId ? {
        ...t, courses: [...t.courses, { id: data.id, name: data.name, code: data.code, color: data.color, notes: [] }]
      } : t));
    },
    deleteCourse: async (courseId) => {
      await supabase.from("courses").delete().eq("id", courseId);
      setTerms(ts => ts.map(t => ({ ...t, courses: t.courses.filter(c => c.id !== courseId) })));
    },
    addNote: (courseId) => {
      const tempId = uid();
      let term: Term | undefined; let course: Course | undefined;
      for (const t of terms) for (const c of t.courses) if (c.id === courseId) { term = t; course = c; }
      if (!user || !course) return tempId;
      const week = course.notes.length + 1;
      const title = `${week}-nji hepde: Täze ýazgy`;
      const blocks: Block[] = [
        { id: uid(), type: "h1", content: "Täze ýazgy" },
        { id: uid(), type: "text", content: "Ýazyp başlaň..." },
      ];
      // Optimistic
      setTerms(ts => ts.map(t => ({
        ...t,
        courses: t.courses.map(c => c.id === courseId ? {
          ...c, notes: [...c.notes, { id: tempId, title, week, updatedAt: new Date().toISOString().slice(0, 10), tags: [], blocks }]
        } : c),
      })));
      (async () => {
        const { data } = await supabase.from("notes").insert({
          user_id: user.id, course_id: courseId, title, week, tags: [], blocks: blocks as unknown as never,
        }).select().single();
        if (data) setTerms(ts => ts.map(t => ({
          ...t, courses: t.courses.map(c => ({
            ...c, notes: c.notes.map(n => n.id === tempId ? { ...n, id: data.id } : n),
          })),
        })));
      })();
      return tempId;
    },
    deleteNote: async (noteId) => {
      await supabase.from("notes").delete().eq("id", noteId);
      setTerms(ts => ts.map(t => ({ ...t, courses: t.courses.map(c => ({ ...c, notes: c.notes.filter(n => n.id !== noteId) })) })));
      if (selectedNoteId === noteId) setSelectedNoteId(null);
    },
    updateNoteTitle: (noteId, title) => {
      setTerms(ts => ts.map(t => ({ ...t, courses: t.courses.map(c => ({ ...c, notes: c.notes.map(n => n.id === noteId ? { ...n, title } : n) })) })));
      persistNote(noteId, { title });
    },
    updateBlock: (noteId, blockId, content) => {
      let nextBlocks: Block[] | null = null;
      setTerms(ts => ts.map(t => ({
        ...t, courses: t.courses.map(c => ({
          ...c, notes: c.notes.map(n => {
            if (n.id !== noteId) return n;
            const blocks = n.blocks.map(b => b.id === blockId ? ({ ...b, content } as Block) : b);
            nextBlocks = blocks; return { ...n, blocks };
          })
        }))
      })));
      if (nextBlocks) persistNote(noteId, { blocks: nextBlocks as unknown as never });
    },
    addBlock: (noteId, type) => {
      let nextBlocks: Block[] | null = null;
      setTerms(ts => ts.map(t => ({
        ...t, courses: t.courses.map(c => ({
          ...c, notes: c.notes.map(n => {
            if (n.id !== noteId) return n;
            const nb: Block = type === "code"
              ? { id: uid(), type: "code", language: "javascript", content: "// kodyňyz" }
              : type === "image"
              ? { id: uid(), type: "image", caption: "Täze surat" }
              : { id: uid(), type, content: "" } as Block;
            const blocks = [...n.blocks, nb]; nextBlocks = blocks; return { ...n, blocks };
          })
        }))
      })));
      if (nextBlocks) persistNote(noteId, { blocks: nextBlocks as unknown as never });
    },
    addImageBlocks: (noteId, images) => {
      let nextBlocks: Block[] | null = null;
      setTerms(ts => ts.map(t => ({
        ...t, courses: t.courses.map(c => ({
          ...c, notes: c.notes.map(n => {
            if (n.id !== noteId) return n;
            const blocks = [...n.blocks, ...images.map(img => ({ id: uid(), type: "image" as const, caption: img.caption, src: img.src }))];
            nextBlocks = blocks; return { ...n, blocks };
          })
        }))
      })));
      if (nextBlocks) persistNote(noteId, { blocks: nextBlocks as unknown as never });
    },
    addVideoBlock: (noteId, v) => {
      let nextBlocks: Block[] | null = null;
      setTerms(ts => ts.map(t => ({
        ...t, courses: t.courses.map(c => ({
          ...c, notes: c.notes.map(n => {
            if (n.id !== noteId) return n;
            const blocks = [...n.blocks, { id: uid(), type: "video" as const, caption: v.caption, src: v.src, start: v.start, end: v.end }];
            nextBlocks = blocks; return { ...n, blocks };
          })
        }))
      })));
      if (nextBlocks) persistNote(noteId, { blocks: nextBlocks as unknown as never });
    },
    deleteBlock: (noteId, blockId) => {
      let nextBlocks: Block[] | null = null;
      setTerms(ts => ts.map(t => ({
        ...t, courses: t.courses.map(c => ({
          ...c, notes: c.notes.map(n => {
            if (n.id !== noteId) return n;
            const blocks = n.blocks.filter(b => b.id !== blockId);
            nextBlocks = blocks; return { ...n, blocks };
          })
        }))
      })));
      if (nextBlocks) persistNote(noteId, { blocks: nextBlocks as unknown as never });
    },
    findNote,
    schedule,
    addScheduleEntry: (e) => setSchedule(s => [...s, { ...e, id: uid() }]),
    updateScheduleEntry: (id, patch) => setSchedule(s => s.map(e => e.id === id ? { ...e, ...patch } : e)),
    deleteScheduleEntry: (id) => setSchedule(s => s.filter(e => e.id !== id)),
  };

  return <Ctx.Provider value={store}>{children}</Ctx.Provider>;
}

export const useDefterim = () => {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("DefterimProvider missing");
  return ctx;
};

export function useAllNotes() {
  const { terms } = useDefterim();
  return useMemo(() => {
    const all: { note: Note; course: Course; term: Term }[] = [];
    for (const term of terms) for (const course of term.courses) for (const note of course.notes) all.push({ note, course, term });
    return all;
  }, [terms]);
}
