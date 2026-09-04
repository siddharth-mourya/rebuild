"use client";

import { useState } from "react";
import { useEditorStore } from "@/store/editorStore";
import { exportProject, type ExportProgress } from "@/lib/render/ffmpegEngine";
import { getAssetBlob } from "@/lib/storage/assetStore";

export default function ExportModal({ onClose }: { onClose: () => void }) {
  const project = useEditorStore((s) => s.project);
  const assets = useEditorStore((s) => s.assets);
  const [progress, setProgress] = useState<ExportProgress>({ ratio: 0, stage: "idle" });
  const [error, setError] = useState<string | null>(null);
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);

  async function run() {
    if (!project) return;
    setError(null);
    try {
      const blob = await exportProject(
        project,
        assets,
        (blobKey) => getAssetBlob(blobKey),
        setProgress
      );
      setDownloadUrl(URL.createObjectURL(blob));
    } catch (err) {
      console.error("Export failed:", err);
      setError(err instanceof Error ? err.message : "Export failed");
    }
  }

  return (
    <div className="dialog-backdrop">
      <div className="dialog">
        <h4 className="dialog-title" style={{ margin: 0 }}>Export video</h4>

        {!downloadUrl && !error && progress.stage === "idle" && (
          <button onClick={run} className="btn btn-primary btn-block" style={{ marginTop: 0 }}>
            Start export
          </button>
        )}

        {progress.stage !== "idle" && !downloadUrl && !error && (
          <div className="flex flex-col gap-2">
            <div style={{ height: 6, width: "100%", background: "var(--color-divider)" }}>
              <div
                style={{ height: "100%", background: "var(--color-accent)", width: `${Math.round(progress.ratio * 100)}%` }}
              />
            </div>
            <p className="text-muted" style={{ fontSize: 12, margin: 0 }}>{progress.stage}…</p>
          </div>
        )}

        {error && <p style={{ color: "var(--color-accent)", fontSize: 12, margin: 0 }}>{error}</p>}

        {downloadUrl && (
          <a href={downloadUrl} download="export.mp4" className="btn btn-primary btn-block" style={{ marginTop: 0 }}>
            Download MP4
          </a>
        )}

        <button onClick={onClose} className="btn btn-secondary btn-block" style={{ marginTop: 0 }}>
          Close
        </button>
      </div>
    </div>
  );
}
