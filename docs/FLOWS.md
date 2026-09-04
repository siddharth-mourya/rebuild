# User flows

Everything below happens entirely in the browser. Nothing is uploaded to a server; state lives in IndexedDB.

## 1. New Project

1. User opens `/` (Start screen) → `StartScreen` calls `listProjects()` (`lib/storage/projectStore.ts`) to show existing projects.
2. User clicks **New project** → `emptyProject()` (`lib/timeline/types.ts`) creates a `Project` with one empty video track and one empty audio track.
3. `saveProject()` writes it to IndexedDB immediately, then the user is routed to `/editor/[projectId]`.

## 2. Resume Project

1. On `/`, `StartScreen` reads all saved projects and shows the most recently updated one as **Resume "<name>"**.
2. Clicking it (or picking any project from **My projects**) routes to `/editor/[projectId]`.
3. `EditorScreen` calls `loadProject(projectId)` then `useEditorStore.loadInto(project)`, which also loads that project's `MediaAsset` metadata via `listAssets()`.
4. If the project id doesn't exist (e.g. deleted elsewhere), the editor shows "Project not found" with a link back.

## 3. Import Media (image / audio / video)

1. In the editor's **Media** sidebar tab, the user drags a file onto the drop zone or clicks it to open a file picker (`MediaLibrary.tsx`).
2. Each file's MIME type determines its `MediaKind` (video/image/audio).
3. `importAsset()` (`lib/storage/assetStore.ts`) probes the file for duration/dimensions (via a temporary `<video>`/`<audio>`/`createImageBitmap`), then stores the `Blob` in the `assets` IndexedDB store and its metadata (`MediaAsset`) in `assetMeta`.
4. The new asset appears in the Media list; clicking **+ Add** appends it to the matching track (video/image → video track, audio → audio track) right after the last existing clip on that track.

## 4. Add Music from Jamendo

1. User switches to the **Music** sidebar tab and searches (`MusicSearch.tsx`).
2. `searchMusic()` (`lib/music/musicService.ts`) fans the query out to every registered `MusicProvider` (currently just `jamendoProvider`) and normalizes results into the app's own `MusicTrack` shape — the UI never touches Jamendo's raw response.
3. User can preview a track (plays `track.audioUrl` in a hidden `<audio>` element) or click **+ Add** to open the trimmer.
4. `AudioTrimmer.tsx` decodes the track's audio (`decodeAudio` + `extractPeaks`, `lib/audio/waveform.ts`) and draws a waveform with two draggable handles marking the selected range (default: first 10s).
5. On **Add to timeline**: the track's audio is fetched and stored locally via `importAsset()` (kind `audio`) so it persists offline, then a `Clip` is added to the audio track with `sourceIn`/`sourceOut` set to the selected range — not the full song.

## 5. Mute Video + Attach New Audio (core flow)

1. User adds a video clip to the video track (flow 3).
2. Selecting the clip (click in the timeline) opens `PropertiesPanel`, which shows a **Mute original audio** checkbox for video-track clips → toggling it sets `clip.muted`.
3. Independently, the user adds a music or uploaded-audio clip to an audio track (flow 3 or 4) positioned to overlap the video clip's time range.
4. During preview playback, `PreviewPlayer` mutes the `<video>` element when `clip.muted` is true and plays the overlapping audio-track clip(s) alongside it.
5. On export, `exportProject()` (`lib/render/ffmpegEngine.ts`) builds an ffmpeg command that maps the video stream without its original audio (`-an`) when muted, and mixes in whichever audio-track clips overlap that video clip's time range (`amix` filter), each trimmed to its own `sourceIn`/`sourceOut` and offset/volumed/faded as configured.

## 6. Trim / Reorder / Delete Clip

1. Dragging a clip left/right in the timeline (`ClipView.tsx`) calls `moveClip()`, which shifts `timelineStart`/`timelineEnd` while preserving the clip's length.
2. **Split at playhead** (`Toolbar.tsx`) calls `splitClip()`, which cuts the selected clip into two at the current playhead position, recalculating each half's `sourceIn`/`sourceOut`.
3. **Delete** removes the selected clip from its track and recomputes the project's total duration.
4. All of these are pure functions in `lib/timeline/timelineEngine.ts` — the store just calls them and re-saves the resulting `Project`.

## 7. Export

1. User clicks **Export** in the toolbar → `ExportModal` opens.
2. Clicking **Start export** calls `exportProject()`, which lazily loads `@ffmpeg/ffmpeg` (client-only import, wasm core fetched once and cached) and writes every referenced asset's `Blob` into ffmpeg's virtual filesystem.
3. ffmpeg mutes/trims the base video (or loops a still image for its clip duration), mixes in overlapping audio clips with their configured volume/fades, and encodes `output.mp4` (H.264/yuv420p).
4. Progress events update a progress bar; on completion, a **Download MP4** link appears (`URL.createObjectURL` on the resulting Blob — the file never leaves the browser except via this user-initiated download).

## 8. Save / Load Project File (manual backup, cross-device transfer)

*(Planned — not yet implemented in Phase 1 code.)* Exports the `Project` JSON plus referenced asset Blobs as a downloadable bundle; importing it on another browser/device re-inserts everything into that browser's IndexedDB, since projects never sync automatically across devices.

## 9. Manage Projects

1. On `/`, each row in **My projects** shows the project name and last-updated time (`listProjects()`, sorted newest first).
2. **Delete** calls `deleteProject()`, which removes the project record and cascades to delete every asset (`assetMeta` + `assets` blob rows) scoped to that `projectId`.

## Autosave (cross-cutting)

Every store mutation (`addClip`, `updateClip`, `removeClip`, `moveClip`, `splitClip`, `addTrack`) debounces a call to `saveProject()` (800ms after the last edit). `SaveStatusIndicator` reflects `idle → saving → saved/error` so the user always has visible confirmation that their edit is safe, without ever pressing a Save button.
