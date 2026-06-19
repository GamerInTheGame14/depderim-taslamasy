import { useMemo, useState } from "react";
import { Search, Clock, BookOpen, GraduationCap, TrendingUp, MapPin, CalendarPlus } from "lucide-react";
import { useDefterim, useAllNotes } from "@/lib/defterim-store";
import { dayNames } from "@/lib/defterim-data";

export function Dashboard() {
  const { terms, selectNote, schedule, setView } = useDefterim();
  const allNotes = useAllNotes();
  const [query, setQuery] = useState("");

  const currentTerm = terms[0];
  const totalCourses = currentTerm.courses.length;
  const totalNotes = currentTerm.courses.reduce((s, c) => s + c.notes.length, 0);

  // JS getDay(): 0=Sun..6=Sat. Our convention: 0=Mon..6=Sun.
  const jsDow = new Date().getDay();
  const today = jsDow === 0 ? 6 : jsDow - 1;
  const todayItems = useMemo(
    () => schedule.filter(e => e.day === today).sort((a, b) => a.time.localeCompare(b.time)),
    [schedule, today]
  );

  const recent = useMemo(() => [...allNotes].sort((a, b) => b.note.updatedAt.localeCompare(a.note.updatedAt)).slice(0, 6), [allNotes]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    return allNotes.filter(({ note, course }) =>
      note.title.toLowerCase().includes(q) ||
      course.name.toLowerCase().includes(q) ||
      note.tags.some(t => t.toLowerCase().includes(q))
    ).slice(0, 8);
  }, [query, allNotes]);

  return (
    <div className="scrollbar-thin h-full overflow-y-auto">
      <div className="mx-auto max-w-5xl px-6 py-10">
        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight">Salam, talyp</h1>
          <p className="mt-1 text-muted-foreground">{currentTerm.name} möwsüminde nämeler bolup geçýär.</p>
        </div>

        <div className="relative mb-8">
          <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Ýazgylary, sapaklary ýa-da bellikleri gözle..."
            className="w-full rounded-xl border border-border bg-card py-3 pl-11 pr-4 text-sm outline-none transition-shadow placeholder:text-muted-foreground focus:ring-2 focus:ring-ring"
          />
          {filtered.length > 0 && (
            <div className="absolute z-10 mt-2 w-full overflow-hidden rounded-xl border border-border bg-popover shadow-xl">
              {filtered.map(({ note, course }) => (
                <button key={note.id} onClick={() => { selectNote(note.id); setQuery(""); }}
                  className="flex w-full items-center gap-3 px-4 py-2.5 text-left hover:bg-accent">
                  <span className="h-2 w-2 rounded-sm" style={{ background: course.color }} />
                  <div className="flex-1 min-w-0">
                    <div className="truncate text-sm font-medium">{note.title}</div>
                    <div className="truncate text-xs text-muted-foreground">{course.name}</div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="mb-8 grid gap-4 sm:grid-cols-3">
          <Stat icon={<GraduationCap className="h-4 w-4" />} label="Häzirki möwsüm" value={currentTerm.name} />
          <Stat icon={<BookOpen className="h-4 w-4" />} label="Sapaklar" value={String(totalCourses)} />
          <Stat icon={<TrendingUp className="h-4 w-4" />} label="Ýazgylar" value={String(totalNotes)} />
        </div>

        <div className="grid gap-6 lg:grid-cols-[1.2fr_1fr]">
          <section>
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                Şu günki sapak tertibi · {dayNames[today]}
              </h2>
              <button
                onClick={() => setView("schedule")}
                className="text-xs text-primary hover:underline"
              >
                Düzetmek
              </button>
            </div>
            <div className="space-y-2">
              {todayItems.length === 0 ? (
                <button
                  onClick={() => setView("schedule")}
                  className="flex w-full flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-border bg-card/40 p-6 text-sm text-muted-foreground hover:bg-card/70 transition"
                >
                  <CalendarPlus className="h-5 w-5 opacity-60" />
                  <div>Şu gün üçin sapak ýok. Hepdelik tertibiňizi düzüň.</div>
                </button>
              ) : (
                todayItems.map(item => (
                  <div key={item.id} className="flex items-center gap-3 rounded-lg border border-border bg-card p-3">
                    <div className="w-14 text-sm font-mono font-semibold">{item.time}</div>
                    <div className="h-8 w-1 rounded-full" style={{ background: item.color }} />
                    <div className="flex-1 min-w-0">
                      <div className="truncate text-sm font-medium">{item.title}</div>
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <MapPin className="h-3 w-3" /> {item.room || "—"}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </section>

          <section>
            <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">Soňky ýazgylar</h2>
            <div className="space-y-2">
              {recent.map(({ note, course }) => (
                <button key={note.id} onClick={() => selectNote(note.id)}
                  className="flex w-full items-center gap-3 rounded-lg border border-border bg-card p-3 text-left transition-colors hover:bg-accent">
                  <span className="grid h-8 w-8 shrink-0 place-items-center rounded-md" style={{ background: `color-mix(in oklab, ${course.color} 18%, transparent)` }}>
                    <BookOpen className="h-3.5 w-3.5" style={{ color: course.color }} />
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="truncate text-sm font-medium">{note.title}</div>
                    <div className="truncate text-xs text-muted-foreground">{course.name}</div>
                  </div>
                  <div className="flex items-center gap-1 text-[11px] text-muted-foreground">
                    <Clock className="h-3 w-3" /> {note.updatedAt.slice(5)}
                  </div>
                </button>
              ))}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}

function Stat({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <div className="flex items-center gap-2 text-xs text-muted-foreground">{icon}{label}</div>
      <div className="mt-1.5 text-xl font-semibold">{value}</div>
    </div>
  );
}
