import { useState } from "react";
import { Share2, X, Copy, Check, Loader2, Eye, Pencil } from "lucide-react";
import { useDefterim } from "@/lib/defterim-store";
import { useAuth } from "@/lib/auth-context";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";

export function ShareModal({ noteId, onClose }: { noteId: string; onClose: () => void }) {
  const { findNote } = useDefterim();
  const { user } = useAuth();
  const found = findNote(noteId);

  const [access, setAccess] = useState<"read" | "write">("read");
  const [loading, setLoading] = useState(false);
  const [link, setLink] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function generate() {
    if (!found || !user) return;
    setLoading(true);
    setError(null);
    try {
      const token = crypto.randomUUID().replace(/-/g, "");
      const { error } = await supabase.from("shared_notes").insert({
        token,
        owner_id: user.id,
        title: found.note.title,
        blocks: found.note.blocks as any,
        access,
      });
      if (error) throw error;
      const url = `${window.location.origin}/share/${token}`;
      setLink(url);
    } catch (e: any) {
      setError(e.message ?? "Salgyny döretmek başartmady.");
    } finally {
      setLoading(false);
    }
  }

  async function copy() {
    if (!link) return;
    await navigator.clipboard.writeText(link);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/60 p-4 backdrop-blur-sm" onClick={onClose}>
      <div onClick={e => e.stopPropagation()} className="w-full max-w-md rounded-xl border border-border bg-background shadow-2xl">
        <div className="flex items-center justify-between border-b border-border px-5 py-3">
          <div className="flex items-center gap-2">
            <Share2 className="h-4 w-4 text-primary" />
            <h2 className="text-sm font-semibold">Ýazgyny paýlaşmak</h2>
          </div>
          <button onClick={onClose} className="rounded-md p-1 text-muted-foreground hover:bg-accent hover:text-foreground">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          <div>
            <div className="mb-2 text-xs font-medium text-muted-foreground">Elýeterlilik derejesi</div>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => setAccess("read")}
                className={cn(
                  "flex flex-col items-start gap-1 rounded-lg border p-3 text-left transition",
                  access === "read" ? "border-primary bg-primary/10" : "border-border hover:bg-accent"
                )}
              >
                <div className="flex items-center gap-1.5 text-sm font-medium">
                  <Eye className="h-3.5 w-3.5" /> Diňe okamak
                </div>
                <div className="text-[11px] text-muted-foreground">Salgyny açan diňe okap biler.</div>
              </button>
              <button
                onClick={() => setAccess("write")}
                className={cn(
                  "flex flex-col items-start gap-1 rounded-lg border p-3 text-left transition",
                  access === "write" ? "border-primary bg-primary/10" : "border-border hover:bg-accent"
                )}
              >
                <div className="flex items-center gap-1.5 text-sm font-medium">
                  <Pencil className="h-3.5 w-3.5" /> Üýtgedip biler
                </div>
                <div className="text-[11px] text-muted-foreground">Hasabyna giren islendik student üýtgedip biler.</div>
              </button>
            </div>
          </div>

          {!link ? (
            <button
              onClick={generate}
              disabled={loading}
              className="flex w-full items-center justify-center gap-2 rounded-md bg-primary px-3 py-2 text-sm font-medium text-primary-foreground hover:opacity-90 disabled:opacity-60"
            >
              {loading && <Loader2 className="h-4 w-4 animate-spin" />}
              Çakylyk salgysyny döret
            </button>
          ) : (
            <div className="space-y-2">
              <div className="text-xs font-medium text-muted-foreground">Çakylyk salgysy</div>
              <div className="flex items-center gap-2 rounded-md border border-border bg-card p-2">
                <input readOnly value={link} className="flex-1 bg-transparent px-1 text-xs outline-none" />
                <button
                  onClick={copy}
                  className="inline-flex items-center gap-1 rounded-md bg-primary px-2 py-1 text-xs font-medium text-primary-foreground hover:opacity-90"
                >
                  {copied ? <><Check className="h-3 w-3" /> Göçürildi</> : <><Copy className="h-3 w-3" /> Göçür</>}
                </button>
              </div>
              <p className="text-[11px] text-muted-foreground">
                Salgyny dostlaryňyz bilen paýlaşyň. {access === "write" ? "Olar üýtgedip bilerler." : "Olar diňe okap bilerler."}
              </p>
            </div>
          )}

          {error && <p className="text-xs text-destructive">{error}</p>}
        </div>
      </div>
    </div>
  );
}
