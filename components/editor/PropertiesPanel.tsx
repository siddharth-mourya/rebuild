"use client";

import { useEditorStore } from "@/store/editorStore";
import { useAssetObjectUrl } from "@/lib/storage/useAssetObjectUrl";
import CropControl from "./CropControl";

function fmt(sec: number): string {
  const m = Math.floor(sec / 60);
  const s = (sec % 60).toFixed(1).padStart(4, "0");
  return `${m}:${s}`;
}

export default function PropertiesPanel() {
  const project = useEditorStore((s) => s.project);
  const selectedClipId = useEditorStore((s) => s.selectedClipId);
  const assets = useEditorStore((s) => s.assets);
  const updateClip = useEditorStore((s) => s.updateClip);
  const removeClip = useEditorStore((s) => s.removeClip);

  const track = project?.tracks.find((t) => t.clips.some((c) => c.id === selectedClipId));
  const clip = track?.clips.find((c) => c.id === selectedClipId);
  const asset = clip?.assetId ? assets.get(clip.assetId) : undefined;
  const thumbnailUrl = useAssetObjectUrl(clip?.assetId);

  if (!project || !selectedClipId || !track || !clip) {
    return (
      <div className="p-5">
        <h6 style={{ margin: 0 }}>Clip properties</h6>
        <p className="text-muted" style={{ fontSize: 13, marginTop: 10 }}>
          Select a clip to edit its properties.
        </p>
      </div>
    );
  }

  const isVisual = track.kind === "video"; // this track holds both video and image clips
  const fit = clip.fit ?? "fill";

  return (
    <div className="flex h-full flex-col">
      <div
        className="flex items-center justify-between px-3 py-2.5"
        style={{ borderBottom: "2px solid var(--color-divider)" }}
      >
        <h6 style={{ margin: 0 }}>Clip properties</h6>
        <span className="tag tag-accent" style={{ fontFamily: "var(--font-mono)" }}>
          {(asset?.kind ?? track.kind).toUpperCase()}
        </span>
      </div>

      {isVisual && (
        <div className="p-3" style={{ borderBottom: "1px solid var(--color-divider)" }}>
          <div className="field" style={{ marginBottom: 12 }}>
            <label>Fit inside frame</label>
            <div className="seg" style={{ width: "100%" }}>
              <label className="seg-opt" style={{ flex: 1 }}>
                <input
                  type="radio"
                  name={`fit-${clip.id}`}
                  checked={fit === "fill"}
                  onChange={() => updateClip(clip.id, { fit: "fill", zoom: 1, focusX: 0.5, focusY: 0.5 })}
                />
                Fill
              </label>
              <label className="seg-opt" style={{ flex: 1 }}>
                <input type="radio" name={`fit-${clip.id}`} checked={fit === "crop"} onChange={() => updateClip(clip.id, { fit: "crop" })} />
                Crop
              </label>
              <label className="seg-opt" style={{ flex: 1 }}>
                <input type="radio" name={`fit-${clip.id}`} checked={fit === "fit"} onChange={() => updateClip(clip.id, { fit: "fit" })} />
                Fit + letterbox
              </label>
            </div>
          </div>
          {fit === "crop" && (
            <CropControl
              focusX={clip.focusX ?? 0.5}
              focusY={clip.focusY ?? 0.5}
              zoom={clip.zoom ?? 1}
              thumbnailUrl={thumbnailUrl ?? undefined}
              thumbnailKind={asset?.kind === "video" ? "video" : "image"}
              assetWidth={asset?.width}
              assetHeight={asset?.height}
              onChange={(patch) => updateClip(clip.id, patch)}
            />
          )}
        </div>
      )}

      {asset?.kind === "video" && (
        <div
          className="flex items-center justify-between p-3"
          style={{ borderBottom: "1px solid var(--color-divider)" }}
        >
          <span style={{ fontSize: 13 }}>Mute original audio</span>
          <input
            type="checkbox"
            checked={!!clip.muted}
            onChange={(e) => updateClip(clip.id, { muted: e.target.checked })}
            style={{ width: 16, height: 16, accentColor: "var(--color-accent)" }}
          />
        </div>
      )}

      {track.kind === "text" && (
        <div className="flex flex-col gap-3 p-3" style={{ borderBottom: "1px solid var(--color-divider)" }}>
          <div className="field">
            <label>Content</label>
            <textarea
              value={clip.text ?? ""}
              onChange={(e) => updateClip(clip.id, { text: e.target.value })}
              className="input"
              style={{ minHeight: 56 }}
            />
          </div>
          <div className="flex gap-2">
            <div className="field" style={{ flex: 1 }}>
              <label>Size</label>
              <input
                type="number"
                min={8}
                max={200}
                value={clip.fontSize ?? 32}
                onChange={(e) => updateClip(clip.id, { fontSize: Number(e.target.value) })}
                className="input"
              />
            </div>
            <div className="field" style={{ flex: 1 }}>
              <label>Color</label>
              <input
                type="color"
                value={clip.textColor ?? "#ffffff"}
                onChange={(e) => updateClip(clip.id, { textColor: e.target.value })}
                className="input"
                style={{ padding: 2, height: 36 }}
              />
            </div>
          </div>
          <p className="text-muted" style={{ fontSize: 11, margin: 0 }}>
            Drag the text directly on the preview to reposition it.
          </p>
        </div>
      )}

      {track.kind === "audio" && (
        <div className="flex flex-col gap-3 p-3" style={{ borderBottom: "1px solid var(--color-divider)" }}>
          <div className="field">
            <label>Volume</label>
            <input
              type="range"
              min={0}
              max={1}
              step={0.01}
              value={clip.volume ?? 1}
              onChange={(e) => updateClip(clip.id, { volume: Number(e.target.value) })}
              style={{ width: "100%", accentColor: "var(--color-accent)" }}
            />
          </div>
          <div className="flex gap-2">
            <div className="field" style={{ flex: 1 }}>
              <label>Fade in (s)</label>
              <input
                type="number"
                min={0}
                step={0.1}
                value={clip.fadeInSec ?? 0}
                onChange={(e) => updateClip(clip.id, { fadeInSec: Number(e.target.value) })}
                className="input"
              />
            </div>
            <div className="field" style={{ flex: 1 }}>
              <label>Fade out (s)</label>
              <input
                type="number"
                min={0}
                step={0.1}
                value={clip.fadeOutSec ?? 0}
                onChange={(e) => updateClip(clip.id, { fadeOutSec: Number(e.target.value) })}
                className="input"
              />
            </div>
          </div>
        </div>
      )}

      <div className="p-3" style={{ borderBottom: "1px solid var(--color-divider)" }}>
        <h6 style={{ margin: "0 0 8px" }}>Placement</h6>
        <div
          className="flex justify-between py-1"
          style={{ fontSize: 12, borderBottom: "1px solid var(--color-divider)", fontFamily: "var(--font-mono)" }}
        >
          <span style={{ fontFamily: "var(--font-body)" }}>Timeline</span>
          <span>{fmt(clip.timelineStart)} – {fmt(clip.timelineEnd)}</span>
        </div>
        <div className="flex justify-between py-1" style={{ fontSize: 12, fontFamily: "var(--font-mono)" }}>
          <span style={{ fontFamily: "var(--font-body)" }}>Source range</span>
          <span>{fmt(clip.sourceIn)} – {fmt(clip.sourceOut)}</span>
        </div>
      </div>

      <div className="mt-auto p-3">
        <button
          onClick={() => removeClip(clip.id)}
          className="btn btn-secondary btn-block"
          style={{ fontSize: 12, color: "var(--color-accent-700)", borderColor: "var(--color-accent-300)" }}
        >
          Delete clip
        </button>
      </div>
    </div>
  );
}
