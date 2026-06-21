import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./auth-context";

export type Role = "admin" | "teacher" | "student";

interface RoleState {
  roles: Role[];
  isAdmin: boolean;
  isTeacher: boolean;
  isStudent: boolean;
  loading: boolean;
  refresh: () => Promise<void>;
}

const Ctx = createContext<RoleState | undefined>(undefined);

export function RoleProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    if (!user) { setRoles([]); setLoading(false); return; }
    setLoading(true);
    const { data } = await supabase.from("user_roles").select("role").eq("user_id", user.id);
    setRoles((data ?? []).map(r => r.role as Role));
    setLoading(false);
  };

  useEffect(() => { load(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [user?.id]);

  const value: RoleState = {
    roles,
    isAdmin: roles.includes("admin"),
    isTeacher: roles.includes("teacher") || roles.includes("admin"),
    isStudent: roles.includes("student") || (!roles.includes("teacher") && !roles.includes("admin")),
    loading,
    refresh: load,
  };

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useRoles() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("RoleProvider missing");
  return ctx;
}