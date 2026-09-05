const STEPS = [
  { n: 1, label: "Upload" },
  { n: 2, label: "Review" },
  { n: 3, label: "Canvas" },
  { n: 4, label: "Music", optional: true },
];

export default function WizardHeader({
  step,
  onSkip,
  skipping,
}: {
  step: number;
  onSkip: () => void;
  skipping: boolean;
}) {
  return (
    <div className="shrink-0">
      <div className="nav">
        <span className="nav-brand">
          EDIT<span style={{ color: "var(--color-accent)" }}>.</span>
        </span>
        <span className="ml-auto flex items-center gap-3.5" style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 14 }}>
          <span className="text-muted" style={{ fontSize: 11 }}>
            Nothing is saved until you finish
          </span>
          <button onClick={onSkip} disabled={skipping} className="btn btn-ghost" style={{ fontSize: 12 }}>
            {skipping ? "Creating…" : "Skip, start blank"}
          </button>
        </span>
      </div>
      <div className="grid grid-cols-4" style={{ borderBottom: "2px solid var(--color-divider)" }}>
        {STEPS.map((s) => {
          const active = s.n === step;
          const done = s.n < step;
          return (
            <div
              key={s.n}
              className="flex items-center gap-2.5"
              style={{
                padding: "12px 16px",
                borderLeft: s.n > 1 ? "1px solid var(--color-divider)" : undefined,
                background: active ? "var(--color-text)" : undefined,
                color: active ? "var(--color-bg)" : done ? "var(--color-accent-700)" : "color-mix(in srgb, var(--color-text) 45%, transparent)",
              }}
            >
              <span
                style={{
                  font: "600 10px var(--font-mono)",
                  padding: "2px 6px",
                  border: "1px solid currentColor",
                  background: done ? "var(--color-accent)" : undefined,
                  color: done ? "var(--color-bg)" : undefined,
                  borderColor: done ? "var(--color-accent)" : undefined,
                }}
              >
                {s.n}
              </span>
              <span style={{ fontFamily: "var(--font-heading)", fontWeight: 800, fontSize: 12, letterSpacing: "0.06em", textTransform: "uppercase" }}>
                {s.label}
              </span>
              {s.optional && (
                <span className="tag tag-outline" style={{ fontSize: 9.5, padding: "1px 6px", borderColor: "currentColor", color: "inherit" }}>
                  optional
                </span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
