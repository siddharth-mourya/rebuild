"use client";

import { useEffect, useRef, useState } from "react";
import { useEditorStore } from "@/store/editorStore";
import { useAssetObjectUrl } from "@/lib/storage/useAssetObjectUrl";
import { effectiveVolume, AudioMixer } from "@/lib/audio/audioEngine";
import type { Clip } from "@/lib/timeline/types";

function activeClip(clips: Clip[], t: number): Clip | undefined {
  return clips.find((c) => t >= c.timelineStart && t < c.timelineEnd);
}

/** A freshly-loaded, paused <video> shows nothing until a frame is actually decoded — nudge it
 * to render one instead of staying blank until the user hits play. */
function nudgeFirstFrame(e: React.SyntheticEvent<HTMLVideoElement>) {
  const el = e.currentTarget;
  if (el.currentTime === 0) el.currentTime = 0.01;
}

function clipFrameStyle(clip: Clip): React.CSSProperties {
  const fit = clip.fit ?? "fill";
  if (fit === "fit") return { objectFit: "contain", position: "relative" };
  const focusX = (clip.focusX ?? 0.5) * 100;
  const focusY = (clip.focusY ?? 0.5) * 100;
  return {
    objectFit: "cover",
    objectPosition: `${focusX}% ${focusY}%`,
    transform: `scale(${clip.zoom ?? 1})`,
    transformOrigin: `${focusX}% ${focusY}%`,
  };
}

/** Fills the letterboxed space in "fit" mode with the same source, cover-cropped and dimmed —
 * matching how photo-editing crop tools (e.g. Lightroom) show the trimmed-away area darkened
 * rather than as flat black bars. A fixed black scrim on top (not just a brightness filter) so
 * the dimming reads clearly regardless of how bright or dark the source image already is. */
const DIMMED_BACKGROUND_STYLE: React.CSSProperties = {
  position: "absolute",
  inset: 0,
  width: "100%",
  height: "100%",
  objectFit: "cover",
};
const DIMMED_BACKGROUND_SCRIM: React.CSSProperties = {
  position: "absolute",
  inset: 0,
  background: "rgba(0, 0, 0, 0.6)",
};

function aspectRatioCss(ratio: string): string {
  const [w, h] = ratio.split(":");
  return `${w} / ${h}`;
}

export default function PreviewPlayer() {
  const project = useEditorStore((s) => s.project);
  const playheadSec = useEditorStore((s) => s.playheadSec);
  const isPlaying = useEditorStore((s) => s.isPlaying);
  const setPlayhead = useEditorStore((s) => s.setPlayhead);
  const setIsPlaying = useEditorStore((s) => s.setIsPlaying);
  const selectClip = useEditorStore((s) => s.selectClip);
  const updateClip = useEditorStore((s) => s.updateClip);

  const videoTrack = project?.tracks.find((t) => t.kind === "video");
  const audioTracks = project?.tracks.filter((t) => t.kind === "audio") ?? [];
  const textTrack = project?.tracks.find((t) => t.kind === "text");

  const videoClip = videoTrack ? activeClip(videoTrack.clips, playheadSec) : undefined;
  const audioClips = audioTracks.map((t) => activeClip(t.clips, playheadSec)).filter(Boolean) as Clip[];
  const textClip = textTrack ? activeClip(textTrack.clips, playheadSec) : undefined;

  const assets = useEditorStore((s) => s.assets);
  const asset = videoClip?.assetId ? assets.get(videoClip.assetId) : undefined;
  const videoUrl = useAssetObjectUrl(videoClip?.assetId);

  const videoRef = useRef<HTMLVideoElement>(null);
  const bgVideoRef = useRef<HTMLVideoElement>(null);
  const frameRef = useRef<HTMLDivElement>(null);
  const isFitMode = (videoClip?.fit ?? "fill") === "fit";
  const [mixer] = useState(() => new AudioMixer());
  const textDragRef = useRef<{ clipId: string; pointerId: number } | null>(null);

  // rAF-driven playhead clock while playing.
  useEffect(() => {
    if (!isPlaying || !project) return;
    let last = performance.now();
    let raf = 0;
    const tick = (now: number) => {
      const dt = (now - last) / 1000;
      last = now;
      const next = useEditorStore.getState().playheadSec + dt;
      if (next >= project.durationSec) {
        setPlayhead(0);
        setIsPlaying(false);
        return;
      }
      setPlayhead(next);
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [isPlaying, project, setPlayhead, setIsPlaying]);

  // Keep the video element's currentTime + mute state in sync with the active clip. The dimmed
  // background copy (fit mode only) mirrors the same time/play state but stays permanently muted.
  useEffect(() => {
    const el = videoRef.current;
    if (!el || !videoClip) return;
    const localTime = videoClip.sourceIn + (playheadSec - videoClip.timelineStart);
    if (Math.abs(el.currentTime - localTime) > 0.25) el.currentTime = localTime;
    el.muted = !!videoClip.muted;
    if (isPlaying) el.play().catch(() => {});
    else el.pause();

    const bgEl = bgVideoRef.current;
    if (bgEl) {
      if (Math.abs(bgEl.currentTime - localTime) > 0.25) bgEl.currentTime = localTime;
      bgEl.muted = true;
      if (isPlaying) bgEl.play().catch(() => {});
      else bgEl.pause();
    }
  }, [videoClip, playheadSec, isPlaying]);

  function onTextPointerDown(e: React.PointerEvent, clipId: string) {
    e.stopPropagation();
    selectClip(clipId);
    textDragRef.current = { clipId, pointerId: e.pointerId };
    (e.target as Element).setPointerCapture(e.pointerId);
  }

  function onTextPointerMove(e: React.PointerEvent) {
    const drag = textDragRef.current;
    if (!drag) return;
    const rect = frameRef.current?.getBoundingClientRect();
    if (!rect) return;
    const x = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    const y = Math.max(0, Math.min(1, (e.clientY - rect.top) / rect.height));
    updateClip(drag.clipId, { x, y });
  }

  return (
    <div className="relative flex h-full w-full items-center justify-center p-8">
      <span
        className="absolute left-4 top-3"
        style={{ font: "600 10px var(--font-mono)", letterSpacing: "0.08em", color: "color-mix(in srgb, var(--color-bg) 55%, transparent)" }}
      >
        PREVIEW
      </span>
      <div
        ref={frameRef}
        onPointerMove={onTextPointerMove}
        onPointerUp={() => (textDragRef.current = null)}
        className="relative overflow-hidden"
        style={{
          aspectRatio: aspectRatioCss(project?.aspectRatio ?? "9:16"),
          maxWidth: "100%",
          maxHeight: "100%",
          width: "auto",
          height: "auto",
          outline: "2px solid color-mix(in srgb, var(--color-bg) 35%, transparent)",
        }}
      >
        {videoClip && asset?.kind === "image" && videoUrl && (
          <>
            {isFitMode && (
              <>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={videoUrl} alt="" style={DIMMED_BACKGROUND_STYLE} />
                <div style={DIMMED_BACKGROUND_SCRIM} />
              </>
            )}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={videoUrl} alt="" className="h-full w-full" style={clipFrameStyle(videoClip)} />
          </>
        )}
        {videoClip && asset?.kind === "video" && videoUrl && (
          <>
            {isFitMode && (
              <>
                <video ref={bgVideoRef} src={videoUrl} style={DIMMED_BACKGROUND_STYLE} playsInline muted onLoadedData={nudgeFirstFrame} />
                <div style={DIMMED_BACKGROUND_SCRIM} />
              </>
            )}
            <video
              ref={videoRef}
              src={videoUrl}
              className="h-full w-full"
              style={clipFrameStyle(videoClip)}
              playsInline
              onLoadedData={nudgeFirstFrame}
            />
          </>
        )}
        {!videoClip && (
          <div className="flex h-full w-full items-center justify-center">
            <p style={{ color: "color-mix(in srgb, var(--color-bg) 55%, transparent)", fontSize: 13 }}>Nothing to preview yet</p>
          </div>
        )}

        {textClip && (
          <div
            onPointerDown={(e) => onTextPointerDown(e, textClip.id)}
            className="absolute cursor-move select-none"
            style={{
              left: `${(textClip.x ?? 0.5) * 100}%`,
              top: `${(textClip.y ?? 0.8) * 100}%`,
              transform: "translate(-50%, -50%)",
              color: textClip.textColor ?? "#ffffff",
              fontSize: textClip.fontSize ?? 32,
              fontFamily: "var(--font-heading)",
              fontWeight: textClip.bold ? 800 : 400,
              fontStyle: textClip.italic ? "italic" : "normal",
              textAlign: "center",
              maxWidth: "90%",
              textShadow: textClip.highlightColor ? undefined : "0 1px 4px rgba(0,0,0,0.5)",
              whiteSpace: "pre-wrap",
              opacity: textClip.opacity ?? 1,
              background: textClip.highlightColor,
              padding: textClip.highlightColor ? "0.15em 0.35em" : undefined,
            }}
          >
            {textClip.text}
          </div>
        )}

        {audioClips.map((clip) => (
          <HiddenAudioClip key={clip.id} clip={clip} playheadSec={playheadSec} isPlaying={isPlaying} mixer={mixer} />
        ))}
      </div>
    </div>
  );
}

function HiddenAudioClip({
  clip,
  playheadSec,
  isPlaying,
  mixer,
}: {
  clip: Clip;
  playheadSec: number;
  isPlaying: boolean;
  mixer: AudioMixer;
}) {
  const url = useAssetObjectUrl(clip.assetId);
  const ref = useRef<HTMLAudioElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el || !url) return;
    const localTime = clip.sourceIn + (playheadSec - clip.timelineStart);
    if (Math.abs(el.currentTime - localTime) > 0.25) el.currentTime = localTime;
    mixer.register(clip.id, el);
    mixer.setVolume(clip.id, effectiveVolume(clip, playheadSec - clip.timelineStart));
    if (isPlaying) {
      mixer.resume();
      el.play().catch(() => {});
    } else {
      el.pause();
    }
  }, [clip, url, playheadSec, isPlaying, mixer]);

  if (!url) return null;
  return <audio ref={ref} src={url} className="hidden" />;
}
