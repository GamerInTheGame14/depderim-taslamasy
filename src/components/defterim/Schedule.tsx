import { useState } from "react";
import { Plus, Trash2, MapPin, Clock } from "lucide-react";
import { useDefterim } from "@/lib/defterim-store";
import { dayNames } from "@/lib/defterim-data";

export function Schedule() {
  const { schedule, addScheduleEntry, updateScheduleEntry, deleteScheduleEntry, terms } = useDefterim();
  const allCourses = terms.flatMap(t => t.courses);

  const [day, setDay] = useState(0);
  const [time, setTime] = useState("09:00");
  const [title, setTitle] = useState("");
  const [room, setRoom] = useState("");
  const [courseId, setCourseId] = useState<string>("");

  function add(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;
    const course = allCourses.find(c => c.id === courseId);
    addScheduleEntry({
      day,
      time,
      title: title.trim(),
      room: room.trim(),
      courseId: course?.id,
      color: course?.color ?? "oklch(0.7 0.17 268)",
    });
    setTitle("");
    setRoom("");
  }

  return (
    <div className="scrollbar-thin h-full overflow-y-auto">
      <div className="mx-auto max-w-5xl px-6 py-10">
        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight">Hepdelik sapak tertibi</h1>
          <p className="mt-1 text-muted-foreground">Sapaklaryňyzy goşuň — baş sahypa şu gün üçinkileri görkezer.</p>
        </div>

        <form onSubmit={add} className="mb-8 grid gap-3 rounded-xl border border-border bg-card p-4 sm:grid-cols-[120px_100px_1fr_140px_180px_auto]">
          <select value={day} onChange={e => setDay(Number(e.target.value))}
            className="rounded-md border border-input bg-background px-2 py-2 text-sm">
            {dayNames.map((d, i) => <option key={i} value={i}>{d}</option>)}
          </select>
          <input type="time" value={time} onChange={e => setTime(e.target.value)}
            className="rounded-md border border-input bg-background px-2 py-2 text-sm" />
          <input value={title} onChange={e => setTitle(e.target.value)} placeholder="Sapagyň ady"
            className="rounded-md border border-input bg-background px-3 py-2 text-sm" />
          <input value={room} onChange={e => setRoom(e.target.value)} placeholder="Otag (mysal: A-101)"
            className="rounded-md border border-input bg-background px-3 py-2 text-sm" />
          <select value={courseId} onChange={e => setCourseId(e.target.value)}
            className="rounded-md border border-input bg-background px-2 py-2 text-sm">
            <option value="">Sapagy baglamak (saýlap bilersiňiz)</option>
            {allCourses.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
          <button type="submit"
            className="inline-flex items-center justify-center gap-1.5 rounded-md bg-primary px-3 py-2 text-sm font-medium text-primary-foreground hover:opacity-90">
            <Plus className="h-3.5 w-3.5" /> Goş
          </button>
        </form>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {dayNames.map((dn, i) => {
            const items = schedule.filter(e => e.day === i).sort((a, b) => a.time.localeCompare(b.time));
            return (
              <div key={i} className="rounded-xl border border-border bg-card p-3">
                <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">{dn}</div>
                {items.length === 0 ? (
                  <div className="rounded-md border border-dashed border-border px-3 py-4 text-center text-xs text-muted-foreground">Sapak ýok</div>
                ) : (
                  <div className="space-y-2">
                    {items.map(item => (
                      <div key={item.id} className="group flex items-start gap-2 rounded-md border border-border bg-background p-2">
                        <div className="h-full w-1 shrink-0 rounded-full" style={{ background: item.color }} />
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                            <Clock className="h-3 w-3" />
                            <input
                              type="time"
                              value={item.time}
                              onChange={e => updateScheduleEntry(item.id, { time: e.target.value })}
                              className="bg-transparent text-[11px] outline-none"
                            />
                          </div>
                          <input
                            value={item.title}
                            onChange={e => updateScheduleEntry(item.id, { title: e.target.value })}
                            className="w-full truncate bg-transparent text-sm font-medium outline-none"
                          />
                          <div className="flex items-center gap-1 text-[11px] text-muted-foreground">
                            <MapPin className="h-3 w-3" />
                            <input
                              value={item.room}
                              onChange={e => updateScheduleEntry(item.id, { room: e.target.value })}
                              placeholder="Otag"
                              className="bg-transparent outline-none"
                            />
                          </div>
                        </div>
                        <button onClick={() => deleteScheduleEntry(item.id)}
                          className="opacity-0 group-hover:opacity-100 rounded p-1 text-muted-foreground hover:bg-accent hover:text-destructive">
                          <Trash2 className="h-3 w-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
