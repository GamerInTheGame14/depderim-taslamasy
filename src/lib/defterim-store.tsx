import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { initialTerms, type Term, type Note, type Course, type Block } from "./defterim-data";

export type View = "dashboard";

interface Store {
  terms: Term[];
  selectedNoteId: string | null;
  selectNote: (id: string | null) => void;
  view: View;
  setView: (v: View) => void;
  theme: "dark" | "light";
  toggleTheme: () => void;
  addCourse: (termId: string, name: string, code: string) => void;
  addNote: (courseId: string) => string;
  updateNoteTitle: (noteId: string, title: string) => void;
  updateBlock: (noteId: string, blockId: string, content: string) => void;
  addBlock: (noteId: string, type: Block["type"]) => void;
  addImageBlocks: (noteId: string, images: { src: string; caption: string }[]) => void;
  addVideoBlock: (noteId: string, video: { src: string; caption: string; start: number; end: number }) => void;
  deleteBlock: (noteId: string, blockId: string) => void;
  findNote: (id: string) => { note: Note; course: Course; term: Term } | null;
}

const Ctx = createContext<Store | null>(null);
const uid = () => Math.random().toString(36).slice(2, 10);

export function DefterimProvider({ children }: { children: ReactNode }) {
  const [terms, setTerms] = useState<Term[]>(initialTerms);
  const [selectedNoteId, setSelectedNoteId] = useState<string | null>(null);
  const [view, setView] = useState<View>("dashboard");
  const [theme, setTheme] = useState<"dark" | "light">("dark");

  useEffect(() => {
    document.documentElement.classList.toggle("dark", theme === "dark");
  }, [theme]);

  const findNote = (id: string) => {
    for (const term of terms) for (const course of term.courses) {
      const note = course.notes.find(n => n.id === id);
      if (note) return { note, course, term };
    }
    return null;
  };

  const store: Store = {
    terms,
    selectedNoteId,
    selectNote: (id) => { setSelectedNoteId(id); if (id) setView("dashboard"); },
    view,
    setView: (v) => { setView(v); setSelectedNoteId(null); },
    theme,
    toggleTheme: () => setTheme(t => t === "dark" ? "light" : "dark"),
    addCourse: (termId, name, code) => setTerms(ts => ts.map(t => t.id === termId ? {
      ...t, courses: [...t.courses, { id: uid(), name, code, color: "oklch(0.7 0.17 268)", notes: [] }]
    } : t)),
    addNote: (courseId) => {
      const id = uid();
      setTerms(ts => ts.map(t => ({
        ...t,
        courses: t.courses.map(c => c.id === courseId ? {
          ...c,
          notes: [...c.notes, {
            id, title: `Week ${c.notes.length + 1}: New Note`, week: c.notes.length + 1,
            updatedAt: new Date().toISOString().slice(0, 10), tags: [],
            blocks: [{ id: uid(), type: "h1", content: "New Note" }, { id: uid(), type: "text", content: "Start writing..." }]
          }]
        } : c)
      })));
      return id;
    },
    updateNoteTitle: (noteId, title) => setTerms(ts => ts.map(t => ({
      ...t, courses: t.courses.map(c => ({
        ...c, notes: c.notes.map(n => n.id === noteId ? { ...n, title } : n)
      }))
    }))),
    updateBlock: (noteId, blockId, content) => setTerms(ts => ts.map(t => ({
      ...t, courses: t.courses.map(c => ({
        ...c, notes: c.notes.map(n => n.id === noteId ? {
          ...n, blocks: n.blocks.map(b => b.id === blockId ? { ...b, content } as Block : b)
        } : n)
      }))
    }))),
    addBlock: (noteId, type) => setTerms(ts => ts.map(t => ({
      ...t, courses: t.courses.map(c => ({
        ...c, notes: c.notes.map(n => {
          if (n.id !== noteId) return n;
          const nb: Block = type === "code"
            ? { id: uid(), type: "code", language: "javascript", content: "// your code" }
            : type === "image"
            ? { id: uid(), type: "image", caption: "New image" }
            : { id: uid(), type, content: "" } as Block;
          return { ...n, blocks: [...n.blocks, nb] };
        })
      }))
    }))),
    addImageBlocks: (noteId, images) => setTerms(ts => ts.map(t => ({
      ...t, courses: t.courses.map(c => ({
        ...c, notes: c.notes.map(n => n.id === noteId ? {
          ...n, blocks: [...n.blocks, ...images.map(img => ({ id: uid(), type: "image" as const, caption: img.caption, src: img.src }))]
        } : n)
      }))
    }))),
    addVideoBlock: (noteId, v) => setTerms(ts => ts.map(t => ({
      ...t, courses: t.courses.map(c => ({
        ...c, notes: c.notes.map(n => n.id === noteId ? {
          ...n, blocks: [...n.blocks, { id: uid(), type: "video" as const, caption: v.caption, src: v.src, start: v.start, end: v.end }]
        } : n)
      }))
    }))),
    deleteBlock: (noteId, blockId) => setTerms(ts => ts.map(t => ({
      ...t, courses: t.courses.map(c => ({
        ...c, notes: c.notes.map(n => n.id === noteId ? {
          ...n, blocks: n.blocks.filter(b => b.id !== blockId)
        } : n)
      }))
    }))),
    findNote,
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
