import { useState, useMemo } from "react";
import { useDefterim } from "@/lib/defterim-store";
import type { Block } from "@/lib/defterim-data";
import { Code2, Image as ImageIcon, Type, Heading1, Heading2, List, Sparkles, Eye, Pencil, Plus, Trash2, ChevronLeft, ChevronRight, Hash, Clock } from "lucide-react";
import { cn } from "@/lib/utils";

type Mode = "edit" | "preview" | "study";

export function Editor({ noteId }: { noteId: string }) {
  const { findNote, updateBlock, updateNoteTitle, addBlock, deleteBlock } = useDefterim();
  const found = findNote(noteId);
  const [mode, setMode] = useState<Mode>("edit");

  if (!found) return null;
  const { note, course, term } = found;

  return (
    <div className="flex h-full flex-col">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-6 py-3 bg-background/60 backdrop-blur">
        <div className="flex min-w-0 items-center gap-2 text-xs text-muted-foreground">
          <span>{term.name}</span>
          <ChevronRight className="h-3 w-3" />
          <span className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-sm" style={{ background: course.color }} />
            {course.name}
          </span>
          <ChevronRight className="h-3 w-3" />
          <span className="text-foreground truncate">Week {note.week}</span>
        </div>
        <div className="flex items-center gap-1 rounded-md border border-border bg-card p-0.5">
          {(["edit", "preview", "study"] as Mode[]).map(m => (
            <button
              key={m}
              onClick={() => setMode(m)}
              className={cn(
                "flex items-center gap-1.5 rounded px-2.5 py-1 text-xs font-medium transition-colors capitalize",
                mode === m ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
              )}
            >
              {m === "edit" && <Pencil className="h-3 w-3" />}
              {m === "preview" && <Eye className="h-3 w-3" />}
              {m === "study" && <Sparkles className="h-3 w-3" />}
              {m === "study" ? "Study Mode" : m}
            </button>
          ))}
        </div>
      </div>

      <div className="scrollbar-thin flex-1 overflow-y-auto">
        <div className="mx-auto max-w-3xl px-6 py-10">
          {mode === "study" ? (
            <StudyMode blocks={note.blocks} title={note.title} />
          ) : (
            <>
              <input
                value={note.title}
                onChange={e => updateNoteTitle(note.id, e.target.value)}
                disabled={mode === "preview"}
                className="w-full bg-transparent text-4xl font-bold tracking-tight outline-none placeholder:text-muted-foreground"
                placeholder="Untitled"
              />
              <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> Updated {note.updatedAt}</span>
                {note.tags.map(t => (
                  <span key={t} className="inline-flex items-center gap-0.5 rounded-md bg-accent px-1.5 py-0.5 text-accent-foreground">
                    <Hash className="h-2.5 w-2.5" />{t}
                  </span>
                ))}
              </div>

              <div className="mt-8 space-y-3">
                {note.blocks.map(block => (
                  <BlockEditor
                    key={block.id}
                    block={block}
                    readonly={mode === "preview"}
                    onChange={c => updateBlock(note.id, block.id, c)}
                    onDelete={() => deleteBlock(note.id, block.id)}
                  />
                ))}
              </div>

              {mode === "edit" && (
                <div className="mt-6 flex flex-wrap gap-2">
                  <AddBtn icon={<Heading1 className="h-3.5 w-3.5" />} label="H1" onClick={() => addBlock(note.id, "h1")} />
                  <AddBtn icon={<Heading2 className="h-3.5 w-3.5" />} label="H2" onClick={() => addBlock(note.id, "h2")} />
                  <AddBtn icon={<Type className="h-3.5 w-3.5" />} label="Text" onClick={() => addBlock(note.id, "text")} />
                  <AddBtn icon={<List className="h-3.5 w-3.5" />} label="List" onClick={() => addBlock(note.id, "list")} />
                  <AddBtn icon={<Code2 className="h-3.5 w-3.5" />} label="Code" onClick={() => addBlock(note.id, "code")} />
                  <AddBtn icon={<ImageIcon className="h-3.5 w-3.5" />} label="Image" onClick={() => addBlock(note.id, "image")} />
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function AddBtn({ icon, label, onClick }: { icon: React.ReactNode; label: string; onClick: () => void }) {
  return (
    <button onClick={onClick} className="inline-flex items-center gap-1.5 rounded-md border border-border bg-card px-2.5 py-1.5 text-xs text-muted-foreground transition-colors hover:bg-accent hover:text-foreground">
      <Plus className="h-3 w-3" />{icon}{label}
    </button>
  );
}

function BlockEditor({ block, readonly, onChange, onDelete }: { block: Block; readonly: boolean; onChange: (c: string) => void; onDelete: () => void }) {
  const wrap = (children: React.ReactNode) => (
    <div className="group relative">
      {children}
      {!readonly && (
        <button onClick={onDelete} className="absolute -left-7 top-1.5 hidden h-5 w-5 place-items-center rounded text-muted-foreground hover:bg-accent hover:text-destructive group-hover:grid">
          <Trash2 className="h-3 w-3" />
        </button>
      )}
    </div>
  );

  if (block.type === "h1") return wrap(
    <input value={block.content} onChange={e => onChange(e.target.value)} disabled={readonly}
      className="w-full bg-transparent text-3xl font-bold outline-none" placeholder="Heading 1" />
  );
  if (block.type === "h2") return wrap(
    <input value={block.content} onChange={e => onChange(e.target.value)} disabled={readonly}
      className="w-full bg-transparent text-xl font-semibold outline-none" placeholder="Heading 2" />
  );
  if (block.type === "text") return wrap(
    <textarea value={block.content} onChange={e => onChange(e.target.value)} disabled={readonly} rows={Math.max(2, block.content.split("\n").length)}
      className="w-full resize-none bg-transparent text-[15px] leading-relaxed outline-none" placeholder="Type something..." />
  );
  if (block.type === "list") return wrap(
    <ul className="space-y-1">
      {block.content.split("\n").map((line, i) => (
        <li key={i} className="flex items-start gap-2 text-[15px]">
          <span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-muted-foreground" />
          {readonly ? <span>{line}</span> : (
            <input value={line} onChange={e => {
              const lines = block.content.split("\n"); lines[i] = e.target.value; onChange(lines.join("\n"));
            }} className="flex-1 bg-transparent outline-none" />
          )}
        </li>
      ))}
      {!readonly && (
        <li>
          <button onClick={() => onChange(block.content + "\n")} className="text-xs text-muted-foreground hover:text-foreground">+ add item</button>
        </li>
      )}
    </ul>
  );
  if (block.type === "code") return wrap(
    <div className="overflow-hidden rounded-lg border border-border bg-card">
      <div className="flex items-center justify-between border-b border-border px-3 py-1.5 text-[11px] text-muted-foreground">
        <span className="font-mono uppercase tracking-wider">{(block as any).language}</span>
        <Code2 className="h-3 w-3" />
      </div>
      <textarea value={block.content} onChange={e => onChange(e.target.value)} disabled={readonly} rows={Math.max(4, block.content.split("\n").length)}
        className="w-full resize-none bg-transparent p-3 font-mono text-[13px] leading-relaxed text-foreground outline-none" />
    </div>
  );
  if (block.type === "image") {
    const src = (block as any).src as string | undefined;
    return wrap(
      <div className="flex flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-border bg-card/50 p-4 text-muted-foreground">
        {src ? (
          <img src={src} alt={(block as any).caption} className="max-h-[600px] w-auto rounded-md border border-border bg-white" />
        ) : (
          <>
            <ImageIcon className="h-8 w-8 opacity-50" />
            <span className="text-[11px]">Click to upload whiteboard / slide</span>
          </>
        )}
        <input value={(block as any).caption} onChange={e => onChange(e.target.value)} disabled={readonly}
          className="bg-transparent text-center text-sm outline-none placeholder:text-muted-foreground" placeholder="Image caption" />
      </div>
    );
  }
  return null;
}

function StudyMode({ blocks, title }: { blocks: Block[]; title: string }) {
  const cards = useMemo(() => {
    const out: { q: string; a: string }[] = [];
    blocks.forEach((b, i) => {
      if (b.type === "h1" || b.type === "h2") {
        const next = blocks[i + 1];
        if (next && (next.type === "text" || next.type === "list")) out.push({ q: b.content, a: next.content });
      }
    });
    if (out.length === 0) out.push({ q: title, a: "Add headings and notes to generate flashcards." });
    return out;
  }, [blocks, title]);

  const [idx, setIdx] = useState(0);
  const [flip, setFlip] = useState(false);
  const card = cards[idx];

  return (
    <div>
      <div className="mb-6 flex items-center gap-2 text-sm">
        <Sparkles className="h-4 w-4 text-primary" />
        <span className="font-semibold">Study Mode</span>
        <span className="text-muted-foreground">— {cards.length} flashcards generated</span>
      </div>
      <div
        onClick={() => setFlip(f => !f)}
        className="group relative flex h-72 cursor-pointer items-center justify-center rounded-2xl border border-border bg-gradient-to-br from-card to-accent/30 p-8 text-center shadow-lg transition-all hover:shadow-xl"
      >
        <div>
          <div className="mb-2 text-[11px] uppercase tracking-widest text-muted-foreground">{flip ? "Answer" : "Question"}</div>
          <div className={cn("font-semibold whitespace-pre-line", flip ? "text-lg" : "text-2xl")}>
            {flip ? card.a : card.q}
          </div>
          <div className="mt-6 text-[11px] text-muted-foreground">Click to flip</div>
        </div>
      </div>
      <div className="mt-4 flex items-center justify-between">
        <button onClick={() => { setIdx(i => Math.max(0, i - 1)); setFlip(false); }} disabled={idx === 0}
          className="inline-flex items-center gap-1 rounded-md border border-border px-3 py-1.5 text-sm hover:bg-accent disabled:opacity-40">
          <ChevronLeft className="h-3.5 w-3.5" /> Prev
        </button>
        <span className="text-xs text-muted-foreground">{idx + 1} / {cards.length}</span>
        <button onClick={() => { setIdx(i => Math.min(cards.length - 1, i + 1)); setFlip(false); }} disabled={idx === cards.length - 1}
          className="inline-flex items-center gap-1 rounded-md border border-border px-3 py-1.5 text-sm hover:bg-accent disabled:opacity-40">
          Next <ChevronRight className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}
