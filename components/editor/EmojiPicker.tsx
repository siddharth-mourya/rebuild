"use client";

import { useState } from "react";

// Plain Unicode emoji — rendered by the OS/browser's own font, no image assets or downloads needed.
const EMOJI = [
  "😀", "😂", "😍", "🥳", "😎", "🔥", "💯", "❤️", "💕", "👍",
  "👏", "🙌", "✨", "🎉", "🌟", "☀️", "🌈", "🎬", "🎵", "📸",
  "💡", "😢", "😮", "🤔", "😴", "🥰", "😅", "🤩", "🙏", "💪",
  "👀", "🚀", "⭐", "🏆", "🎈", "🍕", "☕", "🐶", "🌸", "💥",
];

export default function EmojiPicker({ onSelect }: { onSelect: (emoji: string) => void }) {
  const [open, setOpen] = useState(false);

  return (
    <div style={{ position: "relative" }}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="btn btn-secondary btn-icon"
        style={{ width: 32, height: 32 }}
        title="Insert emoji"
      >
        <span style={{ fontSize: 15, lineHeight: 1 }}>🙂</span>
      </button>
      {open && (
        <>
          <div className="fixed inset-0" style={{ zIndex: 19 }} onClick={() => setOpen(false)} />
          <div
            className="elev-md"
            style={{
              position: "absolute",
              top: "110%",
              left: 0,
              zIndex: 20,
              width: 224,
              display: "grid",
              gridTemplateColumns: "repeat(6, 1fr)",
              gap: 2,
              padding: 8,
              background: "var(--color-bg)",
              border: "1px solid var(--color-divider)",
            }}
          >
            {EMOJI.map((e) => (
              <button
                key={e}
                type="button"
                onClick={() => {
                  onSelect(e);
                  setOpen(false);
                }}
                style={{ fontSize: 18, background: "none", border: 0, cursor: "pointer", padding: 4, lineHeight: 1 }}
              >
                {e}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
