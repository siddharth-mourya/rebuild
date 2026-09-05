import type { Track as TrackType } from "@/lib/timeline/types";
import ClipView from "./ClipView";
import { VideoIcon, MusicIcon, TextIcon, PlusIcon } from "@/components/icons";

const ICONS: Record<TrackType["kind"], typeof VideoIcon> = {
  video: VideoIcon,
  audio: MusicIcon,
  text: TextIcon,
};

export default function Track({
  track,
  minWidth,
  labelWidth,
  rowHeight,
  compact = false,
  onAdd,
}: {
  track: TrackType;
  minWidth: number;
  labelWidth: number;
  rowHeight: number;
  compact?: boolean;
  onAdd: () => void;
}) {
  const Icon = ICONS[track.kind];
  return (
    <div className="flex" style={{ borderBottom: "1px solid var(--color-divider)" }}>
      {compact ? (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onAdd();
          }}
          title={track.kind === "text" ? "Add a text clip" : `Add ${track.kind}`}
          className="flex shrink-0 flex-col items-center justify-center gap-0.5"
          style={{
            width: labelWidth,
            borderRight: "2px solid var(--color-divider)",
            height: rowHeight,
            position: "sticky",
            left: 0,
            zIndex: 2,
            background: "var(--color-bg)",
          }}
        >
          <Icon size={13} />
          <span style={{ font: "600 8px var(--font-mono)", color: "color-mix(in srgb, var(--color-text) 55%, transparent)" }}>
            {track.name.slice(0, 4).toUpperCase()}
          </span>
        </button>
      ) : (
        <div
          className="flex shrink-0 items-center gap-2 px-3"
          style={{
            width: labelWidth,
            borderRight: "2px solid var(--color-divider)",
            fontSize: 11,
            fontWeight: 600,
            position: "sticky",
            left: 0,
            zIndex: 2,
            background: "var(--color-bg)",
          }}
        >
          <Icon size={15} />
          <span className="flex-1 truncate">{track.name.toUpperCase()}</span>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onAdd();
            }}
            title={track.kind === "text" ? "Add a text clip" : `Add ${track.kind}`}
            className="btn btn-secondary btn-icon"
            style={{ width: 20, height: 20, flexShrink: 0 }}
          >
            <PlusIcon size={11} />
          </button>
        </div>
      )}
      <div className="relative flex-1" style={{ minWidth, height: rowHeight }}>
        {track.clips.map((clip) => (
          <ClipView key={clip.id} clip={clip} compact={compact} />
        ))}
      </div>
    </div>
  );
}
