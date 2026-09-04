import { PX_PER_SEC, LABEL_WIDTH } from "./constants";

export default function Playhead({ sec }: { sec: number }) {
  return (
    <div
      className="pointer-events-none absolute top-0 bottom-0 z-10"
      style={{ left: LABEL_WIDTH + sec * PX_PER_SEC, width: 2, background: "var(--color-accent)" }}
    >
      <span
        className="absolute"
        style={{
          top: -1,
          left: -5,
          width: 12,
          height: 12,
          background: "var(--color-accent)",
          clipPath: "polygon(0 0, 100% 0, 50% 100%)",
        }}
      />
    </div>
  );
}
