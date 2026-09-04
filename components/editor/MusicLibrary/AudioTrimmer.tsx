"use client";

import { useEffect, useRef, useState } from "react";
import { decodeAudio, extractPeaks } from "@/lib/audio/waveform";

function fmt(sec: number): string {
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60).toString().padStart(2, "0");
  return `${m}:${s}`;
}

export default function AudioTrimmer({
  audioUrl,
  durationSec,
  onChange,
}: {
  audioUrl: string;
  durationSec: number;
  onChange: (range: { sourceIn: number; sourceOut: number }) => void;
}) {
  const [peaks, setPeaks] = useState<Float32Array | null>(null);
  const [range, setRange] = useState<[number, number]>([0, Math.min(10, durationSec)]);
  const containerRef = useRef<HTMLDivElement>(null);
  const draggingRef = useRef<"start" | "end" | null>(null);

  useEffect(() => {
    let cancelled = false;
    decodeAudio(audioUrl)
      .then((buf) => {
        if (cancelled) return;
        setPeaks(extractPeaks(buf).peaks);
      })
      .catch(() => setPeaks(null));
    return () => {
      cancelled = true;
    };
  }, [audioUrl]);

  useEffect(() => {
    onChange({ sourceIn: range[0], sourceOut: range[1] });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [range]);

  function timeFromClientX(clientX: number): number {
    const el = containerRef.current;
    if (!el) return 0;
    const rect = el.getBoundingClientRect();
    const ratio = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
    return ratio * durationSec;
  }

  function onPointerMove(e: React.PointerEvent) {
    if (!draggingRef.current) return;
    const t = timeFromClientX(e.clientX);
    setRange(([start, end]) =>
      draggingRef.current === "start"
        ? [Math.min(t, end - 0.5), end]
        : [start, Math.max(t, start + 0.5)]
    );
  }

  return (
    <div className="flex flex-col gap-2">
      <div
        ref={containerRef}
        onPointerMove={onPointerMove}
        onPointerUp={() => (draggingRef.current = null)}
        onPointerLeave={() => (draggingRef.current = null)}
        className="relative h-[92px] w-full select-none"
        style={{ background: "var(--color-surface)", border: "1px solid var(--color-divider)" }}
      >
        {peaks && (
          <svg viewBox={`0 0 ${peaks.length} 100`} preserveAspectRatio="none" className="absolute inset-0 h-full w-full" opacity={0.45}>
            {Array.from(peaks).map((p, i) => (
              <rect key={i} x={i} y={50 - p * 48} width={0.8} height={p * 96} fill="var(--color-text)" />
            ))}
          </svg>
        )}
        <div
          className="absolute inset-y-0"
          style={{
            left: `${(range[0] / durationSec) * 100}%`,
            width: `${((range[1] - range[0]) / durationSec) * 100}%`,
            background: "color-mix(in srgb, var(--color-accent) 16%, transparent)",
            borderLeft: "8px solid var(--color-accent)",
            borderRight: "8px solid var(--color-accent)",
          }}
        />
        <span
          className="absolute"
          style={{
            left: `${(range[0] / durationSec) * 100}%`,
            top: -1,
            transform: range[0] / durationSec < 0.08 ? "translateX(0)" : "translateX(-100%)",
            background: "var(--color-text)",
            color: "var(--color-bg)",
            font: "600 10px var(--font-mono)",
            padding: "2px 5px",
          }}
        >
          {fmt(range[0])}
        </span>
        <span
          className="absolute"
          style={{
            left: `${(range[1] / durationSec) * 100}%`,
            bottom: -1,
            transform: range[1] / durationSec > 0.92 ? "translateX(-100%)" : "translateX(0)",
            background: "var(--color-text)",
            color: "var(--color-bg)",
            font: "600 10px var(--font-mono)",
            padding: "2px 5px",
          }}
        >
          {fmt(range[1])}
        </span>
        <div
          onPointerDown={() => (draggingRef.current = "start")}
          className="absolute inset-y-0 cursor-ew-resize"
          style={{ left: `calc(${(range[0] / durationSec) * 100}% - 8px)`, width: 16 }}
        />
        <div
          onPointerDown={() => (draggingRef.current = "end")}
          className="absolute inset-y-0 cursor-ew-resize"
          style={{ left: `calc(${(range[1] / durationSec) * 100}% - 8px)`, width: 16 }}
        />
      </div>
      <span style={{ font: "600 13px var(--font-mono)" }}>
        {fmt(range[0])} – {fmt(range[1])}
        <span className="text-muted"> · {(range[1] - range[0]).toFixed(1)}s selected</span>
      </span>
    </div>
  );
}
