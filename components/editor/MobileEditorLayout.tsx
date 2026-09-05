"use client";

import { useEffect, useRef, useState } from "react";
import { useEditorStore } from "@/store/editorStore";
import type { MediaAsset } from "@/lib/timeline/types";
import PreviewPlayer from "./PreviewPlayer";
import Timeline from "./Timeline/Timeline";
import MediaLibrary from "./MediaLibrary";
import MusicSearch from "./MusicLibrary/MusicSearch";
import PropertiesPanel from "./PropertiesPanel";
import { PlayIcon, SplitIcon, TrashIcon, VideoIcon, UploadIcon, MusicIcon, TextIcon } from "@/components/icons";
import AspectRatioSelect from "./AspectRatioSelect";

type MobileTab = "timeline" | "media" | "music" | "text" | "clip";

function fmt(sec: number): string {
  const m = Math.floor(sec / 60);
  const s = (sec % 60).toFixed(1).padStart(4, "0");
  return `${m}:${s}`;
}

const TABS: { id: MobileTab; label: string; Icon: typeof VideoIcon }[] = [
  { id: "timeline", label: "TIMELINE", Icon: VideoIcon },
  { id: "media", label: "MEDIA", Icon: UploadIcon },
  { id: "music", label: "MUSIC", Icon: MusicIcon },
  { id: "text", label: "TEXT", Icon: TextIcon },
  { id: "clip", label: "CLIP", Icon: SplitIcon },
];

export default function MobileEditorLayout({
  projectId,
  onAddAsset,
}: {
  projectId: string;
  onAddAsset: (asset: MediaAsset, range?: { sourceIn: number; sourceOut: number }) => void;
}) {
  const [tab, setTab] = useState<MobileTab>("timeline");
  const project = useEditorStore((s) => s.project);
  const selectedClipId = useEditorStore((s) => s.selectedClipId);
  const playheadSec = useEditorStore((s) => s.playheadSec);
  const isPlaying = useEditorStore((s) => s.isPlaying);
  const setIsPlaying = useEditorStore((s) => s.setIsPlaying);
  const splitClip = useEditorStore((s) => s.splitClip);
  const removeClip = useEditorStore((s) => s.removeClip);
  const addTextClip = useEditorStore((s) => s.addTextClip);

  const selectedTrack = project?.tracks.find((t) => t.clips.some((c) => c.id === selectedClipId));

  // Tapping a clip while on the Timeline tab should show its properties immediately, not require
  // a second manual tap on the Clip tab. Only does this from the Timeline tab itself — selecting
  // a clip as a side effect of adding media (from the Media/Music tab) shouldn't yank focus away.
  const tabRef = useRef(tab);
  useEffect(() => {
    tabRef.current = tab;
  }, [tab]);
  useEffect(() => {
    if (selectedClipId && tabRef.current === "timeline") setTab("clip");
  }, [selectedClipId]);

  function onRequestAdd(trackKind: "video" | "audio" | "text") {
    if (trackKind === "text") {
      addTextClip(playheadSec);
      setTab("clip");
    } else {
      setTab(trackKind === "audio" ? "music" : "media");
    }
  }

  return (
    <div className="flex h-full flex-col overflow-hidden">
      <div className="relative shrink-0" style={{ background: "var(--color-text)", height: "36vh", minHeight: 200 }}>
        <PreviewPlayer />
      </div>

      <div
        className="flex shrink-0 items-center gap-3 px-3 py-2"
        style={{ borderBottom: "2px solid var(--color-divider)" }}
      >
        <button
          onClick={() => setIsPlaying(!isPlaying)}
          className="btn btn-primary btn-icon"
          style={{ width: 44, height: 44 }}
          aria-label="Play"
        >
          {isPlaying ? (
            <span style={{ width: 12, height: 12, background: "var(--color-bg)", display: "block" }} />
          ) : (
            <PlayIcon size={16} />
          )}
        </button>
        <span style={{ font: "600 13px var(--font-mono)" }}>
          {fmt(playheadSec)}
          <span className="text-muted"> / {fmt(project?.durationSec ?? 0)}</span>
        </span>
        <div className="ml-auto flex gap-2">
          <AspectRatioSelect compact />
          <button
            disabled={!selectedClipId}
            onClick={() => selectedClipId && splitClip(selectedClipId, playheadSec)}
            className="btn btn-secondary btn-icon"
            style={{ width: 44, height: 44 }}
            aria-label="Split"
          >
            <SplitIcon size={16} />
          </button>
          <button
            disabled={!selectedClipId}
            onClick={() => selectedClipId && removeClip(selectedClipId)}
            className="btn btn-secondary btn-icon"
            style={{ width: 44, height: 44 }}
            aria-label="Delete"
          >
            <TrashIcon size={16} />
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto" style={{ minHeight: 0 }}>
        {tab === "timeline" && (
          <div className="h-full overflow-x-auto">
            <Timeline onRequestAdd={onRequestAdd} compact />
          </div>
        )}
        {tab === "media" && <MediaLibrary projectId={projectId} onAdd={onAddAsset} />}
        {tab === "music" && <MusicSearch projectId={projectId} onAddAsset={onAddAsset} />}
        {tab === "text" &&
          (selectedTrack?.kind === "text" ? (
            <PropertiesPanel />
          ) : (
            <div className="flex flex-col items-center gap-3 p-8">
              <p className="text-muted text-center text-sm">Add a text overlay at the current position.</p>
              <button
                onClick={() => {
                  addTextClip(playheadSec);
                  setTab("clip");
                }}
                className="btn btn-primary"
              >
                Add text
              </button>
            </div>
          ))}
        {tab === "clip" && <PropertiesPanel />}
      </div>

      <div className="flex shrink-0" style={{ borderTop: "2px solid var(--color-divider)" }}>
        {TABS.map((t, i) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className="flex flex-1 flex-col items-center gap-1 py-2.5"
            style={{
              borderLeft: i > 0 ? "1px solid var(--color-divider)" : undefined,
              background: tab === t.id ? "var(--color-text)" : "transparent",
              color: tab === t.id ? "var(--color-bg)" : "color-mix(in srgb, var(--color-text) 55%, transparent)",
            }}
          >
            <t.Icon size={18} />
            <span style={{ font: "600 9.5px var(--font-mono)" }}>{t.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
