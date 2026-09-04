"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useEditorStore, flushAutosave } from "@/store/editorStore";
import { loadProject } from "@/lib/storage/projectStore";
import type { MediaAsset } from "@/lib/timeline/types";
import { ASPECT_RATIOS } from "@/lib/timeline/types";
import { BackIcon, UndoIcon } from "@/components/icons";
import ExportButton from "./ExportButton";
import EditableProjectName from "./EditableProjectName";
import MediaLibrary from "./MediaLibrary";
import MusicSearch from "./MusicLibrary/MusicSearch";
import Timeline from "./Timeline/Timeline";
import PreviewPlayer from "./PreviewPlayer";
import Toolbar from "./Toolbar";
import PropertiesPanel from "./PropertiesPanel";
import SaveStatusIndicator from "./SaveStatusIndicator";

const DEFAULT_IMAGE_DURATION = 5;

export default function EditorScreen({ projectId }: { projectId: string }) {
  const router = useRouter();
  const [notFound, setNotFound] = useState(false);
  const [tab, setTab] = useState<"media" | "music">("media");
  const project = useEditorStore((s) => s.project);
  const loadInto = useEditorStore((s) => s.loadInto);
  const addClip = useEditorStore((s) => s.addClip);
  const addTextClip = useEditorStore((s) => s.addTextClip);
  const setAspectRatio = useEditorStore((s) => s.setAspectRatio);
  const playheadSec = useEditorStore((s) => s.playheadSec);
  const canUndo = useEditorStore((s) => s.past.length > 0);

  useEffect(() => {
    loadProject(projectId).then((p) => {
      if (!p) {
        setNotFound(true);
        return;
      }
      loadInto(p);
    });
  }, [projectId, loadInto]);

  // Delete/Backspace removes the selected clip (Backspace covers the key labeled "delete" on Mac
  // keyboards, which actually sends Backspace); Cmd/Ctrl+Z undoes, Cmd/Ctrl+Shift+Z or Ctrl+Y
  // redoes. All ignored while typing in an input/textarea so normal editing still works.
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      const target = e.target as HTMLElement | null;
      const tag = target?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || target?.isContentEditable) return;

      if (e.key === "Delete" || e.key === "Backspace") {
        const { selectedClipId, removeClip } = useEditorStore.getState();
        if (!selectedClipId) return;
        e.preventDefault();
        removeClip(selectedClipId);
        return;
      }

      const meta = e.metaKey || e.ctrlKey;
      if (meta && e.key.toLowerCase() === "z" && !e.shiftKey) {
        e.preventDefault();
        useEditorStore.getState().undo();
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  function addAssetToTimeline(asset: MediaAsset, range?: { sourceIn: number; sourceOut: number }) {
    const proj = useEditorStore.getState().project;
    if (!proj) return;
    const trackKind = asset.kind === "audio" ? "audio" : "video";
    const track = proj.tracks.find((t) => t.kind === trackKind);
    if (!track) return;

    const lastEnd = track.clips.reduce((max, c) => Math.max(max, c.timelineEnd), 0);
    const sourceIn = range?.sourceIn ?? 0;
    const sourceOut = range?.sourceOut ?? asset.durationSec ?? DEFAULT_IMAGE_DURATION;
    const duration = sourceOut - sourceIn;

    addClip(track.id, {
      assetId: asset.id,
      timelineStart: lastEnd,
      timelineEnd: lastEnd + duration,
      sourceIn,
      sourceOut,
      muted: false,
      volume: 1,
    });
  }

  function handleRequestAdd(trackKind: "video" | "audio" | "text") {
    if (trackKind === "text") {
      addTextClip(playheadSec);
    } else {
      setTab(trackKind === "audio" ? "music" : "media");
    }
  }

  async function goToProjects() {
    await flushAutosave();
    router.push("/");
  }

  if (notFound) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-4">
        <p className="text-muted text-sm">Project not found.</p>
        <button onClick={goToProjects} className="btn btn-secondary">
          Back to projects
        </button>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <p className="text-muted text-sm">Loading…</p>
      </div>
    );
  }

  return (
    <div className="flex h-screen flex-col overflow-hidden">
      <header
        className="flex items-center gap-4 px-4 py-2.5"
        style={{ borderBottom: "2px solid var(--color-divider)" }}
      >
        <button onClick={goToProjects} className="btn btn-secondary" style={{ fontSize: 12, gap: 8 }}>
          <BackIcon size={13} />
          Projects
        </button>
        <div style={{ width: 1, height: 22, background: "var(--color-divider)" }} />
        <EditableProjectName name={project.name} />

        <button
          onClick={() => useEditorStore.getState().undo()}
          disabled={!canUndo}
          className="btn btn-secondary btn-icon"
          style={{ width: 30, height: 30 }}
          title="Undo (Cmd/Ctrl+Z)"
        >
          <UndoIcon size={14} />
        </button>

        <div className="ml-auto flex items-center gap-4">
          <SaveStatusIndicator />
          <select
            value={project.aspectRatio}
            onChange={(e) => setAspectRatio(e.target.value as typeof project.aspectRatio)}
            className="btn btn-secondary"
            style={{ fontSize: 12, cursor: "pointer" }}
            title="Output canvas shape"
          >
            {ASPECT_RATIOS.map((a) => (
              <option key={a.value} value={a.value}>
                {a.label}
              </option>
            ))}
          </select>
          <ExportButton />
        </div>
      </header>

      <div className="flex flex-1" style={{ minHeight: 0 }}>
        <aside className="flex w-[312px] flex-col" style={{ borderRight: "2px solid var(--color-divider)", minHeight: 0 }}>
          <div className="flex" style={{ borderBottom: "2px solid var(--color-divider)" }}>
            <button
              onClick={() => setTab("media")}
              className="flex-1 py-2.5 px-3 text-center"
              style={{
                fontFamily: "var(--font-heading)",
                fontWeight: 800,
                fontSize: 12,
                letterSpacing: "0.06em",
                textTransform: "uppercase",
                background: tab === "media" ? "var(--color-text)" : "transparent",
                color: tab === "media" ? "var(--color-bg)" : "color-mix(in srgb, var(--color-text) 55%, transparent)",
              }}
            >
              Media
            </button>
            <button
              onClick={() => setTab("music")}
              className="flex-1 py-2.5 px-3 text-center"
              style={{
                fontFamily: "var(--font-heading)",
                fontWeight: 800,
                fontSize: 12,
                letterSpacing: "0.06em",
                textTransform: "uppercase",
                borderLeft: "1px solid var(--color-divider)",
                background: tab === "music" ? "var(--color-text)" : "transparent",
                color: tab === "music" ? "var(--color-bg)" : "color-mix(in srgb, var(--color-text) 55%, transparent)",
              }}
            >
              Music
            </button>
          </div>
          <div className="flex-1 overflow-y-auto">
            {tab === "media" ? (
              <MediaLibrary projectId={projectId} onAdd={addAssetToTimeline} />
            ) : (
              <MusicSearch projectId={projectId} onAddAsset={addAssetToTimeline} />
            )}
          </div>
        </aside>

        <main className="flex flex-1 flex-col" style={{ minWidth: 0 }}>
          <div
            className="flex flex-1 items-center justify-center"
            style={{ background: "var(--color-text)", minHeight: 0 }}
          >
            <PreviewPlayer />
          </div>
          <Toolbar />
          <div className="h-56 overflow-x-auto">
            <Timeline onRequestAdd={handleRequestAdd} />
          </div>
        </main>

        <aside className="w-[312px] overflow-y-auto" style={{ borderLeft: "2px solid var(--color-divider)" }}>
          <PropertiesPanel />
        </aside>
      </div>
    </div>
  );
}
