"use client";

import { useEffect, useRef, useState } from "react";
import { useEditorStore } from "@/store/editorStore";
import { useAssetObjectUrl } from "@/lib/storage/useAssetObjectUrl";
import { effectiveVolume, AudioMixer } from "@/lib/audio/audioEngine";
import type { Clip } from "@/lib/timeline/types";

function activeClip(clips: Clip[], t: number): Clip | undefined {
  return clips.find((c) => t >= c.timelineStart && t < c.timelineEnd);
}

function clipFrameStyle(clip: Clip): React.CSSProperties {
  const fit = clip.fit ?? "fill";
  if (fit === "fit") return { objectFit: "contain" };
  const focusX = (clip.focusX ?? 0.5) * 100;
  const focusY = (clip.focusY ?? 0.5) * 100;
  return {
    objectFit: "cover",
    objectPosition: `${focusX}% ${focusY}%`,
    transform: `scale(${clip.zoom ?? 1})`,
    transformOrigin: `${focusX}% ${focusY}%`,
  };
}

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
  const frameRef = useRef<HTMLDivElement>(null);
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

  // Keep the video element's currentTime + mute state in sync with the active clip.
  useEffect(() => {
    const el = videoRef.current;
    if (!el || !videoClip) return;
    const localTime = videoClip.sourceIn + (playheadSec - videoClip.timelineStart);
    if (Math.abs(el.currentTime - localTime) > 0.25) el.currentTime = localTime;
    el.muted = !!videoClip.muted;
    if (isPlaying) el.play().catch(() => {});
    else el.pause();
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
          // eslint-disable-next-line @next/next/no-img-element
          <img src={videoUrl} alt="" className="h-full w-full" style={clipFrameStyle(videoClip)} />
        )}
        {videoClip && asset?.kind === "video" && videoUrl && (
          <video ref={videoRef} src={videoUrl} className="h-full w-full" style={clipFrameStyle(videoClip)} playsInline />
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
              fontWeight: 800,
              textAlign: "center",
              maxWidth: "90%",
              textShadow: "0 1px 4px rgba(0,0,0,0.5)",
              whiteSpace: "pre-wrap",
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
