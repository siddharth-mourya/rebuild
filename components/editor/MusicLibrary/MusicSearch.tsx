"use client";

import { useRef, useState } from "react";
import { searchMusic } from "@/lib/music/musicService";
import type { MusicTrack } from "@/lib/music/types";
import { importAsset } from "@/lib/storage/assetStore";
import { useEditorStore } from "@/store/editorStore";
import type { MediaAsset } from "@/lib/timeline/types";
import { PlayIcon, UploadIcon, SfxIcon } from "@/components/icons";
import AudioTrimmer from "./AudioTrimmer";

type PendingUpload = { asset: MediaAsset; url: string };

export default function MusicSearch({
  projectId,
  onAddAsset,
}: {
  projectId: string;
  onAddAsset: (asset: MediaAsset, range: { sourceIn: number; sourceOut: number }) => void;
}) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<MusicTrack[]>([]);
  const [status, setStatus] = useState<"idle" | "loading" | "error">("idle");
  const [error, setError] = useState<string | null>(null);
  const [openTrack, setOpenTrack] = useState<MusicTrack | null>(null);
  const [pendingUpload, setPendingUpload] = useState<PendingUpload | null>(null);
  const [range, setRange] = useState({ sourceIn: 0, sourceOut: 10 });
  const [adding, setAdding] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);
  const uploadInputRef = useRef<HTMLInputElement>(null);
  const registerAsset = useEditorStore((s) => s.registerAsset);

  async function runSearch(e: React.FormEvent) {
    e.preventDefault();
    if (!query.trim()) return;
    setStatus("loading");
    setError(null);
    try {
      const tracks = await searchMusic(query.trim());
      setResults(tracks);
      setStatus("idle");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Search failed");
      setStatus("error");
    }
  }

  async function handleAdd(track: MusicTrack) {
    setAdding(true);
    try {
      const res = await fetch(track.audioUrl);
      const blob = await res.blob();
      const asset = await importAsset(projectId, "audio", `${track.title} — ${track.artist ?? "Unknown"}`, blob);
      registerAsset(asset);
      onAddAsset(asset, range);
      setOpenTrack(null);
    } finally {
      setAdding(false);
    }
  }

  async function handleUploadFile(file: File | undefined) {
    if (!file) return;
    const asset = await importAsset(projectId, "audio", file.name, file);
    registerAsset(asset);
    setPendingUpload({ asset, url: URL.createObjectURL(file) });
    setRange({ sourceIn: 0, sourceOut: Math.min(10, asset.durationSec ?? 10) });
  }

  function confirmUpload() {
    if (!pendingUpload) return;
    onAddAsset(pendingUpload.asset, range);
    setPendingUpload(null);
  }

  return (
    <div className="flex flex-col p-3">
      <div className="flex flex-col gap-2 pb-3" style={{ borderBottom: "1px solid var(--color-divider)" }}>
        <form onSubmit={runSearch}>
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search free music…"
            className="input"
          />
        </form>
        <div className="flex gap-2">
          <button
            onClick={() => uploadInputRef.current?.click()}
            className="btn btn-secondary"
            style={{ flex: 1, fontSize: 11.5, justifyContent: "flex-start", gap: 6 }}
          >
            <UploadIcon size={13} />
            Upload song
          </button>
          <button className="btn btn-secondary" style={{ flex: 1, fontSize: 11.5, justifyContent: "flex-start", gap: 6 }} disabled title="Planned feature — coming soon">
            <SfxIcon size={13} />
            Effects
          </button>
        </div>
        <input
          ref={uploadInputRef}
          type="file"
          accept="audio/*"
          className="hidden"
          onChange={(e) => handleUploadFile(e.target.files?.[0])}
        />
        <p className="text-muted" style={{ fontSize: 10.5, margin: 0 }}>
          Only upload audio you have permission to use.
        </p>
      </div>

      {pendingUpload && (
        <div className="flex flex-col gap-3 py-3" style={{ borderBottom: "1px solid var(--color-divider)" }}>
          <p style={{ margin: 0, fontSize: 12.5, fontWeight: 600 }}>Trim &ldquo;{pendingUpload.asset.name}&rdquo;</p>
          <AudioTrimmer
            audioUrl={pendingUpload.url}
            durationSec={pendingUpload.asset.durationSec ?? 10}
            onChange={setRange}
          />
          <div className="flex justify-end gap-2">
            <button onClick={() => setPendingUpload(null)} className="btn btn-secondary" style={{ fontSize: 12 }}>
              Cancel
            </button>
            <button onClick={confirmUpload} className="btn btn-primary" style={{ fontSize: 12 }}>
              Add to timeline
            </button>
          </div>
        </div>
      )}

      {status === "error" && (
        <p style={{ color: "var(--color-accent)", fontSize: 12, marginTop: 10 }}>{error}</p>
      )}
      {status === "loading" && <p className="text-muted" style={{ fontSize: 12, marginTop: 10 }}>Searching…</p>}
      {results.length > 0 && (
        <div
          className="px-0 py-2"
          style={{ font: "600 10px var(--font-mono)", letterSpacing: "0.06em", color: "color-mix(in srgb, var(--color-text) 50%, transparent)" }}
        >
          JAMENDO · {results.length} RESULTS
        </div>
      )}

      <ul className="flex flex-col">
        {results.map((track) => (
          <li key={track.id} style={{ borderBottom: "1px solid var(--color-divider)" }}>
            <div className="flex items-start justify-between gap-2 py-2.5">
              <div className="min-w-0">
                <p className="truncate" style={{ margin: 0, fontSize: 12.5, fontWeight: 600 }}>{track.title}</p>
                <p className="text-muted truncate" style={{ margin: "2px 0 0", fontSize: 11 }}>{track.artist}</p>
              </div>
              <div className="flex shrink-0 items-center gap-1.5">
                <button
                  onClick={() => {
                    if (audioRef.current) {
                      audioRef.current.src = track.audioUrl;
                      audioRef.current.play();
                    }
                  }}
                  className="btn btn-secondary btn-icon"
                  style={{ width: 28, height: 28 }}
                  aria-label="Preview"
                >
                  <PlayIcon size={12} />
                </button>
                <button
                  onClick={() => {
                    setOpenTrack(track);
                    setRange({ sourceIn: 0, sourceOut: Math.min(10, track.durationSec) });
                  }}
                  className="btn btn-primary"
                  style={{ fontSize: 11, padding: "5px 10px" }}
                >
                  Add
                </button>
              </div>
            </div>

            {openTrack?.id === track.id && (
              <div className="flex flex-col gap-3 pb-3">
                <AudioTrimmer audioUrl={track.audioUrl} durationSec={track.durationSec} onChange={setRange} />
                <div className="flex justify-end gap-2">
                  <button onClick={() => setOpenTrack(null)} className="btn btn-secondary" style={{ fontSize: 12 }}>
                    Cancel
                  </button>
                  <button
                    disabled={adding}
                    onClick={() => handleAdd(track)}
                    className="btn btn-primary"
                    style={{ fontSize: 12 }}
                  >
                    {adding ? "Adding…" : "Add to timeline"}
                  </button>
                </div>
                {track.license.attributionRequired && (
                  <p className="text-muted" style={{ fontSize: 10.5, margin: 0 }}>
                    Attribution required: &ldquo;{track.title}&rdquo; by {track.artist}
                    {track.license.sourceUrl ? ` — ${track.license.sourceUrl}` : ""}
                  </p>
                )}
              </div>
            )}
          </li>
        ))}
      </ul>

      <audio ref={audioRef} className="hidden" />
    </div>
  );
}
