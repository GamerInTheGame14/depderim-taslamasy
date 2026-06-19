import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState, useCallback, useRef } from "react";
import { Loader2, NotebookPen, Eye, Pencil, Check } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { AuthProvider } from "@/lib/auth-context";
import { BlockEditor } from "@/components/defterim/Editor";
import type { Block } from "@/lib/defterim-data";

export const Route = createFileRoute("/share/$token")({
  head: () => ({
    meta: [
      { title: "Paýlaşylan ýazgy — Depderim" },
      { name: "description", content: "Depderim üsti bilen paýlaşylan ýazgy." },
    ],
  }),
  component: SharePage,
});

type Shared = {
  id: string;
  token: string;
  title: string;
  blocks: Block[];
  access: "read" | "write";
  owner_id: string;
  updated_at: string;
};

function SharePage() {
  return (
    <AuthProvider>
      <SharedView />
    </AuthProvider>
  );
}

function SharedView() {
  const { token } = Route.useParams();
  const { user } = useAuth();
  const [data, setData] = useState<Shared | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [savedAt, setSavedAt] = useState<Date | null>(null);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      const { data: row, error } = await supabase
        .from("shared_notes")
        .select("id, token, title, blocks, access, owner_id, updated_at")
        .eq("token", token)
        .maybeSingle();
      if (cancelled) return;
      if (error || !row) setError("Bu paýlaşylan ýazgy tapylmady.");
      else setData(row as unknown as Shared);
      setLoading(false);
    })();
    return () => { cancelled = true; };
  }, [token]);

  const canEdit = !!data && !!user && (data.access === "write" || user.id === data.owner_id);

  const persist = useCallback(async (next: Shared) => {
    if (!canEdit) return;
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(async () => {
      const { error } = await supabase
        .from("shared_notes")
        .update({ title: next.title, blocks: next.blocks as any })
        .eq("token", next.token);
      if (!error) setSavedAt(new Date());
    }, 500);
  }, [canEdit]);

  function updateTitle(title: string) {
    if (!data) return;
    const next = { ...data, title };
    setData(next);
    persist(next);
  }
  function updateBlockContent(blockId: string, content: string) {
    if (!data) return;
    const next = { ...data, blocks: data.blocks.map(b => b.id === blockId ? ({ ...b, content } as Block) : b) };
    setData(next);
    persist(next);
  }

  if (loading) {
    return <div className="grid min-h-screen place-items-center bg-background"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>;
  }
  if (error || !data) {
    return (
      <div className="grid min-h-screen place-items-center bg-background px-4 text-center">
        <div>
          <h1 className="text-xl font-semibold">{error ?? "Tapylmady"}</h1>
          <Link to="/" className="mt-4 inline-block text-sm text-primary hover:underline">Baş sahypa</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-6 py-3">
        <Link to="/" className="flex items-center gap-2">
          <div className="grid h-7 w-7 place-items-center rounded-md bg-primary text-primary-foreground">
            <NotebookPen className="h-3.5 w-3.5" />
          </div>
          <span className="text-sm font-semibold">Depderim</span>
        </Link>
        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          <span className="inline-flex items-center gap-1 rounded-md bg-accent px-2 py-1 text-accent-foreground">
            {data.access === "write" ? <><Pencil className="h-3 w-3" /> Üýtgedip biler</> : <><Eye className="h-3 w-3" /> Diňe okamak</>}
          </span>
          {canEdit && savedAt && (
            <span className="inline-flex items-center gap-1"><Check className="h-3 w-3 text-primary" /> Saklanyldy</span>
          )}
          {!canEdit && data.access === "write" && !user && (
            <Link to="/auth" className="text-primary hover:underline">Üýtgetmek üçin içeri giriň</Link>
          )}
        </div>
      </header>

      <div className="mx-auto max-w-3xl px-6 py-10">
        <input
          value={data.title}
          onChange={e => updateTitle(e.target.value)}
          disabled={!canEdit}
          className="w-full bg-transparent text-4xl font-bold tracking-tight outline-none placeholder:text-muted-foreground"
          placeholder="Atsyz"
        />
        <div className="mt-8 space-y-3">
          {data.blocks.map(block => (
            <BlockEditor
              key={block.id}
              block={block}
              readonly={!canEdit}
              onChange={c => updateBlockContent(block.id, c)}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
