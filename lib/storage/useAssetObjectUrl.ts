"use client";

import { useEffect, useState } from "react";
import { useEditorStore } from "@/store/editorStore";
import { getAssetBlob } from "./assetStore";

/** Caches one blob: URL per asset for the lifetime of the editor session. */
export function useAssetObjectUrl(assetId: string | undefined): string | null {
  const [state, setState] = useState<{ forAssetId?: string; url: string | null }>({ url: null });
  const assets = useEditorStore((s) => s.assets);

  useEffect(() => {
    if (!assetId) return;
    const asset = assets.get(assetId);
    if (!asset) return;
    let cancelled = false;
    getAssetBlob(asset.blobKey).then((blob) => {
      if (!blob || cancelled) return;
      setState({ forAssetId: assetId, url: URL.createObjectURL(blob) });
    });
    return () => {
      cancelled = true;
    };
  }, [assetId, assets]);

  return state.forAssetId === assetId ? state.url : null;
}
