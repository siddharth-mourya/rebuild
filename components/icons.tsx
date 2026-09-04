// Icon set matching the Modernist mockup exactly (same path data), kept as small
// reusable components instead of re-declaring the SVG boilerplate at every call site.

type IconProps = { size?: number; className?: string };

function base(d: string, { size = 14, className }: IconProps, fill = false) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill={fill ? "currentColor" : "none"}
      stroke={fill ? undefined : "currentColor"}
      strokeWidth={fill ? undefined : 2}
      className={className}
    >
      <path d={d} />
    </svg>
  );
}

export const BackIcon = (p: IconProps) => base("M19 12H5M12 19l-7-7 7-7", p);
export const UploadIcon = (p: IconProps) => base("M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M17 8l-5-5-5 5M12 3v12", p);
export const MusicIcon = (p: IconProps) =>
  base("M9 18V5l12-2v13M9 18a3 3 0 1 1-6 0 3 3 0 0 1 6 0zM21 16a3 3 0 1 1-6 0 3 3 0 0 1 6 0z", p);
export const MicIcon = (p: IconProps) =>
  base("M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3zM19 10v2a7 7 0 0 1-14 0v-2M12 19v3", p);
export const SfxIcon = (p: IconProps) =>
  base("M11 5 6 9H2v6h4l5 4V5zM19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07", p);
export const VideoIcon = (p: IconProps) => base("M2 4h20v16H2zM7 4v16M17 4v16M2 12h20", p);
export const TextIcon = (p: IconProps) => base("M4 7V4h16v3M9 20h6M12 4v16", p);
export const PlayIcon = (p: IconProps) => base("M6 4l14 8-14 8z", p, true);
export const ExportIcon = (p: IconProps) => base("M12 3v12M7 10l5 5 5-5M5 21h14", p);
export const SplitIcon = (p: IconProps) => base("M12 3v18M7 8l5-5 5 5M7 16l5 5 5-5", p);
export const CropIcon = (p: IconProps) => base("M6 2v14a2 2 0 0 0 2 2h14M18 22V8a2 2 0 0 0-2-2H2", p);
export const TrashIcon = (p: IconProps) => base("M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6", p);
export const PlusIcon = (p: IconProps) => base("M12 5v14M5 12h14", p);
export const UndoIcon = (p: IconProps) => base("M9 14 4 9l5-5M4 9h10a6 6 0 0 1 0 12h-3", p);
export const RedoIcon = (p: IconProps) => base("M15 14l5-5-5-5M20 9H10a6 6 0 0 0 0 12h3", p);
