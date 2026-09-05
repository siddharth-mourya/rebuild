"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { emptyProject } from "@/lib/timeline/types";
import { saveProject } from "@/lib/storage/projectStore";
import { importAsset, probeMedia } from "@/lib/storage/assetStore";
import * as engine from "@/lib/timeline/timelineEngine";
import type { WizardState, PendingFile } from "./types";
import WizardHeader from "./WizardHeader";
import StepUpload from "./StepUpload";
import StepReview from "./StepReview";
import StepCanvas from "./StepCanvas";
import StepMusic from "./StepMusic";

const DEFAULT_IMAGE_DURATION = 5;

function kindFor(file: File): "video" | "image" | "audio" | null {
  if (file.type.startsWith("video/")) return "video";
  if (file.type.startsWith("image/")) return "image";
  if (file.type.startsWith("audio/")) return "audio";
  return null;
}

export default function NewProjectWizard() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [state, setState] = useState<WizardState>({
    files: [],
    order: [],
    aspectRatio: "9:16",
    defaultFit: "fill",
    music: null,
  });
  const [finishing, setFinishing] = useState(false);

  function patch(p: Partial<WizardState>) {
    setState((s) => ({ ...s, ...p }));
  }

  async function addFiles(fileList: FileList | File[]) {
    const accepted: PendingFile[] = [];
    for (const file of Array.from(fileList)) {
      const kind = kindFor(file);
      if (!kind) continue;
      accepted.push({ id: crypto.randomUUID(), file, kind, status: "reading" });
    }
    if (accepted.length === 0) return;

    setState((s) => ({
      ...s,
      files: [...s.files, ...accepted],
      order: [...s.order, ...accepted.filter((f) => f.kind !== "audio").map((f) => f.id)],
    }));

    for (const pf of accepted) {
      const meta = await probeMedia(pf.kind, pf.file);
      setState((s) => ({
        ...s,
        files: s.files.map((f) => (f.id === pf.id ? { ...f, ...meta, status: "ready" } : f)),
      }));
    }
  }

  function removeFile(id: string) {
    setState((s) => ({
      ...s,
      files: s.files.filter((f) => f.id !== id),
      order: s.order.filter((o) => o !== id),
      music: s.music?.kind === "upload" && s.music.file.id === id ? null : s.music,
    }));
  }

  const visualFiles = state.order.map((id) => state.files.find((f) => f.id === id)).filter((f): f is PendingFile => !!f);
  const audioFiles = state.files.filter((f) => f.kind === "audio");
  const canContinueStep1 = state.files.length > 0;

  async function finish() {
    setFinishing(true);
    try {
      const id = crypto.randomUUID();
      let project = { ...emptyProject(id, "Untitled project"), aspectRatio: state.aspectRatio };

      const videoTrack = project.tracks.find((t) => t.kind === "video")!;
      const audioTrack = project.tracks.find((t) => t.kind === "audio")!;

      let cursor = 0;
      for (const pf of visualFiles) {
        const asset = await importAsset(id, pf.kind, pf.file.name, pf.file);
        const duration = asset.durationSec ?? DEFAULT_IMAGE_DURATION;
        project = engine.addClip(project, videoTrack.id, {
          assetId: asset.id,
          timelineStart: cursor,
          timelineEnd: cursor + duration,
          sourceIn: 0,
          sourceOut: duration,
          muted: false,
          fit: state.defaultFit,
        });
        cursor += duration;
      }

      let audioCursor = 0;
      for (const pf of audioFiles) {
        const asset = await importAsset(id, "audio", pf.file.name, pf.file);
        const duration = asset.durationSec ?? 0;
        project = engine.addClip(project, audioTrack.id, {
          assetId: asset.id,
          timelineStart: audioCursor,
          timelineEnd: audioCursor + duration,
          sourceIn: 0,
          sourceOut: duration,
          volume: 1,
        });
        audioCursor += duration;
      }

      if (state.music) {
        let blob: Blob;
        let name: string;
        let sourceIn = 0;
        let sourceOut: number;
        if (state.music.kind === "upload") {
          blob = state.music.file.file;
          name = state.music.file.file.name;
          sourceOut = state.music.file.durationSec ?? 0;
        } else {
          const res = await fetch(state.music.track.audioUrl);
          blob = await res.blob();
          name = `${state.music.track.title} — ${state.music.track.artist ?? "Unknown"}`;
          sourceIn = state.music.sourceIn;
          sourceOut = state.music.sourceOut;
        }
        const asset = await importAsset(id, "audio", name, blob);
        const duration = sourceOut - sourceIn;
        project = engine.addClip(project, audioTrack.id, {
          assetId: asset.id,
          timelineStart: audioCursor,
          timelineEnd: audioCursor + duration,
          sourceIn,
          sourceOut,
          volume: 1,
        });
      }

      await saveProject(project);
      router.push(`/editor/${id}`);
    } finally {
      setFinishing(false);
    }
  }

  return (
    <div className="flex h-screen flex-col overflow-hidden" style={{ background: "var(--color-bg)" }}>
      <WizardHeader step={step} onSkip={finish} skipping={finishing} />

      <div className="flex-1 overflow-y-auto" style={{ minHeight: 0 }}>
        {step === 1 && <StepUpload files={state.files} onAdd={addFiles} onRemove={removeFile} />}
        {step === 2 && (
          <StepReview
            visualFiles={visualFiles}
            audioFiles={audioFiles}
            defaultImageDuration={DEFAULT_IMAGE_DURATION}
            onReorder={(order) => patch({ order })}
            onRemove={removeFile}
          />
        )}
        {step === 3 && (
          <StepCanvas
            aspectRatio={state.aspectRatio}
            defaultFit={state.defaultFit}
            previewFile={visualFiles[0]}
            onAspectRatioChange={(aspectRatio) => patch({ aspectRatio })}
            onDefaultFitChange={(defaultFit) => patch({ defaultFit })}
          />
        )}
        {step === 4 && (
          <StepMusic
            music={state.music}
            aspectRatio={state.aspectRatio}
            defaultFit={state.defaultFit}
            visualCount={visualFiles.length}
            videoDuration={cursorDuration(visualFiles, DEFAULT_IMAGE_DURATION)}
            onChange={(music) => patch({ music })}
          />
        )}
      </div>

      <div className="flex items-center gap-4 px-4 py-3" style={{ borderTop: "2px solid var(--color-divider)" }}>
        <button className="btn btn-secondary" style={{ fontSize: 12.5 }} disabled={step === 1} onClick={() => setStep((s) => s - 1)}>
          Back
        </button>
        <span style={{ font: "600 11px var(--font-mono)", color: "color-mix(in srgb, var(--color-text) 50%, transparent)" }}>
          STEP {step} OF 4
        </span>
        {step < 4 ? (
          <button
            className="btn btn-primary"
            style={{ fontSize: 13, marginLeft: "auto" }}
            disabled={step === 1 && !canContinueStep1}
            onClick={() => setStep((s) => s + 1)}
          >
            Continue
          </button>
        ) : (
          <button className="btn btn-primary" style={{ fontSize: 13, marginLeft: "auto", gap: 8 }} disabled={finishing} onClick={finish}>
            {finishing ? "Creating…" : "Finish & open editor"}
          </button>
        )}
      </div>
    </div>
  );
}

function cursorDuration(visualFiles: PendingFile[], defaultImageDuration: number): number {
  return visualFiles.reduce((sum, f) => sum + (f.durationSec ?? defaultImageDuration), 0);
}
