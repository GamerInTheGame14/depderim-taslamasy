import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowLeft,
  FileUp,
  Loader2,
  LifeBuoy,
  Trash2,
  ChevronRight,
  ChevronDown,
  FileText,
  Search,
  AlertTriangle,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { useRoles } from "@/lib/role-context";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/gollanma")({
  head: () => ({
    meta: [
      { title: "Gollanma — Hereket" },
      { name: "description", content: "PDF gollanmalary ýükläň we awtomatik mind-map görnüşinde dörediň." },
    ],
  }),
  component: GollanmaApp,
});

type OutlineNode = {
  id: string;
  title: string;
  page: number;
  text: string;
  children: OutlineNode[];
};

type GollanmaRow = {
  id: string;
  owner_id: string;
  title: string;
  pdf_path: string;
  page_count: number;
  outline: OutlineNode[];
  created_at: string;
};

function GollanmaApp() {
  const { user } = useAuth();
  const { isTeacher, isAdmin, loading: roleLoading } = useRoles();
  const canUpload = isTeacher || isAdmin;

  const [items, setItems] = useState<GollanmaRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<GollanmaRow | null>(null);

  async function load() {
    setLoading(true);
    const { data, error } = await supabase
      .from("gollanma")
      .select("*")
      .order("created_at", { ascending: false });
    if (!error && data) setItems(data as unknown as GollanmaRow[]);
    setLoading(false);
  }

  useEffect(() => {
    if (!roleLoading) load();
  }, [roleLoading]);

  if (roleLoading) {
    return (
      <div className="grid min-h-screen place-items-center text-muted-foreground">
        <Loader2 className="h-5 w-5 animate-spin" />
      </div>
    );
  }

  if (selected) {
    return <GollanmaViewer item={selected} onBack={() => setSelected(null)} onDeleted={() => { setSelected(null); load(); }} canDelete={isAdmin || selected.owner_id === user?.id} />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
      <header className="border-b border-border/40 bg-background/60 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-2">
            <Link to="/" className="rounded-md p-1.5 text-muted-foreground hover:bg-accent hover:text-foreground">
              <ArrowLeft className="h-4 w-4" />
            </Link>
            <div className="grid h-8 w-8 place-items-center rounded-lg bg-gradient-to-br from-cyan-500 to-sky-600 text-white">
              <LifeBuoy className="h-4 w-4" />
            </div>
            <span className="text-lg font-semibold tracking-tight">Gollanma</span>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-6 py-10">
        <div className="mb-8 flex items-end justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Gollanmalar</h1>
            <p className="mt-1 text-sm text-muted-foreground">PDF ýükläň — sistema mazmuny mind-map görnüşinde böler.</p>
          </div>
          <UploadButton onDone={load} />
        </div>

        {loading ? (
          <div className="flex items-center gap-2 text-sm text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" /> Ýüklenýär…</div>
        ) : items.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border bg-card/40 p-12 text-center">
            <FileText className="mx-auto mb-3 h-10 w-10 text-muted-foreground/60" />
            <p className="text-sm text-muted-foreground">Henüz gollanma ýok. Ilkinji PDF-i ýükläň.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {items.map(g => {
              const total = countNodes(g.outline);
              return (
                <button
                  key={g.id}
                  onClick={() => setSelected(g)}
                  className="group text-left rounded-2xl border border-border bg-card p-5 transition-all hover:-translate-y-0.5 hover:shadow-lg"
                >
                  <div className="mb-3 inline-flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-cyan-500 to-sky-600 text-white">
                    <FileText className="h-5 w-5" />
                  </div>
                  <h3 className="line-clamp-2 font-semibold">{g.title}</h3>
                  <p className="mt-2 text-xs text-muted-foreground">{g.page_count} sahypa · {total} bölüm</p>
                </button>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}

function countNodes(nodes: OutlineNode[]): number {
  let n = 0;
  for (const node of nodes) { n += 1 + countNodes(node.children); }
  return n;
}

function UploadButton({ onDone }: { onDone: () => void }) {
  const { user } = useAuth();
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState("");
  const [error, setError] = useState<string | null>(null);

  async function handle(file: File) {
    if (!user) return;
    setBusy(true);
    setError(null);
    try {
      setStatus("PDF okalýar…");
      const buf = await file.arrayBuffer();
      const pdfjs: any = await import("pdfjs-dist");
      const workerSrc = (await import("pdfjs-dist/build/pdf.worker.min.mjs?url")).default;
      pdfjs.GlobalWorkerOptions.workerSrc = workerSrc;
      const pdf = await pdfjs.getDocument({ data: buf.slice(0) }).promise;
      const pageCount = pdf.numPages;

      setStatus("Sahypalardan tekst alynýar…");
      const pageTexts: string[] = [];
      for (let i = 1; i <= pageCount; i++) {
        const page = await pdf.getPage(i);
        const content = await page.getTextContent();
        const text = content.items.map((it: any) => ("str" in it ? it.str : "")).join(" ");
        pageTexts.push(text);
      }

      setStatus("Sözbaşylar tapylýar…");
      let outline = await extractOutlineFromPdf(pdf, pageTexts);
      if (outline.length === 0) {
        outline = extractHeadingsByFontSize(pageTexts);
      }
      if (outline.length === 0) {
        // Fallback: one node per page
        outline = pageTexts.map((t, i) => ({
          id: `p${i + 1}`,
          title: `Sahypa ${i + 1}`,
          page: i + 1,
          text: t,
          children: [],
        }));
      }

      setStatus("PDF ýüklenýär…");
      const id = crypto.randomUUID();
      const path = `${user.id}/${id}.pdf`;
      const { error: upErr } = await supabase.storage.from("gollanma").upload(path, file, {
        contentType: "application/pdf",
        upsert: false,
      });
      if (upErr) throw upErr;

      const title = file.name.replace(/\.pdf$/i, "");
      const { error: insErr } = await supabase.from("gollanma").insert({
        id,
        owner_id: user.id,
        title,
        pdf_path: path,
        page_count: pageCount,
        outline: outline as any,
      });
      if (insErr) throw insErr;
      setStatus("");
      onDone();
    } catch (e: any) {
      console.error(e);
      setError(e?.message ?? "Ýalňyşlyk ýüze çykdy");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <input
        ref={inputRef}
        type="file"
        accept="application/pdf"
        className="hidden"
        onChange={e => { const f = e.target.files?.[0]; if (f) handle(f); e.target.value = ""; }}
      />
      <button
        onClick={() => inputRef.current?.click()}
        disabled={busy}
        className="inline-flex items-center gap-2 rounded-lg bg-gradient-to-br from-cyan-500 to-sky-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm hover:opacity-90 disabled:opacity-60"
      >
        {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileUp className="h-4 w-4" />}
        {busy ? status || "Işlenýär…" : "PDF ýükle"}
      </button>
      {error && <span className="text-xs text-destructive">{error}</span>}
    </div>
  );
}

/* ===================== Outline extraction ===================== */

async function extractOutlineFromPdf(pdf: any, pageTexts: string[]): Promise<OutlineNode[]> {
  const raw = await pdf.getOutline();
  if (!raw || raw.length === 0) return [];

  async function resolvePage(item: any): Promise<number> {
    try {
      let dest = item.dest;
      if (typeof dest === "string") dest = await pdf.getDestination(dest);
      if (!dest) return 1;
      const ref = dest[0];
      const idx = await pdf.getPageIndex(ref);
      return idx + 1;
    } catch {
      return 1;
    }
  }

  async function walk(items: any[]): Promise<OutlineNode[]> {
    const out: OutlineNode[] = [];
    for (const it of items) {
      const page = await resolvePage(it);
      const children = it.items?.length ? await walk(it.items) : [];
      out.push({
        id: crypto.randomUUID(),
        title: (it.title || "Atsyz").trim(),
        page,
        text: "",
        children,
      });
    }
    return out;
  }

  const tree = await walk(raw);
  attachTextRanges(tree, pageTexts);
  return tree;
}

function attachTextRanges(nodes: OutlineNode[], pageTexts: string[]) {
  const flat: OutlineNode[] = [];
  const collect = (ns: OutlineNode[]) => ns.forEach(n => { flat.push(n); collect(n.children); });
  collect(nodes);
  flat.sort((a, b) => a.page - b.page);
  for (let i = 0; i < flat.length; i++) {
    const start = flat[i].page;
    const end = i + 1 < flat.length ? flat[i + 1].page : pageTexts.length;
    const slice = pageTexts.slice(start - 1, Math.max(start, end)).join("\n\n");
    flat[i].text = slice.slice(0, 4000);
  }
}

function extractHeadingsByFontSize(pageTexts: string[]): OutlineNode[] {
  // Heuristic fallback: turn ALL-CAPS or numbered lines into headings
  const nodes: OutlineNode[] = [];
  pageTexts.forEach((text, idx) => {
    const lines = text.split(/\s{2,}|\n/).map(l => l.trim()).filter(Boolean);
    for (const line of lines) {
      if (line.length < 4 || line.length > 80) continue;
      const looksHeading =
        /^(\d+(\.\d+)*\.?\s+)\S/.test(line) ||
        (/^[A-ZÄÖÜÝŇŞŽ\s\d.,:-]+$/.test(line) && line.split(/\s+/).length <= 10);
      if (looksHeading) {
        nodes.push({
          id: crypto.randomUUID(),
          title: line,
          page: idx + 1,
          text: text.slice(0, 4000),
          children: [],
        });
        break; // one heading per page max
      }
    }
  });
  return nodes;
}

/* ===================== Viewer ===================== */

function GollanmaViewer({
  item, onBack, onDeleted, canDelete,
}: { item: GollanmaRow; onBack: () => void; onDeleted: () => void; canDelete: boolean }) {
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [activePage, setActivePage] = useState(1);
  const [activeNode, setActiveNode] = useState<OutlineNode | null>(null);
  const [query, setQuery] = useState("");

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data, error } = await supabase.storage.from("gollanma").createSignedUrl(item.pdf_path, 60 * 60);
      if (!cancelled && data?.signedUrl && !error) setPdfUrl(data.signedUrl);
    })();
    return () => { cancelled = true; };
  }, [item.pdf_path]);

  const filteredOutline = useMemo(() => {
    if (!query.trim()) return item.outline;
    const q = query.toLowerCase();
    const filter = (nodes: OutlineNode[]): OutlineNode[] => {
      const out: OutlineNode[] = [];
      for (const n of nodes) {
        const kids = filter(n.children);
        if (n.title.toLowerCase().includes(q) || kids.length) {
          out.push({ ...n, children: kids });
        }
      }
      return out;
    };
    return filter(item.outline);
  }, [query, item.outline]);

  async function handleDelete() {
    if (!confirm("Bu gollanmany pozmaly?")) return;
    await supabase.storage.from("gollanma").remove([item.pdf_path]);
    await supabase.from("gollanma").delete().eq("id", item.id);
    onDeleted();
  }

  const pdfSrc = pdfUrl ? `${pdfUrl}#page=${activePage}&toolbar=1&navpanes=0` : "";

  return (
    <div className="flex h-screen flex-col bg-background">
      <header className="flex items-center justify-between border-b border-border bg-card/60 px-4 py-3 backdrop-blur">
        <div className="flex items-center gap-2 min-w-0">
          <button onClick={onBack} className="rounded-md p-1.5 text-muted-foreground hover:bg-accent hover:text-foreground">
            <ArrowLeft className="h-4 w-4" />
          </button>
          <FileText className="h-4 w-4 text-cyan-600 shrink-0" />
          <h2 className="truncate font-semibold">{item.title}</h2>
          <span className="ml-2 shrink-0 rounded-full bg-muted px-2 py-0.5 text-[10px] text-muted-foreground">
            {item.page_count} sahypa
          </span>
        </div>
        {canDelete && (
          <button
            onClick={handleDelete}
            className="inline-flex items-center gap-1.5 rounded-md border border-border px-2.5 py-1.5 text-xs text-destructive hover:bg-destructive/10"
          >
            <Trash2 className="h-3.5 w-3.5" /> Poz
          </button>
        )}
      </header>

      <div className="flex flex-1 min-h-0">
        {/* Mind-map / outline */}
        <aside className="flex w-[340px] shrink-0 flex-col border-r border-border bg-card/30">
          <div className="border-b border-border px-3 py-2">
            <div className="relative">
              <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
              <input
                value={query}
                onChange={e => setQuery(e.target.value)}
                placeholder="Bölümlerde gözle…"
                className="w-full rounded-md border border-border bg-background py-1.5 pl-8 pr-2 text-xs focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>
          </div>
          <div className="flex-1 overflow-y-auto p-2 text-sm">
            {filteredOutline.length === 0 ? (
              <div className="px-3 py-6 text-center text-xs text-muted-foreground">Bölüm tapylmady.</div>
            ) : (
              <OutlineTree
                nodes={filteredOutline}
                activeId={activeNode?.id ?? null}
                onPick={n => { setActiveNode(n); setActivePage(n.page); }}
              />
            )}
          </div>
        </aside>

        {/* Detail / PDF */}
        <section className="flex flex-1 min-w-0 flex-col">
          {activeNode ? (
            <div className="border-b border-border bg-background px-5 py-3">
              <div className="text-xs text-muted-foreground">Sahypa {activeNode.page}</div>
              <h3 className="text-base font-semibold">{activeNode.title}</h3>
              <p className="mt-1.5 line-clamp-3 text-xs text-muted-foreground whitespace-pre-wrap">
                {activeNode.text || "Bu bölüm üçin tekst alynmady."}
              </p>
            </div>
          ) : (
            <div className="border-b border-border bg-background px-5 py-3 text-xs text-muted-foreground">
              Çepdäki sanawdan bir bölümi saýlaň.
            </div>
          )}
          <div className="flex-1 bg-neutral-900">
            {pdfSrc ? (
              <iframe key={activePage} src={pdfSrc} title={item.title} className="h-full w-full" />
            ) : (
              <div className="grid h-full place-items-center text-muted-foreground"><Loader2 className="h-5 w-5 animate-spin" /></div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}

function OutlineTree({
  nodes, activeId, onPick, depth = 0,
}: { nodes: OutlineNode[]; activeId: string | null; onPick: (n: OutlineNode) => void; depth?: number }) {
  return (
    <ul className={cn(depth === 0 ? "space-y-0.5" : "ml-3 mt-0.5 space-y-0.5 border-l border-border/60 pl-2")}>
      {nodes.map(n => <OutlineRow key={n.id} node={n} activeId={activeId} onPick={onPick} depth={depth} />)}
    </ul>
  );
}

function OutlineRow({
  node, activeId, onPick, depth,
}: { node: OutlineNode; activeId: string | null; onPick: (n: OutlineNode) => void; depth: number }) {
  const [open, setOpen] = useState(depth < 1);
  const hasKids = node.children.length > 0;
  const isActive = activeId === node.id;
  return (
    <li>
      <div
        className={cn(
          "group flex items-center gap-1 rounded-md px-1.5 py-1 text-left transition-colors",
          isActive ? "bg-primary/10 text-primary" : "hover:bg-accent"
        )}
      >
        {hasKids ? (
          <button onClick={() => setOpen(o => !o)} className="shrink-0 rounded p-0.5 text-muted-foreground hover:bg-background">
            {open ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
          </button>
        ) : (
          <span className="inline-block w-4" />
        )}
        <button
          onClick={() => onPick(node)}
          className="flex-1 truncate text-left text-[13px] leading-snug"
          title={node.title}
        >
          {node.title}
        </button>
        <span className="shrink-0 text-[10px] text-muted-foreground">{node.page}</span>
      </div>
      {hasKids && open && (
        <OutlineTree nodes={node.children} activeId={activeId} onPick={onPick} depth={depth + 1} />
      )}
    </li>
  );
}
