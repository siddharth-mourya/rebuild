# Pages & features — for design handoff

Functional spec only — (colors, spacing, layout style are intentionally left open for the designer). This describes what each screen needs to contain and do.

Product context: a free, no-signup, browser-only video editor (nothing uploaded to a server). Each project is one continuous **editing session**: every asset ever imported into it stays available and reusable for the life of that project, not consumed on first use.

Status tags: **[Built]** exists in code today. **[Planned]** described here for design purposes but not yet implemented.

---

## 1. Start screen (`/`) — [Built]

Purpose: entry point — resume or create a project, no login.

- App name/logo
- One-line reassurance that data stays local ("nothing uploaded, no account")
- Primary button: **New project** → creates a project and opens the editor
- Secondary button: **Resume "<last project name>"** — only shown if a project exists, opens the most recently edited project directly
- **My projects** list/grid:
  - Each entry shows: project name, last-edited timestamp
  - Click a project → opens it in the editor
  - Delete action per project (with the understanding this permanently deletes it and its media, since everything is local)
- Empty state when there are no projects yet
- Link to **Help** page

---

## 2. Editor screen (`/editor/[projectId]`)

Purpose: the main workspace. One screen, several regions (not separate pages).

### Header (top bar) — [Built]

- Back-to-projects action
- Current project name
- Save status indicator (Saving… / Saved / Couldn't save) — always visible, no manual save button

### Left sidebar — Media tab

**Session asset library — [Built, needs these additions: Planned]**

- Drop zone / file picker to import image, video, or audio from the user's device — **[Built]**
- Every asset imported into this project stays listed here for the whole session — never removed just because it was used — **[Built]**
- Each asset has an **Add** action that places another copy of it on the timeline — assets are reusable any number of times, not consumed on add — **[Built]**
- **[Planned] Usage badge** per asset — e.g. "used ×3" — so the user can see at a glance what's already placed vs. unused
- **[Planned] Click-to-locate:** clicking an asset in the library highlights (and scrolls the timeline to) every clip that uses it, across every track
- **[Planned] Reverse highlight:** selecting a clip on the timeline highlights its source asset back in the library, so the connection is visible both ways
- **[Planned] Remove-from-project** action per asset (only when it's not currently placed on the timeline, or with a confirmation if it is — removes it from this session entirely, including its stored file)

### Left sidebar — Music tab — [Built]

- Search box for free/licensed music (Jamendo)
- Search results list: track title, artist, **Preview** (play/pause), **Add** action
- On **Add**: a trim step appears — a waveform of the track with two draggable handles to select a start/end range (so only e.g. seconds 5–10 of a 3-minute song get used), plus a live selected-range readout and Cancel/Add-to-timeline actions
- Attribution note shown per track when the license requires it
- Once added, a music clip becomes a normal session asset — same reuse, badge, and highlight behavior as the Media tab
- **[Planned]** **Upload your own song** shortcut inside this tab (separate from general Media import), and a **Sound effects** section (short CC0 effects) using the same add/trim flow

### Center — canvas, preview, toolbar, timeline

**Output canvas settings — [Planned]**

- Project-level aspect ratio / output size, chosen once per project (changeable later): **Portrait (9:16)**, **Square (1:1)**, **Landscape (16:9)**, or a custom ratio
- Every video/image clip renders inside this canvas; a clip whose source doesn't match gets a **fit mode**, set per clip:
  - **Fill/Crop** — scales to cover the canvas, cropping the overflow, with a draggable/pannable focus point to choose which part of the frame stays visible
  - **Fit** — scales to stay fully visible inside the canvas, with letterbox space (plain, blurred, or color-filled) around it
- Changing the project's aspect ratio later re-applies each clip's fit mode to the new canvas rather than destroying the edit

**Photo/video crop & transform tool — [Planned]**

- Opens from the selected clip (button in the Properties panel, or double-click the preview)
- Crop with aspect-ratio presets (matching the canvas presets above) plus freeform
- Scale and reposition directly on the preview by dragging — same drag-to-pan behavior as the Fill/Crop focus point above
- Rotate and flip (horizontal/vertical)
- Reset-to-original action

**Text layer tool — [Planned]**

- **Add text** action creates a new text clip on a text track, positioned at the current playhead
- The text box is placed directly on the preview canvas and can be **dragged anywhere** on it (pick-and-drop positioning, not a fixed slot)
- **Resize** via drag handles on the text box (scales the text), independent of manually changing font size
- Rich formatting controls: font family, font size, text color, background/highlight color, bold/italic, alignment, opacity
- Each text clip has its own timeline duration/position, same as other clips (start/end, drag to move, trim, delete)
- Multiple text clips can exist across time and can overlap different video/image clips underneath

**Preview player — [Built, extends to show text/crop live per above]**

- Video/image preview area reflecting whatever clip is under the playhead, composited within the project's output canvas
- Play / Pause control
- Audio from overlapping audio-track clips plays in sync with the visual
- Any active text clip renders on top, at its chosen position/style

**Toolbar (acts on the selected clip / playhead) — [Built], + [Planned] additions**

- Split clip at playhead — **[Built]**
- Delete selected clip — **[Built]**
- Export button → opens the Export modal — **[Built]**
- **[Planned]** Crop/transform tool entry point (for video/image clips)
- **[Planned]** Add text entry point

**Timeline — [Built], with the following visual/interaction upgrades: [Planned]**

- One row per track/layer type: video/image, one or more audio (music, voiceover, original video audio), text — **[Built for video+audio, Planned for text]**
- Each track shows its clips as blocks positioned/sized by time — **[Built]**
- Click a clip to select it (selection drives the Properties panel) — **[Built]**
- Click empty timeline space to move the playhead — **[Built]**
- A vertical playhead line spanning all tracks — **[Built]**
- Muted video clips are visually indicated (e.g. a "muted" label) — **[Built]**
- **[Planned]** Each track/layer type has a distinct, immediately recognizable visual identity (icon and/or treatment per type: video, image, music, voiceover, text) so the stack reads clearly at a glance
- **[Planned]** Whole-clip drag to move it in time (currently exists) **plus dedicated trim handles at the left and right edge of each clip**, so shortening/lengthening a clip's used range is a distinct, precise gesture from moving it — handles should be easy to grab (larger hit target than the clip border) and show a hover/active state
- **[Planned]** Dragging a clip or its trim handles shows a live time readout (e.g. "0:05" tooltip) while dragging
- **[Planned]** Asset-usage highlight (see Media tab above) lights up every matching clip across all layers at once

### Right sidebar — Properties panel

Shown for whichever clip is selected; contents depend on clip/track type:

- **Video clip — [Built]:** "Mute original audio" toggle. **[Planned]:** entry point into the crop/transform tool, fit-mode selector (Fill/Fit)
- **Image clip — [Planned]:** same crop/transform + fit-mode controls as video
- **Audio clip — [Built]:** volume slider, fade-in (seconds), fade-out (seconds)
- **Text clip — [Planned]:** font, size, color, background color, bold/italic, alignment, opacity — the same rich formatting controls available from the Text layer tool, editable after the fact
- Read-only info: this clip's position on the timeline, and which portion of the source file it uses — **[Built]**
- Delete-clip action — **[Built]**
- Empty state: "Select a clip to edit its properties" when nothing is selected — **[Built]**

### Export modal (overlay, not a page) — [Built]

- Start-export action
- Progress bar + current stage label while rendering (all client-side, via ffmpeg.wasm)
- Error message state if export fails
- Download-the-finished-MP4 action once done
- Close action
- **[Planned]** Export renders at the project's chosen output canvas size/aspect ratio, with all crop/fit and text-layer positioning baked in

---

## 3. Help page (`/help`) — [Built]

Purpose: the privacy/trust explanation, since there's no onboarding flow or account system to convey this otherwise.

- Back link to Start screen
- Explanation: your data never leaves your browser (no server upload, no account)
- Practical implications: projects are tied to this browser/device; clearing browser data deletes them; moving a project to another device requires exporting/importing a project file _(roadmap — not yet built)_
- Note on where music comes from (free/CC-licensed catalog) and the "only upload audio you have rights to use" disclaimer for uploaded audio

---

## Further roadmap (not yet specified in detail, design should leave room)

- Beat-sync suggested cut points on the timeline
- Ken Burns / keyframe animation for image clips (pan & zoom over time)
- Sticker/emoji layer (separate from text)
- Picture-in-picture / split-screen composition
- Color filters, speed ramping
- Voiceover recording (mic capture straight into an audio track)
- Auto-captions (on-device speech-to-text)
- Snapping/magnetic timeline + filmstrip thumbnails on video clips
- Installable offline PWA
- Export presets sized for specific platforms (Reels/TikTok/Shorts) — distinct from the manual aspect-ratio picker above
- Export/Import project file (manual cross-device backup)
