import { analyzeFireplaceNeed, analyzeFurnitureNeed, analyzeRoomGroups, hasFalKey, resolveRenderJob, stageRenderImage, submitRenderJob, uploadRenderAsset } from "./lib/falClient.js";

const themes = [
  {
    id: "ski-house",
    name: "Ski House",
    creator: "JT Visuals style",
    movement: "premium reveal sequence",
    palette: ["#1c2d3a", "#886e55", "#cdb89d"],
    surface: "linear-gradient(135deg, rgba(17, 31, 43, 0.96), rgba(48, 67, 84, 0.9) 52%, rgba(133, 106, 82, 0.84))",
    atmosphere: "Crisp alpine reveal with cool stone, wood warmth, and premium arrival energy.",
    lightLabel: "Cool alpine light",
    motionLabel: "Reveal + glide",
    bestFor: "Mountain homes, dramatic exteriors, premium entries",
    prompt:
      "Luxury ski-house real estate video sequence. Smooth cinematic motion, premium architectural reveals, crisp mountain-resort editorial light, stable geometry, photorealistic texture, no text."
  },
  {
    id: "editorial-timelapse",
    name: "Editorial Timelapse",
    creator: "Directional shadow style",
    movement: "slow trucks and light movement",
    palette: ["#d7c6a1", "#8b6a43", "#2e2a24"],
    surface: "linear-gradient(135deg, rgba(207, 189, 150, 0.96), rgba(147, 111, 70, 0.88) 48%, rgba(38, 34, 30, 0.92))",
    atmosphere: "Architectural light-play with directional shadows, texture, and slow editorial drift.",
    lightLabel: "Moving sun shadows",
    motionLabel: "Slow truck + time drift",
    bestFor: "Designer interiors, texture, light-play moments",
    prompt:
      "Editorial real estate video sequence. Slow trucking movement, natural directional light progression, shadows crawl across surfaces, stable architecture, polished cinematic realism, no text."
  },
  {
    id: "airy-luxury",
    name: "Airy Luxury",
    creator: "Bright luxury style",
    movement: "soft dolly sequence",
    palette: ["#f2eadf", "#d4c1a9", "#b7c6ce"],
    surface: "linear-gradient(135deg, rgba(245, 238, 229, 0.98), rgba(219, 204, 185, 0.92) 50%, rgba(178, 197, 206, 0.88))",
    atmosphere: "Open, sunlit, and inviting with bright windows, quiet motion, and clean luxury.",
    lightLabel: "Bright open daylight",
    motionLabel: "Soft dolly in",
    bestFor: "Clean bright listings, family homes, coastal interiors",
    prompt:
      "Bright airy luxury real estate video sequence. Smooth dolly motion, inviting clean interiors, gentle dimensional shadows, saturated window views, stable camera, photorealistic, no text."
  },
  {
    id: "moody-modern",
    name: "Moody Modern",
    creator: "High-contrast modern style",
    movement: "slow parallax sequence",
    palette: ["#1f2124", "#5e4d3e", "#b38e67"],
    surface: "linear-gradient(135deg, rgba(19, 21, 24, 0.98), rgba(58, 46, 38, 0.9) 48%, rgba(164, 127, 89, 0.82))",
    atmosphere: "Sculptural contrast, warm materials, and slower cinematic motion for modern homes.",
    lightLabel: "Warm contrast",
    motionLabel: "Parallax + hold",
    bestFor: "Modern architecture, darker wood, sculptural interiors",
    prompt:
      "Moody modern real estate video sequence. Slow parallax movement, deep contrast, warm accents, premium glass stone and wood textures, stable vertical lines, cinematic, no text."
  }
];

const PROJECT_KEY = "autohdr.oneVideoProject.v2";
const SETTINGS_KEY = "autohdr.settings.v3";
const VIDEO_DB_NAME = "autohdr-video-store";
const VIDEO_STORE_NAME = "videos";
const POLL_MS = 30000;
const FURNITURE_PROMPT =
  "Use the virtually staged furniture as fixed, real objects in the room. Keep furniture stable during camera motion with no morphing, object drift, flicker, or sudden style changes. Never change architecture or invent structural features.";
const STAGING_IMAGE_PROMPT =
  "Stage this vacant or sparse room with tasteful contemporary real estate furniture. Preserve architecture, windows, doors, flooring, wall color, built-ins, camera angle, perspective, lighting, and exterior views. Keep scale realistic, styling uncluttered, and do not add people, text, or impossible objects.";
const CINEMATIC_IMAGE_PROMPT =
  "Transform this photo into a cinematic editorial image with controlled, natural directional light shaping. Correct any perspective distortion so vertical lines are truly vertical and horizontal lines are level. Maintain the exact scene composition after correction and preserve the original white balance. Respect the source image's existing sunlight and shadow intensity: if the original light is subtle, keep it subtle; do not exaggerate sun patches, window streaks, or shadow contrast beyond what the scene can naturally support. Balance overall exposure with intention: raise interior midtones subtly for improved readability and presence, while preserving gentle, sculpted shadow structure and clean contrast. The interior should feel brighter and more intentional, not flat or evenly lit. Highlights should stay controlled and natural. Apply intentional, filmic window pulls that reveal deep, rich exterior views and preserve sky density, environmental color, and contrast beyond the glass. Exterior scenes should feel dimensional and weighty, never washed out or pastel. Window highlights must roll off smoothly with realistic falloff; avoid haloing, edge glow, or global tonal compression. Do not flatten contrast or lift blacks globally. Window recovery should feel localized, natural, and optically believable, similar to a well-exposed negative rather than HDR processing. Preserve all architectural and interior details. The scene should feel well-lit, polished, and cinematic without becoming overly moody or artificially shadowed. Derive all lighting direction strictly from visible sources in the frame, including windows, doors, architectural openings, and practical fixtures. Do not introduce light from walls or areas without logical entry points.";
const CINEMATIC_DETAIL_IMAGE_PROMPT =
  "Extreme close-up detail shot with smooth tracking camera following subtle directional light as it grows and spreads across textured surface. Keep the sunlight and shadow pattern restrained and believable to the source scene; do not amplify the light into heavy stripes or overly dramatic contrast if the original scene is softer. Gentle shadow edges may crawl and shift in real time. Camera moves with the light's path revealing texture in wood grain, fabric weave, and architectural detail. Editorial film style. Neutral white balance, balanced exposure, dimensional contrast without underexposure, and shallow depth of field. Preserve exact architecture, materials, and believable real-estate detail while reframing into a cinematic editorial close-up.";
const HDR_TIMELAPSE_VIDEO_PROMPT =
  "Very slow truck right, time-lapse light progression, camera slides laterally while light shifts across the space, shadows gradually move and lengthen, parallax effect, consistent exposure, stable motion, cinematic, photorealistic. Keep the sunlight progression restrained and believable to the source image; if the original scene has subtle sun and shade, preserve that subtlety and avoid exaggerated shadow bands or dramatic darkening.";
const TV_IMAGE_PROMPT =
  "Add one tasteful modern TV before furniture staging. Place it only where a professional stager would naturally put a TV, keep it correctly scaled and aligned, and preserve architecture, lighting, perspective, materials, and exterior views. Do not add any other furniture, people, text, logos, or UI in this step.";
const FIREPLACE_PROMPT =
  "If a fireplace fire was added, keep it subtle, warm, and physically contained inside the existing fireplace during camera motion. Preserve stable flames, gentle amber glow, realistic reflections, no smoke, no sparks outside the firebox, and no flicker artifacts. Never create a new fireplace or alter walls, openings, or structure.";
const FIREPLACE_IMAGE_PROMPT =
  "Add a subtle realistic warm fire only inside the existing fireplace or firebox. Keep the flame small, tasteful, and physically contained. Preserve architecture, furniture, decor, materials, windows, camera angle, perspective, and room layout. Do not add smoke, text, watermarks, structural changes, or any new fireplace.";
const DRIVEWAY_SURFACE_PROMPT =
  "For exterior arrival shots with visible driveway or hardscape, reduce harsh midday shadow contrast on the pavement. If it helps, give the driveway a very subtle freshly misted or lightly wet finish to soften glare and improve reflections. Keep it believable, premium, and restrained. Do not make the scene look rainy, puddled, flooded, or artificially glossy.";
const STRUCTURE_LOCK_PROMPT =
  "Preserve the exact architecture from the source image. Do not invent or remove fireplaces, fireboxes, outdoor kitchen elements, built-ins, wall openings, alcoves, columns, chimneys, fountains, windows, doors, rooflines, or any other structural feature. If a feature is not clearly visible in the source image, it must not appear in the video.";
const VIDEO_MOVEMENTS = {
  dollyIn: "Super smooth camera moves forward in straight line through space, cinematic.",
  dollyInTimelapse: "Super smooth camera moves forward in straight line through space, time-lapse light progression, shadows gradually move and lengthen, parallax effect, consistent exposure, stable motion, cinematic, photorealistic.",
  droneTopDownDescend: "Super smooth camera descends in a straight line through space, cinematic.",
  dollyOut: "Super smooth camera moves backward in straight line revealing space, cinematic.",
  truckLeftToRight: "Super smooth camera glides horizontally from left to right, parallel path, cinematic.",
  truckRightToLeft: "Super smooth camera glides horizontally from right to left, parallel path, cinematic.",
  parallaxOrbit: "Super smooth camera travels in arc around subject, subject stays centered, cinematic.",
  dollyPanRight: "Super smooth camera moves forward while rotating gradually right, curved path, cinematic.",
  craneUp: "Super smooth camera rises vertically upward, straight vertical path, cinematic.",
  craneDown: "Super smooth camera descends vertically downward, straight vertical path, cinematic.",
  orbitHyperlapse: "Super smooth camera travels in arc around subject, subject stays centered, sky hyperlapses naturally in the background, cinematic.",
  wideSlide: "Wide interior shot with slow trucking movement side to side as harsh directional light moves and expands across walls, furnishings, and architectural surfaces. Crisp shadow edges in motion. Editorial film style. Neutral white balance, balanced exposure, smooth parallel motion, atmospheric architectural cinematography.",
  wideDollyIn: "Wide interior shot with a slow and smooth dolly in. Dramatic shadows crawl and shift across surfaces and furnishings. Editorial film style. Neutral white balance, balanced exposure, smooth motion, atmospheric architectural cinematography.",
  tightTruck: "Tight interior shot with slow trucking movement side to side as directional light moves across textured surfaces. Crisp shadows shift gently. Editorial film style. Neutral white balance, balanced exposure, smooth parallel motion."
};

const DEFAULT_MUSIC_ID = "sunlit-drive";
const DEFAULT_TV_SCENE_ID = "coral-fish";
const STAGING_VERSION = 2;
const SCENE_DURATION_SECONDS = 5;
const MIN_TARGET_DURATION_SEC = 15;
const MAX_TARGET_DURATION_SEC = 600;
const TARGET_DURATION_STEP_SEC = 15;
const sceneTreatmentOptions = {
  furniture: [
    { value: "project", label: "Furniture: Project" },
    { value: "add", label: "Furniture: Add" },
    { value: "fix", label: "Furniture: Fix" },
    { value: "remove", label: "Furniture: Remove" }
  ],
  tv: [
    { value: "project", label: "TV: Project" },
    { value: "add", label: "TV: Add" },
    { value: "fix", label: "TV: Fix" },
    { value: "remove", label: "TV: Remove" }
  ],
  fireplace: [
    { value: "project", label: "Fireplace: Project" },
    { value: "add", label: "Fireplace: Add" },
    { value: "fix", label: "Fireplace: Fix" },
    { value: "remove", label: "Fireplace: Remove" }
  ]
};
const imageTreatmentOptions = [
  {
    id: "cinematic",
    name: "Cinematic",
    description: "Editorial shadows, stronger window pulls, more intentional contrast."
  },
  {
    id: "natural",
    name: "Natural",
    description: "Keeps the image treatment more restrained and closer to the source look."
  }
];
const tvScenes = [
  {
    id: "coral-fish",
    name: "Coral Fish",
    label: "Default",
    prompt: "a vivid coral reef fish video with colorful tropical fish, reef texture, clean blue water, and subtle underwater movement",
    motionPrompt: "a calm coral reef fish video with tropical fish drifting across the TV screen"
  },
  {
    id: "nature",
    name: "Nature",
    label: "Forest",
    prompt: "a serene nature video with green forest light, leaves moving gently, and soft sun filtering through trees",
    motionPrompt: "a peaceful forest nature video with subtle moving leaves and sunlight"
  },
  {
    id: "mountains",
    name: "Mountains",
    label: "Alpine",
    prompt: "a cinematic mountain landscape video with alpine peaks, soft clouds, and clean daylight",
    motionPrompt: "a cinematic mountain landscape video with slow clouds moving over alpine peaks"
  },
  {
    id: "snow",
    name: "Snow",
    label: "Winter",
    prompt: "a tasteful snowy winter landscape video with falling snow, soft white texture, and a cozy alpine feeling",
    motionPrompt: "a snowy winter landscape video with gentle falling snow"
  },
  {
    id: "beach",
    name: "Beach",
    label: "Coastal",
    prompt: "a bright beach video with turquoise water, soft waves, pale sand, and sunny coastal atmosphere",
    motionPrompt: "a relaxed beach video with soft turquoise waves moving on the TV screen"
  }
];

const musicTracks = [
  {
    id: "sunlit-drive",
    name: "Sunlit Drive",
    vibe: "Polished upbeat house groove with cleaner commercial energy.",
    category: "Studio",
    source: "/assets/music/sunlit-drive.wav",
    bpm: 122,
    gain: 0.22
  },
  {
    id: "coastal-glide",
    name: "Coastal Glide",
    vibe: "Light coastal pulse with smoother pads and airy lift.",
    category: "Studio",
    source: "/assets/music/coastal-glide.wav",
    bpm: 108,
    gain: 0.22
  },
  {
    id: "summit-arrival",
    name: "Summit Arrival",
    vibe: "Cinematic modern drive for luxe reveals and hero spaces.",
    category: "Studio",
    source: "/assets/music/summit-arrival.wav",
    bpm: 118,
    gain: 0.22
  },
  {
    id: "open-house-drive",
    name: "Open House Drive",
    vibe: "Upbeat pulse for fast premium walkthroughs.",
    category: "Built-in",
    arrangement: "house",
    bpm: 122,
    root: 220,
    chords: [
      [1, 1.25, 1.5, 2],
      [0.89, 1.125, 1.333, 1.78],
      [1.125, 1.333, 1.667, 2.25],
      [0.75, 1, 1.25, 1.5]
    ],
    melodySteps: [7, 9, 11, 14, 11, 9, 7, 4],
    bassSteps: [0, 0, 5, 4],
    padWave: "sawtooth",
    leadWave: "square",
    bassWave: "sawtooth",
    gain: 0.16
  },
  {
    id: "luxury-lift",
    name: "Luxury Lift",
    vibe: "Bright cinematic momentum with polished accents.",
    category: "Built-in",
    arrangement: "cinematic",
    bpm: 98,
    root: 196,
    chords: [
      [1, 1.25, 1.5, 2],
      [1.125, 1.333, 1.667, 2.25],
      [0.75, 1, 1.5, 1.875],
      [0.84, 1.125, 1.333, 1.667]
    ],
    melodySteps: [11, 14, 16, 14, 11, 9, 7, 11],
    bassSteps: [0, 7, 5, 4],
    padWave: "triangle",
    leadWave: "sine",
    bassWave: "sine",
    gain: 0.18
  },
  {
    id: "modern-spark",
    name: "Modern Spark",
    vibe: "Crisp plucks and confident rhythmic movement.",
    category: "Built-in",
    arrangement: "minimal",
    bpm: 116,
    root: 246.94,
    chords: [
      [1, 1.2, 1.5, 1.875],
      [0.8, 1, 1.25, 1.6],
      [1.125, 1.333, 1.667, 2],
      [0.9, 1.2, 1.5, 1.8]
    ],
    melodySteps: [0, 7, 4, 11, 7, 14, 11, 16],
    bassSteps: [0, 3, 0, 7],
    padWave: "sine",
    leadWave: "triangle",
    bassWave: "square",
    gain: 0.15
  },
  {
    id: "arrival-energy",
    name: "Arrival Energy",
    vibe: "Warm bass and quicker lift for exterior reveals.",
    category: "Built-in",
    arrangement: "drive",
    bpm: 128,
    root: 174.61,
    chords: [
      [1, 1.25, 1.667, 2],
      [1.125, 1.333, 1.667, 2.25],
      [0.667, 1, 1.25, 1.667],
      [0.75, 1, 1.5, 2]
    ],
    melodySteps: [7, 7, 14, 11, 9, 9, 16, 14],
    bassSteps: [0, 0, 7, 5],
    padWave: "triangle",
    leadWave: "sawtooth",
    bassWave: "square",
    gain: 0.17
  }
];

const initialSettings = loadSettings();
let musicPreview = null;

const state = {
  selectedThemeId: initialSettings.selectedThemeId ?? "ski-house",
  selectedMusicId: musicTracks.some((track) => track.id === initialSettings.selectedMusicId) ? initialSettings.selectedMusicId : DEFAULT_MUSIC_ID,
  selectedTvSceneId: tvScenes.some((scene) => scene.id === initialSettings.selectedTvSceneId) ? initialSettings.selectedTvSceneId : DEFAULT_TV_SCENE_ID,
  selectedImageTreatmentId: imageTreatmentOptions.some((option) => option.id === initialSettings.selectedImageTreatmentId) ? initialSettings.selectedImageTreatmentId : "cinematic",
  targetDurationSec: clampTargetDuration(initialSettings.targetDurationSec),
  addFurniture: initialSettings.addFurniture ?? true,
  addFireplaceFire: initialSettings.addFireplaceFire ?? true,
  softenDrivewayShadows: initialSettings.softenDrivewayShadows ?? true,
  previewingMusicId: "",
  files: [],
  project: loadProject(),
  pollers: {},
  activeFinalClip: 0,
  downloadableVideoUrl: "",
  activeSceneEditorId: "",
  isGenerating: false
};

function render() {
  markStaleSubmissions();
  markExportMusicStale();
  saveProject();
  restoreDownloadableVideo();
  const theme = getTheme();
  document.querySelector("#root").innerHTML = `
    <main class="simple-app theme-shell theme-${escapeHtml(theme.id)}">
      <header class="simple-header theme-home" style="background:${escapeHtml(theme.surface ?? "#fffdf8")}">
        <div>
          <span class="eyebrow">AutoHDR</span>
          <h1>One Video From Multiple Photos</h1>
          <p>${escapeHtml(theme.atmosphere ?? "Upload a full photoshoot, pick a style, and generate one final themed video sequence with Fal Seedance 2.0.")}</p>
          <div class="theme-home-cues">
            <span>${escapeHtml(theme.name)}</span>
            <span>${escapeHtml(theme.lightLabel ?? "")}</span>
            <span>${escapeHtml(theme.motionLabel ?? "")}</span>
          </div>
        </div>
        <div class="theme-home-preview" aria-hidden="true">
          <div class="theme-home-frame">
            <div class="theme-home-band">
              ${(theme.palette ?? []).map((color, index) => `<span class="theme-home-band-${index + 1}" style="background:${escapeHtml(color)}"></span>`).join("")}
            </div>
            <div class="theme-home-copy">
              <strong>${escapeHtml(theme.creator)}</strong>
              <span>${escapeHtml(theme.bestFor ?? theme.movement)}</span>
            </div>
          </div>
        </div>
        <div class="header-actions">
          ${state.files.length ? `<button class="ghost-button" data-action="rerun-project" ${state.isGenerating ? "disabled" : ""}>Rerun Pipeline</button>` : ""}
          <button class="primary-button" data-action="generate-project" ${state.files.length && !state.isGenerating ? "" : "disabled"}>
            ${icon("play", "M8 5v14l11-7Z")}
            ${state.isGenerating ? "Generating..." : "Generate Final Video"}
          </button>
        </div>
      </header>

      <section class="simple-layout">
        <aside class="simple-panel">
          <h2>1. Upload Photoshoot</h2>
          <label class="simple-upload">
            <input id="file-input" type="file" accept="image/*" multiple />
            ${icon("upload", "M12 3v12M7 8l5-5 5 5M5 21h14")}
            <strong>Choose multiple photos</strong>
            <span>Each uploaded photo becomes one scene in the final video sequence.</span>
          </label>

          <h2>2. Pick Theme</h2>
          <div class="theme-list">
            ${themes.map(themeCard).join("")}
          </div>
          <div class="theme-inline-preview" aria-hidden="true">
            <div class="theme-inline-header">
              <strong>${escapeHtml(theme.name)}</strong>
              <span>${escapeHtml(theme.lightLabel ?? "")}</span>
            </div>
            <div class="theme-home-frame theme-inline-frame">
              <div class="theme-home-band">
                ${(theme.palette ?? []).map((color, index) => `<span class="theme-home-band-${index + 1}" style="background:${escapeHtml(color)}"></span>`).join("")}
              </div>
              <div class="theme-home-copy">
                <strong>${escapeHtml(theme.motionLabel ?? "")}</strong>
                <span>${escapeHtml(theme.bestFor ?? theme.movement)}</span>
              </div>
            </div>
          </div>

          <h2>Room Treatment</h2>
          <div class="image-treatment-list">
            ${imageTreatmentOptions.map(imageTreatmentCard).join("")}
          </div>
          <label class="option-card ${state.addFurniture ? "selected" : ""}">
            <input type="checkbox" data-action="toggle-furniture" ${state.addFurniture ? "checked" : ""} />
            <span>
              <strong>Enable staging</strong>
              <small>Adds TV first if it belongs, then stages furniture around it with shared room styling.</small>
            </span>
          </label>
          <div class="tv-section">
            <div class="mini-section-title">
              <strong>TV screen</strong>
              <small>Used for existing TVs by default, and for newly added TVs when staging is enabled.</small>
            </div>
            <div class="tv-list">
              ${tvScenes.map(tvSceneCard).join("")}
            </div>
          </div>
          <label class="option-card ${state.addFireplaceFire ? "selected" : ""}">
            <input type="checkbox" data-action="toggle-fireplace" ${state.addFireplaceFire ? "checked" : ""} />
            <span>
              <strong>Add subtle fire to fireplaces</strong>
              <small>Only when an unlit fireplace is visible.</small>
            </span>
          </label>
          <label class="option-card ${state.softenDrivewayShadows ? "selected" : ""}">
            <input type="checkbox" data-action="toggle-driveway-shadows" ${state.softenDrivewayShadows ? "checked" : ""} />
            <span>
              <strong>Soften driveway shadows</strong>
              <small>Uses a lightly misted driveway look on exterior arrival shots when it improves the image.</small>
            </span>
          </label>

          <h2>Music</h2>
          <div class="music-list">
            ${musicTracks.map(musicCard).join("")}
          </div>

          <h2>Video Length</h2>
          <div class="duration-control">
            <div class="duration-header">
              <strong>${formatDuration(state.targetDurationSec)}</strong>
              <span>Up to ${estimateSceneCount(state.targetDurationSec)} scenes</span>
            </div>
            <input
              id="duration-input"
              class="duration-slider"
              type="range"
              min="${MIN_TARGET_DURATION_SEC}"
              max="${MAX_TARGET_DURATION_SEC}"
              step="${TARGET_DURATION_STEP_SEC}"
              value="${state.targetDurationSec}"
            />
            <div class="duration-scale">
              <span>15s</span>
              <span>2m</span>
              <span>5m</span>
              <span>10m</span>
            </div>
          </div>
          <p class="duration-note">This is a hard cap. The final cut can run shorter, but it will never exceed the selected length. Major spaces are prioritized first, with stronger supporting shots filling the remaining room.</p>
        </aside>

        <section class="simple-panel main-simple-panel">
          <div class="section-title">
            <div>
              <h2>3. Final Video Project</h2>
              <p>${escapeHtml(theme.name)} - ${escapeHtml(theme.movement)}</p>
            </div>
            <button class="ghost-button compact" data-action="clear-project">Clear Project</button>
          </div>

          <h2>Uploaded Sequence</h2>
          <div class="file-grid sequence-grid">
            ${state.files.length ? state.files.map(fileCard).join("") : emptyState("Upload two or more photos for a stronger final sequence.")}
          </div>

          <h2 class="results-heading">Progress</h2>
          ${state.project ? projectPanel(state.project) : emptyState("Click Generate Final Video to submit one project to Fal.")}
        </section>
      </section>
    </main>
  `;
  bindEvents();
  resumePollers();
  bindFinalPlayer();
}

function bindEvents() {
  document.querySelector("#file-input")?.addEventListener("change", handleFiles);
  document.querySelector("[data-action='generate-project']")?.addEventListener("click", generateProject);
  document.querySelectorAll("[data-action='rerun-project']").forEach((button) => {
    button.addEventListener("click", rerunProject);
  });
  document.querySelector("[data-action='clear-project']")?.addEventListener("click", clearProject);
  document.querySelectorAll("[data-theme-id]").forEach((button) => {
    button.addEventListener("click", () => {
      state.selectedThemeId = button.dataset.themeId;
      saveSettings();
      render();
    });
  });
  document.querySelectorAll("[data-action='select-music']").forEach((button) => {
    button.addEventListener("click", () => selectMusic(button.dataset.musicId));
  });
  document.querySelectorAll("[data-action='preview-music']").forEach((button) => {
    button.addEventListener("click", () => previewMusic(button.dataset.musicId));
  });
  document.querySelectorAll("[data-tv-scene-id]").forEach((button) => {
    button.addEventListener("click", () => selectTvScene(button.dataset.tvSceneId));
  });
  document.querySelectorAll("[data-image-treatment-id]").forEach((button) => {
    button.addEventListener("click", () => selectImageTreatment(button.dataset.imageTreatmentId));
  });
  document.querySelector("#duration-input")?.addEventListener("input", (event) => {
    selectTargetDuration(event.target.value);
  });
  document.querySelector("[data-action='toggle-furniture']")?.addEventListener("change", (event) => {
    state.addFurniture = event.target.checked;
    saveSettings();
    clearFurnitureOutputs();
    resetRuntimeProject();
    render();
  });
  document.querySelector("[data-action='toggle-fireplace']")?.addEventListener("change", (event) => {
    state.addFireplaceFire = event.target.checked;
    saveSettings();
    clearFireplaceOutputs();
    resetRuntimeProject();
    render();
  });
  document.querySelector("[data-action='toggle-driveway-shadows']")?.addEventListener("change", (event) => {
    state.softenDrivewayShadows = event.target.checked;
    saveSettings();
    resetRuntimeProject();
    render();
  });
  document.querySelectorAll("[data-action='check-scene']").forEach((button) => {
    button.addEventListener("click", () => pollScene(button.dataset.sceneId, true));
  });
  document.querySelectorAll("[data-action='retry-scene']").forEach((button) => {
    button.addEventListener("click", () => submitScene(button.dataset.sceneId));
  });
  document.querySelectorAll("[data-action='open-scene-editor']").forEach((button) => {
    button.addEventListener("click", () => openSceneEditor(button.dataset.sceneId));
  });
  document.querySelectorAll("[data-action='close-scene-editor']").forEach((button) => {
    button.addEventListener("click", () => closeSceneEditor(button.dataset.sceneId));
  });
  document.querySelectorAll("[data-action='apply-scene-rerun']").forEach((button) => {
    button.addEventListener("click", () => rerunScene(button.dataset.sceneId));
  });
  document.querySelectorAll("[data-action='scene-adjustment']").forEach((select) => {
    select.addEventListener("change", (event) => {
      const target = event.currentTarget;
      updateSceneAdjustment(target.dataset.sceneId, target.dataset.sceneKey, target.value);
    });
  });
  document.querySelector("[data-action='build-download']")?.addEventListener("click", buildDownloadableVideo);
  document.querySelector("[data-action='download-final']")?.addEventListener("click", handleFinalDownload);
}

async function handleFiles(event) {
  const files = Array.from(event.target.files ?? []);
  resetRuntimeProject();
  state.files = sortFilesForSequence(await Promise.all(files.map(readAndCompressImageFile)));
  render();
}

function readAndCompressImageFile(file, index) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      compressDataUrl(String(reader.result), 1600, 0.84)
        .then((dataUrl) => {
          resolve({
            id: `${file.name}-${file.lastModified}-${file.size}-${index ?? 0}`,
            name: file.name,
            originalIndex: index ?? 0,
            size: estimateDataUrlSize(dataUrl),
            originalSize: file.size,
            dataUrl
          });
        })
        .catch(reject);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function sortFilesForSequence(files) {
  return [...files].sort(compareFilesForSequence);
}

function compareFilesForSequence(left, right) {
  const leftNumber = firstFilenameNumber(left.name);
  const rightNumber = firstFilenameNumber(right.name);

  if (leftNumber !== null && rightNumber !== null && leftNumber !== rightNumber) {
    return leftNumber - rightNumber;
  }
  if (leftNumber !== null && rightNumber === null) return -1;
  if (leftNumber === null && rightNumber !== null) return 1;

  const nameCompare = left.name.localeCompare(right.name, undefined, {
    numeric: true,
    sensitivity: "base"
  });
  return nameCompare || (left.originalIndex ?? 0) - (right.originalIndex ?? 0);
}

function firstFilenameNumber(name) {
  const basename = String(name).replace(/\.[^.]+$/, "");
  const match = basename.match(/\d+/);
  return match ? Number(match[0]) : null;
}

function compressDataUrl(dataUrl, maxDimension, quality) {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => {
      const scale = Math.min(1, maxDimension / Math.max(image.width, image.height));
      const width = Math.max(1, Math.round(image.width * scale));
      const height = Math.max(1, Math.round(image.height * scale));
      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const context = canvas.getContext("2d");
      context.drawImage(image, 0, 0, width, height);
      resolve(canvas.toDataURL("image/jpeg", quality));
    };
    image.onerror = () => reject(new Error("Could not read one uploaded image."));
    image.src = dataUrl;
  });
}

function estimateDataUrlSize(dataUrl) {
  const base64 = dataUrl.split(",")[1] ?? "";
  return Math.round((base64.length * 3) / 4);
}

async function generateProject() {
  if (state.isGenerating) return;

  if (!hasFalKey()) {
    state.project = {
      id: `project-${Date.now()}`,
      status: "missing_key",
      message: "FAL_KEY is missing in .env.",
      clips: []
    };
    render();
    return;
  }

  state.isGenerating = true;
  Object.keys(state.pollers).forEach(stopPolling);
  const theme = getTheme();
  state.project = {
    id: `project-${Date.now()}`,
    themeId: theme.id,
    themeName: theme.name,
    addFurniture: state.addFurniture,
    addFireplaceFire: state.addFireplaceFire,
    tvSceneId: state.selectedTvSceneId,
    tvSceneName: getTvScene().name,
    targetDurationSec: state.targetDurationSec,
    status: "uploading",
    message: `Uploading ${state.files.length} photos to Fal CDN in parallel before video generation...`,
    createdAt: new Date().toISOString(),
    clips: []
  };
  state.files = state.files.map((file) => ({
    ...file,
    uploadStatus: file.falUrl ? "uploaded" : "uploading",
    uploadMessage: file.falUrl ? "Uploaded to Fal CDN." : "Uploading to Fal CDN..."
  }));
  render();

  try {
    state.files = await Promise.all(state.files.map(uploadFileForRender));
    render();
    if (state.addFurniture || state.selectedTvSceneId) {
      state.project = {
        ...state.project,
        status: "staging",
        message: state.addFurniture
          ? "Grouping related room angles for shared staging decisions..."
          : "Checking rooms for visible TVs before video generation..."
      };
      render();
      if (state.addFurniture) {
        const groupingResult = await enrichFilesWithRoomGroups(state.files);
        state.files = groupingResult.files;
        mergeProjectWarnings(groupingResult.warning);
      }
      state.project = {
        ...state.project,
        status: "staging",
        message: state.addFurniture
          ? "Checking which rooms need staging before video generation..."
          : "Preparing visible TV screens before video generation..."
      };
      state.files = state.files.map((file) => ({
        ...file,
        uploadStatus: file.stagedImageUrl ? "staged" : "checking_furniture",
        uploadMessage: file.stagedImageUrl
          ? "Room treatment prepared."
          : state.addFurniture
            ? "Checking if staging is needed..."
            : "Checking for visible TVs..."
      }));
      render();
      const stagingResult = await stageFilesWithFallback(state.files);
      state.files = stagingResult.files;
      mergeProjectWarnings(stagingResult.warning);
      render();
    }
    if (state.addFireplaceFire) {
      state.project = {
        ...state.project,
        status: "staging",
        message: `Checking for unlit fireplaces before video generation...`
      };
      state.files = state.files.map((file) => ({
        ...file,
        uploadStatus: file.fireImageUrl ? "fire_added" : "checking_fireplace",
        uploadMessage: file.fireImageUrl ? "Subtle fire added." : "Checking for an unlit fireplace..."
      }));
      render();
      state.files = await Promise.all(state.files.map(stageFireplaceForRender));
      render();
    }
    if (state.selectedImageTreatmentId === "cinematic") {
      state.project = {
        ...state.project,
        status: "staging",
        message: `Applying cinematic HDR process before video generation...`
      };
      state.files = state.files.map((file) => ({
        ...file,
        uploadStatus: file.treatedImageUrl ? "treated" : "staging",
        uploadMessage: file.treatedImageUrl ? "Cinematic HDR process applied." : "Applying cinematic HDR process..."
      }));
      render();
      const treatmentResult = await applyImageTreatmentWithFallback(state.files);
      state.files = treatmentResult.files;
      mergeProjectWarnings(treatmentResult.warning);
      render();
    }
  } catch (error) {
    markFilesWorkflowFailed(error instanceof Error ? error.message : "Fal asset preparation failed.");
    state.project = {
      ...state.project,
      status: state.addFurniture || state.addFireplaceFire ? "staging_failed" : "upload_failed",
      message: error instanceof Error ? error.message : "Fal asset preparation failed.",
      clips: []
    };
    state.isGenerating = false;
    render();
    return;
  }

  const selection = chooseFilesForTimeline(state.files, state.targetDurationSec);
  mergeProjectWarnings(selection.warning);
  const clips = buildClips(theme, selection.files).map((clip) => ({
    ...clip,
    status: "submitting",
    message: "Submitting in parallel to Fal..."
  }));
  state.project = {
    ...state.project,
    themeId: theme.id,
    themeName: theme.name,
    addFurniture: state.addFurniture,
    addFireplaceFire: state.addFireplaceFire,
    tvSceneId: state.selectedTvSceneId,
    tvSceneName: getTvScene().name,
    targetDurationSec: state.targetDurationSec,
    selectedImageCount: selection.files.length,
    selectionAudit: {
      selected: selection.selected ?? [],
      skipped: selection.skipped ?? []
    },
    status: "submitting",
    message: `Submitting ${clips.length} selected scenes for a final video up to ${formatDuration(state.targetDurationSec)}...`,
    clips
  };
  render();

  await Promise.allSettled(clips.map((clip) => submitScene(clip.id)));
  state.isGenerating = false;
  updateProjectStatus();
  render();
}

function buildClips(theme, files = state.files) {
  return files.map((file, index) =>
    makeClip({
      theme,
      index,
      start: file,
      total: files.length
    })
  );
}

function chooseFilesForTimeline(files, targetDurationSec) {
  const clampedDuration = clampTargetDuration(targetDurationSec);
  const maxScenes = estimateSceneCount(clampedDuration);
  const rankedCandidates = files
    .map((file, index) => ({
      ...file,
      selectionScore: scoreFileForTimeline(file),
      sequenceCategory: classifySequenceCategory(file),
      storyRank: getStoryRank(file),
      originalSequenceIndex: index
    }))
    .sort(compareTimelineCandidates)
    .map((file, index) => ({
      ...file,
      selectionRank: index + 1
    }));
  const rankById = new Map(rankedCandidates.map((file) => [file.id, file.selectionRank]));
  if (files.length <= maxScenes) {
    return {
      files,
      warning: "",
      selected: files.map((file, index) => ({
        id: file.id,
        name: file.name,
        imageUrl: file.fireImageUrl || file.stagedImageUrl || file.dataUrl || file.falUrl || "",
        selectionRank: rankById.get(file.id) ?? index + 1,
        reason: `Selected in original order. Fits within the ${formatDuration(clampedDuration)} cap.`,
        originalSequenceIndex: index
      })),
      skipped: []
    };
  }

  const groups = new Map();
  rankedCandidates.forEach((scored) => {
    const groupKey = scored.roomGroupId || `solo-${scored.id}`;
    if (!groups.has(groupKey)) groups.set(groupKey, []);
    groups.get(groupKey).push(scored);
  });

  const bestPerGroup = Array.from(groups.values())
    .map((group) => group.sort(compareTimelineCandidates)[0])
    .sort(compareTimelineCandidates);

  const selected = [];
  const selectedIds = new Set();
  for (const candidate of bestPerGroup) {
    if (selected.length >= maxScenes) break;
    selected.push(candidate);
    selectedIds.add(candidate.id);
  }

  const leftovers = rankedCandidates
    .filter((file) => !selectedIds.has(file.id))
    .sort(compareTimelineCandidates);

  for (const candidate of leftovers) {
    if (selected.length >= maxScenes) break;
    selected.push(candidate);
    selectedIds.add(candidate.id);
  }

  const ordered = selected.sort(compareSelectedTimelineOrder);
  const skipped = rankedCandidates
    .filter((file) => !selectedIds.has(file.id))
    .map((file) => ({
      id: file.id,
      name: file.name,
      imageUrl: file.fireImageUrl || file.stagedImageUrl || file.dataUrl || file.falUrl || "",
      selectionRank: file.selectionRank,
      reason: explainSkippedFile(file, groups, clampedDuration),
      originalSequenceIndex: file.originalSequenceIndex
    }));
  return {
    files: ordered,
    warning: `${files.length - ordered.length} photo${files.length - ordered.length === 1 ? "" : "s"} were skipped to stay within the ${formatDuration(clampedDuration)} cap while keeping major spaces in the cut.`
    ,
    selected: ordered.map((file) => ({
      id: file.id,
      name: file.name,
      imageUrl: file.fireImageUrl || file.stagedImageUrl || file.dataUrl || file.falUrl || "",
      selectionRank: rankById.get(file.id) ?? file.originalSequenceIndex + 1,
      reason: explainSelectedFile(file),
      originalSequenceIndex: file.originalSequenceIndex
    })),
    skipped
  };
}

function compareTimelineCandidates(left, right) {
  return (right.selectionScore - left.selectionScore) || (left.originalSequenceIndex - right.originalSequenceIndex);
}

function scoreFileForTimeline(file) {
  const text = normalizeSelectionText([file.name, file.roomLabel, file.stagingStyle].filter(Boolean).join(" "));
  let score = 0;
  if (/\baerial|drone|birds[- ]?eye|birds eye|overhead|top[- ]?down\b/.test(text)) score += 126;
  if (/\bfront|facade|exterior|entry|curb|driveway\b/.test(text)) score += 100;
  if (/\bfountain|water feature|pond\b/.test(text)) score += 92;
  if (/\bliving|family|great-room|great room|main room\b/.test(text)) score += 95;
  if (/\bkitchen\b/.test(text)) score += 95;
  if (/\bprimary bedroom|master bedroom|main bedroom\b/.test(text)) score += 88;
  if (/\bbedroom\b/.test(text)) score += 72;
  if (/\bprimary bath|master bath|bathroom|ensuite\b/.test(text)) score += 74;
  if (/\bdining\b/.test(text)) score += 70;
  if (/\bpatio|deck|pool|yard|backyard|outdoor|terrace\b/.test(text)) score += 76;
  if (/\boffice|study|den\b/.test(text)) score += 66;
  if (/\blaundry|mudroom|garage|hall|hallway|closet|detail|close-up|close up\b/.test(text)) score -= 24;
  if (file.roomGroupId) score += 8;
  if (file.tvAdded) score += 2;
  return score;
}

function classifySequenceCategory(file) {
  const text = normalizeSelectionText([file.name, file.roomLabel, file.stagingStyle].filter(Boolean).join(" "));
  if (/\baerial|drone|birds[- ]?eye|birds eye|overhead|top[- ]?down\b/.test(text)) return "hero-aerial";
  if (/\bfountain|water feature|pond\b/.test(text)) return "feature-exterior";
  if (/\bfront|facade|exterior|entry|curb|driveway\b/.test(text)) return "arrival";
  if (/\bliving|family|great-room|great room|main room\b/.test(text)) return "living";
  if (/\bkitchen\b/.test(text)) return "kitchen";
  if (/\bdining\b/.test(text)) return "dining";
  if (/\bprimary bedroom|master bedroom|main bedroom\b/.test(text)) return "primary-bedroom";
  if (/\bprimary bath|master bath|bathroom|ensuite\b/.test(text)) return "bath";
  if (/\bbedroom\b/.test(text)) return "bedroom";
  if (/\boffice|study|den\b/.test(text)) return "office";
  if (/\bpatio|deck|pool|yard|backyard|outdoor|terrace\b/.test(text)) return "outdoor";
  if (/\blaundry|mudroom|garage|hall|hallway|closet\b/.test(text)) return "utility";
  if (/\bdetail|close-up|close up\b/.test(text)) return "detail";
  return "general";
}

function getStoryRank(file) {
  const ranks = {
    "hero-aerial": 0,
    "feature-exterior": 1,
    arrival: 2,
    living: 3,
    kitchen: 4,
    dining: 5,
    "primary-bedroom": 6,
    bath: 7,
    bedroom: 8,
    office: 9,
    outdoor: 10,
    general: 11,
    detail: 12,
    utility: 13
  };
  return ranks[classifySequenceCategory(file)] ?? 11;
}

function compareSelectedTimelineOrder(left, right) {
  return (left.storyRank - right.storyRank) || (left.originalSequenceIndex - right.originalSequenceIndex);
}

function explainSelectedFile(file) {
  const text = normalizeSelectionText([file.name, file.roomLabel, file.stagingStyle].filter(Boolean).join(" "));
  if (/\bfront|facade|exterior|entry|curb|driveway\b/.test(text)) return "Selected as a high-priority exterior or arrival shot.";
  if (/\bliving|family|great-room|great room|main room\b/.test(text)) return "Selected as a major living-area shot.";
  if (/\bkitchen\b/.test(text)) return "Selected as a key kitchen shot.";
  if (/\bprimary bedroom|master bedroom|main bedroom\b/.test(text)) return "Selected as a primary-bedroom shot.";
  if (/\bprimary bath|master bath|bathroom|ensuite\b/.test(text)) return "Selected as a key bathroom shot.";
  if (/\bpatio|deck|pool|yard|backyard|outdoor|terrace\b/.test(text)) return "Selected as a strong outdoor-living shot.";
  if (file.roomGroupId) return "Selected as the strongest angle from this room group.";
  return "Selected to round out the final cut within the time cap.";
}

function explainSkippedFile(file, groups, targetDurationSec) {
  const text = normalizeSelectionText([file.name, file.roomLabel, file.stagingStyle].filter(Boolean).join(" "));
  const groupKey = file.roomGroupId || `solo-${file.id}`;
  const group = groups.get(groupKey) ?? [];
  if (group.length > 1) {
    const label = file.roomLabel || inferRoomLabel(text);
    return `Skipped as a duplicate angle of ${label}.`;
  }
  if (/\blaundry|mudroom|garage|hall|hallway|closet\b/.test(text)) {
    return "Skipped as a lower-priority utility space under the time cap.";
  }
  if (/\bdetail|close-up|close up\b/.test(text)) {
    return "Skipped as a detail shot under the time cap.";
  }
  if (/\boffice|study|den\b/.test(text)) {
    return `Skipped because higher-priority spaces were kept first for the ${formatDuration(targetDurationSec)} cap.`;
  }
  return `Skipped to stay within the ${formatDuration(targetDurationSec)} cap after higher-priority spaces were selected.`;
}

function inferRoomLabel(text) {
  if (/\bliving|family|great-room|great room|main room\b/.test(text)) return "the living room";
  if (/\bkitchen\b/.test(text)) return "the kitchen";
  if (/\bbedroom\b/.test(text)) return "the bedroom";
  if (/\bbathroom|bath|ensuite\b/.test(text)) return "the bathroom";
  if (/\bpatio|deck|pool|yard|backyard|outdoor|terrace\b/.test(text)) return "the outdoor area";
  if (/\bexterior|front|facade|entry\b/.test(text)) return "the exterior";
  return "the same room";
}

function normalizeSelectionText(value) {
  return String(value ?? "").toLowerCase();
}

async function enrichFilesWithRoomGroups(files) {
  if (files.length < 2) return { files, warning: "" };

  try {
    const result = await analyzeRoomGroups({
      images: files.map((file) => ({
        id: file.id,
        imageUrl: file.falUrl,
        fileName: file.name
      }))
    });

    if (!result.ok || !Array.isArray(result.assignments)) {
      return {
        files,
        warning: "Room grouping failed, so staging continued without cross-angle room matching."
      };
    }

    const assignmentMap = new Map(
      result.assignments.map((assignment) => [
        assignment.id,
        {
          roomGroupId: assignment.roomGroupId,
          roomLabel: assignment.roomLabel,
          stagingStyle: assignment.stagingStyle
        }
      ])
    );

    return {
      files: files.map((file) => ({
        ...file,
        ...(assignmentMap.get(file.id) ?? {})
      })),
      warning: ""
    };
  } catch {
    return {
      files,
      warning: "Room grouping failed, so staging continued without cross-angle room matching."
    };
  }
}

async function stageFilesWithFallback(files) {
  const results = await Promise.all(
    files.map(async (file) => {
      try {
        return await stageFileForRender(file);
      } catch (error) {
        const message = error instanceof Error ? error.message : "Staging failed.";
        return {
          ...file,
          stagingError: message,
          uploadStatus: "kept",
          uploadMessage: `Staging failed. Used original image. ${summarizeStageError(message)}`
        };
      }
    })
  );

  const failed = results.filter((file) => file.stagingError);
  return {
    files: results,
    warning: failed.length
      ? `${failed.length} photo${failed.length === 1 ? "" : "s"} could not be staged and continued with the original image. First error: ${summarizeStageError(failed[0].stagingError)}`
      : ""
  };
}

function summarizeStageError(message) {
  if (!message) return "";
  if (message.length <= 120) return message;
  return `${message.slice(0, 117)}...`;
}

async function applyImageTreatmentForRender(file) {
  if (state.selectedImageTreatmentId !== "cinematic") return file;
  const sourceImageUrl = file.fireImageUrl ?? file.stagedImageUrl ?? file.falUrl ?? file.dataUrl;
  if (!sourceImageUrl) return file;

  const cinematicResult = await stageRenderImage({
    imageUrl: sourceImageUrl,
    fileName: file.name,
    prompt: CINEMATIC_IMAGE_PROMPT
  });
  if (!cinematicResult.ok || !cinematicResult.imageUrl) {
    const message = cinematicResult.message ?? cinematicResult.data?.message ?? "Cinematic treatment failed.";
    throw new Error(`Could not create cinematic base for ${file.name}: ${message}`);
  }

  const detailResult = await stageRenderImage({
    imageUrl: cinematicResult.imageUrl,
    fileName: file.name,
    prompt: CINEMATIC_DETAIL_IMAGE_PROMPT
  });
  if (!detailResult.ok || !detailResult.imageUrl) {
    const message = detailResult.message ?? detailResult.data?.message ?? "Cinematic detail treatment failed.";
    throw new Error(`Could not create cinematic detail for ${file.name}: ${message}`);
  }

  return {
    ...file,
    cinematicBaseImageUrl: cinematicResult.imageUrl,
    treatedImageUrl: detailResult.imageUrl,
    uploadStatus: "treated",
    uploadMessage: "Cinematic HDR process applied."
  };
}

async function applyImageTreatmentWithFallback(files) {
  const results = await Promise.all(
    files.map(async (file) => {
      try {
        return await applyImageTreatmentForRender(file);
      } catch (error) {
        const message = error instanceof Error ? error.message : "Image treatment failed.";
        return {
          ...file,
          treatmentError: message,
          uploadMessage: `${file.uploadMessage ?? "Kept original."} Cinematic treatment skipped. ${summarizeStageError(message)}`
        };
      }
    })
  );
  const failed = results.filter((file) => file.treatmentError);
  return {
    files: results,
    warning: failed.length
      ? `${failed.length} photo${failed.length === 1 ? "" : "s"} could not complete the cinematic HDR process and continued with the prior image. First error: ${summarizeStageError(failed[0].treatmentError)}`
      : ""
  };
}

function mergeProjectWarnings(warning) {
  if (!warning || !state.project) return;
  const existing = Array.isArray(state.project.warnings) ? state.project.warnings : [];
  if (existing.includes(warning)) return;
  state.project.warnings = [...existing, warning];
}

function buildTvStagingPrompt(analysis) {
  const tvScene = getTvScene();
  return [
    TV_IMAGE_PROMPT,
    `The pre-furniture analysis says a TV makes sense here: ${analysis.tvReason || "the room has a natural viewing wall or media-zone layout."}`,
    `The TV screen must show ${tvScene.prompt}.`,
    "The TV content must be contained inside the screen only, with no text overlays, logos, UI controls, watermarks, people, or impossible reflections."
  ].join(" ");
}

function buildExistingTvPrompt(analysis) {
  const tvScene = getTvScene();
  return [
    "An existing TV is already visible in this room.",
    `Replace only the visible TV screen content so it clearly shows ${tvScene.prompt}.`,
    "Keep the TV hardware, room layout, furniture, architecture, lighting, reflections, and perspective unchanged.",
    "The TV must appear powered on with the chosen content visibly readable inside the screen, not black, blank, or reflective-only.",
    "Do not add a new TV or any furniture. Keep the video contained inside the existing TV screen only, with no text overlays, logos, UI controls, spill outside the frame, or changes anywhere else in the room.",
    analysis.tvReason ? `Reference: ${analysis.tvReason}` : ""
  ]
    .filter(Boolean)
    .join(" ");
}

function buildRoomConsistencyPrompt(file) {
  if (!file.roomGroupId) return "";
  return [
    `This image belongs to room group ${file.roomGroupId}${file.roomLabel ? ` (${file.roomLabel})` : ""}.`,
    `Use the same furniture package, palette, scale, and placement logic across every angle of this room group.`,
    file.stagingStyle ? `Shared staging brief for this room group: ${file.stagingStyle}` : ""
  ]
    .filter(Boolean)
    .join(" ");
}

function buildFurnitureStagingPrompt(file, analysis, tvWasAdded) {
  const consistencyPrompt = buildRoomConsistencyPrompt(file);
  if (tvWasAdded) {
    return [
      STAGING_IMAGE_PROMPT,
      getImageTreatmentPrompt(),
      consistencyPrompt,
      "A TV was already added in the previous step before furniture staging.",
      "Preserve the TV exactly where it is: do not move it, resize it, replace it, crop it, cover it, remove it, or alter the screen content.",
      `Stage furniture around the TV naturally so the layout feels professionally designed around a media-viewing wall. Keep the ${getTvScene().name} screen content visible and contained inside the TV.`
    ]
      .filter(Boolean)
      .join(" ");
  }

  return [
    STAGING_IMAGE_PROMPT,
    getImageTreatmentPrompt(),
    consistencyPrompt,
    `The pre-furniture TV analysis says a TV does not make sense here: ${analysis.tvReason || analysis.reason || "no suitable TV placement was found."}`,
    "Do not add a TV, monitor, projector screen, or glowing display."
  ]
    .filter(Boolean)
    .join(" ");
}

async function uploadFileForRender(file) {
  if (file.falUrl) {
    return {
      ...file,
      uploadStatus: "uploaded",
      uploadMessage: "Uploaded to Fal CDN."
    };
  }

  const result = await uploadRenderAsset({
    dataUrl: file.dataUrl,
    fileName: file.name,
    contentType: "image/jpeg"
  });

  if (!result.ok || !result.url) {
    const message = result.message ?? result.data?.message ?? "Fal CDN upload failed.";
    throw new Error(`Could not upload ${file.name}: ${message}`);
  }

  return {
    ...file,
    falUrl: result.url,
    uploadStatus: "uploaded",
    uploadMessage: "Uploaded to Fal CDN."
  };
}

async function stageFileForRender(file) {
  if (file.stagedImageUrl && file.tvSceneId === state.selectedTvSceneId && file.stagingVersion === STAGING_VERSION) {
    return {
      ...file,
      uploadStatus: "staged",
      uploadMessage: file.tvEnhanced ? `${file.tvSceneName ?? getTvScene(file.tvSceneId).name} TV video prepared.` : "Furniture added. TV skipped."
    };
  }

  const analysis = await analyzeFurnitureNeed({
    imageUrl: file.falUrl,
    fileName: file.name
  });

  if (!analysis.ok) {
    const message = analysis.message ?? analysis.data?.message ?? "Furniture check failed.";
    throw new Error(`Could not inspect ${file.name}: ${message}`);
  }

  let baseImageUrl = file.falUrl;
  let tvImageUrl = "";
  let tvAdded = false;
  let tvEnhanced = false;

  if (analysis.hasVisibleTv) {
    const tvScreenResult = await stageRenderImage({
      imageUrl: baseImageUrl,
      fileName: file.name,
      prompt: buildExistingTvPrompt(analysis)
    });

    if (!tvScreenResult.ok || !tvScreenResult.imageUrl) {
      const message = tvScreenResult.message ?? tvScreenResult.data?.message ?? "TV screen edit failed.";
      throw new Error(`Could not add TV video to ${file.name}: ${message}`);
    }

    tvImageUrl = tvScreenResult.imageUrl;
    baseImageUrl = tvImageUrl;
    tvEnhanced = true;
  }

  if (state.addFurniture && analysis.shouldAddTv) {
    const tvResult = await stageRenderImage({
      imageUrl: baseImageUrl,
      fileName: file.name,
      prompt: buildTvStagingPrompt(analysis)
    });

    if (!tvResult.ok || !tvResult.imageUrl) {
      const message = tvResult.message ?? tvResult.data?.message ?? "TV staging failed.";
      throw new Error(`Could not add TV to ${file.name}: ${message}`);
    }

    tvImageUrl = tvResult.imageUrl;
    baseImageUrl = tvImageUrl;
    tvAdded = true;
    tvEnhanced = true;
  }

  if (!analysis.needsFurniture) {
    return {
      ...file,
      furnitureAnalysis: analysis,
      tvImageUrl,
      stagedImageUrl: tvEnhanced ? baseImageUrl : undefined,
      tvAdded,
      tvEnhanced,
      tvSceneId: tvEnhanced ? state.selectedTvSceneId : undefined,
      tvSceneName: tvEnhanced ? getTvScene().name : undefined,
      stagingVersion: tvEnhanced ? STAGING_VERSION : undefined,
      uploadStatus: tvEnhanced ? "staged" : "kept",
      uploadMessage: tvEnhanced
        ? `${getTvScene().name} TV video added to existing TV.`
        : analysis.warning ? "Furniture check unclear. Kept original." : "Already furnished. Kept original."
    };
  }

  const result = await stageRenderImage({
    imageUrl: baseImageUrl,
    fileName: file.name,
    prompt: buildFurnitureStagingPrompt(file, analysis, tvAdded || analysis.hasVisibleTv)
  });

  if (!result.ok || !result.imageUrl) {
    const message = result.message ?? result.data?.message ?? "Furniture staging failed.";
    throw new Error(`Could not add furniture to ${file.name}: ${message}`);
  }

  return {
    ...file,
    furnitureAnalysis: analysis,
    tvImageUrl,
    stagedImageUrl: result.imageUrl,
    tvAdded,
    tvEnhanced: tvEnhanced || tvAdded,
    tvSceneId: state.selectedTvSceneId,
    tvSceneName: getTvScene().name,
    stagingVersion: STAGING_VERSION,
    uploadStatus: "staged",
    uploadMessage: tvEnhanced ? `${getTvScene().name} TV video prepared before furniture.` : "Furniture added. TV skipped."
  };
}

async function stageFireplaceForRender(file) {
  if (file.fireImageUrl) {
    return {
      ...file,
      uploadStatus: "fire_added",
      uploadMessage: "Subtle fire added."
    };
  }

  const imageUrl = file.stagedImageUrl ?? file.falUrl;
  const analysis = await analyzeFireplaceNeed({
    imageUrl,
    fileName: file.name
  });

  if (!analysis.ok) {
    const message = analysis.message ?? analysis.data?.message ?? "Fireplace check failed.";
    throw new Error(`Could not inspect fireplace in ${file.name}: ${message}`);
  }

  if (!analysis.needsFire) {
    const keptMessage = file.stagedImageUrl
      ? "Furniture added. No fireplace fire needed."
      : analysis.warning
        ? "Fireplace check unclear. Kept original."
        : "No unlit fireplace. Kept original.";
    return {
      ...file,
      fireplaceAnalysis: analysis,
      uploadStatus: file.stagedImageUrl ? "staged" : "kept",
      uploadMessage: keptMessage
    };
  }

  const result = await stageRenderImage({
    imageUrl,
    fileName: file.name,
    prompt: FIREPLACE_IMAGE_PROMPT
  });

  if (!result.ok || !result.imageUrl) {
    const message = result.message ?? result.data?.message ?? "Fireplace fire edit failed.";
    throw new Error(`Could not add fireplace fire to ${file.name}: ${message}`);
  }

  return {
    ...file,
    fireplaceAnalysis: analysis,
    fireImageUrl: result.imageUrl,
    uploadStatus: "fire_added",
    uploadMessage: "Subtle fire added."
  };
}

function markFilesWorkflowFailed(message) {
  state.files = state.files.map((file) =>
    ["uploading", "checking_furniture", "checking_fireplace", "staging"].includes(file.uploadStatus)
      ? {
          ...file,
          uploadStatus: "failed",
          uploadMessage: message
        }
      : file
  );
}

function buildThemeDirectionPrompt(theme) {
  return [theme.prompt, theme.atmosphere ? 'Theme mood: ' + theme.atmosphere : ''].filter(Boolean).join(' ');
}

function buildShotMotionPrompt(theme, file, index, total) {
  const category = classifySequenceCategory(file);
  if (category === 'hero-aerial') {
    return VIDEO_MOVEMENTS.droneTopDownDescend + ' Premium establishing aerial for scene ' + (index + 1) + ' of ' + total + '. Preserve exact rooflines, landscape, and property geometry.';
  }
  if (category === 'feature-exterior') {
    return VIDEO_MOVEMENTS.parallaxOrbit + ' Highlight the exterior feature as a premium amenity while preserving exact hardscape, fountain geometry, and landscaping.';
  }
  if (category === 'arrival') {
    return (theme.id === 'moody-modern' ? VIDEO_MOVEMENTS.dollyPanRight : VIDEO_MOVEMENTS.dollyIn) + ' Premium arrival reveal. Preserve exact facade, entry, driveway, hardscape, and landscape with no added structure.';
  }
  if (state.selectedImageTreatmentId === 'cinematic') {
    return HDR_TIMELAPSE_VIDEO_PROMPT;
  }
  if (category === 'living' || category === 'kitchen') {
    if (theme.id === 'editorial-timelapse') return VIDEO_MOVEMENTS.wideSlide;
    if (theme.id === 'airy-luxury') return VIDEO_MOVEMENTS.wideDollyIn;
    if (theme.id === 'moody-modern') return VIDEO_MOVEMENTS.parallaxOrbit;
    return VIDEO_MOVEMENTS.dollyIn;
  }
  if (category === 'bath' || category === 'detail') {
    return theme.id === 'editorial-timelapse' ? VIDEO_MOVEMENTS.tightTruck : VIDEO_MOVEMENTS.truckRightToLeft;
  }
  if (category === 'outdoor') {
    return theme.id === 'editorial-timelapse' ? VIDEO_MOVEMENTS.orbitHyperlapse : VIDEO_MOVEMENTS.craneUp;
  }
  if (category === 'primary-bedroom' || category === 'bedroom') {
    return theme.id === 'moody-modern' ? VIDEO_MOVEMENTS.dollyOut : VIDEO_MOVEMENTS.dollyIn;
  }
  return theme.id === 'editorial-timelapse' ? VIDEO_MOVEMENTS.dollyInTimelapse : VIDEO_MOVEMENTS.dollyIn;
}

function makeClip({ theme, index, start, total }) {
  return {
    id: `scene-${Date.now()}-${index}`,
    index,
    title: `Scene ${index + 1} of ${total}`,
    startName: start.name,
    sourceFileId: start.id,
    sceneAdjustments: {
      furniture: "project",
      tv: "project",
      fireplace: "project"
    },
    imageUrl: start.treatedImageUrl ?? start.fireImageUrl ?? start.stagedImageUrl ?? start.falUrl ?? start.dataUrl,
    previewUrl: start.treatedImageUrl ?? start.fireImageUrl ?? start.stagedImageUrl ?? start.falUrl ?? start.dataUrl,
    endImageUrl: "",
    status: "pending",
    message: "Waiting to submit.",
    prompt: [
      buildThemeDirectionPrompt(theme),
      buildShotMotionPrompt(theme, start, index, total),
      STRUCTURE_LOCK_PROMPT,
      state.addFurniture ? FURNITURE_PROMPT : "",
      buildTvMotionPrompt(start),
      state.addFireplaceFire ? FIREPLACE_PROMPT : "",
      buildDrivewaySurfacePrompt(start),
      `Animate photo ${index + 1} of ${total} as scene ${index + 1} in one continuous real estate walkthrough.`,
      "Keep motion natural, avoid warping architecture, preserve room layout and materials, and maintain exact structural fidelity to the source image."
    ]
      .filter(Boolean)
      .join(" ")
  };
}

function buildTvMotionPrompt(file) {
  if (!file.tvEnhanced && !file.tvAdded) return "";
  const tvScene = getTvScene(file.tvSceneId);
  return `If the room contains a visible TV, keep the TV physically fixed and correctly masked inside the screen while it clearly plays ${tvScene.motionPrompt}. The TV must look powered on, bright enough to read, and contained fully inside the screen with no black screen, no mirror-like blank reflection, no text, no logos, no UI, no flicker artifacts, and no spill outside the TV frame.`;
}

function buildDrivewaySurfacePrompt(file) {
  if (!state.softenDrivewayShadows) return "";
  const text = normalizeSelectionText([file.name, file.roomLabel, file.stagingStyle].filter(Boolean).join(" "));
  if (!/\bfront|facade|exterior|entry|curb|driveway\b/.test(text)) return "";
  return DRIVEWAY_SURFACE_PROMPT;
}

function buildSceneFurniturePrompt(mode, file) {
  const consistencyPrompt = buildRoomConsistencyPrompt(file);
  if (mode === "add") {
    return [STAGING_IMAGE_PROMPT, getImageTreatmentPrompt(), consistencyPrompt, "Add furniture confidently for this one scene and keep the room premium, balanced, and realistic."]
      .filter(Boolean)
      .join(" ");
  }
  if (mode === "fix") {
    return [
      consistencyPrompt,
      "Refine the furniture styling in this scene only. Keep the room premium and realistic, correct awkward placement, improve scale, and preserve architecture, lighting, and perspective."
    ]
      .filter(Boolean)
      .join(" ");
  }
  return "";
}

function buildSceneTvPrompt(mode, file) {
  const tvScene = getTvScene();
  if (mode === "add") {
    return [
      TV_IMAGE_PROMPT,
      `The TV screen must clearly show ${tvScene.prompt}.`,
      "Make the TV feel naturally placed for the room and keep the content contained inside the screen."
    ].join(" ");
  }
  if (mode === "fix") {
    return [
      "An existing or intended TV in this scene should be corrected.",
      `Replace only the TV screen content so it clearly shows ${tvScene.prompt}.`,
      "If the TV is weak, dark, or reflective, make it look powered on and readable. Preserve the rest of the room unchanged."
    ].join(" ");
  }
  if (mode === "remove") {
    return [
      "Remove any added or visible TV/screen emphasis from this scene.",
      "Restore the wall, console, and surrounding decor naturally with no screen glow, no black rectangle emphasis, and no obvious edit seams."
    ].join(" ");
  }
  return "";
}

function buildSceneFireplacePrompt(mode) {
  if (mode === "add" || mode === "fix") {
    return FIREPLACE_IMAGE_PROMPT;
  }
  return "";
}

async function prepareSceneForRerun(file, clip) {
  const adjustments = clip.sceneAdjustments ?? {};
  const projectModes =
    adjustments.furniture === "project" &&
    adjustments.tv === "project" &&
    adjustments.fireplace === "project";

  let working = file.falUrl ? file : await uploadFileForRender(file);
  if (projectModes) {
    if (state.addFurniture || state.selectedTvSceneId) {
      working = await stageFileForRender(working);
    }
    if (state.addFireplaceFire) {
      working = await stageFireplaceForRender(working);
    }
    if (state.selectedImageTreatmentId === "cinematic") {
      working = await applyImageTreatmentForRender(working);
    }
    return working;
  }

  let baseImageUrl = working.falUrl;
  let stagedImageUrl = "";
  let tvEnhanced = false;
  let tvAdded = false;
  let tvSceneId;
  let tvSceneName;
  let furnitureAnalysis = null;

  if (adjustments.tv === "project" || adjustments.furniture === "project") {
    furnitureAnalysis = await analyzeFurnitureNeed({
      imageUrl: baseImageUrl,
      fileName: working.name
    });
    if (!furnitureAnalysis.ok) {
      throw new Error(furnitureAnalysis.message ?? "Furniture analysis failed.");
    }
  }

  if (adjustments.tv === "project") {
    if (furnitureAnalysis?.hasVisibleTv) {
      const result = await stageRenderImage({
        imageUrl: baseImageUrl,
        fileName: working.name,
        prompt: buildExistingTvPrompt(furnitureAnalysis)
      });
      if (!result.ok || !result.imageUrl) {
        throw new Error(result.message ?? "TV scene edit failed.");
      }
      baseImageUrl = result.imageUrl;
      stagedImageUrl = baseImageUrl;
      tvEnhanced = true;
      tvSceneId = state.selectedTvSceneId;
      tvSceneName = getTvScene().name;
    } else if (state.addFurniture && furnitureAnalysis?.shouldAddTv) {
      const result = await stageRenderImage({
        imageUrl: baseImageUrl,
        fileName: working.name,
        prompt: buildTvStagingPrompt(furnitureAnalysis)
      });
      if (!result.ok || !result.imageUrl) {
        throw new Error(result.message ?? "TV scene edit failed.");
      }
      baseImageUrl = result.imageUrl;
      stagedImageUrl = baseImageUrl;
      tvEnhanced = true;
      tvAdded = true;
      tvSceneId = state.selectedTvSceneId;
      tvSceneName = getTvScene().name;
    }
  } else if (adjustments.tv && adjustments.tv !== "remove") {
    const result = await stageRenderImage({
      imageUrl: baseImageUrl,
      fileName: working.name,
      prompt: buildSceneTvPrompt(adjustments.tv, working)
    });
    if (!result.ok || !result.imageUrl) {
      throw new Error(result.message ?? "TV scene edit failed.");
    }
    baseImageUrl = result.imageUrl;
    stagedImageUrl = baseImageUrl;
    tvEnhanced = true;
    tvAdded = adjustments.tv === "add";
    tvSceneId = state.selectedTvSceneId;
    tvSceneName = getTvScene().name;
  }

  if (adjustments.furniture === "project") {
    if (state.addFurniture && furnitureAnalysis?.needsFurniture) {
      const result = await stageRenderImage({
        imageUrl: baseImageUrl,
        fileName: working.name,
        prompt: buildFurnitureStagingPrompt(working, furnitureAnalysis, tvAdded || furnitureAnalysis.hasVisibleTv)
      });
      if (!result.ok || !result.imageUrl) {
        throw new Error(result.message ?? "Furniture scene edit failed.");
      }
      baseImageUrl = result.imageUrl;
      stagedImageUrl = baseImageUrl;
    }
  } else if (adjustments.furniture && adjustments.furniture !== "remove") {
    const result = await stageRenderImage({
      imageUrl: baseImageUrl,
      fileName: working.name,
      prompt: buildSceneFurniturePrompt(adjustments.furniture, working)
    });
    if (!result.ok || !result.imageUrl) {
      throw new Error(result.message ?? "Furniture scene edit failed.");
    }
    baseImageUrl = result.imageUrl;
    stagedImageUrl = baseImageUrl;
  }

  let fireImageUrl = "";
  if (adjustments.fireplace === "project") {
    if (state.addFireplaceFire) {
      const fireplaceAnalysis = await analyzeFireplaceNeed({
        imageUrl: baseImageUrl,
        fileName: working.name
      });
      if (!fireplaceAnalysis.ok) {
        throw new Error(fireplaceAnalysis.message ?? "Fireplace analysis failed.");
      }
      if (fireplaceAnalysis.needsFire) {
        const result = await stageRenderImage({
          imageUrl: baseImageUrl,
          fileName: working.name,
          prompt: FIREPLACE_IMAGE_PROMPT
        });
        if (!result.ok || !result.imageUrl) {
          throw new Error(result.message ?? "Fireplace scene edit failed.");
        }
        fireImageUrl = result.imageUrl;
        baseImageUrl = fireImageUrl;
      }
    }
  } else if (adjustments.fireplace && adjustments.fireplace !== "remove") {
    const result = await stageRenderImage({
      imageUrl: baseImageUrl,
      fileName: working.name,
      prompt: buildSceneFireplacePrompt(adjustments.fireplace)
    });
    if (!result.ok || !result.imageUrl) {
      throw new Error(result.message ?? "Fireplace scene edit failed.");
    }
    fireImageUrl = result.imageUrl;
    baseImageUrl = fireImageUrl;
  }

  let finalWorking = {
    ...working,
    stagedImageUrl: stagedImageUrl || undefined,
    fireImageUrl: fireImageUrl || undefined,
    tvEnhanced,
    tvAdded,
    tvSceneId,
    tvSceneName
  };
  if (state.selectedImageTreatmentId === "cinematic") {
    finalWorking = await applyImageTreatmentForRender(finalWorking);
  }
  return finalWorking;
}

async function submitScene(sceneId) {
  const clip = findClip(sceneId);
  if (!clip) return;
  updateClip(sceneId, {
    status: "submitting",
    message: "Submitting scene to Fal...",
    lastCheckedAt: new Date().toISOString()
  });

  try {
    const result = await submitRenderJob({
      modelId: "bytedance/seedance-2.0/image-to-video",
      imageUrl: clip.imageUrl,
      endImageUrl: clip.endImageUrl,
      duration: 5,
      prompt: clip.prompt
    });
    updateClip(sceneId, {
      ...result,
      status: result.ok ? normalizeStatus(result.status) : "submit_failed",
      message: result.ok ? statusMessage(result) : result.message ?? "Fal submission failed.",
      lastCheckedAt: new Date().toISOString()
    });
    if (result.ok) {
      startPolling(sceneId);
      setTimeout(() => pollScene(sceneId, true), 500);
    }
  } catch (error) {
    updateClip(sceneId, {
      status: "submit_failed",
      message: error instanceof Error ? error.message : "Fal submission failed."
    });
  }
}

async function pollScene(sceneId, manual = false) {
  const clip = findClip(sceneId);
  if (!clip?.request_id && !clip?.requestId) return;
  updateClip(sceneId, {
    status: manual ? "checking" : clip.status,
    message: manual ? "Checking Fal status..." : clip.message,
    lastCheckedAt: new Date().toISOString()
  });
  if (manual) render();

  try {
    const resolved = await resolveRenderJob({
      ...clip,
      requestId: clip.request_id ?? clip.requestId,
      modelId: "bytedance/seedance-2.0/image-to-video"
    });
    const videoUrl = resolved.videoUrl || findVideoUrl(resolved);
    const status = normalizeStatus(resolved.status);
    updateClip(sceneId, {
      ...resolved,
      status: videoUrl ? "complete" : status,
      message: videoUrl ? "Scene ready." : resolved.message ?? statusMessage(resolved),
      videoUrl,
      lastCheckedAt: new Date().toISOString()
    });
    if (videoUrl || ["complete", "render_failed", "failed", "error", "canceled"].includes(status)) {
      stopPolling(sceneId);
    }
  } catch (error) {
    updateClip(sceneId, {
      status: "status_failed",
      message: `${error instanceof Error ? error.message : "Status check failed."} Retrying every 30 seconds.`,
      lastCheckedAt: new Date().toISOString()
    });
  } finally {
    updateProjectStatus();
    render();
  }
}

function projectPanel(project) {
  const complete = project.clips.filter((clip) => clip.videoUrl).length;
  const total = project.clips.length;
  const finalReady = total > 0 && complete === total;
  const selectedAudit = project.selectionAudit?.selected ?? [];
  const skippedAudit = project.selectionAudit?.skipped ?? [];
  return `
    <section class="project-panel ${escapeHtml(project.status ?? "pending")}">
      <div class="project-summary">
        <div>
          <strong>${escapeHtml(project.themeName ?? "Final video")}</strong>
          <span>${complete}/${total} scenes ready${project.addFurniture ? " - Virtual staging on" : ""} - Music: ${escapeHtml(getSelectedMusic().name)} - Cap: ${escapeHtml(formatDuration(project.targetDurationSec ?? state.targetDurationSec))}</span>
        </div>
        <div class="project-summary-actions">
          <button class="ghost-button compact" data-action="rerun-project" ${state.isGenerating ? "disabled" : ""}>Rerun From Start</button>
          <div class="project-progress"><span style="width:${total ? (complete / total) * 100 : 0}%"></span></div>
        </div>
      </div>
      ${finalReady ? finalPlayer(project) : `<p class="project-message">${escapeHtml(project.message ?? "Generating scenes...")}</p>`}
      ${Array.isArray(project.warnings) && project.warnings.length ? `<div class="project-warnings">${project.warnings.map((warning) => `<p class="project-warning">${escapeHtml(warning)}</p>`).join("")}</div>` : ""}
      ${selectedAudit.length || skippedAudit.length ? selectionAuditPanel(selectedAudit, skippedAudit) : ""}
      <div class="scene-list">
        ${project.clips.map(sceneRow).join("")}
      </div>
    </section>
  `;
}

function selectionAuditPanel(selected, skipped) {
  return `
    <section class="selection-audit">
      <div class="selection-column">
        <h3>Selected</h3>
        <div class="selection-list">
          ${selected.length ? selected.map((item) => selectionAuditCard(item, "selected")).join("") : `<p class="selection-empty">No selected photos yet.</p>`}
        </div>
      </div>
      <div class="selection-column">
        <h3>Skipped</h3>
        <div class="selection-list">
          ${skipped.length ? skipped.map((item) => selectionAuditCard(item, "skipped")).join("") : `<p class="selection-empty">No skipped photos for this cut.</p>`}
        </div>
      </div>
    </section>
  `;
}

function selectionAuditCard(item, kind) {
  return `
    <article class="selection-card ${escapeHtml(kind)}">
      <img src="${escapeHtml(item.imageUrl || "")}" alt="" />
      <div>
        <strong><span class="selection-rank">#${escapeHtml(String(item.selectionRank ?? "-"))}</span> ${escapeHtml(item.name)}</strong>
        <span>${escapeHtml(item.reason)}</span>
      </div>
    </article>
  `;
}

function finalPlayer(project) {
  const urls = project.clips.map((clip) => clip.videoUrl).filter(Boolean);
  const exportState = project.export ?? {};
  const music = getSelectedMusic();
  const mp4Supported = canRecordMp4();
  const downloadText = exportState.status === "publishing" ? "Preparing..." : "Download MP4";
  return `
    <div class="final-player" data-final-player data-video-urls="${escapeHtml(JSON.stringify(urls))}">
      <div>
        <strong>Final Video Sequence</strong>
        <span>Plays all generated scenes as one continuous property video. Downloadable MP4s include ${escapeHtml(music.name)} music.</span>
      </div>
      <video data-final-video src="${escapeHtml(urls[0] ?? "")}" controls playsinline></video>
      <div class="final-player-actions">
        <button class="ghost-button compact" data-action="restart-final">Play From Start</button>
        <button class="ghost-button compact" data-action="build-download" ${["building", "publishing"].includes(exportState.status) || !mp4Supported ? "disabled" : ""}>
          ${exportState.status === "building" ? "Building..." : "Build Downloadable Video"}
        </button>
        ${state.downloadableVideoUrl ? `<a class="primary-link" data-action="download-final" data-final-download-link href="${escapeHtml(state.downloadableVideoUrl)}" download="${escapeHtml(exportState.fileName ?? "autohdr-final-video.mp4")}">${downloadText}</a>` : ""}
        <span data-final-counter>Scene 1 of ${urls.length}</span>
      </div>
      ${!mp4Supported ? `<p class="export-message">This browser cannot record MP4 from multiple clips. Use a browser with MP4 MediaRecorder support or add server-side ffmpeg stitching.</p>` : ""}
      ${exportState.message ? `<p class="export-message">${escapeHtml(exportState.message)}</p>` : ""}
    </div>
  `;
}

function bindFinalPlayer() {
  const wrapper = document.querySelector("[data-final-player]");
  const video = document.querySelector("[data-final-video]");
  if (!wrapper || !video) return;
  const urls = JSON.parse(wrapper.dataset.videoUrls ?? "[]");
  let index = 0;
  const counter = document.querySelector("[data-final-counter]");
  const setClip = (nextIndex) => {
    index = nextIndex;
    video.src = urls[index];
    if (counter) counter.textContent = `Scene ${index + 1} of ${urls.length}`;
    video.play().catch(() => {});
  };
  video.addEventListener("ended", () => {
    if (index < urls.length - 1) setClip(index + 1);
  });
  document.querySelector("[data-action='restart-final']")?.addEventListener("click", () => setClip(0));
}

async function buildDownloadableVideo() {
  const project = state.project;
  const urls = project?.clips?.map((clip) => clip.videoUrl).filter(Boolean) ?? [];
  if (!project || !urls.length) return;
  const selectedMusic = getSelectedMusic();

  updateExportState({
    status: "building",
    message: `Building one downloadable video with ${selectedMusic.name} music...`
  });
  render();

  let musicController = null;

  try {
    const mimeType = chooseRecorderMimeType();
    if (!mimeType) {
      throw new Error("This browser cannot record MP4 from the final sequence. Try Chrome/Safari with MP4 MediaRecorder support, or add ffmpeg for server-side stitching.");
    }
    const canvas = document.createElement("canvas");
    canvas.width = 1280;
    canvas.height = 720;
    const context = canvas.getContext("2d");
    const stream = canvas.captureStream(30);
    musicController = await attachMusicToStream(stream, selectedMusic);
    const recorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);
    const chunks = [];
    recorder.addEventListener("dataavailable", (event) => {
      if (event.data.size) chunks.push(event.data);
    });
    const stopped = new Promise((resolve) => recorder.addEventListener("stop", resolve, { once: true }));

    recorder.start(1000);
    for (let index = 0; index < urls.length; index += 1) {
      updateExportState({
        status: "building",
        message: `Recording scene ${index + 1} of ${urls.length} with ${selectedMusic.name} music...`
      });
      await drawVideoToCanvas(urls[index], canvas, context);
    }
    recorder.stop();
    await stopped;

    const blobType = recorder.mimeType || mimeType;
    const blob = new Blob(chunks, { type: blobType });
    if (state.downloadableVideoUrl?.startsWith("blob:")) URL.revokeObjectURL(state.downloadableVideoUrl);
    await saveVideoBlob(project.id, blob);
    const fileName = "autohdr-final-video.mp4";
    const exported = await exportVideoBlob(blob, project.id, fileName);
    if (!exported.ok || !exported.downloadUrl) {
      throw new Error(exported.message ?? "The MP4 was built but could not be published for download.");
    }
    state.downloadableVideoUrl = exported.downloadUrl;
    updateExportState({
      status: "ready",
      fileName: exported.fileName ?? fileName,
      storedVideoId: project.id,
      serverDownloadUrl: exported.downloadUrl,
      mimeType: blobType,
      musicName: selectedMusic.name,
      message: `One downloadable MP4 file with ${selectedMusic.name} music is ready.`
    });
  } catch (error) {
    updateExportState({
      status: "failed",
      message:
        error instanceof Error
          ? error.message
          : "Could not build the downloadable video in the browser."
    });
  } finally {
    if (musicController) await musicController.stop();
    render();
  }
}

async function handleFinalDownload(event) {
  const link = event.currentTarget;
  const href = link?.getAttribute("href") ?? "";
  if (!href.startsWith("blob:")) return;

  event.preventDefault();
  const project = state.project;
  const fileName = project?.export?.fileName ?? "autohdr-final-video.mp4";

  updateExportState({
    status: "publishing",
    message: "Preparing the MP4 as a normal local download..."
  });
  render();

  try {
    const response = await fetch(href);
    if (!response.ok) throw new Error("Could not read the prepared browser video.");
    const blob = await response.blob();
    const exported = await exportVideoBlob(blob, project?.id ?? `project-${Date.now()}`, fileName);
    if (!exported.ok || !exported.downloadUrl) {
      throw new Error(exported.message ?? "Could not prepare the MP4 download.");
    }
    state.downloadableVideoUrl = exported.downloadUrl;
    updateExportState({
      status: "ready",
      fileName: exported.fileName ?? fileName,
      serverDownloadUrl: exported.downloadUrl,
      musicName: getSelectedMusic().name,
      message: "Download is ready."
    });
    render();
    triggerDownload(exported.downloadUrl, exported.fileName ?? fileName);
  } catch (error) {
    updateExportState({
      status: "failed",
      message: error instanceof Error ? error.message : "Could not prepare the MP4 download."
    });
    render();
  }
}

async function exportVideoBlob(blob, projectId, fileName) {
  const id = encodeURIComponent(projectId || `project-${Date.now()}`);
  const response = await fetch(`/api/video/export/${id}?fileName=${encodeURIComponent(fileName)}`, {
    method: "POST",
    headers: {
      "Content-Type": blob.type || "video/mp4"
    },
    body: blob
  });
  return response.json();
}

function triggerDownload(url, fileName) {
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = fileName;
  document.body.append(anchor);
  anchor.click();
  anchor.remove();
}

function chooseRecorderMimeType() {
  const options = [
    "video/mp4;codecs=avc1.42E01E,mp4a.40.2",
    "video/mp4;codecs=h264,aac",
    "video/mp4;codecs=avc1.42E01E",
    "video/mp4;codecs=h264",
    "video/mp4"
  ];
  return options.find((type) => MediaRecorder.isTypeSupported(type)) ?? "";
}

function canRecordMp4() {
  if (typeof MediaRecorder === "undefined") return false;
  return Boolean(chooseRecorderMimeType());
}

async function attachMusicToStream(stream, music) {
  const audioContext = createAudioContext();
  const destination = audioContext.createMediaStreamDestination();
  await audioContext.resume();

  const musicSource = await startMusicSource(audioContext, destination, music);

  destination.stream.getAudioTracks().forEach((track) => stream.addTrack(track));

  return {
    async stop() {
      musicSource.stop();
      destination.stream.getTracks().forEach((track) => track.stop());
      await closeAudioContext(audioContext);
    }
  };
}

function createAudioContext() {
  const AudioContextClass = window.AudioContext || window.webkitAudioContext;
  if (!AudioContextClass) {
    throw new Error("This browser cannot create an audio track for the downloadable MP4.");
  }
  return new AudioContextClass();
}

async function closeAudioContext(audioContext) {
  if (audioContext.state !== "closed") {
    await audioContext.close();
  }
}

async function startMusicSource(audioContext, outputNode, track) {
  if (track.source) {
    return startBufferedMusic(audioContext, outputNode, track);
  }
  return startProceduralMusic(audioContext, outputNode, track);
}

async function startBufferedMusic(audioContext, outputNode, track) {
  const response = await fetch(track.source);
  if (!response.ok) {
    throw new Error(`Could not load ${track.name}.`);
  }
  const arrayBuffer = await response.arrayBuffer();
  const decoded = await audioContext.decodeAudioData(arrayBuffer.slice(0));
  const source = audioContext.createBufferSource();
  const gain = audioContext.createGain();
  gain.gain.value = track.gain ?? 0.22;
  source.buffer = decoded;
  source.loop = true;
  source.connect(gain);
  gain.connect(outputNode);
  source.start();
  return {
    stop() {
      const now = audioContext.currentTime;
      gain.gain.cancelScheduledValues(now);
      gain.gain.setValueAtTime(Math.max(gain.gain.value, 0.0001), now);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.3);
      try {
        source.stop(now + 0.32);
      } catch {
        // Source may already be stopped.
      }
    }
  };
}

function startProceduralMusic(audioContext, outputNode, track) {
  const scale = [1, 1.125, 1.25, 1.333, 1.5, 1.667, 1.875, 2, 2.25, 2.5, 2.667, 3];
  const beatSeconds = 60 / track.bpm;
  const master = audioContext.createGain();
  const padGain = audioContext.createGain();
  const activeSources = new Set();
  const padOscillators = [];
  const chords = track.chords ?? [track.padRatios ?? [1, 1.25, 1.5, 2]];
  let nextBeatTime = audioContext.currentTime;
  let beatIndex = 0;

  master.gain.setValueAtTime(0.0001, audioContext.currentTime);
  master.gain.exponentialRampToValueAtTime(track.gain, audioContext.currentTime + 1.4);
  master.connect(outputNode);

  padGain.gain.value = track.arrangement === "minimal" ? 0.12 : 0.2;
  padGain.connect(master);
  chords[0].forEach((ratio, index) => {
    const oscillator = audioContext.createOscillator();
    const gain = audioContext.createGain();
    oscillator.type = track.padWave ?? (index % 2 ? "triangle" : "sine");
    oscillator.frequency.value = track.root * ratio;
    gain.gain.value = track.arrangement === "house" ? 0.022 : 0.032;
    oscillator.connect(gain);
    gain.connect(padGain);
    oscillator.start();
    padOscillators.push({ oscillator, gain });
  });

  const retunePads = (startTime, chordIndex) => {
    const chord = chords[chordIndex % chords.length];
    padOscillators.forEach(({ oscillator }, index) => {
      oscillator.frequency.setTargetAtTime(track.root * chord[index % chord.length], startTime, 0.12);
    });
  };

  const playNote = (frequency, startTime, duration, gainValue, type = "triangle", filterFrequency = 1800) => {
    const oscillator = audioContext.createOscillator();
    const filter = audioContext.createBiquadFilter();
    const gain = audioContext.createGain();
    oscillator.type = type;
    oscillator.frequency.setValueAtTime(frequency, startTime);
    filter.type = "lowpass";
    filter.frequency.setValueAtTime(filterFrequency, startTime);
    filter.Q.value = 0.7;
    gain.gain.setValueAtTime(0.0001, startTime);
    gain.gain.exponentialRampToValueAtTime(gainValue, startTime + 0.03);
    gain.gain.exponentialRampToValueAtTime(0.0001, startTime + duration);
    oscillator.connect(filter);
    filter.connect(gain);
    gain.connect(master);
    oscillator.start(startTime);
    oscillator.stop(startTime + duration + 0.05);
    activeSources.add(oscillator);
    oscillator.addEventListener("ended", () => activeSources.delete(oscillator), { once: true });
  };

  const playKick = (startTime, gainValue = 0.055) => {
    const oscillator = audioContext.createOscillator();
    const gain = audioContext.createGain();
    oscillator.type = "sine";
    oscillator.frequency.setValueAtTime(105, startTime);
    oscillator.frequency.exponentialRampToValueAtTime(46, startTime + 0.16);
    gain.gain.setValueAtTime(0.0001, startTime);
    gain.gain.exponentialRampToValueAtTime(gainValue, startTime + 0.012);
    gain.gain.exponentialRampToValueAtTime(0.0001, startTime + 0.18);
    oscillator.connect(gain);
    gain.connect(master);
    oscillator.start(startTime);
    oscillator.stop(startTime + 0.2);
    activeSources.add(oscillator);
    oscillator.addEventListener("ended", () => activeSources.delete(oscillator), { once: true });
  };

  const playTick = (startTime, frequency = 1650, gainValue = 0.006) => {
    const oscillator = audioContext.createOscillator();
    const gain = audioContext.createGain();
    oscillator.type = "square";
    oscillator.frequency.setValueAtTime(frequency, startTime);
    gain.gain.setValueAtTime(0.0001, startTime);
    gain.gain.exponentialRampToValueAtTime(gainValue, startTime + 0.008);
    gain.gain.exponentialRampToValueAtTime(0.0001, startTime + 0.055);
    oscillator.connect(gain);
    gain.connect(master);
    oscillator.start(startTime);
    oscillator.stop(startTime + 0.06);
    activeSources.add(oscillator);
    oscillator.addEventListener("ended", () => activeSources.delete(oscillator), { once: true });
  };

  const playNoise = (startTime, duration, gainValue, filterType, frequency) => {
    const frameCount = Math.max(1, Math.floor(audioContext.sampleRate * duration));
    const buffer = audioContext.createBuffer(1, frameCount, audioContext.sampleRate);
    const data = buffer.getChannelData(0);
    for (let index = 0; index < frameCount; index += 1) {
      const fade = 1 - index / frameCount;
      data[index] = (Math.random() * 2 - 1) * fade;
    }
    const source = audioContext.createBufferSource();
    const filter = audioContext.createBiquadFilter();
    const gain = audioContext.createGain();
    source.buffer = buffer;
    filter.type = filterType;
    filter.frequency.value = frequency;
    filter.Q.value = filterType === "bandpass" ? 1.8 : 0.6;
    gain.gain.setValueAtTime(0.0001, startTime);
    gain.gain.exponentialRampToValueAtTime(gainValue, startTime + 0.008);
    gain.gain.exponentialRampToValueAtTime(0.0001, startTime + duration);
    source.connect(filter);
    filter.connect(gain);
    gain.connect(master);
    source.start(startTime);
    source.stop(startTime + duration);
    activeSources.add(source);
    source.addEventListener("ended", () => activeSources.delete(source), { once: true });
  };

  const noteFrequency = (step, octave = 1) => {
    const normalized = ((step % scale.length) + scale.length) % scale.length;
    const octaveShift = Math.floor(step / scale.length);
    return track.root * scale[normalized] * octave * 2 ** octaveShift;
  };

  const scheduleAhead = () => {
    while (nextBeatTime < audioContext.currentTime + 4) {
      const localBeat = beatIndex % 16;
      const barIndex = Math.floor(beatIndex / 16);
      const quarterIndex = Math.floor(localBeat / 4);
      const halfBeat = nextBeatTime + beatSeconds * 0.5;

      if (localBeat === 0) retunePads(nextBeatTime, barIndex);

      if (track.arrangement === "house") {
        if (localBeat % 4 === 0) playKick(nextBeatTime, 0.065);
        if (localBeat % 2 === 1) playTick(halfBeat, 2600, 0.008);
        if (localBeat % 4 === 2) playNoise(nextBeatTime, 0.09, 0.012, "highpass", 3200);
        if (localBeat % 4 === 0) {
          const bassStep = track.bassSteps[quarterIndex % track.bassSteps.length];
          playNote(noteFrequency(bassStep, 0.5), nextBeatTime, beatSeconds * 1.6, 0.095, track.bassWave, 900);
        }
        if (localBeat % 2 === 1) {
          const melodyStep = track.melodySteps[(beatIndex + barIndex) % track.melodySteps.length];
          playNote(noteFrequency(melodyStep, 1), nextBeatTime, beatSeconds * 0.55, 0.032, track.leadWave, 2400);
        }
      }

      if (track.arrangement === "cinematic") {
        if (localBeat === 0 || localBeat === 8) playKick(nextBeatTime, 0.05);
        if (localBeat === 6 || localBeat === 14) playNoise(nextBeatTime, 0.16, 0.018, "bandpass", 1400);
        if ([2, 5, 9, 13].includes(localBeat)) {
          const melodyStep = track.melodySteps[(beatIndex + quarterIndex) % track.melodySteps.length];
          playNote(noteFrequency(melodyStep, 1.5), nextBeatTime, beatSeconds * 1.2, 0.033, track.leadWave, 3600);
        }
        if (localBeat % 8 === 0) {
          const bassStep = track.bassSteps[quarterIndex % track.bassSteps.length];
          playNote(noteFrequency(bassStep, 0.5), nextBeatTime, beatSeconds * 3.6, 0.074, track.bassWave, 700);
        }
      }

      if (track.arrangement === "minimal") {
        if ([0, 7, 10].includes(localBeat)) playKick(nextBeatTime, 0.038);
        if ([1, 3, 6, 9, 11, 14].includes(localBeat)) playTick(nextBeatTime + beatSeconds * 0.25, 4200, 0.007);
        if ([0, 3, 5, 8, 11, 13].includes(localBeat)) {
          const melodyStep = track.melodySteps[(beatIndex * 2 + barIndex) % track.melodySteps.length];
          playNote(noteFrequency(melodyStep, 1), nextBeatTime, beatSeconds * 0.28, 0.04, track.leadWave, 4200);
        }
        if ([0, 8].includes(localBeat)) {
          const bassStep = track.bassSteps[quarterIndex % track.bassSteps.length];
          playNote(noteFrequency(bassStep, 0.5), nextBeatTime, beatSeconds * 1.1, 0.067, track.bassWave, 650);
        }
      }

      if (track.arrangement === "drive") {
        if (localBeat % 4 === 0 || localBeat === 6 || localBeat === 14) playKick(nextBeatTime, localBeat % 4 === 0 ? 0.07 : 0.04);
        if (localBeat === 4 || localBeat === 12) playNoise(nextBeatTime, 0.12, 0.024, "bandpass", 1900);
        if (localBeat % 2 === 1) playTick(halfBeat, 3100, 0.009);
        if (localBeat % 2 === 0) {
          const bassStep = track.bassSteps[Math.floor(localBeat / 2) % track.bassSteps.length];
          playNote(noteFrequency(bassStep, 0.45), nextBeatTime, beatSeconds * 0.9, 0.082, track.bassWave, 800);
        }
        if (localBeat === 3 || localBeat === 7 || localBeat === 11 || localBeat === 15) {
          const melodyStep = track.melodySteps[(beatIndex + quarterIndex) % track.melodySteps.length];
          playNote(noteFrequency(melodyStep, 1), nextBeatTime, beatSeconds * 0.5, 0.029, track.leadWave, 2600);
        }
      }

      nextBeatTime += beatSeconds;
      beatIndex += 1;
    }
  };

  scheduleAhead();
  const timer = window.setInterval(scheduleAhead, 800);

  return {
    stop() {
      window.clearInterval(timer);
      const now = audioContext.currentTime;
      master.gain.cancelScheduledValues(now);
      master.gain.setValueAtTime(Math.max(master.gain.value, 0.0001), now);
      master.gain.exponentialRampToValueAtTime(0.0001, now + 0.35);
      padOscillators.forEach(({ oscillator }) => {
        try {
          oscillator.stop(now + 0.4);
        } catch {
          // Some scheduled audio nodes may already have ended.
        }
      });
      activeSources.forEach((source) => {
        try {
          source.stop(now + 0.4);
        } catch {
          // Some scheduled audio nodes may already have ended.
        }
      });
    }
  };
}

function drawVideoToCanvas(url, canvas, context) {
  return new Promise((resolve, reject) => {
    const video = document.createElement("video");
    video.crossOrigin = "anonymous";
    video.muted = true;
    video.playsInline = true;
    video.preload = "auto";
    video.src = url;

    let frameId = 0;
    let settled = false;
    let started = false;
    const cleanup = () => {
      cancelAnimationFrame(frameId);
      video.pause();
      video.removeAttribute("src");
      video.load();
    };
    const finish = () => {
      if (settled) return;
      settled = true;
      cleanup();
      resolve();
    };
    const fail = (message) => {
      if (settled) return;
      settled = true;
      cleanup();
      reject(new Error(message));
    };
    const paintFrame = () => {
      try {
        drawCover(context, video, canvas.width, canvas.height);
        return true;
      } catch {
        return false;
      }
    };
    const draw = () => {
      if (!paintFrame()) {
        fail("The browser could not record one of the remote Fal clips. Use Open Video for the scene clip, or add server-side ffmpeg for MP4 stitching.");
        return;
      }
      if (!video.ended) frameId = requestAnimationFrame(draw);
    };

    video.addEventListener("ended", finish, { once: true });
    video.addEventListener("error", () => fail("A scene video failed to load while building the downloadable file."), { once: true });
    video.addEventListener(
      "loadeddata",
      () => {
        if (started || settled) return;
        paintFrame();
      },
      { once: true }
    );
    video.addEventListener(
      "canplay",
      async () => {
        try {
          if (settled) return;
          paintFrame();
          started = true;
          await video.play();
          draw();
        } catch {
          fail("The browser blocked playback while building the downloadable file.");
        }
      },
      { once: true }
    );
  });
}

function drawCover(context, video, width, height) {
  const sourceWidth = video.videoWidth || width;
  const sourceHeight = video.videoHeight || height;
  const scale = Math.max(width / sourceWidth, height / sourceHeight);
  const drawWidth = sourceWidth * scale;
  const drawHeight = sourceHeight * scale;
  context.drawImage(video, (width - drawWidth) / 2, (height - drawHeight) / 2, drawWidth, drawHeight);
}

function updateExportState(patch) {
  if (!state.project) return;
  state.project.export = {
    ...(state.project.export ?? {}),
    ...patch
  };
  saveProject();
}

function resetDownloadableExport(message) {
  if (state.downloadableVideoUrl?.startsWith("blob:")) URL.revokeObjectURL(state.downloadableVideoUrl);
  state.downloadableVideoUrl = "";
  if (!state.project?.export) return;
  const storedVideoId = state.project.export.storedVideoId;
  if (storedVideoId) deleteVideoBlob(storedVideoId);
  state.project.export = {
    status: "idle",
    message
  };
  saveProject();
}

function sceneRow(clip) {
  const requestId = clip.request_id || clip.requestId;
  const canRetry = !requestId && ["submit_failed", "status_failed", "submitting"].includes(clip.status);
  const canRerun = !state.isGenerating && !["submitting", "checking"].includes(clip.status);
  const adjustments = clip.sceneAdjustments ?? {};
  const expanded = state.activeSceneEditorId === clip.id;
  return `
    <article class="scene-row ${escapeHtml(clip.status ?? "pending")} ${expanded ? "expanded" : ""}">
      <img src="${escapeHtml(clip.previewUrl || clip.imageUrl || "")}" alt="" />
      <div class="scene-main">
        <strong>${escapeHtml(clip.title)}</strong>
        <span>${escapeHtml(renderStatusLabel(clip.status))} - ${escapeHtml(clip.message ?? "")}</span>
        ${clip.request_id || clip.requestId ? `<code>${escapeHtml(clip.request_id ?? clip.requestId)}</code>` : ""}
        ${expanded ? `
          <div class="scene-adjustments">
            ${renderSceneAdjustmentSelect(clip.id, "furniture", adjustments.furniture ?? "project")}
            ${renderSceneAdjustmentSelect(clip.id, "tv", adjustments.tv ?? "project")}
            ${renderSceneAdjustmentSelect(clip.id, "fireplace", adjustments.fireplace ?? "project")}
          </div>
          <div class="scene-editor-actions">
            <button class="ghost-button compact" data-action="close-scene-editor" data-scene-id="${escapeHtml(clip.id)}">Cancel</button>
            <button class="primary-button compact" data-action="apply-scene-rerun" data-scene-id="${escapeHtml(clip.id)}" ${canRerun ? "" : "disabled"}>Regenerate Scene</button>
          </div>
        ` : ""}
      </div>
      <div class="scene-actions">
        ${requestId ? `<button class="ghost-button compact" data-action="check-scene" data-scene-id="${escapeHtml(clip.id)}">Check</button>` : ""}
        ${canRetry ? `<button class="ghost-button compact" data-action="retry-scene" data-scene-id="${escapeHtml(clip.id)}">Retry</button>` : ""}
        <button class="ghost-button compact" data-action="open-scene-editor" data-scene-id="${escapeHtml(clip.id)}" ${canRerun ? "" : "disabled"}>${expanded ? "Editing Scene" : "Rerun Scene"}</button>
      </div>
    </article>
  `;
}

function renderSceneAdjustmentSelect(sceneId, key, value) {
  const options = sceneTreatmentOptions[key] ?? [];
  return `
    <label class="scene-adjustment">
      <select data-action="scene-adjustment" data-scene-id="${escapeHtml(sceneId)}" data-scene-key="${escapeHtml(key)}">
        ${options
          .map((option) => `<option value="${escapeHtml(option.value)}" ${option.value === value ? "selected" : ""}>${escapeHtml(option.label)}</option>`)
          .join("")}
      </select>
    </label>
  `;
}

function startPolling(sceneId) {
  if (state.pollers[sceneId]) return;
  state.pollers[sceneId] = setInterval(() => pollScene(sceneId), POLL_MS);
}

function stopPolling(sceneId) {
  if (!state.pollers[sceneId]) return;
  clearInterval(state.pollers[sceneId]);
  delete state.pollers[sceneId];
}

function resumePollers() {
  state.project?.clips?.forEach((clip) => {
    if (shouldPoll(clip)) startPolling(clip.id);
  });
}

function shouldPoll(clip) {
  return Boolean((clip.request_id || clip.requestId) && !clip.videoUrl && !["complete", "submit_failed", "render_failed", "failed", "error", "canceled"].includes(clip.status));
}

function updateClip(sceneId, patch) {
  if (!state.project) return;
  state.project.clips = state.project.clips.map((clip) => (clip.id === sceneId ? { ...clip, ...patch } : clip));
  updateProjectStatus();
  saveProject();
}

function findClip(sceneId) {
  return state.project?.clips?.find((clip) => clip.id === sceneId);
}

function findSourceFileForClip(clip) {
  if (!clip) return null;
  return state.files.find((file) => file.id === clip.sourceFileId) ?? state.files.find((file) => file.name === clip.startName) ?? null;
}

function buildFallbackSceneFile(clip) {
  if (!clip?.imageUrl) return null;
  return {
    id: clip.sourceFileId ?? `scene-fallback-${clip.id}`,
    name: clip.startName ?? `${clip.title}.jpg`,
    originalIndex: clip.index ?? 0,
    size: 0,
    originalSize: 0,
    dataUrl: clip.previewUrl?.startsWith("data:") ? clip.previewUrl : undefined,
    falUrl: clip.imageUrl
  };
}

function openSceneEditor(sceneId) {
  if (!sceneId || state.isGenerating) return;
  state.activeSceneEditorId = state.activeSceneEditorId === sceneId ? "" : sceneId;
  render();
}

function closeSceneEditor(sceneId) {
  if (state.activeSceneEditorId !== sceneId) return;
  state.activeSceneEditorId = "";
  render();
}

function updateSceneAdjustment(sceneId, key, value) {
  if (!state.project || !sceneTreatmentOptions[key]) return;
  state.project.clips = state.project.clips.map((clip) =>
    clip.id === sceneId
      ? {
          ...clip,
          sceneAdjustments: {
            furniture: "project",
            tv: "project",
            fireplace: "project",
            ...(clip.sceneAdjustments ?? {}),
            [key]: value
          }
        }
      : clip
  );
  saveProject();
}

async function rerunScene(sceneId) {
  const clip = findClip(sceneId);
  const sourceFile = findSourceFileForClip(clip) ?? buildFallbackSceneFile(clip);
  if (!clip || state.isGenerating) return;
  if (!sourceFile) {
    updateClip(sceneId, {
      status: "submit_failed",
      message: "This scene no longer has a reusable source image. Upload the photos again or rerun the full pipeline."
    });
    render();
    return;
  }

  state.activeSceneEditorId = "";
  stopPolling(sceneId);
  resetDownloadableExport(`${clip.title} changed. Build the downloadable MP4 again to include the refreshed scene.`);
  updateClip(sceneId, {
    request_id: undefined,
    requestId: undefined,
    response_url: undefined,
    responseUrl: undefined,
    status_url: undefined,
    statusUrl: undefined,
    cancel_url: undefined,
    cancelUrl: undefined,
    videoUrl: "",
    status: "staging",
    message: "Rebuilding this scene from the original photo...",
    lastCheckedAt: new Date().toISOString()
  });
  render();

  try {
    const prepared = await prepareSceneForRerun(sourceFile, clip);
    const nextClip = makeClip({
      theme: getTheme(),
      index: clip.index,
      start: prepared,
      total: state.project?.clips?.length ?? 1
    });
    updateClip(sceneId, {
      ...nextClip,
      id: clip.id,
      index: clip.index,
      title: clip.title,
      sourceFileId: clip.sourceFileId ?? nextClip.sourceFileId,
      sceneAdjustments: clip.sceneAdjustments ?? nextClip.sceneAdjustments,
      status: "pending",
      message: "Scene prepared. Submitting..."
    });
    render();
    await submitScene(sceneId);
  } catch (error) {
    updateClip(sceneId, {
      status: "submit_failed",
      message: error instanceof Error ? error.message : "Could not rerun this scene."
    });
    render();
  }
}

function updateProjectStatus() {
  if (!state.project) return;
  const clips = state.project.clips;
  if (!clips.length) {
    state.project.status = "empty";
    state.project.message = "No scenes to generate.";
    return;
  }
  const complete = clips.filter((clip) => clip.videoUrl).length;
  const failed = clips.some((clip) => ["submit_failed", "render_failed", "failed", "error"].includes(clip.status));
  if (complete === clips.length) {
    state.project.status = "complete";
    state.project.message = "Final video sequence is ready.";
  } else if (failed) {
    state.project.status = "partial";
    state.project.message = `${complete}/${clips.length} scenes complete. Some scenes need attention.`;
  } else {
    state.project.status = "rendering";
    state.project.message = `${complete}/${clips.length} scenes complete. Auto-checking every 30 seconds.`;
  }
}

function markStaleSubmissions() {
  if (!state.project?.clips?.length) return;
  const now = Date.now();
  let changed = false;
  state.project.clips = state.project.clips.map((clip) => {
    const hasRequest = clip.request_id || clip.requestId;
    const isSubmitting = ["submitting", "checking"].includes(clip.status);
    const timestamp = Date.parse(clip.lastCheckedAt ?? state.project.createdAt ?? "");
    if (!hasRequest && isSubmitting && timestamp && now - timestamp > 60000) {
      changed = true;
      return {
        ...clip,
        status: "submit_failed",
        message: "Submission did not return a Fal request ID. The image payload may have been too large or the request timed out. Retry this scene."
      };
    }
    return clip;
  });
  if (changed) updateProjectStatus();
}

function markExportMusicStale() {
  const exportState = state.project?.export;
  if (!exportState) return;
  const hasBuiltExport = exportState.serverDownloadUrl || exportState.storedVideoId || state.downloadableVideoUrl;
  if (!hasBuiltExport) return;
  const musicName = getSelectedMusic().name;
  if (exportState.musicName !== musicName) {
    resetDownloadableExport(`Music is set to ${musicName}. Build the downloadable MP4 again to include it.`);
  }
}

function clearProject() {
  Object.keys(state.pollers).forEach(stopPolling);
  const storedVideoId = state.project?.export?.storedVideoId ?? state.project?.id;
  if (storedVideoId) deleteVideoBlob(storedVideoId);
  if (state.downloadableVideoUrl?.startsWith("blob:")) URL.revokeObjectURL(state.downloadableVideoUrl);
  state.downloadableVideoUrl = "";
  state.project = null;
  state.isGenerating = false;
  saveProject();
  render();
}

function resetFilesForRerun() {
  state.files = state.files.map((file) => ({
    id: file.id,
    name: file.name,
    originalIndex: file.originalIndex ?? 0,
    size: file.size,
    originalSize: file.originalSize,
    dataUrl: file.dataUrl,
    falUrl: file.falUrl,
    uploadStatus: file.falUrl ? "uploaded" : "",
    uploadMessage: file.falUrl ? "Uploaded to Fal CDN." : "Local preview ready."
  }));
}

async function rerunProject() {
  if (state.isGenerating || !state.files.length) return;
  resetFilesForRerun();
  resetRuntimeProject();
  render();
  await generateProject();
}

function resetRuntimeProject() {
  Object.keys(state.pollers).forEach(stopPolling);
  if (state.downloadableVideoUrl?.startsWith("blob:")) URL.revokeObjectURL(state.downloadableVideoUrl);
  state.downloadableVideoUrl = "";
  state.project = null;
  state.isGenerating = false;
  saveProject();
}

function getTheme() {
  return themes.find((theme) => theme.id === state.selectedThemeId) ?? themes[0];
}

function themeCard(theme) {
  const palette = Array.isArray(theme.palette) ? theme.palette : [];
  return `
    <button class="theme-card ${theme.id === state.selectedThemeId ? "selected" : ""}" data-theme-id="${theme.id}">
      <div class="theme-visual">
        <div class="theme-swatches">
          ${palette.map((color) => `<span style="background:${escapeHtml(color)}"></span>`).join("")}
        </div>
        <div class="theme-cues">
          <span>${escapeHtml(theme.lightLabel ?? "")}</span>
          <span>${escapeHtml(theme.motionLabel ?? "")}</span>
        </div>
      </div>
      <strong>${escapeHtml(theme.name)}</strong>
      <span>${escapeHtml(theme.creator)}</span>
      <small>${escapeHtml(theme.bestFor ?? theme.movement)}</small>
    </button>
  `;
}

function tvSceneCard(scene) {
  const selected = getTvScene().id === scene.id;
  return `
    <button type="button" class="tv-card ${selected ? "selected" : ""}" data-tv-scene-id="${escapeHtml(scene.id)}">
      <span>${escapeHtml(scene.label)}</span>
      <strong>${escapeHtml(scene.name)}</strong>
    </button>
  `;
}

function imageTreatmentCard(option) {
  const selected = state.selectedImageTreatmentId === option.id;
  return `
    <button type="button" class="theme-card image-treatment-card ${selected ? "selected" : ""}" data-image-treatment-id="${escapeHtml(option.id)}">
      <strong>${escapeHtml(option.name)}</strong>
      <small>${escapeHtml(option.description)}</small>
    </button>
  `;
}

function clampTargetDuration(value) {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return MIN_TARGET_DURATION_SEC;
  const stepped = Math.round(numeric / TARGET_DURATION_STEP_SEC) * TARGET_DURATION_STEP_SEC;
  return Math.min(MAX_TARGET_DURATION_SEC, Math.max(MIN_TARGET_DURATION_SEC, stepped));
}

function formatDuration(seconds) {
  const safeSeconds = clampTargetDuration(seconds);
  if (safeSeconds < 60) return `${safeSeconds}s`;
  const minutes = Math.floor(safeSeconds / 60);
  const remainder = safeSeconds % 60;
  return remainder ? `${minutes}m ${remainder}s` : `${minutes}m`;
}

function estimateSceneCount(seconds) {
  return Math.max(1, Math.floor(clampTargetDuration(seconds) / SCENE_DURATION_SECONDS));
}

function selectImageTreatment(treatmentId) {
  const nextTreatment = imageTreatmentOptions.find((option) => option.id === treatmentId) ?? imageTreatmentOptions[0];
  if (!nextTreatment || nextTreatment.id === state.selectedImageTreatmentId) return;
  state.selectedImageTreatmentId = nextTreatment.id;
  saveSettings();
  clearFurnitureOutputs();
  clearFireplaceOutputs();
  resetRuntimeProject();
  render();
}

function getImageTreatmentPrompt() {
  return state.selectedImageTreatmentId === "cinematic" ? CINEMATIC_IMAGE_PROMPT : "";
}

function getTvScene(sceneId = state.selectedTvSceneId) {
  return tvScenes.find((scene) => scene.id === sceneId) ?? tvScenes.find((scene) => scene.id === DEFAULT_TV_SCENE_ID) ?? tvScenes[0];
}

function selectTvScene(sceneId) {
  const nextScene = getTvScene(sceneId);
  if (!nextScene || nextScene.id === state.selectedTvSceneId) return;
  state.selectedTvSceneId = nextScene.id;
  saveSettings();
  clearFurnitureOutputs();
  resetRuntimeProject();
  render();
}

function selectTargetDuration(durationSec) {
  const nextDuration = clampTargetDuration(durationSec);
  if (nextDuration === state.targetDurationSec) return;
  state.targetDurationSec = nextDuration;
  saveSettings();
  resetRuntimeProject();
  render();
}

function clearFurnitureOutputs() {
  state.files = state.files.map((file) => ({
    ...file,
    stagedImageUrl: undefined,
    tvImageUrl: undefined,
    fireImageUrl: undefined,
    treatedImageUrl: undefined,
    cinematicBaseImageUrl: undefined,
    furnitureAnalysis: undefined,
    fireplaceAnalysis: undefined,
    tvAdded: undefined,
    tvSceneId: undefined,
    tvSceneName: undefined,
    stagingVersion: undefined,
    roomGroupId: file.roomGroupId,
    roomLabel: file.roomLabel,
    stagingStyle: file.stagingStyle,
    uploadStatus: file.falUrl ? "uploaded" : "",
    uploadMessage: file.falUrl ? "Uploaded to Fal CDN." : "Local preview ready."
  }));
}

function clearFireplaceOutputs() {
  state.files = state.files.map((file) => ({
    ...file,
    fireImageUrl: undefined,
    treatedImageUrl: undefined,
    cinematicBaseImageUrl: undefined,
    fireplaceAnalysis: undefined,
    uploadStatus: file.stagedImageUrl ? "staged" : file.falUrl ? "uploaded" : "",
    uploadMessage: file.stagedImageUrl ? "Furniture added." : file.falUrl ? "Uploaded to Fal CDN." : "Local preview ready."
  }));
}

function musicCard(track) {
  const selected = getSelectedMusic().id === track.id;
  const previewing = state.previewingMusicId === track.id;
  return `
    <article class="music-card ${selected ? "selected" : ""}">
      <button type="button" class="music-preview-button ${previewing ? "playing" : ""}" data-action="preview-music" data-music-id="${escapeHtml(track.id)}" aria-label="${previewing ? "Pause" : "Play"} ${escapeHtml(track.name)}">
        ${previewing ? icon("pause", "M8 5h3v14H8zM13 5h3v14h-3z") : icon("play", "M8 5v14l11-7Z")}
      </button>
      <div class="music-copy">
        <strong>
          ${escapeHtml(track.name)}
          <span>${escapeHtml(track.category ?? (track.source ? "Studio" : "Built-in"))}</span>
          <span>${track.bpm} BPM</span>
        </strong>
        <small>${escapeHtml(track.vibe)}</small>
      </div>
      <button type="button" class="music-select-button ${selected ? "selected" : ""}" data-action="select-music" data-music-id="${escapeHtml(track.id)}">
        ${selected ? `${icon("check", "M20 6 9 17l-5-5")} Selected` : "Use"}
      </button>
    </article>
  `;
}

function getSelectedMusic() {
  return musicTracks.find((track) => track.id === state.selectedMusicId) ?? musicTracks.find((track) => track.id === DEFAULT_MUSIC_ID) ?? musicTracks[0];
}

function selectMusic(musicId) {
  const nextMusic = musicTracks.find((track) => track.id === musicId) ?? musicTracks.find((track) => track.id === DEFAULT_MUSIC_ID);
  if (!nextMusic || nextMusic.id === state.selectedMusicId) return;
  state.selectedMusicId = nextMusic.id;
  saveSettings();
  stopMusicPreview();
  resetDownloadableExport(`Music changed to ${nextMusic.name}. Build the downloadable MP4 again to include it.`);
  render();
}

async function previewMusic(musicId) {
  if (state.previewingMusicId === musicId) {
    stopMusicPreview();
    render();
    return;
  }

  stopMusicPreview();
  const music = musicTracks.find((track) => track.id === musicId);
  if (!music) return;

  try {
    if (music.source) {
      const audio = new Audio(music.source);
      audio.loop = true;
      audio.volume = 0.9;
      await audio.play();
      musicPreview = {
        id: music.id,
        stop: async () => {
          audio.pause();
          audio.currentTime = 0;
        }
      };
    } else {
      const audioContext = createAudioContext();
      await audioContext.resume();
      const controller = await startMusicSource(audioContext, audioContext.destination, music);
      musicPreview = {
        id: music.id,
        stop: async () => {
          controller.stop();
          await closeAudioContext(audioContext);
        }
      };
    }
    musicPreview.timeout = window.setTimeout(() => {
      if (musicPreview?.id === music.id) {
        stopMusicPreview();
        render();
      }
    }, 12000);
    state.previewingMusicId = music.id;
    render();
  } catch {
    stopMusicPreview();
    state.previewingMusicId = "";
    render();
  }
}

function stopMusicPreview() {
  if (musicPreview?.timeout) window.clearTimeout(musicPreview.timeout);
  const stop = musicPreview?.stop;
  musicPreview = null;
  state.previewingMusicId = "";
  if (stop) stop();
}

function fileCard(file, index) {
  const uploadText = file.uploadMessage || (file.falUrl ? "Uploaded to Fal CDN." : "Local preview ready.");
  const imageUrl = file.fireImageUrl || file.stagedImageUrl || file.dataUrl;
  return `
    <article class="simple-file-card sequence-card ${escapeHtml(file.uploadStatus ?? "")}">
      <img src="${imageUrl}" alt="" />
      <div>
        <strong>${String(index + 1).padStart(2, "0")} - ${escapeHtml(file.name)}</strong>
        <span>${formatBytes(file.size)} - ${escapeHtml(uploadText)}</span>
      </div>
    </article>
  `;
}

function statusMessage(result) {
  const position = result.queue_position ?? result.queuePosition;
  if (position !== undefined && position !== null) {
    return `Fal status: ${result.status}. Queue position ${position}.`;
  }
  return `Fal status: ${result.status ?? "submitted"}.`;
}

function normalizeStatus(status) {
  return String(status ?? "pending").toLowerCase();
}

function renderStatusLabel(status) {
  const labels = {
    pending: "Pending",
    submitting: "Submitting",
    submitted: "Submitted",
    in_queue: "In queue",
    in_progress: "Rendering",
    checking: "Checking",
    complete: "Complete",
    uploading: "Uploading",
    checking_furniture: "Checking furniture",
    checking_fireplace: "Checking fireplace",
    staging: "Adding furniture",
    staged: "Furniture added",
    fire_added: "Fireplace warmed",
    kept: "Kept original",
    upload_failed: "Upload failed",
    staging_failed: "Furniture failed",
    status_failed: "Status failed",
    submit_failed: "Submit failed"
  };
  return labels[normalizeStatus(status)] ?? String(status ?? "Pending");
}

function findVideoUrl(value) {
  if (!value) return "";
  if (typeof value === "string") return /^https?:\/\/.+\.(mp4|mov|webm)(\?|$)/i.test(value) ? value : "";
  if (Array.isArray(value)) {
    for (const item of value) {
      const found = findVideoUrl(item);
      if (found) return found;
    }
    return "";
  }
  if (typeof value === "object") {
    for (const [key, item] of Object.entries(value)) {
      if (/video|url|file|media/i.test(key)) {
        const found = findVideoUrl(item);
        if (found) return found;
      }
    }
  }
  return "";
}

function loadProject() {
  try {
    return JSON.parse(localStorage.getItem(PROJECT_KEY) ?? "null");
  } catch {
    return null;
  }
}

function loadSettings() {
  try {
    return JSON.parse(localStorage.getItem(SETTINGS_KEY) ?? "{}");
  } catch {
    return {};
  }
}

function saveSettings() {
  try {
    localStorage.setItem(
      SETTINGS_KEY,
      JSON.stringify({
        selectedThemeId: state.selectedThemeId,
        selectedMusicId: state.selectedMusicId,
        selectedTvSceneId: state.selectedTvSceneId,
        selectedImageTreatmentId: state.selectedImageTreatmentId,
        targetDurationSec: state.targetDurationSec,
        addFurniture: state.addFurniture,
        addFireplaceFire: state.addFireplaceFire,
        softenDrivewayShadows: state.softenDrivewayShadows
      })
    );
  } catch {
    // Settings are best-effort.
  }
}

function saveProject() {
  try {
    const project = state.project
      ? {
          ...state.project,
          export: state.project.export ? { ...state.project.export, status: state.project.export.status === "building" ? "idle" : state.project.export.status } : undefined
        }
      : null;
    localStorage.setItem(PROJECT_KEY, JSON.stringify(project));
  } catch {
    // Persistence is best-effort.
  }
}

function openVideoDb() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(VIDEO_DB_NAME, 1);
    request.onupgradeneeded = () => {
      request.result.createObjectStore(VIDEO_STORE_NAME, { keyPath: "id" });
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

async function saveVideoBlob(id, blob) {
  const db = await openVideoDb();
  await new Promise((resolve, reject) => {
    const transaction = db.transaction(VIDEO_STORE_NAME, "readwrite");
    transaction.objectStore(VIDEO_STORE_NAME).put({
      id,
      blob,
      createdAt: new Date().toISOString()
    });
    transaction.oncomplete = resolve;
    transaction.onerror = () => reject(transaction.error);
  });
  db.close();
}

async function getVideoBlob(id) {
  const db = await openVideoDb();
  const record = await new Promise((resolve, reject) => {
    const transaction = db.transaction(VIDEO_STORE_NAME, "readonly");
    const request = transaction.objectStore(VIDEO_STORE_NAME).get(id);
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
  db.close();
  return record?.blob ?? null;
}

async function deleteVideoBlob(id) {
  try {
    const db = await openVideoDb();
    await new Promise((resolve, reject) => {
      const transaction = db.transaction(VIDEO_STORE_NAME, "readwrite");
      transaction.objectStore(VIDEO_STORE_NAME).delete(id);
      transaction.oncomplete = resolve;
      transaction.onerror = () => reject(transaction.error);
    });
    db.close();
  } catch {
    // Deleting persisted output is best-effort.
  }
}

async function restoreDownloadableVideo() {
  const videoId = state.project?.export?.storedVideoId;
  const serverDownloadUrl = state.project?.export?.serverDownloadUrl;
  if (state.downloadableVideoUrl) return;
  if (serverDownloadUrl) {
    state.downloadableVideoUrl = serverDownloadUrl;
    const link = document.querySelector("[data-final-download-link]");
    if (link) link.href = state.downloadableVideoUrl;
    if (!link) render();
    return;
  }
  if (!videoId) return;
  try {
    const blob = await getVideoBlob(videoId);
    if (!blob) return;
    const fileName = state.project?.export?.fileName ?? "autohdr-final-video.mp4";
    const exported = await exportVideoBlob(blob, videoId, fileName);
    if (exported.ok && exported.downloadUrl) {
      state.downloadableVideoUrl = exported.downloadUrl;
      updateExportState({
        status: "ready",
        fileName: exported.fileName ?? fileName,
        serverDownloadUrl: exported.downloadUrl,
        musicName: getSelectedMusic().name,
        message: "Download is ready."
      });
      render();
      return;
    }
    state.downloadableVideoUrl = URL.createObjectURL(blob);
    const link = document.querySelector("[data-final-download-link]");
    if (link) link.href = state.downloadableVideoUrl;
    if (!link) render();
  } catch {
    // If IndexedDB is unavailable, the user can rebuild the downloadable file.
  }
}

function emptyState(text) {
  return `<div class="simple-empty">${escapeHtml(text)}</div>`;
}

function formatBytes(bytes) {
  if (!bytes) return "0 B";
  const units = ["B", "KB", "MB"];
  const index = Math.min(units.length - 1, Math.floor(Math.log(bytes) / Math.log(1024)));
  return `${(bytes / 1024 ** index).toFixed(index ? 1 : 0)} ${units[index]}`;
}

function icon(label, path) {
  return `<svg aria-label="${label}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${path
    .split("M")
    .filter(Boolean)
    .map((item) => `<path d="M${item.trim()}" />`)
    .join("")}</svg>`;
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

render();
