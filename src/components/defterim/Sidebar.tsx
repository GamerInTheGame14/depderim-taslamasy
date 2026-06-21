import { useState } from "react";
import { ChevronRight, BookOpen, Plus, Hash, Sun, Moon, NotebookPen, LayoutDashboard, CalendarDays, LogOut, Grid3x3, GraduationCap, Inbox, Trash2 } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { useDefterim } from "@/lib/defterim-store";
import { allTags } from "@/lib/defterim-data";
import { cn } from "@/lib/utils";
import { useAuth } from "@/lib/auth-context";
import { useRoles } from "@/lib/role-context";

export function Sidebar() {
  const { terms, selectedNoteId, selectNote, view, setView, theme, toggleTheme, addCourse, addNote, addTerm, deleteTerm, deleteCourse } = useDefterim();
  const { user, signOut } = useAuth();
  const { isTeacher } = useRoles();
  const [openTerms, setOpenTerms] = useState<Record<string, boolean>>({});
  const [openCourses, setOpenCourses] = useState<Record<string, boolean>>({});
  const onDashboard = !selectedNoteId && view === "dashboard";
  const onSchedule = !selectedNoteId && view === "schedule";
  const onSubmissions = !selectedNoteId && view === "submissions";

  return (
    <aside className="flex h-full w-72 shrink-0 flex-col border-r border-sidebar-border bg-sidebar text-sidebar-foreground">
      <div className="flex items-center gap-2 px-4 py-4 border-b border-sidebar-border">
        <Link to="/" className="grid h-8 w-8 place-items-center rounded-md bg-muted hover:bg-accent" title="Hereket">
          <Grid3x3 className="h-4 w-4" />
        </Link>
        <div className="grid h-8 w-8 place-items-center rounded-md bg-primary text-primary-foreground">
          <NotebookPen className="h-4 w-4" />
        </div>
        <div className="min-w-0">
          <div className="text-sm font-semibold truncate">Depderim</div>
          <div className="text-[11px] text-muted-foreground truncate">Hereket · Programma</div>
        </div>
      </div>

      <div className="mx-3 mt-3 space-y-0.5">
        <button
          onClick={() => setView("dashboard")}
          className={cn(
            "flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm transition-colors hover:bg-sidebar-accent",
            onDashboard && "bg-sidebar-accent text-foreground"
          )}
        >
          <LayoutDashboard className="h-4 w-4" /> Baş sahypa
        </button>
        <button
          onClick={() => setView("schedule")}
          className={cn(
            "flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm transition-colors hover:bg-sidebar-accent",
            onSchedule && "bg-sidebar-accent text-foreground"
          )}
        >
          <CalendarDays className="h-4 w-4" /> Sapak tertibi
        </button>
        <button
          onClick={() => setView("submissions")}
          className={cn(
            "flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm transition-colors hover:bg-sidebar-accent",
            onSubmissions && "bg-sidebar-accent text-foreground"
          )}
        >
          {isTeacher ? <Inbox className="h-4 w-4" /> : <GraduationCap className="h-4 w-4" />}
          {isTeacher ? "Gelýän işler" : "Tabşyrylanlar"}
        </button>
      </div>

      <div className="scrollbar-thin flex-1 overflow-y-auto px-2 py-3 space-y-1">
        <div className="mb-1 flex items-center justify-between px-2">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Möwsümler</span>
          <button
            onClick={async () => {
              const name = prompt("Möwsümiň ady? (mysal: 2026 Güýz)");
              if (name?.trim()) await addTerm(name.trim());
            }}
            className="rounded p-1 text-muted-foreground hover:bg-sidebar-accent hover:text-foreground"
            title="Möwsüm goş"
          >
            <Plus className="h-3.5 w-3.5" />
          </button>
        </div>
        {terms.length === 0 && (
          <div className="mx-2 rounded-md border border-dashed border-sidebar-border p-3 text-[11px] text-muted-foreground">
            Henize çenli möwsüm ýok. Ýokardaky <Plus className="inline h-3 w-3" /> arkaly ilkinji möwsümi goşuň.
          </div>
        )}
        {terms.map(term => (
          <div key={term.id}>
            <div className="group flex items-center">
              <button
                onClick={() => setOpenTerms(s => ({ ...s, [term.id]: !s[term.id] }))}
                className="flex flex-1 items-center gap-1 rounded-md px-2 py-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground hover:bg-sidebar-accent"
              >
                <ChevronRight className={cn("h-3 w-3 transition-transform", openTerms[term.id] && "rotate-90")} />
                {term.name}
              </button>
              <button
                onClick={() => {
                  if (confirm(`"${term.name}" möwsümini we ähli sapaklary öçürmek?`)) deleteTerm(term.id);
                }}
                className="mr-1 opacity-0 group-hover:opacity-100 rounded p-1 hover:bg-sidebar-accent text-muted-foreground hover:text-destructive"
                title="Möwsümi öçür"
              >
                <Trash2 className="h-3 w-3" />
              </button>
            </div>
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
                        title="Ýazgy goş"
                      >
                        <Plus className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={() => {
                          if (confirm(`"${course.name}" sapagyny öçürmek?`)) deleteCourse(course.id);
                        }}
                        className="opacity-0 group-hover:opacity-100 mr-1 rounded p-1 hover:bg-sidebar-accent text-muted-foreground hover:text-destructive"
                        title="Sapagy öçür"
                      >
                        <Trash2 className="h-3 w-3" />
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
                    const name = prompt("Sapagyň ady?");
                    if (name) addCourse(term.id, name, "NEW101");
                  }}
                  className="flex w-full items-center gap-1.5 rounded-md px-2 py-1 text-xs text-muted-foreground hover:bg-sidebar-accent hover:text-foreground"
                >
                  <Plus className="h-3 w-3" /> Sapak goş
                </button>
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="border-t border-sidebar-border px-3 py-3 space-y-3">
        <div>
          <div className="mb-1.5 px-1 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Bellikler</div>
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
            {theme === "dark" ? "Açyk" : "Garaňky"} reýim
          </button>
          <button onClick={() => signOut()} className="rounded-md p-1.5 hover:bg-sidebar-accent" title="Çykmak">
            <LogOut className="h-3.5 w-3.5" />
          </button>
        </div>
        {user?.email && (
          <div className="truncate px-1 text-[11px] text-muted-foreground" title={user.email}>
            {user.email}
          </div>
        )}
      </div>
    </aside>
  );
}
