import { useState } from "react";
import { ChevronRight, BookOpen, Plus, Hash, Settings, Sun, Moon, NotebookPen, FileText, Scissors } from "lucide-react";
import { useDefterim } from "@/lib/defterim-store";
import { allTags } from "@/lib/defterim-data";
import { cn } from "@/lib/utils";

export function Sidebar() {
  const { terms, selectedNoteId, selectNote, theme, toggleTheme, addCourse, addNote, view, setView } = useDefterim();
  const [openTerms, setOpenTerms] = useState<Record<string, boolean>>({ t1: true });
  const [openCourses, setOpenCourses] = useState<Record<string, boolean>>({ c1: true });
  const onDashboard = !selectedNoteId && view === "dashboard";
  const onPdfTools = !selectedNoteId && view === "pdf-tools";

  return (
    <aside className="flex h-full w-72 shrink-0 flex-col border-r border-sidebar-border bg-sidebar text-sidebar-foreground">
      <div className="flex items-center gap-2 px-4 py-4 border-b border-sidebar-border">
        <div className="grid h-8 w-8 place-items-center rounded-md bg-primary text-primary-foreground">
          <NotebookPen className="h-4 w-4" />
        </div>
        <div className="min-w-0">
          <div className="text-sm font-semibold truncate">Defterim</div>
          <div className="text-[11px] text-muted-foreground truncate">My Notebook</div>
        </div>
      </div>

      <button
        onClick={() => selectNote(null)}
        className={cn(
          "mx-3 mt-3 flex items-center gap-2 rounded-md px-2 py-1.5 text-sm transition-colors hover:bg-sidebar-accent",
          !selectedNoteId && "bg-sidebar-accent text-foreground"
        )}
      >
        <FileText className="h-4 w-4" /> Dashboard
      </button>

      <div className="scrollbar-thin flex-1 overflow-y-auto px-2 py-3 space-y-1">
        {terms.map(term => (
          <div key={term.id}>
            <button
              onClick={() => setOpenTerms(s => ({ ...s, [term.id]: !s[term.id] }))}
              className="flex w-full items-center gap-1 rounded-md px-2 py-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground hover:bg-sidebar-accent"
            >
              <ChevronRight className={cn("h-3 w-3 transition-transform", openTerms[term.id] && "rotate-90")} />
              {term.name}
            </button>
            {openTerms[term.id] && (
              <div className="ml-2 mt-0.5 space-y-0.5">
                {term.courses.map(course => (
                  <div key={course.id}>
                    <div className="group flex items-center">
                      <button
                        onClick={() => setOpenCourses(s => ({ ...s, [course.id]: !s[course.id] }))}
                        className="flex flex-1 min-w-0 items-center gap-1.5 rounded-md px-2 py-1.5 text-sm hover:bg-sidebar-accent"
                      >
                        <ChevronRight className={cn("h-3 w-3 shrink-0 transition-transform", openCourses[course.id] && "rotate-90")} />
                        <span className="h-2 w-2 shrink-0 rounded-sm" style={{ background: course.color }} />
                        <span className="truncate">{course.name}</span>
                      </button>
                      <button
                        onClick={() => { const id = addNote(course.id); selectNote(id); setOpenCourses(s => ({...s, [course.id]: true})); }}
                        className="opacity-0 group-hover:opacity-100 mr-1 rounded p-1 hover:bg-sidebar-accent"
                        title="Add note"
                      >
                        <Plus className="h-3.5 w-3.5" />
                      </button>
                    </div>
                    {openCourses[course.id] && (
                      <div className="ml-5 border-l border-sidebar-border pl-2 space-y-0.5">
                        {course.notes.map(note => (
                          <button
                            key={note.id}
                            onClick={() => selectNote(note.id)}
                            className={cn(
                              "flex w-full items-center gap-1.5 rounded-md px-2 py-1 text-sm text-left transition-colors hover:bg-sidebar-accent truncate",
                              selectedNoteId === note.id && "bg-sidebar-accent text-foreground"
                            )}
                          >
                            <BookOpen className="h-3 w-3 shrink-0 opacity-60" />
                            <span className="truncate">{note.title}</span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
                <button
                  onClick={() => {
                    const name = prompt("Course name?");
                    if (name) addCourse(term.id, name, "NEW101");
                  }}
                  className="flex w-full items-center gap-1.5 rounded-md px-2 py-1 text-xs text-muted-foreground hover:bg-sidebar-accent hover:text-foreground"
                >
                  <Plus className="h-3 w-3" /> Add course
                </button>
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="border-t border-sidebar-border px-3 py-3 space-y-3">
        <div>
          <div className="mb-1.5 px-1 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Tags</div>
          <div className="flex flex-wrap gap-1">
            {allTags.slice(0, 6).map(t => (
              <span key={t} className="inline-flex items-center gap-0.5 rounded-md bg-sidebar-accent px-1.5 py-0.5 text-[11px] text-sidebar-foreground">
                <Hash className="h-2.5 w-2.5 opacity-60" />{t}
              </span>
            ))}
          </div>
        </div>
        <div className="flex items-center justify-between">
          <button onClick={toggleTheme} className="flex items-center gap-1.5 rounded-md px-2 py-1.5 text-xs hover:bg-sidebar-accent">
            {theme === "dark" ? <Sun className="h-3.5 w-3.5" /> : <Moon className="h-3.5 w-3.5" />}
            {theme === "dark" ? "Light" : "Dark"} mode
          </button>
          <button className="rounded-md p-1.5 hover:bg-sidebar-accent" title="Settings">
            <Settings className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </aside>
  );
}
