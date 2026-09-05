import type { MediaKind, AspectRatio } from "@/lib/timeline/types";
import type { MusicTrack } from "@/lib/music/types";

export type PendingFile = {
  id: string;
  file: File;
  kind: MediaKind;
  durationSec?: number;
  width?: number;
  height?: number;
  status: "reading" | "ready";
};

export type MusicSelection =
  | { kind: "track"; track: MusicTrack; sourceIn: number; sourceOut: number }
  | { kind: "upload"; file: PendingFile };

export type WizardState = {
  files: PendingFile[]; // everything from step 1, unified
  order: string[]; // PendingFile ids for visual (image/video) files, in track order
  aspectRatio: AspectRatio;
  defaultFit: "fill" | "crop" | "fit";
  music: MusicSelection | null;
};
