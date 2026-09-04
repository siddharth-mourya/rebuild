"use client";

import { useEffect, useRef } from "react";
import { useEditorStore } from "@/store/editorStore";
import type { Clip } from "@/lib/timeline/types";
import { PX_PER_SEC } from "./constants";

export default function ClipView({ clip }: { clip: Clip }) {
  const selectedClipId = useEditorStore((s) => s.selectedClipId);
  const highlightedAssetId = useEditorStore((s) => s.highlightedAssetId);
  const selectClip = useEditorStore((s) => s.selectClip);
  const pushHistory = useEditorStore((s) => s.pushHistory);
  const moveClip = useEditorStore((s) => s.moveClip);
  const trimClipStart = useEditorStore((s) => s.trimClipStart);
  const trimClipEnd = useEditorStore((s) => s.trimClipEnd);
  const assets = useEditorStore((s) => s.assets);
  const asset = clip.assetId ? assets.get(clip.assetId) : undefined;
  const label = clip.text ?? asset?.name ?? "…";

  const dragRef = useRef<{ mode: "move" | "left" | "right"; startX: number; clip: Clip } | null>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  const selected = selectedClipId === clip.id;

  // A newly added or newly selected clip can land outside the timeline's visible scroll area —
  // bring it into view instead of leaving it scrolled off (which otherwise looks like it vanished).
  useEffect(() => {
    if (selected) rootRef.current?.scrollIntoView({ behavior: "smooth", inline: "nearest", block: "nearest" });
  }, [selected]);

  function onPointerDown(e: React.PointerEvent<HTMLDivElement>) {
    e.stopPropagation();
    selectClip(clip.id);
    pushHistory();
    const mode = (e.currentTarget.dataset.mode as "move" | "left" | "right") ?? "move";
    dragRef.current = { mode, startX: e.clientX, clip };
    e.currentTarget.setPointerCapture(e.pointerId);
  }

  function onPointerMove(e: React.PointerEvent) {
    const drag = dragRef.current;
    if (!drag) return;
    const dSec = (e.clientX - drag.startX) / PX_PER_SEC;

    if (drag.mode === "move") {
      moveClip(clip.id, drag.clip.timelineStart + dSec);
    } else if (drag.mode === "left") {
      trimClipStart(clip.id, drag.clip.timelineStart + dSec);
    } else {
      trimClipEnd(clip.id, drag.clip.timelineEnd + dSec);
    }
  }

  const width = Math.max(4, (clip.timelineEnd - clip.timelineStart) * PX_PER_SEC);
  const left = clip.timelineStart * PX_PER_SEC;
  const highlighted = !!highlightedAssetId && !!clip.assetId && clip.assetId === highlightedAssetId;

  return (
    <div
      ref={rootRef}
      onPointerMove={onPointerMove}
      onPointerUp={() => (dragRef.current = null)}
      style={{
        width,
        left,
        top: 6,
        bottom: 6,
        background: selected ? "var(--color-accent)" : highlighted ? "var(--color-accent-100)" : "var(--color-surface)",
        color: selected ? "var(--color-bg)" : "var(--color-text)",
        border: `1px solid ${selected || highlighted ? "var(--color-accent)" : "var(--color-divider)"}`,
      }}
      className="absolute flex items-center overflow-hidden text-[11px]"
    >
      <div
        data-mode="left"
        onPointerDown={onPointerDown}
        className="h-full shrink-0 cursor-ew-resize"
        style={{
          width: 8,
          background: selected ? "color-mix(in srgb, var(--color-bg) 90%, transparent)" : "var(--color-divider)",
          opacity: 0.8,
        }}
      />
      <div data-mode="move" onPointerDown={onPointerDown} className="min-w-0 flex-1 cursor-grab px-2.5 active:cursor-grabbing">
        <p className="truncate font-medium">{label}</p>
        {clip.muted && (
          <span className="tag tag-neutral" style={{ fontSize: 9.5, padding: "1px 6px" }}>
            muted
          </span>
        )}
      </div>
      <div
        data-mode="right"
        onPointerDown={onPointerDown}
        className="h-full shrink-0 cursor-ew-resize"
        style={{
          width: 8,
          background: selected ? "color-mix(in srgb, var(--color-bg) 90%, transparent)" : "var(--color-divider)",
          opacity: 0.8,
        }}
      />
    </div>
  );
}
