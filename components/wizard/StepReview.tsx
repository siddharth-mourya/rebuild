"use client";

import { useState } from "react";
import type { PendingFile } from "./types";
import { MusicIcon } from "@/components/icons";
import Thumbnail from "@/components/Thumbnail";

function fmt(sec: number): string {
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60).toString().padStart(2, "0");
  return `${m}:${s}`;
}

export default function StepReview({
  visualFiles,
  audioFiles,
  defaultImageDuration,
  onReorder,
  onRemove,
}: {
  visualFiles: PendingFile[];
  audioFiles: PendingFile[];
  defaultImageDuration: number;
  onReorder: (order: string[]) => void;
  onRemove: (id: string) => void;
}) {
  const [dragId, setDragId] = useState<string | null>(null);

  function handleDrop(targetId: string) {
    if (!dragId || dragId === targetId) return;
    const ids = visualFiles.map((f) => f.id);
    const from = ids.indexOf(dragId);
    const to = ids.indexOf(targetId);
    ids.splice(from, 1);
    ids.splice(to, 0, dragId);
    onReorder(ids);
    setDragId(null);
  }

  const totalDuration = visualFiles.reduce((sum, f) => sum + (f.durationSec ?? defaultImageDuration), 0);

  return (
    <div className="grid h-full" style={{ gridTemplateColumns: "1.35fr 1fr" }}>
      <div className="flex flex-col p-8" style={{ borderRight: "1px solid var(--color-divider)", minHeight: 0 }}>
        <h3 style={{ margin: "0 0 6px" }}>This is the order they&apos;ll play in</h3>
        <p className="text-muted" style={{ fontSize: 13.5, margin: "0 0 18px", maxWidth: "52ch" }}>
          Drag to reorder your images and video. Leave it as it is and they go on the track exactly
          as uploaded.
        </p>

        <div style={{ borderTop: "2px solid var(--color-divider)" }}>
          {visualFiles.map((f, i) => (
            <div
              key={f.id}
              draggable
              onDragStart={() => setDragId(f.id)}
              onDragOver={(e) => e.preventDefault()}
              onDrop={() => handleDrop(f.id)}
              className="flex cursor-grab items-center gap-3 py-2.5 active:cursor-grabbing"
              style={{
                borderBottom: "1px solid var(--color-divider)",
                opacity: dragId === f.id ? 0.4 : 1,
              }}
            >
              <span style={{ font: "600 11px var(--font-mono)", width: 18, color: "color-mix(in srgb, var(--color-text) 50%, transparent)" }}>
                {String(i + 1).padStart(2, "0")}
              </span>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ flexShrink: 0, color: "color-mix(in srgb, var(--color-text) 45%, transparent)" }}>
                <path d="M4 8h16M4 16h16" />
              </svg>
              <FileThumb file={f} />
              <div className="min-w-0 flex-1">
                <p className="truncate" style={{ margin: 0, fontSize: 13, fontWeight: 600 }}>{f.file.name}</p>
                <p className="text-muted" style={{ margin: "2px 0 0", fontSize: 11 }}>
                  {f.kind === "video" ? "Video" : "Image"} · {(f.durationSec ?? defaultImageDuration).toFixed(0)}s
                </p>
              </div>
              <button onClick={() => onRemove(f.id)} className="btn btn-ghost" style={{ fontSize: 12, flexShrink: 0 }}>
                Remove
              </button>
            </div>
          ))}
        </div>

        {audioFiles.length > 0 && (
          <div className="mt-6" style={{ paddingTop: 14, borderTop: "2px solid var(--color-divider)" }}>
            <div className="flex items-baseline justify-between" style={{ marginBottom: 8 }}>
              <h6 style={{ margin: 0 }}>Audio — {audioFiles.length} file{audioFiles.length === 1 ? "" : "s"}</h6>
              <span className="text-muted" style={{ fontSize: 11 }}>Not ordered here · goes to the audio track</span>
            </div>
            {audioFiles.map((f) => (
              <div key={f.id} className="flex items-center gap-3 py-2.5" style={{ borderTop: "1px solid var(--color-divider)" }}>
                <div className="flex shrink-0 items-center justify-center text-muted" style={{ width: 52, height: 38, background: "var(--color-surface)" }}>
                  <MusicIcon size={15} />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate" style={{ margin: 0, fontSize: 12.5, fontWeight: 600 }}>{f.file.name}</p>
                  <p className="text-muted" style={{ margin: "2px 0 0", fontSize: 11 }}>Audio{f.durationSec ? ` · ${f.durationSec.toFixed(0)}s` : ""}</p>
                </div>
                <button onClick={() => onRemove(f.id)} className="btn btn-ghost" style={{ fontSize: 12, flexShrink: 0 }}>
                  Remove
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="flex flex-col gap-3.5 p-8" style={{ gap: 14 }}>
        <h6 style={{ margin: 0 }}>Resulting video track</h6>
        <div style={{ border: "1px solid var(--color-divider)", background: "color-mix(in srgb, var(--color-text) 3%, transparent)", padding: 10 }}>
          <div className="flex" style={{ gap: 2, height: 54 }}>
            {visualFiles.map((f) => (
              <div
                key={f.id}
                style={{
                  flex: f.durationSec ?? defaultImageDuration,
                  background: "var(--color-surface)",
                  border: "1px solid var(--color-divider)",
                  display: "flex",
                  alignItems: "flex-end",
                  padding: 5,
                  font: "600 10px var(--font-mono)",
                  overflow: "hidden",
                }}
              >
                {fmt(f.durationSec ?? defaultImageDuration)}
              </div>
            ))}
          </div>
          <p className="text-muted" style={{ margin: "8px 0 0", fontSize: 11 }}>
            Back-to-back, no gaps. Images take the default {defaultImageDuration}s. Total {fmt(totalDuration)}.
          </p>
        </div>
        <div style={{ borderLeft: "3px solid var(--color-accent)", background: "var(--color-accent-100)", padding: "12px 14px" }}>
          <p style={{ margin: 0, fontSize: 12, color: "var(--color-accent-800)" }}>
            Clips arrive at full length — trimming in and out points is an editor job, not a setup one.
          </p>
        </div>
      </div>
    </div>
  );
}

function FileThumb({ file }: { file: PendingFile }) {
  const [url] = useState(() => URL.createObjectURL(file.file));
  return <Thumbnail url={url} kind={file.kind === "video" ? "video" : "image"} className="shrink-0" style={{ width: 64, height: 46 }} />;
}
