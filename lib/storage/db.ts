import { openDB, type DBSchema, type IDBPDatabase } from "idb";
import type { MediaAsset, Project } from "../timeline/types";

interface EditorDB extends DBSchema {
  projects: {
    key: string;
    value: Project;
    indexes: { "by-updatedAt": number };
  };
  assets: {
    key: string; // blobKey
    value: { blobKey: string; projectId: string; blob: Blob };
    indexes: { "by-projectId": string };
  };
  assetMeta: {
    key: string; // MediaAsset.id
    value: MediaAsset;
    indexes: { "by-projectId": string };
  };
}

const DB_NAME = "video-editor";
const DB_VERSION = 1;

let dbPromise: Promise<IDBPDatabase<EditorDB>> | null = null;

export function getDB(): Promise<IDBPDatabase<EditorDB>> {
  if (typeof window === "undefined") {
    throw new Error("getDB() can only be called in the browser");
  }
  if (!dbPromise) {
    dbPromise = openDB<EditorDB>(DB_NAME, DB_VERSION, {
      upgrade(db) {
        const projects = db.createObjectStore("projects", { keyPath: "id" });
        projects.createIndex("by-updatedAt", "updatedAt");

        const assets = db.createObjectStore("assets", { keyPath: "blobKey" });
        assets.createIndex("by-projectId", "projectId");

        const assetMeta = db.createObjectStore("assetMeta", { keyPath: "id" });
        assetMeta.createIndex("by-projectId", "projectId");
      },
    });
  }
  return dbPromise;
}
