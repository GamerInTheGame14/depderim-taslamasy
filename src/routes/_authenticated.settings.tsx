import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, Sun, Moon, Monitor } from "lucide-react";
import { useHereketTheme, type ThemeMode } from "@/lib/hereket-theme";
import { useAuth } from "@/lib/auth-context";
import { useRoles } from "@/lib/role-context";
import { Shield, BookUser, GraduationCap } from "lucide-react";

export const Route = createFileRoute("/_authenticated/settings")({
  head: () => ({
    meta: [
      { title: "Sazlamalar — Hereket" },
      { name: "description", content: "Hereket platformasynyň umumy sazlamalary." },
    ],
  }),
  component: SettingsPage,
});

function SettingsPage() {
  const { mode, setMode } = useHereketTheme();
  const { user } = useAuth();
  const { roles, isAdmin } = useRoles();

  const options: { value: ThemeMode; label: string; icon: typeof Sun }[] = [
    { value: "light", label: "Açyk", icon: Sun },
    { value: "dark", label: "Garaňky", icon: Moon },
    { value: "system", label: "Ulgam", icon: Monitor },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
      <header className="border-b border-border/40 bg-background/60 backdrop-blur">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-6 py-4">
          <Link to="/" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-4 w-4" /> Programmalar
          </Link>
          <span className="text-sm font-semibold tracking-tight">Hereket · Sazlamalar</span>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-6 py-10 space-y-8">
        <section>
          <h1 className="text-2xl font-bold tracking-tight">Umumy sazlamalar</h1>
          <p className="mt-1 text-sm text-muted-foreground">Bu sazlamalar Hereketiň ähli programmalaryna degişlidir.</p>
        </section>

        <section className="rounded-2xl border border-border bg-card p-6">
          <h2 className="text-base font-semibold">Görnüş</h2>
          <p className="mt-1 text-sm text-muted-foreground">Reýimi saýlaň.</p>
          <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-3">
            {options.map((o) => {
              const Icon = o.icon;
              const active = mode === o.value;
              return (
                <button
                  key={o.value}
                  onClick={() => setMode(o.value)}
                  className={`flex items-center justify-center gap-2 rounded-lg border px-3 py-3 text-sm transition-colors ${
                    active ? "border-primary bg-primary/10 text-foreground" : "border-border bg-background hover:bg-accent"
                  }`}
                >
                  <Icon className="h-4 w-4" /> {o.label}
                </button>
              );
            })}
          </div>
        </section>

        <section className="rounded-2xl border border-border bg-card p-6">
          <h2 className="text-base font-semibold">Hasap</h2>
          <p className="mt-1 text-sm text-muted-foreground">{user?.email ?? "—"}</p>
          <div className="mt-3 flex flex-wrap gap-2">
            {roles.length === 0 && <span className="text-xs text-muted-foreground">Rol berilmedik</span>}
            {roles.includes("admin") && <span className="inline-flex items-center gap-1 rounded-full bg-rose-500/15 px-2.5 py-1 text-xs font-medium text-rose-600"><Shield className="h-3 w-3" /> Admin</span>}
            {roles.includes("teacher") && <span className="inline-flex items-center gap-1 rounded-full bg-blue-500/15 px-2.5 py-1 text-xs font-medium text-blue-600"><BookUser className="h-3 w-3" /> Mugallym</span>}
            {roles.includes("student") && <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/15 px-2.5 py-1 text-xs font-medium text-emerald-600"><GraduationCap className="h-3 w-3" /> Talyp</span>}
          </div>
          {isAdmin && (
            <Link to="/admin" className="mt-4 inline-flex items-center gap-1.5 rounded-md border border-border px-3 py-1.5 text-sm hover:bg-accent">
              <Shield className="h-3.5 w-3.5" /> Ulanyjylary dolandyr
            </Link>
          )}
        </section>
      </main>
    </div>
  );
}