"use client";

import { useEditorStore } from "@/store/editorStore";
import Track from "./Track";
import Playhead from "./Playhead";
import Ruler from "./Ruler";
import { PX_PER_SEC, LABEL_WIDTH, COMPACT_LABEL_WIDTH, ROW_HEIGHT, COMPACT_ROW_HEIGHT } from "./constants";

export default function Timeline({
  onRequestAdd,
  compact = false,
}: {
  onRequestAdd: (trackKind: "video" | "audio" | "text") => void;
  /** Mobile mode: narrower track-label column and shorter rows so more of the timeline fits on screen. */
  compact?: boolean;
}) {
  const project = useEditorStore((s) => s.project);
  const playheadSec = useEditorStore((s) => s.playheadSec);
  const setPlayhead = useEditorStore((s) => s.setPlayhead);

  if (!project) return null;

  const labelWidth = compact ? COMPACT_LABEL_WIDTH : LABEL_WIDTH;
  const rowHeight = compact ? COMPACT_ROW_HEIGHT : ROW_HEIGHT;
  const width = Math.max(600, project.durationSec * PX_PER_SEC + 200);

  function onClick(e: React.MouseEvent) {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left - labelWidth;
    setPlayhead(Math.max(0, x / PX_PER_SEC));
  }

  return (
    <div onClick={onClick} className="relative" style={{ width, background: "var(--color-bg)" }}>
      <Ruler durationSec={project.durationSec} labelWidth={labelWidth} />
      <Playhead sec={playheadSec} labelWidth={labelWidth} />
      {project.tracks.map((track) => (
        <Track
          key={track.id}
          track={track}
          minWidth={width - labelWidth}
          labelWidth={labelWidth}
          rowHeight={rowHeight}
          compact={compact}
          onAdd={() => onRequestAdd(track.kind)}
        />
      ))}
    </div>
  );
}
