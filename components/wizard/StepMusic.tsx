"use client";

import { useRef, useState } from "react";
import { searchMusic } from "@/lib/music/musicService";
import { probeMedia } from "@/lib/storage/assetStore";
import type { MusicTrack } from "@/lib/music/types";
import type { AspectRatio } from "@/lib/timeline/types";
import type { MusicSelection, PendingFile } from "./types";
import AudioTrimmer from "@/components/editor/MusicLibrary/AudioTrimmer";
import { PlayIcon, UploadIcon } from "@/components/icons";

function fmt(sec: number): string {
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60).toString().padStart(2, "0");
  return `${m}:${s}`;
}

export default function StepMusic({
  music,
  aspectRatio,
  defaultFit,
  visualCount,
  videoDuration,
  onChange,
}: {
  music: MusicSelection | null;
  aspectRatio: AspectRatio;
  defaultFit: "fill" | "crop" | "fit";
  visualCount: number;
  videoDuration: number;
  onChange: (m: MusicSelection | null) => void;
}) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<MusicTrack[]>([]);
  const [status, setStatus] = useState<"idle" | "loading" | "error">("idle");
  const [error, setError] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const uploadInputRef = useRef<HTMLInputElement>(null);

  async function runSearch(e: React.FormEvent) {
    e.preventDefault();
    if (!query.trim()) return;
    setStatus("loading");
    setError(null);
    try {
      setResults(await searchMusic(query.trim()));
      setStatus("idle");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Search failed");
      setStatus("error");
    }
  }

  function selectTrack(track: MusicTrack) {
    onChange({ kind: "track", track, sourceIn: 0, sourceOut: Math.min(10, track.durationSec) });
  }

  async function handleUpload(file: File | undefined) {
    if (!file) return;
    const meta = await probeMedia("audio", file);
    const pf: PendingFile = { id: crypto.randomUUID(), file, kind: "audio", status: "ready", ...meta };
    onChange({ kind: "upload", file: pf });
  }

  return (
    <div className="grid h-full" style={{ gridTemplateColumns: "1fr 1.1fr" }}>
      <div className="flex flex-col p-8" style={{ borderRight: "1px solid var(--color-divider)", minHeight: 0 }}>
        <h3 style={{ margin: "0 0 6px" }}>Music, if you want it</h3>
        <p className="text-muted" style={{ fontSize: 13.5, margin: "0 0 18px", maxWidth: "44ch" }}>
          Search the free catalogue or bring your own file. One track here — layer more once
          you&apos;re in the editor.
        </p>
        <div className="flex gap-2" style={{ marginBottom: 14 }}>
          <form onSubmit={runSearch} style={{ flex: 1 }}>
            <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search free music…" className="input" />
          </form>
          <button onClick={() => uploadInputRef.current?.click()} className="btn btn-secondary" style={{ fontSize: 12, gap: 6, flexShrink: 0 }}>
            <UploadIcon size={13} />
            Upload audio
          </button>
          <input ref={uploadInputRef} type="file" accept="audio/*" className="hidden" onChange={(e) => handleUpload(e.target.files?.[0])} />
        </div>

        {music?.kind === "upload" && (
          <div className="flex items-center justify-between" style={{ padding: "11px 10px", background: "var(--color-accent-100)", borderLeft: "3px solid var(--color-accent)", marginBottom: 12 }}>
            <p style={{ margin: 0, fontSize: 13, fontWeight: 600 }}>{music.file.file.name}</p>
            <button onClick={() => onChange(null)} className="btn btn-ghost" style={{ fontSize: 11 }}>Remove</button>
          </div>
        )}

        {status === "error" && <p style={{ color: "var(--color-accent)", fontSize: 12 }}>{error}</p>}
        {status === "loading" && <p className="text-muted" style={{ fontSize: 12 }}>Searching…</p>}
        {results.length > 0 && (
          <div style={{ font: "600 10px var(--font-mono)", letterSpacing: "0.06em", color: "color-mix(in srgb, var(--color-text) 50%, transparent)", paddingBottom: 6, borderBottom: "1px solid var(--color-divider)" }}>
            JAMENDO · {results.length} RESULTS
          </div>
        )}
        <div className="flex-1 overflow-y-auto">
          {results.map((track) => {
            const selected = music?.kind === "track" && music.track.id === track.id;
            return (
              <div
                key={track.id}
                className="flex items-start justify-between"
                style={{
                  gap: 10,
                  padding: "11px 10px",
                  borderBottom: selected ? undefined : "1px solid var(--color-divider)",
                  background: selected ? "var(--color-accent-100)" : undefined,
                  borderLeft: selected ? "3px solid var(--color-accent)" : undefined,
                }}
              >
                <div>
                  <p style={{ margin: 0, fontSize: 13, fontWeight: 600 }}>{track.title}</p>
                  <p style={{ margin: "2px 0 0", fontSize: 11, color: selected ? "var(--color-accent-800)" : "color-mix(in srgb, var(--color-text) 55%, transparent)" }}>
                    {track.artist} · {fmt(track.durationSec)}
                    {selected && track.license.attributionRequired ? " · CC BY" : ""}
                  </p>
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
                  >
                    <PlayIcon size={12} />
                  </button>
                  {selected ? (
                    <span className="tag tag-accent">selected</span>
                  ) : (
                    <button onClick={() => selectTrack(track)} className="btn btn-secondary" style={{ fontSize: 11, padding: "5px 10px" }}>
                      Use
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        <div style={{ marginTop: "auto", paddingTop: 16 }}>
          <button onClick={() => onChange(null)} className="btn btn-ghost" style={{ fontSize: 12.5, gap: 8, paddingLeft: 0 }}>
            Skip, add music later
          </button>
        </div>
        <audio ref={audioRef} className="hidden" />
      </div>

      <div className="flex flex-col p-8" style={{ minHeight: 0 }}>
        {music?.kind === "track" ? (
          <>
            <div className="flex items-baseline justify-between">
              <h6 style={{ margin: 0 }}>Trim &ldquo;{music.track.title}&rdquo;</h6>
              <span className="tag tag-neutral" style={{ fontFamily: "var(--font-mono)" }}>1 of 1 allowed</span>
            </div>
            <p className="text-muted" style={{ fontSize: 12.5, margin: "8px 0 16px" }}>
              Only the range you keep is imported. It lands on the audio track.
            </p>
            <AudioTrimmer
              audioUrl={music.track.audioUrl}
              durationSec={music.track.durationSec}
              onChange={(range) => onChange({ ...music, ...range })}
            />
          </>
        ) : music?.kind === "upload" ? (
          <>
            <h6 style={{ margin: "0 0 8px" }}>Ready to use</h6>
            <p className="text-muted" style={{ fontSize: 12.5, margin: 0 }}>
              &ldquo;{music.file.file.name}&rdquo; goes onto the audio track in full — trim it in the editor if needed.
            </p>
          </>
        ) : (
          <p className="text-muted" style={{ fontSize: 13 }}>Pick a track or upload a file to preview it here.</p>
        )}

        <div style={{ marginTop: "auto" }}>
          <h6 style={{ margin: "0 0 10px" }}>On finish</h6>
          <div style={{ border: "1px solid var(--color-divider)", padding: 12 }}>
            <SummaryRow label="Canvas" value={aspectRatio} />
            <SummaryRow label="Video track" value={`${visualCount} clip${visualCount === 1 ? "" : "s"} · fit: ${defaultFit} · ${fmt(videoDuration)}`} />
            <SummaryRow
              label="Audio track"
              value={music?.kind === "track" ? `${music.track.title} ${fmt(music.sourceIn)}–${fmt(music.sourceOut)}` : music?.kind === "upload" ? music.file.file.name : "None"}
              last
            />
          </div>
          <p className="text-muted" style={{ margin: "10px 0 0", fontSize: 11.5 }}>
            Skipping music still creates the empty audio track.
          </p>
        </div>
      </div>
    </div>
  );
}

function SummaryRow({ label, value, last = false }: { label: string; value: string; last?: boolean }) {
  return (
    <div
      className="flex justify-between"
      style={{ fontSize: 12, padding: "5px 0", borderBottom: last ? undefined : "1px solid var(--color-divider)" }}
    >
      <span>{label}</span>
      <span style={{ font: "600 11.5px var(--font-mono)" }}>{value}</span>
    </div>
  );
}
