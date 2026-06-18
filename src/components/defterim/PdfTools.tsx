import { useRef, useState } from "react";
import { FileUp, Loader2, Check, Scissors, X } from "lucide-react";
import { useDefterim } from "@/lib/defterim-store";
import { cn } from "@/lib/utils";

interface PageThumb {
  pageNumber: number;
  dataUrl: string;
}

export function PdfToolModal({ noteId, onClose }: { noteId: string; onClose: () => void }) {
  const { addImageBlocks } = useDefterim();
  const [fileName, setFileName] = useState<string>("");
  const [pages, setPages] = useState<PageThumb[]>([]);
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  async function handleFile(file: File) {
    setLoading(true);
    setPages([]);
    setSelected(new Set());
    setDone(false);
    setFileName(file.name);
    try {
      const pdfjs: any = await import("pdfjs-dist");
      const workerSrc = (await import("pdfjs-dist/build/pdf.worker.min.mjs?url")).default;
      pdfjs.GlobalWorkerOptions.workerSrc = workerSrc;
      const buf = await file.arrayBuffer();
      const pdf = await pdfjs.getDocument({ data: buf }).promise;
      const thumbs: PageThumb[] = [];
      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const viewport = page.getViewport({ scale: 1.2 });
        const canvas = document.createElement("canvas");
        canvas.width = viewport.width;
        canvas.height = viewport.height;
        const ctx = canvas.getContext("2d")!;
        await page.render({ canvasContext: ctx, viewport, canvas }).promise;
        thumbs.push({ pageNumber: i, dataUrl: canvas.toDataURL("image/jpeg", 0.82) });
        setPages([...thumbs]);
      }
    } catch (err) {
      console.error("PDF load failed", err);
    } finally {
      setLoading(false);
    }
  }

  function toggle(n: number) {
    setSelected(s => {
      const next = new Set(s);
      if (next.has(n)) next.delete(n); else next.add(n);
      return next;
    });
  }

  function attach() {
    if (selected.size === 0) return;
    const ordered = [...selected].sort((a, b) => a - b);
    const images = ordered.map(n => {
      const page = pages.find(p => p.pageNumber === n)!;
      return { src: page.dataUrl, caption: `${fileName} — page ${n}` };
    });
    addImageBlocks(noteId, images);
    setDone(true);
    setTimeout(onClose, 600);
  }

  return (
    <ModalShell onClose={onClose} title="PDF — extract pages" icon={<Scissors className="h-4 w-4 text-primary" />}>
      <input
        ref={inputRef}
        type="file"
        accept="application/pdf"
        className="hidden"
        onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f); }}
      />

      {!pages.length && !loading && (
        <button
          onClick={() => inputRef.current?.click()}
          className="flex w-full flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed border-border bg-card/40 px-6 py-16 text-muted-foreground hover:bg-card/70 transition"
        >
          <FileUp className="h-10 w-10 opacity-60" />
          <div className="text-sm font-medium text-foreground">Upload a PDF</div>
          <div className="text-xs">Pick the pages you want to attach to this note</div>
        </button>
      )}

      {loading && (
        <div className="flex items-center justify-center gap-2 py-20 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" /> Rendering {fileName}…
        </div>
      )}

      {!!pages.length && (
        <>
          <div className="mb-3 flex flex-wrap items-center gap-2 text-xs">
            <span className="font-medium truncate max-w-[260px]">{fileName}</span>
            <span className="text-muted-foreground">· {pages.length} pages · {selected.size} selected</span>
            <div className="ml-auto flex items-center gap-2">
              <button onClick={() => setSelected(new Set(pages.map(p => p.pageNumber)))} className="rounded-md px-2 py-1 hover:bg-accent">Select all</button>
              <button onClick={() => setSelected(new Set())} className="rounded-md px-2 py-1 hover:bg-accent">Clear</button>
              <button onClick={() => inputRef.current?.click()} className="rounded-md px-2 py-1 hover:bg-accent">Replace PDF</button>
            </div>
          </div>

          <div className="scrollbar-thin max-h-[55vh] overflow-y-auto pr-1">
            <div className="grid grid-cols-[repeat(auto-fill,minmax(140px,1fr))] gap-3">
              {pages.map(p => {
                const isSel = selected.has(p.pageNumber);
                return (
                  <button
                    key={p.pageNumber}
                    onClick={() => toggle(p.pageNumber)}
                    className={cn(
                      "group relative overflow-hidden rounded-lg border-2 bg-white transition-all",
                      isSel ? "border-primary shadow-lg ring-2 ring-primary/30" : "border-border hover:border-foreground/30"
                    )}
                  >
                    <img src={p.dataUrl} alt={`Page ${p.pageNumber}`} className="w-full" />
                    <div className={cn(
                      "absolute top-1.5 right-1.5 grid h-5 w-5 place-items-center rounded-full text-[10px] font-semibold transition",
                      isSel ? "bg-primary text-primary-foreground" : "bg-background/80 text-foreground opacity-0 group-hover:opacity-100"
                    )}>
                      {isSel ? <Check className="h-3 w-3" /> : "+"}
                    </div>
                    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent px-1.5 py-0.5 text-left text-[10px] font-medium text-white">
                      Page {p.pageNumber}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="mt-4 flex items-center justify-end gap-2">
            <button onClick={onClose} className="rounded-md border border-border px-3 py-1.5 text-xs hover:bg-accent">Cancel</button>
            <button
              disabled={!selected.size}
              onClick={attach}
              className="inline-flex items-center gap-2 rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground disabled:opacity-40 hover:opacity-90"
            >
              {done ? <><Check className="h-3.5 w-3.5" /> Added</> : <>Attach {selected.size || ""} page{selected.size === 1 ? "" : "s"}</>}
            </button>
          </div>
        </>
      )}
    </ModalShell>
  );
}

function ModalShell({ children, onClose, title, icon }: { children: React.ReactNode; onClose: () => void; title: string; icon: React.ReactNode }) {
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/60 p-4 backdrop-blur-sm" onClick={onClose}>
      <div onClick={e => e.stopPropagation()} className="w-full max-w-4xl rounded-xl border border-border bg-background shadow-2xl">
        <div className="flex items-center justify-between border-b border-border px-5 py-3">
          <div className="flex items-center gap-2">
            {icon}
            <h2 className="text-sm font-semibold">{title}</h2>
          </div>
          <button onClick={onClose} className="rounded-md p-1 text-muted-foreground hover:bg-accent hover:text-foreground">
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>
  );
}
