# AutoHDR Motion Studio

A zero-to-one prototype for automated real estate photo-to-video generation.

The app lets a photographer upload edited property photos, choose or create a creator style, automatically map photos into a cinematic storyboard, tune shots in a web timeline, and export a reproducible project JSON that can be sent to image-to-image and photo-to-video models.

## Run

```bash
node server.mjs
```

Open the local URL printed by the server.

## Optional Provider Setup

Create `.env` from `.env.example` and set:

```bash
FAL_KEY=...
OPENAI_API_KEY=...
# or OPEN_API_KEY=...
OPENAI_MODEL=gpt-5
```

Fal is used for CDN asset upload plus image-to-video render queue submission. Uploaded browser images are first converted into Fal media URLs, then submitted to Seedance/Kling-style video endpoints so the model can fetch them reliably. OpenAI prompt refinement uses `OPENAI_API_KEY` or `OPEN_API_KEY` only from this project's `.env`; it does not use Codex's ambient GPT/OpenAI credentials or ChatGPT plan capacity. Both keys stay server-side; the browser only receives boolean readiness flags.

## Product Shape

- Upload a photoshoot and classify each image by room/use case.
- Pick a creator style such as Ski House, Editorial Timelapse, Airy Luxury, or build a custom style.
- Optionally inspect each uploaded photo first, then run Fal Nano Banana staging only for rooms that are actually vacant or sparse; already-furnished rooms are left unchanged.
- Optionally inspect for visible unlit fireplaces, then run a targeted Nano Banana edit to add a subtle contained fire and warm glow only inside the existing firebox.
- Generate a timestamped storyboard with prompts, movements, durations, model settings, and beat cuts.
- Edit/reorder/replace shots in a timeline.
- Export a reproducible project file for render workers.
