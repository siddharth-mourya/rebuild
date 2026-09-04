"use client";

import { useEffect, useState } from "react";
import type { Project } from "@/lib/timeline/types";
import { getAsset, getAssetBlob } from "@/lib/storage/assetStore";
import Thumbnail from "@/components/Thumbnail";

export default function ProjectThumbnail({ project, className }: { project: Project; className?: string }) {
  const [state, setState] = useState<{ url: string; kind: "image" | "video" } | null>(null);

  useEffect(() => {
    let cancelled = false;

    const videoTrack = project.tracks.find((t) => t.kind === "video");
    const firstClip = [...(videoTrack?.clips ?? [])]
      .filter((c) => c.assetId)
      .sort((a, b) => a.timelineStart - b.timelineStart)[0];
    if (!firstClip?.assetId) return;

    getAsset(firstClip.assetId).then(async (asset) => {
      if (cancelled || !asset || asset.kind === "audio") return;
      const blob = await getAssetBlob(asset.blobKey);
      if (cancelled || !blob) return;
      setState({ url: URL.createObjectURL(blob), kind: asset.kind });
    });

    return () => {
      cancelled = true;
    };
  }, [project]);

  return <Thumbnail url={state?.url ?? null} kind={state?.kind ?? "image"} className={className} />;
}
