"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import type { Project } from "@/lib/timeline/types";
import { deleteProject, listProjects } from "@/lib/storage/projectStore";
import ProjectThumbnail from "./ProjectThumbnail";

export default function StartScreen() {
  const router = useRouter();
  const [projects, setProjects] = useState<Project[] | null>(null);
  const [pendingDelete, setPendingDelete] = useState<Project | null>(null);

  useEffect(() => {
    listProjects().then(setProjects);
  }, []);

  function createProject() {
    router.push("/new");
  }

  async function confirmDelete() {
    if (!pendingDelete) return;
    await deleteProject(pendingDelete.id);
    setProjects((prev) => prev?.filter((p) => p.id !== pendingDelete.id) ?? null);
    setPendingDelete(null);
  }

  const lastEdited = projects?.[0];

  return (
    <div className="flex flex-1 flex-col">
      <div className="nav">
        <span className="nav-brand">
          EDIT<span style={{ color: "var(--color-accent)" }}>.</span>
        </span>
        <Link href="/help">Help</Link>
      </div>

      <div
        className="px-12 py-16"
        style={{ borderBottom: "2px solid var(--color-divider)" }}
      >
        <div className="mx-auto grid max-w-5xl items-end gap-14 md:grid-cols-[1.35fr_1fr]">
          <div>
            <h6 style={{ color: "var(--color-accent)", marginBottom: 14 }}>
              No sign up, no login required
            </h6>
            <h1 className="max-w-[18ch]" style={{ fontSize: 52 }}>
              A video editor that never leaves your browser.
            </h1>
            <p className="max-w-[52ch] text-muted" style={{ fontSize: 16, marginBottom: 28 }}>
              Every file you import stays on this device, in this browser. No sign-up, no server,
              no upload — and no fee.
            </p>
            <div className="flex gap-3">
              <button
                onClick={createProject}
                className="btn btn-primary"
                style={{ padding: "14px 22px", fontSize: 15 }}
              >
                New project
              </button>
              {lastEdited && (
                <button
                  onClick={() => router.push(`/editor/${lastEdited.id}`)}
                  className="btn btn-secondary"
                  style={{ padding: "14px 22px", fontSize: 15 }}
                >
                  Resume &ldquo;{lastEdited.name}&rdquo;
                </button>
              )}
            </div>
          </div>

          <div className="hidden md:block" style={{ borderLeft: "2px solid var(--color-divider)", paddingLeft: 32 }}>
            {[
              ["Storage", "This device only"],
              ["Export", "MP4, rendered locally"],
              ["Music", "Free / CC catalogue"],
              ["Account", "None, ever"],
            ].map(([label, value], i, arr) => (
              <div
                key={label}
                className="flex justify-between py-2.5 text-sm"
                style={i < arr.length - 1 ? { borderBottom: "1px solid var(--color-divider)" } : undefined}
              >
                <span>{label}</span>
                <span className="text-muted">{value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="mx-auto w-full max-w-5xl flex-1 px-12 py-10">
        <div className="mb-4 flex items-baseline justify-between">
          <h6 style={{ margin: 0 }}>My projects{projects ? ` — ${projects.length}` : ""}</h6>
          {projects && projects.length > 0 && (
            <span className="text-muted" style={{ fontSize: 11 }}>
              Deleting a project deletes its media too
            </span>
          )}
        </div>

        {projects === null ? (
          <p className="text-muted text-sm">Loading…</p>
        ) : (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {projects.map((p) => (
              <div key={p.id} className="card">
                <button onClick={() => router.push(`/editor/${p.id}`)} className="block w-full text-left">
                  <ProjectThumbnail project={p} className="relative aspect-video w-full" />
                  <div style={{ marginTop: 12 }}>
                    <p className="card-title">{p.name}</p>
                    <p className="card-meta" style={{ marginTop: 4 }}>
                      {new Date(p.updatedAt).toLocaleString()}
                    </p>
                  </div>
                </button>
                <div className="flex items-center justify-between">
                  <span />
                  <button onClick={() => setPendingDelete(p)} className="btn btn-ghost" style={{ fontSize: 12 }}>
                    Delete
                  </button>
                </div>
              </div>
            ))}
            <div
              className="flex flex-col justify-center gap-2 p-4"
              style={{ background: "var(--color-bg)", border: "2px dashed var(--color-divider)" }}
            >
              <p className="text-muted" style={{ fontSize: 13, margin: 0 }}>
                {projects.length === 0 ? "No projects yet." : "Start something new."}
              </p>
              <button onClick={createProject} className="btn btn-secondary self-start">
                {projects.length === 0 ? "Create your first project" : "New project"}
              </button>
            </div>
          </div>
        )}
      </div>

      {pendingDelete && (
        <div className="dialog-backdrop">
          <div className="dialog">
            <h4 className="dialog-title" style={{ margin: 0 }}>
              Delete &ldquo;{pendingDelete.name}&rdquo;?
            </h4>
            <p className="text-muted" style={{ fontSize: 13, margin: 0 }}>
              This permanently deletes the project and every image, video, and audio file imported
              into it. This can&apos;t be undone.
            </p>
            <div className="flex justify-end gap-2" style={{ marginTop: 8 }}>
              <button onClick={() => setPendingDelete(null)} className="btn btn-secondary">
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                className="btn btn-primary"
                style={{ background: "var(--color-accent-700)" }}
              >
                Delete permanently
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
