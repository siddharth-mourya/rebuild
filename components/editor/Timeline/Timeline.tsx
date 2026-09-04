"use client";

import { useEditorStore } from "@/store/editorStore";
import Track from "./Track";
import Playhead from "./Playhead";
import Ruler from "./Ruler";
import { PX_PER_SEC, LABEL_WIDTH } from "./constants";

export default function Timeline({ onRequestAdd }: { onRequestAdd: (trackKind: "video" | "audio" | "text") => void }) {
  const project = useEditorStore((s) => s.project);
  const playheadSec = useEditorStore((s) => s.playheadSec);
  const setPlayhead = useEditorStore((s) => s.setPlayhead);

  if (!project) return null;

  const width = Math.max(600, project.durationSec * PX_PER_SEC + 200);

  function onClick(e: React.MouseEvent) {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left - LABEL_WIDTH;
    setPlayhead(Math.max(0, x / PX_PER_SEC));
  }

  return (
    <div onClick={onClick} className="relative" style={{ width, background: "var(--color-bg)" }}>
      <Ruler durationSec={project.durationSec} />
      <Playhead sec={playheadSec} />
      {project.tracks.map((track) => (
        <Track key={track.id} track={track} minWidth={width - LABEL_WIDTH} onAdd={() => onRequestAdd(track.kind)} />
      ))}
    </div>
  );
}
