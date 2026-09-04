import { PX_PER_SEC, LABEL_WIDTH } from "./constants";

const TICK_INTERVAL_SEC = 5;

function fmt(sec: number): string {
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60).toString().padStart(2, "0");
  return `${m}:${s}`;
}

export default function Ruler({ durationSec }: { durationSec: number }) {
  const tickCount = Math.ceil(durationSec / TICK_INTERVAL_SEC) + 4; // pad a few extra ticks past the last clip
  const ticks = Array.from({ length: tickCount }, (_, i) => i * TICK_INTERVAL_SEC);

  return (
    <div className="flex" style={{ borderBottom: "1px solid var(--color-divider)" }}>
      <div
        className="shrink-0"
        style={{
          width: LABEL_WIDTH,
          borderRight: "2px solid var(--color-divider)",
          padding: "5px 12px",
          font: "600 10px var(--font-mono)",
          letterSpacing: "0.06em",
          color: "color-mix(in srgb, var(--color-text) 50%, transparent)",
        }}
      >
        TRACKS
      </div>
      <div className="relative flex-1" style={{ height: 26 }}>
        {ticks.map((t) => (
          <span
            key={t}
            className="absolute"
            style={{
              left: t * PX_PER_SEC,
              top: 5,
              paddingLeft: 4,
              borderLeft: t > 0 ? "1px solid var(--color-divider)" : undefined,
              font: "600 10px var(--font-mono)",
              color: "color-mix(in srgb, var(--color-text) 50%, transparent)",
            }}
          >
            {fmt(t)}
          </span>
        ))}
      </div>
    </div>
  );
}
