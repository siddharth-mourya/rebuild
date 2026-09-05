"use client";

import { useEditorStore } from "@/store/editorStore";
import { ASPECT_RATIOS } from "@/lib/timeline/types";

export default function AspectRatioSelect({ compact = false }: { compact?: boolean }) {
  const aspectRatio = useEditorStore((s) => s.project?.aspectRatio);
  const setAspectRatio = useEditorStore((s) => s.setAspectRatio);
  if (!aspectRatio) return null;

  return (
    <select
      value={aspectRatio}
      onChange={(e) => setAspectRatio(e.target.value as typeof aspectRatio)}
      className="btn btn-secondary"
      style={{
        fontSize: compact ? 11 : 12,
        cursor: "pointer",
        ...(compact ? { width: 60, height: 44, padding: "0 4px", textAlign: "center" } : {}),
      }}
      title="Output canvas shape"
    >
      {ASPECT_RATIOS.map((a) => (
        <option key={a.value} value={a.value}>
          {compact ? a.value : a.label}
        </option>
      ))}
    </select>
  );
}
