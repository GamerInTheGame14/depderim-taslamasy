import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState, useCallback } from "react";
import { ArrowLeft, Shield, GraduationCap, BookUser, Check } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useRoles, type Role } from "@/lib/role-context";

export const Route = createFileRoute("/_authenticated/admin")({
  head: () => ({ meta: [{ title: "Dolandyryş — Hereket" }] }),
  component: AdminPage,
});

type UserRow = { id: string; display_name: string | null; email: string | null; roles: Role[] };

function AdminPage() {
  const { isAdmin, loading: rolesLoading } = useRoles();
  const navigate = useNavigate();
  const [users, setUsers] = useState<UserRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!rolesLoading && !isAdmin) navigate({ to: "/" });
  }, [isAdmin, rolesLoading, navigate]);

  const load = useCallback(async () => {
    setLoading(true);
    const [{ data: profiles }, { data: roles }] = await Promise.all([
      supabase.from("profiles").select("id, display_name, email").order("created_at"),
      supabase.from("user_roles").select("user_id, role"),
    ]);
    const roleMap = new Map<string, Role[]>();
    (roles ?? []).forEach(r => {
      const arr = roleMap.get(r.user_id) ?? [];
      arr.push(r.role as Role);
      roleMap.set(r.user_id, arr);
    });
    setUsers((profiles ?? []).map(p => ({ ...p, roles: roleMap.get(p.id) ?? [] })));
    setLoading(false);
  }, []);

  useEffect(() => { if (isAdmin) load(); }, [isAdmin, load]);

  const setRole = async (userId: string, role: Role, has: boolean) => {
    if (has) {
      await supabase.from("user_roles").delete().eq("user_id", userId).eq("role", role);
    } else {
      await supabase.from("user_roles").insert({ user_id: userId, role });
    }
    load();
  };

  if (rolesLoading || !isAdmin) return null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
      <header className="border-b border-border/40 bg-background/60 backdrop-blur">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
          <Link to="/" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-4 w-4" /> Programmalar
          </Link>
          <span className="text-sm font-semibold tracking-tight">Hereket · Dolandyryş</span>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-6 py-10">
        <div className="mb-8 flex items-center gap-2">
          <Shield className="h-6 w-6 text-primary" />
          <h1 className="text-2xl font-bold tracking-tight">Ulanyjy rollary</h1>
        </div>

        {loading ? <div className="text-muted-foreground">Ýüklenýär...</div> : (
          <div className="overflow-hidden rounded-2xl border border-border bg-card">
            <table className="w-full text-sm">
              <thead className="bg-muted/40 text-left text-xs uppercase tracking-wider text-muted-foreground">
                <tr>
                  <th className="px-4 py-3">Ulanyjy</th>
                  <th className="px-4 py-3">E-poçta</th>
                  <th className="px-4 py-3 text-center">Admin</th>
                  <th className="px-4 py-3 text-center">Mugallym</th>
                  <th className="px-4 py-3 text-center">Talyp</th>
                </tr>
              </thead>
              <tbody>
                {users.map(u => (
                  <tr key={u.id} className="border-t border-border">
                    <td className="px-4 py-3 font-medium">{u.display_name || "Atsyz"}</td>
                    <td className="px-4 py-3 text-muted-foreground">{u.email}</td>
                    {(["admin","teacher","student"] as Role[]).map(r => {
                      const has = u.roles.includes(r);
                      return (
                        <td key={r} className="px-4 py-3 text-center">
                          <button
                            onClick={() => setRole(u.id, r, has)}
                            className={`inline-flex h-8 w-8 items-center justify-center rounded-md border transition-colors ${
                              has ? "border-primary bg-primary text-primary-foreground" : "border-border bg-background hover:bg-accent"
                            }`}
                            title={has ? "Aýyrmak" : "Bermek"}
                          >
                            {has ? <Check className="h-4 w-4" /> : (r === "admin" ? <Shield className="h-3.5 w-3.5 opacity-40" /> : r === "teacher" ? <BookUser className="h-3.5 w-3.5 opacity-40" /> : <GraduationCap className="h-3.5 w-3.5 opacity-40" />)}
                          </button>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <p className="mt-6 text-xs text-muted-foreground">
          Bellik: Ilki bilen hasaba alnan ulanyjy awtomatiki <strong>admin</strong> bolýar. Beýlekiler <strong>talyp</strong> bolup başlaýar. Bu sahypadan islendik rol berlip ýa-da aýrylyp bilner.
        </p>
      </main>
    </div>
  );
}