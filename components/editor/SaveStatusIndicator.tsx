"use client";

import { useEditorStore } from "@/store/editorStore";

const LABEL: Record<string, string> = {
  idle: "",
  saving: "Saving…",
  saved: "Saved",
  error: "Couldn't save",
};

export default function SaveStatusIndicator() {
  const status = useEditorStore((s) => s.saveStatus);
  if (!LABEL[status]) return <span style={{ width: 64 }} />;
  return (
    <span
      className="flex items-center gap-1.5"
      style={{ fontSize: 12, color: status === "error" ? "var(--color-accent)" : "color-mix(in srgb, var(--color-text) 55%, transparent)" }}
    >
      {status === "saved" && <span style={{ width: 7, height: 7, background: "var(--color-accent)" }} />}
      {LABEL[status]}
    </span>
  );
}
