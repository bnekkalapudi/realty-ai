# Realty AI

Realty AI is a zero-to-one prototype for turning a real estate photoshoot into one polished downloadable video.

The app takes multiple still property photos, applies optional image enhancement and staging steps, generates scene videos in parallel through Fal-hosted models, and automatically assembles a final MP4 with music.

## What It Does

- Upload a full photoshoot and generate one final video from the sequence.
- Select a creator-style theme with visual direction and motion cues.
- Optionally stage vacant or sparse rooms with furniture.
- Optionally detect existing TVs and place animated TV content inside the screen.
- Optionally detect real existing fireplaces and add subtle fire only inside the existing firebox.
- Apply a two-pass cinematic HDR image treatment before video generation.
- Generate scene clips in parallel and poll Fal until each scene is ready.
- Auto-build a downloadable MP4 from all completed scenes.
- Persist project state in the browser so refreshes can restore the current project and final download state.

## Current Pipeline

### 1. Upload and classify photos
The browser ingests multiple images, compresses them for upload, and stores local preview state.

### 2. Optional room grouping
If staging is enabled, the app attempts to group multiple angles of the same room so furniture choices can stay consistent across those views.

### 3. Optional staging and scene enhancement
Depending on settings and scene analysis, the app can:

- add furniture to rooms that need it
- add TV content to an existing visible TV
- add a TV before furniture only if a TV makes sense in the room
- add subtle fireplace flames only when an existing fireplace is clearly visible

Structural edits are intentionally constrained. The app is designed to avoid inventing fireplaces, walls, windows, or other architectural elements.

### 4. Two-pass cinematic HDR treatment
When **Image Treatment** is set to **Cinematic** (default), each scene image is enhanced twice before video generation:

1. cinematic editorial image pass
2. cinematic detail pass

This follows the prompt direction in:

- [/Users/ai/Documents/realty-ai/prompts/HDR-process.txt](/Users/ai/Documents/realty-ai/prompts/HDR-process.txt)
- [/Users/ai/Documents/realty-ai/prompts/image-to-image-cinematic.txt](/Users/ai/Documents/realty-ai/prompts/image-to-image-cinematic.txt)

### 5. Video prompt and scene generation
The app builds scene prompts from:

- the selected theme
- the room category
- motion rules from [/Users/ai/Documents/realty-ai/prompts/image-to-video.txt](/Users/ai/Documents/realty-ai/prompts/image-to-video.txt)
- TV / fireplace / driveway / structural-fidelity constraints
- composition rules for fuller room coverage, especially for living rooms with multiple angles

Scene videos are submitted in parallel to Fal-hosted image-to-video models and polled until completion.

### 6. Final MP4 assembly
Once all selected scene clips are ready, the app automatically builds one downloadable MP4 with the selected music track.

The manual **Build Downloadable Video** button remains available as a fallback in case the automatic export path gets stuck.

## Main Product Behaviors

### Theme-aware generation
Themes affect both UI presentation and the prompt direction used for generated scenes.

### Time-capped selection
Users can choose a maximum video length. The app then selects the strongest shots while trying to preserve major spaces and at least one strong full-room view in multi-angle room groups.

### Scene-level reruns
Each scene can be regenerated independently with per-scene overrides for:

- furniture
- TV
- fireplace

### TV content
The app supports multiple TV content choices, with **Coral Fish** as the default.

### Music
The app includes bundled music choices for preview and final MP4 export.

## Realty AI Architecture Notes

Architecture board: [Miro system architecture](https://miro.com/app/board/uXjVHVvAHso=/?share_link_id=871520632634)

### Runtime Shape

- No-build browser app served by `server.mjs`
- `index.html` loads `/runtime-config.js`, `/src/styles.css`, and `/src/app.js`
- `server.mjs` is the local Node HTTP API, static file server, Fal proxy/orchestrator, OpenAI analysis caller, and local export server
- Browser state persists project/settings in localStorage and generated video blobs in IndexedDB

### Main Pipeline

1. User uploads a photoshoot in the browser.
2. Browser compresses and sorts images, then uploads them through `/api/render/upload` to Fal CDN.
3. OpenAI Responses API inspects public Fal image URLs for room grouping, furniture need, visible TV, TV placement suitability, and unlit fireplace detection.
4. If staging is enabled, Fal Nano Banana edits images to add/fix TVs and furniture. TV screen content comes from selected TV scenes such as Coral Fish, Nature, Mountains, Snow, or Beach.
5. If fireplace fire is enabled, OpenAI gates the edit with a `0.96` confidence threshold, then Fal Nano Banana adds a subtle contained fire only inside an existing firebox.
6. If cinematic mode is selected, the app applies a two-step cinematic HDR image process before video generation.
7. Browser ranks photos against the selected duration cap, prioritizing hero exterior, arrival, living, kitchen, primary bedroom, bath, and outdoor spaces while skipping lower-priority duplicates/details when needed.
8. Each selected image becomes a scene prompt for Fal Seedance image-to-video through `/api/render/shot`.
9. Browser polls `/api/render/resolve` until scene video URLs are ready.
10. Final player stitches the video sequence in browser using canvas capture and MediaRecorder, adds selected music via Web Audio, stores the blob in IndexedDB, then publishes it through `/api/video/export/:id` to the local `exports/` folder.

### Provider Boundaries

- Fal key stays server-side in `.env`
- OpenAI key stays server-side in `.env`; the browser only receives boolean readiness flags from `/runtime-config.js`
- Fal CDN hosts intermediate image assets and Fal queue APIs produce staged images and Seedance videos

### Notable Product Controls

- Theme/style selection controls mood, palette, movement, and prompt tone
- TV screen scene selection controls what visible/added TVs display
- Staging, fireplace fire, driveway shadow softening, image treatment, target duration, scene rerun, and music are all user-adjustable
- Scene-level reruns allow manual add/fix/remove behavior for furniture, TV, and fireplace instead of only project defaults

### Architecture Observations

- The system is still a compact prototype but has a substantial production pipeline: detection, image edits, video generation, selection logic, polling, music, and export
- `server.mjs` has a broad role and may become the first file to split if the project grows
- The strongest safety design is server-side key isolation; the main reliability risk is many external model calls in sequence before final rendering

## Tech Stack

- **Frontend:** plain HTML, CSS, and browser-side JavaScript
- **Backend:** `server.mjs` Node server
- **Media generation:** Fal-hosted image and video models
- **Scene analysis / planning:** OpenAI API via server-side `.env` keys
- **Persistence:** localStorage + IndexedDB

## Project Structure

```text
realty-ai/
  assets/        Music and static assets
  exports/       Exported downloadable video files
  prompts/       Prompt kits for HDR, cinematic image-to-image, and motion
  src/           Main browser app
  server.mjs     Local server and API endpoints
  tools/         Local helper scripts
  README.md
```

## Setup

### Requirements

- Node.js 18+
- Fal API key
- OpenAI API key for server-side analysis steps

### Environment

Create `.env` from `.env.example` and set:

```bash
FAL_KEY=...
OPENAI_API_KEY=...
# or OPEN_API_KEY=...
OPENAI_MODEL=gpt-5
```

Notes:

- Fal is used for asset upload, image editing, and image-to-video render requests.
- OpenAI is used by the app server for room grouping, furniture checks, fireplace checks, and related planning/analysis steps.
- These keys are used by the project code only. They do not replace the account-backed runtime used by the Codex chat itself.

## Running Locally

```bash
npm run dev
```

or:

```bash
node server.mjs
```

Open the local URL printed by the server.

## Important Prompt Files

- [/Users/ai/Documents/realty-ai/prompts/HDR-process.txt](/Users/ai/Documents/realty-ai/prompts/HDR-process.txt)
- [/Users/ai/Documents/realty-ai/prompts/image-to-image-cinematic.txt](/Users/ai/Documents/realty-ai/prompts/image-to-image-cinematic.txt)
- [/Users/ai/Documents/realty-ai/prompts/image-to-video.txt](/Users/ai/Documents/realty-ai/prompts/image-to-video.txt)

These prompt files drive the app's cinematic treatment and motion behavior.

## Current Limitations

- Video generation quality still depends heavily on the source photos and model behavior.
- Structural hallucinations are reduced with prompt constraints, but image-to-video models can still drift.
- Browser-side MP4 assembly depends on local MediaRecorder support.
- Miro integration requires authenticated MCP access in the active Codex session.

## Product Goal

The goal is to make a normal edited photoshoot feel like it was captured and edited by a skilled real estate videographer:

- better light shaping
- better motion direction
- better sequencing
- better consistency
- one final polished deliverable

That is the core zero-to-one behavior this prototype is exploring.
