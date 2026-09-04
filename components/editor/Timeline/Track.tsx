import type { Track as TrackType } from "@/lib/timeline/types";
import ClipView from "./ClipView";
import { LABEL_WIDTH } from "./constants";
import { VideoIcon, MusicIcon, TextIcon, PlusIcon } from "@/components/icons";

const ICONS: Record<TrackType["kind"], typeof VideoIcon> = {
  video: VideoIcon,
  audio: MusicIcon,
  text: TextIcon,
};

export default function Track({
  track,
  minWidth,
  onAdd,
}: {
  track: TrackType;
  minWidth: number;
  onAdd: () => void;
}) {
  const Icon = ICONS[track.kind];
  return (
    <div className="flex" style={{ borderBottom: "1px solid var(--color-divider)" }}>
      <div
        className="flex shrink-0 items-center gap-2 px-3"
        style={{ width: LABEL_WIDTH, borderRight: "2px solid var(--color-divider)", fontSize: 11, fontWeight: 600 }}
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
      <div className="relative h-14 flex-1" style={{ minWidth }}>
        {track.clips.map((clip) => (
          <ClipView key={clip.id} clip={clip} />
        ))}
      </div>
    </div>
  );
}
