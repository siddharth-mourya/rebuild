"use client";

import { useRef, useState } from "react";
import type { PendingFile } from "./types";
import { UploadIcon, MusicIcon } from "@/components/icons";
import Thumbnail from "@/components/Thumbnail";

function kindLabel(f: PendingFile): string {
  if (f.kind === "video") return `Video · ${f.durationSec ? f.durationSec.toFixed(0) + "s" : "…"}${f.width ? ` · ${f.width}×${f.height}` : ""}`;
  if (f.kind === "image") return `Image${f.width ? ` · ${f.width}×${f.height}` : ""}`;
  return `Audio${f.durationSec ? ` · ${f.durationSec.toFixed(0)}s` : ""}`;
}

export default function StepUpload({
  files,
  onAdd,
  onRemove,
}: {
  files: PendingFile[];
  onAdd: (files: FileList | File[]) => void;
  onRemove: (id: string) => void;
}) {
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <div className="grid h-full" style={{ gridTemplateColumns: "1.05fr 1fr" }}>
      <div className="flex flex-col p-8" style={{ borderRight: "1px solid var(--color-divider)" }}>
        <h3 style={{ margin: "0 0 6px" }}>Bring in your footage</h3>
        <p className="text-muted" style={{ fontSize: 13.5, margin: "0 0 20px", maxWidth: "44ch" }}>
          Image, video or audio — as many files as you like. Everything stays on this device;
          nothing is uploaded anywhere.
        </p>
        <div
          onClick={() => inputRef.current?.click()}
          onDragOver={(e) => {
            e.preventDefault();
            setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragOver(false);
            onAdd(e.dataTransfer.files);
          }}
          className="flex cursor-pointer flex-col items-start gap-2.5"
          style={{ border: `2px dashed ${dragOver ? "var(--color-accent)" : "var(--color-divider)"}`, padding: "34px 28px" }}
        >
          <UploadIcon size={24} className={dragOver ? "" : "text-muted"} />
          <p style={{ fontSize: 15, margin: 0, fontWeight: 600 }}>Drop files here</p>
          <p className="text-muted" style={{ fontSize: 12.5, margin: 0 }}>MP4, MOV, JPG, PNG, MP3, M4A, WAV</p>
          <button className="btn btn-secondary" style={{ fontSize: 12.5, marginTop: 6 }}>
            Browse files
          </button>
        </div>
        <input
          ref={inputRef}
          type="file"
          multiple
          accept="video/*,image/*,audio/*"
          className="hidden"
          onChange={(e) => e.target.files && onAdd(e.target.files)}
        />

        {files.length === 0 && (
          <div className="mt-auto" style={{ borderLeft: "3px solid var(--color-accent)", background: "var(--color-accent-100)", padding: "12px 14px" }}>
            <p style={{ margin: 0, fontSize: 12, color: "var(--color-accent-800)" }}>
              <strong>Nothing added yet.</strong> Continue is disabled until you add at least one
              file — or use <em>Skip, start blank</em> above.
            </p>
          </div>
        )}
      </div>

      <div className="flex flex-col" style={{ minHeight: 0 }}>
        <div className="flex items-baseline justify-between px-6 py-3" style={{ borderBottom: "1px solid var(--color-divider)" }}>
          <h6 style={{ margin: 0 }}>{files.length === 0 ? "Added" : `Added — ${files.length} file${files.length === 1 ? "" : "s"}`}</h6>
          {files.length > 0 && (
            <span className="text-muted" style={{ fontSize: 11 }}>Remove anything before continuing</span>
          )}
        </div>
        <div className="flex-1 overflow-y-auto">
          {files.map((f) => (
            <FileRow key={f.id} file={f} onRemove={() => onRemove(f.id)} />
          ))}
        </div>
      </div>
    </div>
  );
}

function FileRow({ file, onRemove }: { file: PendingFile; onRemove: () => void }) {
  const [url] = useState(() => (file.kind === "audio" ? null : URL.createObjectURL(file.file)));

  return (
    <div className="flex items-center gap-3 px-6 py-2.5" style={{ borderBottom: "1px solid var(--color-divider)" }}>
      {file.kind === "audio" ? (
        <div className="flex shrink-0 items-center justify-center text-muted" style={{ width: 60, height: 44, background: "var(--color-surface)" }}>
          <MusicIcon size={16} />
        </div>
      ) : (
        <Thumbnail url={url} kind={file.kind} className="shrink-0" style={{ width: 60, height: 44 }} />
      )}
      <div className="min-w-0 flex-1">
        <p className="truncate" style={{ margin: 0, fontSize: 13, fontWeight: 600 }}>{file.file.name}</p>
        {file.status === "reading" ? (
          <div style={{ height: 4, marginTop: 6, background: "var(--color-surface)", border: "1px solid var(--color-divider)" }}>
            <span style={{ display: "block", height: "100%", width: "56%", background: "var(--color-accent)" }} />
          </div>
        ) : (
          <p className="text-muted" style={{ margin: "2px 0 0", fontSize: 11 }}>{kindLabel(file)}</p>
        )}
      </div>
      {file.status === "reading" ? (
        <span className="text-muted" style={{ font: "600 11px var(--font-mono)", flexShrink: 0 }}>READING…</span>
      ) : (
        <button onClick={onRemove} className="btn btn-ghost" style={{ fontSize: 12, flexShrink: 0 }}>
          Remove
        </button>
      )}
    </div>
  );
}
