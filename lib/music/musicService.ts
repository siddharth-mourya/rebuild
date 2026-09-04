import { jamendoProvider } from "./jamendoProvider";
import type { MusicProvider, MusicTrack } from "./types";

const providers: MusicProvider[] = [jamendoProvider];

/** Single entry point the UI calls — never talks to a provider module directly. */
export async function searchMusic(query: string): Promise<MusicTrack[]> {
  const results = await Promise.allSettled(providers.map((p) => p.search(query)));
  const tracks = results.flatMap((r) => (r.status === "fulfilled" ? r.value : []));

  // Surface a provider failure instead of silently returning zero results — otherwise
  // a misconfigured/missing API key looks indistinguishable from "no matches found".
  if (tracks.length === 0) {
    const failure = results.find((r): r is PromiseRejectedResult => r.status === "rejected");
    if (failure) {
      throw failure.reason instanceof Error ? failure.reason : new Error(String(failure.reason));
    }
  }

  return tracks;
}

export type { MusicTrack };
