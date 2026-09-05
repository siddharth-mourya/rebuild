"use client";

import { useState } from "react";
import type { AspectRatio } from "@/lib/timeline/types";
import { ASPECT_RATIOS } from "@/lib/timeline/types";
import type { PendingFile } from "./types";
import Thumbnail from "@/components/Thumbnail";

const CANVAS_PX: Record<AspectRatio, string> = {
  "9:16": "1080×1920",
  "1:1": "1080×1080",
  "4:5": "1080×1350",
  "16:9": "1920×1080",
};

const FIT_OPTIONS: { value: "fill" | "crop" | "fit"; label: string; description: string }[] = [
  { value: "fill", label: "Fill", description: "Scaled up until the frame is covered. Edges past the canvas are lost." },
  { value: "crop", label: "Crop", description: "Same as Fill, but you pick the region that survives — focus point per clip." },
  { value: "fit", label: "Fit + letterbox", description: "Whole frame kept; the gap above and below is dimmed instead of left flat black." },
];

export default function StepCanvas({
  aspectRatio,
  defaultFit,
  previewFile,
  onAspectRatioChange,
  onDefaultFitChange,
}: {
  aspectRatio: AspectRatio;
  defaultFit: "fill" | "crop" | "fit";
  previewFile?: PendingFile;
  onAspectRatioChange: (a: AspectRatio) => void;
  onDefaultFitChange: (f: "fill" | "crop" | "fit") => void;
}) {
  const [previewUrl] = useState(() => (previewFile ? URL.createObjectURL(previewFile.file) : null));

  return (
    <div className="flex h-full flex-col p-8" style={{ minHeight: 0 }}>
      <div className="flex items-baseline justify-between" style={{ gap: 24 }}>
        <div>
          <h3 style={{ margin: "0 0 6px" }}>What shape is this video?</h3>
          <p className="text-muted" style={{ fontSize: 13.5, margin: 0, maxWidth: "56ch" }}>
            9:16 is already selected — continue without touching it if that&apos;s what you wanted.
          </p>
        </div>
        <span className="tag tag-neutral" style={{ fontFamily: "var(--font-mono)", flexShrink: 0 }}>
          {CANVAS_PX[aspectRatio]}
        </span>
      </div>

      <div className="grid grid-cols-4 gap-px" style={{ background: "var(--color-divider)", margin: "20px 0 26px" }}>
        {ASPECT_RATIOS.map((a) => {
          const selected = a.value === aspectRatio;
          return (
            <button
              key={a.value}
              onClick={() => onAspectRatioChange(a.value)}
              className="flex items-center gap-3 text-left"
              style={{
                background: selected ? "var(--color-accent-100)" : "var(--color-surface)",
                padding: 12,
                outline: selected ? "2px solid var(--color-accent)" : undefined,
                outlineOffset: -2,
              }}
            >
              <span
                style={{
                  flexShrink: 0,
                  background: selected ? "var(--color-accent)" : "var(--color-neutral-500)",
                  width: 34 * a.ratio,
                  height: 34,
                }}
              />
              <span style={{ fontSize: 12.5, fontWeight: 600 }}>
                {a.label.split(" — ")[1] ?? a.label}
                <br />
                <span style={{ font: "600 11px var(--font-mono)", color: selected ? "var(--color-accent-800)" : "color-mix(in srgb, var(--color-text) 55%, transparent)" }}>
                  {a.value}
                </span>
              </span>
            </button>
          );
        })}
      </div>

      <div className="flex items-baseline justify-between" style={{ borderTop: "2px solid var(--color-divider)", paddingTop: 14 }}>
        <h6 style={{ margin: 0 }}>Default fit — how every clip sits in the frame</h6>
        {previewFile && (
          <span className="text-muted" style={{ fontSize: 11 }}>
            Previewing {previewFile.file.name} · per-clip override lives in the editor
          </span>
        )}
      </div>

      <div className="grid grid-cols-3 gap-px" style={{ background: "var(--color-divider)", marginTop: 14, flex: 1, minHeight: 0 }}>
        {FIT_OPTIONS.map((opt) => {
          const selected = opt.value === defaultFit;
          return (
            <button
              key={opt.value}
              onClick={() => onDefaultFitChange(opt.value)}
              className="flex items-start gap-4 text-left"
              style={{
                background: selected ? "var(--color-accent-100)" : "var(--color-bg)",
                padding: 16,
                outline: selected ? "2px solid var(--color-accent)" : undefined,
                outlineOffset: -2,
              }}
            >
              <div style={{ background: "var(--color-text)", padding: 8, flexShrink: 0 }}>
                <div
                  style={{
                    width: 88,
                    aspectRatio: `${ASPECT_RATIOS.find((a) => a.value === aspectRatio)!.ratio}`,
                    position: "relative",
                    overflow: "hidden",
                    display: opt.value === "fit" ? "grid" : undefined,
                    placeItems: opt.value === "fit" ? "center" : undefined,
                  }}
                >
                  {opt.value === "fit" ? (
                    <Thumbnail url={previewUrl} kind={previewFile?.kind === "video" ? "video" : "image"} style={{ width: "100%", height: "56%", objectFit: "contain" }} />
                  ) : (
                    <Thumbnail url={previewUrl} kind={previewFile?.kind === "video" ? "video" : "image"} className="absolute inset-0" style={{ position: "absolute", inset: 0 }} />
                  )}
                </div>
              </div>
              <div>
                <div className="flex items-center gap-2" style={{ marginBottom: 6 }}>
                  <span
                    style={{
                      width: 13,
                      height: 13,
                      borderRadius: "50%",
                      border: `2px solid ${selected ? "var(--color-accent)" : "var(--color-divider)"}`,
                      background: selected ? "var(--color-accent)" : undefined,
                      boxShadow: selected ? "inset 0 0 0 2px var(--color-accent-100)" : undefined,
                      display: "inline-block",
                    }}
                  />
                  <span style={{ fontSize: 13.5, fontWeight: 600 }}>{opt.label}</span>
                  {opt.value === "fill" && (
                    <span className="tag tag-accent" style={{ fontSize: 9.5, padding: "1px 6px" }}>default</span>
                  )}
                </div>
                <p style={{ fontSize: 12, margin: 0, color: selected ? "var(--color-accent-800)" : "color-mix(in srgb, var(--color-text) 65%, transparent)" }}>
                  {opt.description}
                </p>
              </div>
            </button>
          );
        })}
      </div>

      <div style={{ marginTop: 18, borderLeft: "3px solid var(--color-accent)", background: "var(--color-accent-100)", padding: "12px 14px" }}>
        <p style={{ margin: 0, fontSize: 12, color: "var(--color-accent-800)" }}>
          Both of these stay changeable in the editor — canvas size from the header, fit per clip
          from Properties. Nothing here is a one-way door.
        </p>
      </div>
    </div>
  );
}
