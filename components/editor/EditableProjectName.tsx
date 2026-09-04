"use client";

import { useRef, useState } from "react";
import { useEditorStore } from "@/store/editorStore";

export default function EditableProjectName({ name }: { name: string }) {
  const renameProject = useEditorStore((s) => s.renameProject);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(name);
  const inputRef = useRef<HTMLInputElement>(null);

  function commit() {
    setEditing(false);
    renameProject(draft);
  }

  const sharedStyle: React.CSSProperties = {
    fontFamily: "var(--font-heading)",
    fontWeight: 800,
    fontSize: 15,
  };

  if (editing) {
    return (
      <input
        ref={inputRef}
        value={draft}
        autoFocus
        onChange={(e) => setDraft(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            commit();
          } else if (e.key === "Escape") {
            setDraft(name);
            setEditing(false);
          }
        }}
        onFocus={(e) => e.currentTarget.select()}
        style={{
          ...sharedStyle,
          background: "transparent",
          border: 0,
          borderBottom: "1px solid var(--color-accent)",
          outline: "none",
          padding: 0,
          minWidth: 120,
        }}
      />
    );
  }

  return (
    <button
      onClick={() => {
        setDraft(name);
        setEditing(true);
      }}
      title="Click to rename"
      style={{
        ...sharedStyle,
        background: "none",
        border: "1px solid transparent",
        borderBottom: "1px solid transparent",
        padding: 0,
        cursor: "text",
        color: "inherit",
      }}
      onMouseEnter={(e) => (e.currentTarget.style.borderBottomColor = "var(--color-divider)")}
      onMouseLeave={(e) => (e.currentTarget.style.borderBottomColor = "transparent")}
    >
      {name}
    </button>
  );
}
