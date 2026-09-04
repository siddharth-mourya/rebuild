/**
 * The editor owns this shape — it never depends on a provider's raw API response.
 * This makes it possible to add another provider later (or swap Jamendo out)
 * without touching the UI or timeline code.
 */
export type MusicTrack = {
  id: string;
  provider: "jamendo" | "upload";
  providerTrackId?: string;

  title: string;
  artist?: string;
  artworkUrl?: string;
  durationSec: number;

  /** streamable URL for preview + for pulling the audio into the timeline */
  audioUrl: string;

  license: {
    type?: string;
    attributionRequired: boolean;
    sourceUrl?: string;
  };
};

export interface MusicProvider {
  readonly id: MusicTrack["provider"];
  search(query: string): Promise<MusicTrack[]>;
}
