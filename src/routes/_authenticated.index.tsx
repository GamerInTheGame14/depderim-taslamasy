import { createFileRoute, Link } from "@tanstack/react-router";
import { BookOpen, ClipboardCheck, Star, FileSpreadsheet, Lightbulb, LogOut, Settings, LifeBuoy } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated/")({
  head: () => ({
    meta: [
      { title: "Hereket — Iş meýdançaňyz" },
      { name: "description", content: "Hereket — talyplar we toparlar üçin programmalar toplumy." },
    ],
  }),
  component: Launcher,
});

type App = {
  name: string;
  description: string;
  icon: typeof BookOpen;
  to?: string;
  color: string;
  soon?: boolean;
};

const apps: App[] = [
  { name: "Depderim", description: "Sanly depder we sapak bellikleri", icon: BookOpen, to: "/depderim", color: "from-blue-500 to-indigo-600" },
  { name: "Synag Ulgamy", description: "Onlaýn synaglar we testler", icon: ClipboardCheck, color: "from-emerald-500 to-teal-600", soon: true },
  { name: "Reýting", description: "Talyplaryň bahalary we sanawy", icon: Star, color: "from-amber-500 to-orange-600", soon: true },
  { name: "E-žurnal", description: "Elektron synp žurnaly", icon: FileSpreadsheet, color: "from-rose-500 to-pink-600", soon: true },
  { name: "Ylmy-amaly maslahat", description: "Konferensiýalar we ylmy işler", icon: Lightbulb, color: "from-violet-500 to-purple-600", soon: true },
  { name: "Gollanma", description: "Ulanyjy gollanmasy we kömek", icon: LifeBuoy, color: "from-cyan-500 to-sky-600", soon: true },
];

function Launcher() {
  const { user } = useAuth();
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
      <header className="border-b border-border/40 bg-background/60 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-2">
            <div className="grid h-8 w-8 place-items-center rounded-lg bg-gradient-to-br from-primary to-primary/60 text-primary-foreground font-bold">H</div>
            <span className="text-lg font-semibold tracking-tight">Hereket</span>
          </div>
          <div className="flex items-center gap-3 text-sm text-muted-foreground">
            <span className="hidden sm:inline">{user?.email}</span>
            <Link
              to="/settings"
              className="inline-flex items-center gap-1.5 rounded-md border border-border px-2.5 py-1.5 hover:bg-accent"
            >
              <Settings className="h-3.5 w-3.5" /> Sazlamalar
            </Link>
            <button
              onClick={() => supabase.auth.signOut()}
              className="inline-flex items-center gap-1.5 rounded-md border border-border px-2.5 py-1.5 hover:bg-accent"
            >
              <LogOut className="h-3.5 w-3.5" /> Çykmak
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-6 py-12">
        <div className="mb-10">
          <h1 className="text-3xl font-bold tracking-tight">Programmalar</h1>
          <p className="mt-2 text-muted-foreground">Başlamak üçin bir programma saýlaň.</p>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {apps.map((app) => {
            const Icon = app.icon;
            const inner = (
              <div className={`group relative h-full overflow-hidden rounded-2xl border border-border bg-card p-6 transition-all ${app.soon ? "opacity-60" : "hover:-translate-y-0.5 hover:shadow-lg cursor-pointer"}`}>
                <div className={`mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br ${app.color} text-white shadow-sm`}>
                  <Icon className="h-6 w-6" />
                </div>
                <div className="flex items-center gap-2">
                  <h3 className="text-lg font-semibold">{app.name}</h3>
                  {app.soon && (
                    <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-muted-foreground">Tiz</span>
                  )}
                </div>
                <p className="mt-1 text-sm text-muted-foreground">{app.description}</p>
              </div>
            );
            return app.to && !app.soon ? (
              <Link key={app.name} to={app.to}>{inner}</Link>
            ) : (
              <div key={app.name}>{inner}</div>
            );
          })}
        </div>
      </main>
    </div>
  );
}