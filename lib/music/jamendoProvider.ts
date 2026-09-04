import type { MusicProvider, MusicTrack } from "./types";

// Free public client id — get your own at https://devportal.jamendo.com/ and set
// NEXT_PUBLIC_JAMENDO_CLIENT_ID in .env.local. Jamendo's client ids are meant for
// direct browser use (rate-limited per key, not a secret), so no backend proxy is needed.
const CLIENT_ID = process.env.NEXT_PUBLIC_JAMENDO_CLIENT_ID;
const BASE_URL = "https://api.jamendo.com/v3.0";

type JamendoTrack = {
  id: string;
  name: string;
  artist_name: string;
  album_image: string;
  audio: string;
  duration: number;
  license_ccurl: string;
};

function toMusicTrack(t: JamendoTrack): MusicTrack {
  return {
    id: `jamendo:${t.id}`,
    provider: "jamendo",
    providerTrackId: t.id,
    title: t.name,
    artist: t.artist_name,
    artworkUrl: t.album_image || undefined,
    durationSec: t.duration,
    audioUrl: t.audio,
    license: {
      attributionRequired: true,
      sourceUrl: t.license_ccurl || undefined,
    },
  };
}

export const jamendoProvider: MusicProvider = {
  id: "jamendo",
  async search(query: string): Promise<MusicTrack[]> {
    if (!CLIENT_ID) {
      throw new Error(
        "Jamendo search is unavailable — set NEXT_PUBLIC_JAMENDO_CLIENT_ID in .env.local (free key at devportal.jamendo.com)."
      );
    }
    const params = new URLSearchParams({
      client_id: CLIENT_ID,
      format: "json",
      limit: "20",
      namesearch: query,
      audioformat: "mp3",
    });
    const res = await fetch(`${BASE_URL}/tracks/?${params.toString()}`);
    if (!res.ok) throw new Error(`Jamendo search failed: ${res.status}`);
    const json = await res.json();
    const results: JamendoTrack[] = json.results ?? [];
    return results.map(toMusicTrack);
  },
};
