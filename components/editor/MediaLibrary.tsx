"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { importAsset, listAssets } from "@/lib/storage/assetStore";
import { useAssetObjectUrl } from "@/lib/storage/useAssetObjectUrl";
import { useEditorStore } from "@/store/editorStore";
import type { MediaAsset, MediaKind } from "@/lib/timeline/types";
import { UploadIcon, MusicIcon } from "@/components/icons";
import Thumbnail from "@/components/Thumbnail";

function kindFor(file: File): MediaKind | null {
  if (file.type.startsWith("video/")) return "video";
  if (file.type.startsWith("image/")) return "image";
  if (file.type.startsWith("audio/")) return "audio";
  return null;
}

function AssetRow({
  asset,
  count,
  highlighted,
  onAdd,
  onLocate,
}: {
  asset: MediaAsset;
  count: number;
  highlighted: boolean;
  onAdd: () => void;
  onLocate: () => void;
}) {
  const url = useAssetObjectUrl(asset.kind === "audio" ? undefined : asset.id);

  return (
    <div
      onClick={onAdd}
      title="Click to add to the timeline"
      className="flex cursor-pointer gap-2.5 py-2.5"
      style={{
        borderBottom: "1px solid var(--color-divider)",
        background: highlighted ? "var(--color-accent-100)" : undefined,
        borderLeft: highlighted ? "3px solid var(--color-accent)" : "3px solid transparent",
        paddingLeft: highlighted ? 9 : 12,
      }}
    >
      {asset.kind === "audio" ? (
        <div
          className="flex shrink-0 items-center justify-center text-muted"
          style={{ width: 52, height: 38, background: "var(--color-surface)" }}
        >
          <MusicIcon size={16} />
        </div>
      ) : (
        <Thumbnail url={url} kind={asset.kind} className="shrink-0" style={{ width: 52, height: 38 }} />
      )}
      <div className="min-w-0 flex-1">
        <p className="truncate" style={{ margin: 0, fontSize: 12.5, fontWeight: 600 }}>
          {asset.name}
        </p>
        <p className="text-muted" style={{ margin: "2px 0 0", fontSize: 11 }}>
          {asset.kind === "video" && "Video"}
          {asset.kind === "image" && "Image"}
          {asset.kind === "audio" && "Audio"}
          {asset.durationSec ? ` · ${asset.durationSec.toFixed(1)}s` : ""}
        </p>
      </div>
      <div className="flex shrink-0 flex-col items-end gap-1">
        <span className={`tag ${count > 0 ? "tag-accent" : "tag-outline"}`}>
          {count > 0 ? `used ×${count}` : "unused"}
        </span>
        {count > 0 ? (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onLocate();
            }}
            title="Highlight every clip using this asset on the timeline"
            style={{ fontSize: 11, fontWeight: 600, color: highlighted ? "var(--color-accent)" : "color-mix(in srgb, var(--color-text) 55%, transparent)", background: "none", border: 0, cursor: "pointer" }}
          >
            {highlighted ? "Locating…" : "Locate"}
          </button>
        ) : (
          <span style={{ fontSize: 11, fontWeight: 600, color: "var(--color-accent)" }}>+ Add</span>
        )}
      </div>
    </div>
  );
}

export default function MediaLibrary({
  projectId,
  onAdd,
}: {
  projectId: string;
  onAdd: (asset: MediaAsset) => void;
}) {
  const [assets, setAssets] = useState<MediaAsset[]>([]);
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const registerAsset = useEditorStore((s) => s.registerAsset);
  const project = useEditorStore((s) => s.project);
  const highlightedAssetId = useEditorStore((s) => s.highlightedAssetId);
  const setHighlightedAsset = useEditorStore((s) => s.setHighlightedAsset);

  useEffect(() => {
    listAssets(projectId).then(setAssets);
  }, [projectId]);

  const handleFiles = useCallback(
    async (files: FileList | null) => {
      if (!files) return;
      for (const file of Array.from(files)) {
        const kind = kindFor(file);
        if (!kind) continue;
        const asset = await importAsset(projectId, kind, file.name, file);
        setAssets((prev) => [...prev, asset]);
        registerAsset(asset);
      }
    },
    [projectId, registerAsset]
  );

  function usageCount(assetId: string): number {
    if (!project) return 0;
    return project.tracks.reduce((n, t) => n + t.clips.filter((c) => c.assetId === assetId).length, 0);
  }

  return (
    <div className="flex flex-col gap-3 p-3">
      <div
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragOver(false);
          handleFiles(e.dataTransfer.files);
        }}
        className="flex cursor-pointer flex-col gap-2 p-5 text-xs"
        style={{
          border: `2px dashed ${dragOver ? "var(--color-accent)" : "var(--color-divider)"}`,
        }}
      >
        <UploadIcon size={18} className={dragOver ? "" : "text-muted"} />
        <p style={{ margin: 0, fontSize: 13 }}>
          <strong>Drop files here</strong>
        </p>
        <p className="text-muted" style={{ margin: 0, fontSize: 12 }}>
          Image, video or audio — or click to browse. Files never leave this device.
        </p>
      </div>
      <input
        ref={inputRef}
        type="file"
        multiple
        accept="video/*,image/*,audio/*"
        className="hidden"
        onChange={(e) => handleFiles(e.target.files)}
      />

      <div className="flex items-baseline justify-between px-1">
        <h6 style={{ margin: 0 }}>Session library — {assets.length}</h6>
        {assets.length > 0 && (
          <span className="text-muted" style={{ fontSize: 10 }}>
            Always reusable
          </span>
        )}
      </div>

      <ul className="flex flex-col" style={{ borderTop: assets.length ? "1px solid var(--color-divider)" : undefined }}>
        {assets.map((asset) => (
          <li key={asset.id}>
            <AssetRow
              asset={asset}
              count={usageCount(asset.id)}
              highlighted={highlightedAssetId === asset.id}
              onAdd={() => onAdd(asset)}
              onLocate={() => setHighlightedAsset(asset.id)}
            />
          </li>
        ))}
      </ul>
    </div>
  );
}
