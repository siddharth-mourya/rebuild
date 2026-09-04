import type { Project, MediaAsset, Clip, AspectRatio } from "../timeline/types";

// Loaded lazily/client-only — @ffmpeg/ffmpeg pulls in wasm that must never touch the SSR bundle.
type FFmpegModule = typeof import("@ffmpeg/ffmpeg");
type FFmpeg = InstanceType<FFmpegModule["FFmpeg"]>;

let ffmpegSingleton: FFmpeg | null = null;
let fontWritten = false;

const CANVAS_SIZE: Record<AspectRatio, [number, number]> = {
  "9:16": [1080, 1920],
  "1:1": [1080, 1080],
  "4:5": [1080, 1350],
  "16:9": [1920, 1080],
};

export async function loadFFmpeg(onLog?: (msg: string) => void): Promise<FFmpeg> {
  if (ffmpegSingleton) return ffmpegSingleton;

  const { FFmpeg } = await import("@ffmpeg/ffmpeg");
  const { toBlobURL } = await import("@ffmpeg/util");

  const ffmpeg = new FFmpeg();
  if (onLog) ffmpeg.on("log", ({ message }) => onLog(message));

  const baseURL = "https://unpkg.com/@ffmpeg/core@0.12.6/dist/esm";
  await ffmpeg.load({
    coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, "text/javascript"),
    wasmURL: await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, "application/wasm"),
    // @ffmpeg/ffmpeg's own worker.js does `new Worker(new URL("./worker.js", import.meta.url))`,
    // which Turbopack tries to statically bundle and then trips on the dynamic `import(coreURL)`
    // inside it ("Cannot find module as expression is too dynamic"). Pointing classWorkerURL at
    // a vendored copy served from /public sidesteps the bundler entirely — the browser just
    // fetches and runs it as a plain module worker script. Fully-qualified (not root-relative)
    // because `classWorkerURL` gets resolved as `new URL(classWorkerURL, import.meta.url)`, and
    // the bundled chunk's import.meta.url isn't reliably the page origin.
    classWorkerURL: `${window.location.origin}/ffmpeg/worker.js`,
  });

  ffmpegSingleton = ffmpeg;
  return ffmpeg;
}

async function ensureFontLoaded(ffmpeg: FFmpeg): Promise<void> {
  if (fontWritten) return;
  const { fetchFile } = await import("@ffmpeg/util");
  const res = await fetch("/fonts/Archivo.ttf");
  await ffmpeg.writeFile("Archivo.ttf", await fetchFile(await res.blob()));
  fontWritten = true;
}

/** Escapes text for use inside an ffmpeg drawtext filter argument. */
function escapeDrawtext(text: string): string {
  return text.replace(/\\/g, "\\\\\\\\").replace(/:/g, "\\:").replace(/'/g, "\u2019").replace(/%/g, "\\%");
}

function hexToFfmpegColor(hex: string | undefined): string {
  if (!hex) return "white";
  return `0x${hex.replace("#", "")}`;
}

export type ExportProgress = { ratio: number; stage: string };

/**
 * Renders the project to a single MP4: for each video-track clip, mutes the source (if `muted`)
 * and overlays whichever audio-track clips overlap it in time, trimmed to their selected source range.
 * v1 assumes a single video/image track; multiple simultaneous video clips are not composited.
 */
export async function exportProject(
  project: Project,
  assets: Map<string, MediaAsset>,
  getBlob: (blobKey: string) => Promise<Blob | undefined>,
  onProgress?: (p: ExportProgress) => void
): Promise<Blob> {
  const ffmpeg = await loadFFmpeg();
  ffmpeg.on("progress", ({ progress }) => onProgress?.({ ratio: progress, stage: "encoding" }));

  const videoTrack = project.tracks.find((t) => t.kind === "video");
  const audioTracks = project.tracks.filter((t) => t.kind === "audio");
  const textTrack = project.tracks.find((t) => t.kind === "text");
  if (!videoTrack || videoTrack.clips.length === 0) {
    throw new Error("Nothing to export — add a video or image clip first.");
  }

  onProgress?.({ ratio: 0, stage: "preparing files" });
  await ensureFontLoaded(ffmpeg);

  // Write every referenced asset into ffmpeg's virtual filesystem.
  const writtenAssets = new Set<string>();
  const mediaClips = [...videoTrack.clips, ...audioTracks.flatMap((t) => t.clips)].filter(
    (c): c is Clip & { assetId: string } => !!c.assetId
  );
  for (const clip of mediaClips) {
    const asset = assets.get(clip.assetId);
    if (!asset || writtenAssets.has(asset.id)) continue;
    const blob = await getBlob(asset.blobKey);
    if (!blob) continue;
    const { fetchFile } = await import("@ffmpeg/util");
    await ffmpeg.writeFile(`${asset.id}${extFor(asset)}`, await fetchFile(blob));
    writtenAssets.add(asset.id);
  }

  // v1: render the first video-track clip as the base (mute if requested), mix in whichever
  // audio clips overlap it (trimmed + offset + volume), and write out one MP4 segment.
  const clip = videoTrack.clips[0];
  if (!clip.assetId) throw new Error("Video clip is missing its source asset");
  const asset = assets.get(clip.assetId);
  if (!asset) throw new Error("Missing source asset for video clip");
  const inputFile = `${asset.id}${extFor(asset)}`;
  const clipDuration = clip.sourceOut - clip.sourceIn;

  const overlappingAudio = audioTracks
    .flatMap((t) => t.clips)
    .filter((a) => a.assetId && a.timelineStart < clip.timelineEnd && a.timelineEnd > clip.timelineStart);

  const overlappingText = (textTrack?.clips ?? []).filter(
    (t) => t.text && t.timelineStart < clip.timelineEnd && t.timelineEnd > clip.timelineStart
  );

  const args: string[] = [];

  if (asset.kind === "image") {
    args.push("-loop", "1", "-t", String(clipDuration), "-i", inputFile);
  } else {
    args.push("-ss", String(clip.sourceIn), "-t", String(clipDuration), "-i", inputFile);
  }

  const audioInputIndexes: number[] = [];
  overlappingAudio.forEach((a, i) => {
    const audioAsset = assets.get(a.assetId!);
    if (!audioAsset) return;
    args.push("-ss", String(a.sourceIn), "-t", String(a.sourceOut - a.sourceIn), "-i", `${audioAsset.id}${extFor(audioAsset)}`);
    audioInputIndexes.push(i + 1);
  });

  onProgress?.({ ratio: 0, stage: "encoding" });

  // Crop/zoom/focus (set from the Properties panel's crop control) is baked in here so
  // preview and export agree. Only meaningful in "crop" mode, and only when the source's
  // pixel dimensions are known (captured on import).
  const zoom = clip.zoom ?? 1;
  const fit = clip.fit ?? "fill";
  const filterSteps: string[] = [];
  if (fit === "crop" && zoom > 1 && asset.width && asset.height) {
    const cropW = Math.round(asset.width / zoom);
    const cropH = Math.round(asset.height / zoom);
    const x = Math.round((clip.focusX ?? 0.5) * (asset.width - cropW));
    const y = Math.round((clip.focusY ?? 0.5) * (asset.height - cropH));
    filterSteps.push(`crop=${cropW}:${cropH}:${x}:${y},scale=${asset.width}:${asset.height}`);
  }

  // Fit the source into the project's output canvas (cover-crop, matching the always-filled
  // look of the aspect-ratio picker — Reels/Stories/Square/Portrait/Landscape).
  const [canvasW, canvasH] = CANVAS_SIZE[project.aspectRatio ?? "9:16"];
  filterSteps.push(`scale=${canvasW}:${canvasH}:force_original_aspect_ratio=increase,crop=${canvasW}:${canvasH}`);

  // Text overlays that are visible while this clip plays, positioned/timed to match the preview.
  for (const t of overlappingText) {
    const enableStart = Math.max(0, t.timelineStart - clip.timelineStart);
    const enableEnd = Math.min(clipDuration, t.timelineEnd - clip.timelineStart);
    const fontSize = t.fontSize ?? 32;
    const color = hexToFfmpegColor(t.textColor);
    const xFrac = t.x ?? 0.5;
    const yFrac = t.y ?? 0.8;
    filterSteps.push(
      `drawtext=fontfile=Archivo.ttf:text='${escapeDrawtext(t.text ?? "")}':fontsize=${fontSize}:fontcolor=${color}:` +
        `x=(w*${xFrac})-(text_w/2):y=(h*${yFrac})-(text_h/2):enable='between(t,${enableStart},${enableEnd})'`
    );
  }

  const videoFilter = filterSteps.join(",");
  const filterParts = [`[0:v]${videoFilter}[vout]`];
  if (audioInputIndexes.length > 0) {
    audioInputIndexes.forEach((idx, i) => {
      const a = overlappingAudio[i];
      const vol = a.volume ?? 1;
      const fadeIn = a.fadeInSec ? `,afade=t=in:st=0:d=${a.fadeInSec}` : "";
      const fadeOut = a.fadeOutSec ? `,afade=t=out:st=${clipDuration - a.fadeOutSec}:d=${a.fadeOutSec}` : "";
      filterParts.push(`[${idx}:a]volume=${vol}${fadeIn}${fadeOut}[a${i}]`);
    });
    const mixInputs = audioInputIndexes.map((_, i) => `[a${i}]`).join("");
    filterParts.push(`${mixInputs}amix=inputs=${audioInputIndexes.length}:duration=first[aout]`);
    args.push("-filter_complex", filterParts.join(";"), "-map", "[vout]", "-map", "[aout]");
  } else {
    args.push("-filter_complex", filterParts.join(";"), "-map", "[vout]");
    if (clip.muted || asset.kind === "image") args.push("-an");
    else args.push("-map", "0:a?");
  }

  args.push("-c:v", "libx264", "-pix_fmt", "yuv420p", "-shortest", "output.mp4");

  await ffmpeg.exec(args);
  const data = await ffmpeg.readFile("output.mp4");
  onProgress?.({ ratio: 1, stage: "done" });

  return new Blob([new Uint8Array(data as Uint8Array)], { type: "video/mp4" });
}

function extFor(asset: MediaAsset): string {
  const fromName = asset.name.match(/\.[a-zA-Z0-9]+$/)?.[0];
  if (fromName) return fromName;
  if (asset.kind === "image") return ".png";
  if (asset.kind === "audio") return ".mp3";
  return ".mp4";
}
