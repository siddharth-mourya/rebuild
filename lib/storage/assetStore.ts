import { getDB } from "./db";
import type { MediaAsset, MediaKind } from "../timeline/types";

/** Reads basic metadata (duration/dimensions) from a media Blob before it's persisted. */
async function probeMedia(kind: MediaKind, blob: Blob): Promise<{ durationSec?: number; width?: number; height?: number }> {
  if (kind === "image") {
    const bitmap = await createImageBitmap(blob);
    const { width, height } = bitmap;
    bitmap.close();
    return { width, height };
  }

  const url = URL.createObjectURL(blob);
  try {
    if (kind === "video") {
      return await new Promise((resolve) => {
        const el = document.createElement("video");
        el.preload = "metadata";
        el.src = url;
        el.onloadedmetadata = () =>
          resolve({ durationSec: el.duration, width: el.videoWidth, height: el.videoHeight });
      });
    }
    // audio
    return await new Promise((resolve) => {
      const el = document.createElement("audio");
      el.preload = "metadata";
      el.src = url;
      el.onloadedmetadata = () => resolve({ durationSec: el.duration });
    });
  } finally {
    URL.revokeObjectURL(url);
  }
}

export async function importAsset(
  projectId: string,
  kind: MediaKind,
  name: string,
  blob: Blob
): Promise<MediaAsset> {
  const meta = await probeMedia(kind, blob);
  const id = crypto.randomUUID();
  const blobKey = `${projectId}:${id}`;

  const asset: MediaAsset = {
    id,
    projectId,
    kind,
    name,
    blobKey,
    createdAt: Date.now(),
    ...meta,
  };

  const db = await getDB();
  const tx = db.transaction(["assets", "assetMeta"], "readwrite");
  await tx.objectStore("assets").put({ blobKey, projectId, blob });
  await tx.objectStore("assetMeta").put(asset);
  await tx.done;

  return asset;
}

export async function getAssetBlob(blobKey: string): Promise<Blob | undefined> {
  const db = await getDB();
  const row = await db.get("assets", blobKey);
  return row?.blob;
}

export async function listAssets(projectId: string): Promise<MediaAsset[]> {
  const db = await getDB();
  return db.getAllFromIndex("assetMeta", "by-projectId", projectId);
}

export async function getAsset(assetId: string): Promise<MediaAsset | undefined> {
  const db = await getDB();
  return db.get("assetMeta", assetId);
}

export async function deleteAsset(assetId: string, blobKey: string): Promise<void> {
  const db = await getDB();
  const tx = db.transaction(["assets", "assetMeta"], "readwrite");
  await tx.objectStore("assetMeta").delete(assetId);
  await tx.objectStore("assets").delete(blobKey);
  await tx.done;
}
