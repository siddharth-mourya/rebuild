import { getDB } from "./db";
import type { Project } from "../timeline/types";

export async function saveProject(project: Project): Promise<void> {
  const db = await getDB();
  await db.put("projects", project);
}

export async function loadProject(id: string): Promise<Project | undefined> {
  const db = await getDB();
  return db.get("projects", id);
}

export async function listProjects(): Promise<Project[]> {
  const db = await getDB();
  const all = await db.getAllFromIndex("projects", "by-updatedAt");
  return all.sort((a, b) => b.updatedAt - a.updatedAt);
}

export async function deleteProject(id: string): Promise<void> {
  const db = await getDB();
  const tx = db.transaction(["projects", "assets", "assetMeta"], "readwrite");

  await tx.objectStore("projects").delete(id);

  const assetMetaIdx = tx.objectStore("assetMeta").index("by-projectId");
  for await (const cursor of assetMetaIdx.iterate(id)) {
    await tx.objectStore("assetMeta").delete(cursor.primaryKey);
  }

  const assetIdx = tx.objectStore("assets").index("by-projectId");
  for await (const cursor of assetIdx.iterate(id)) {
    await tx.objectStore("assets").delete(cursor.primaryKey);
  }

  await tx.done;
}

/** id of the most recently updated project, used for the "resume where you left off" banner */
export async function getLastEditedProjectId(): Promise<string | undefined> {
  const projects = await listProjects();
  return projects[0]?.id;
}
