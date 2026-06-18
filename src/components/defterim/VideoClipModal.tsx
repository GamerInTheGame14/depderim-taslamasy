import { useEffect, useRef, useState } from "react";
import { FileUp, Loader2, Check, Film, X, Scissors, Play } from "lucide-react";
import { useDefterim } from "@/lib/defterim-store";

function fmt(t: number) {
  if (!isFinite(t)) return "0:00";
  const m = Math.floor(t / 60);
  const s = Math.floor(t % 60).toString().padStart(2, "0");
  return `${m}:${s}`;
}

export function VideoClipModal({ noteId, onClose }: { noteId: string; onClose: () => void }) {
  const { addVideoBlock } = useDefterim();
  const videoRef = useRef<HTMLVideoElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [src, setSrc] = useState<string>("");
  const [fileName, setFileName] = useState<string>("");
  const [duration, setDuration] = useState(0);
  const [current, setCurrent] = useState(0);
  const [start, setStart] = useState(0);
  const [end, setEnd] = useState(0);
  const [caption, setCaption] = useState("");
  const [previewing, setPreviewing] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => () => { if (src) URL.revokeObjectURL(src); }, [src]);

  function pickFile(file: File) {
    if (src) URL.revokeObjectURL(src);
    const url = URL.createObjectURL(file);
    setSrc(url);
    setFileName(file.name);
    setCaption(file.name.replace(/\.[^.]+$/, ""));
    setStart(0); setEnd(0); setCurrent(0); setDone(false);
  }

  function onMeta() {
    const v = videoRef.current;
    if (!v) return;
    setDuration(v.duration);
    setEnd(v.duration);
  }

  function onTime() {
    const v = videoRef.current;
    if (!v) return;
    setCurrent(v.currentTime);
    if (previewing && v.currentTime >= end) {
      v.pause();
      setPreviewing(false);
    }
  }

  function setStartHere() { setStart(Math.min(current, end - 0.1)); }
  function setEndHere() { setEnd(Math.max(current, start + 0.1)); }

  function preview() {
    const v = videoRef.current;
    if (!v) return;
    v.currentTime = start;
    v.play();
    setPreviewing(true);
  }

  function attach() {
    if (!src) return;
    addVideoBlock(noteId, { src, caption, start, end });
    setDone(true);
    setTimeout(onClose, 600);
  }

  const clipLen = Math.max(0, end - start);

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/60 p-4 backdrop-blur-sm" onClick={onClose}>
      <div onClick={e => e.stopPropagation()} className="w-full max-w-3xl rounded-xl border border-border bg-background shadow-2xl">
        <div className="flex items-center justify-between border-b border-border px-5 py-3">
          <div className="flex items-center gap-2">
            <Film className="h-4 w-4 text-primary" />
            <h2 className="text-sm font-semibold">Video — cut a clip</h2>
          </div>
          <button onClick={onClose} className="rounded-md p-1 text-muted-foreground hover:bg-accent hover:text-foreground">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="p-5">
          <input ref={inputRef} type="file" accept="video/*" className="hidden"
            onChange={e => { const f = e.target.files?.[0]; if (f) pickFile(f); }} />

          {!src ? (
            <button onClick={() => inputRef.current?.click()}
              className="flex w-full flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed border-border bg-card/40 px-6 py-16 text-muted-foreground hover:bg-card/70 transition">
              <FileUp className="h-10 w-10 opacity-60" />
              <div className="text-sm font-medium text-foreground">Upload a video</div>
              <div className="text-xs">Lecture recording, demo, tutorial — trim the part you need</div>
            </button>
          ) : (
            <>
              <div className="overflow-hidden rounded-lg border border-border bg-black">
                <video ref={videoRef} src={src} controls onLoadedMetadata={onMeta} onTimeUpdate={onTime}
                  className="aspect-video w-full" />
              </div>

              <div className="mt-4">
                <div className="mb-1 flex items-center justify-between text-[11px] text-muted-foreground">
                  <span>{fmt(current)}</span>
                  <span className="font-medium text-foreground">Clip: {fmt(start)} → {fmt(end)} · {fmt(clipLen)}</span>
                  <span>{fmt(duration)}</span>
                </div>
                <DualRangeTrack duration={duration} start={start} end={end} current={current}
                  onStart={setStart} onEnd={setEnd} />
              </div>

              <div className="mt-4 flex flex-wrap items-center gap-2">
                <button onClick={setStartHere}
                  className="inline-flex items-center gap-1.5 rounded-md border border-border bg-card px-2.5 py-1.5 text-xs hover:bg-accent">
                  <Scissors className="h-3.5 w-3.5" /> Set start here
                </button>
                <button onClick={setEndHere}
                  className="inline-flex items-center gap-1.5 rounded-md border border-border bg-card px-2.5 py-1.5 text-xs hover:bg-accent">
                  <Scissors className="h-3.5 w-3.5" /> Set end here
                </button>
                <button onClick={preview}
                  className="inline-flex items-center gap-1.5 rounded-md border border-border bg-card px-2.5 py-1.5 text-xs hover:bg-accent">
                  <Play className="h-3.5 w-3.5" /> Preview clip
                </button>
                <button onClick={() => inputRef.current?.click()}
                  className="ml-auto rounded-md px-2 py-1 text-xs text-muted-foreground hover:bg-accent hover:text-foreground">
                  Replace video
                </button>
              </div>

              <div className="mt-4">
                <label className="text-[11px] uppercase tracking-wide text-muted-foreground">Caption</label>
                <input value={caption} onChange={e => setCaption(e.target.value)} placeholder={fileName}
                  className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring" />
              </div>

              <div className="mt-5 flex items-center justify-end gap-2">
                <button onClick={onClose} className="rounded-md border border-border px-3 py-1.5 text-xs hover:bg-accent">Cancel</button>
                <button onClick={attach} disabled={clipLen < 0.1}
                  className="inline-flex items-center gap-2 rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground disabled:opacity-40 hover:opacity-90">
                  {done ? <><Check className="h-3.5 w-3.5" /> Added</> : <>Attach clip ({fmt(clipLen)})</>}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function DualRangeTrack({ duration, start, end, current, onStart, onEnd }: {
  duration: number; start: number; end: number; current: number;
  onStart: (v: number) => void; onEnd: (v: number) => void;
}) {
  const pct = (v: number) => (duration > 0 ? (v / duration) * 100 : 0);
  return (
    <div className="relative h-10 select-none">
      <div className="absolute left-0 right-0 top-1/2 h-2 -translate-y-1/2 rounded-full bg-muted" />
      <div className="absolute top-1/2 h-2 -translate-y-1/2 rounded-full bg-primary/60"
        style={{ left: `${pct(start)}%`, right: `${100 - pct(end)}%` }} />
      <div className="absolute top-0 h-full w-0.5 bg-foreground/80" style={{ left: `${pct(current)}%` }} />
      <input type="range" min={0} max={duration || 0} step={0.05} value={start}
        onChange={e => onStart(Math.min(parseFloat(e.target.value), end - 0.1))}
        className="dual-thumb absolute inset-0 w-full appearance-none bg-transparent" />
      <input type="range" min={0} max={duration || 0} step={0.05} value={end}
        onChange={e => onEnd(Math.max(parseFloat(e.target.value), start + 0.1))}
        className="dual-thumb absolute inset-0 w-full appearance-none bg-transparent" />
    </div>
  );
}
