export const roomTags = ["Exterior", "Entry", "Living", "Kitchen", "Dining", "Bedroom", "Bathroom", "Detail", "Amenity"];

export const defaultPromptPack = [
  {
    label: "Editorial Shadows",
    prompt:
      "Transform this photo into a cinematic editorial image with harsh, directional shadows. Correct perspective distortion, preserve white balance, and keep the scene bright enough to read while retaining dramatic depth."
  },
  {
    label: "Window Pulls",
    prompt:
      "Apply filmic window pulls that reveal deep, rich exterior views with controlled highlights and natural falloff. Avoid HDR flattening, haloing, and global tonal compression."
  },
  {
    label: "85mm Detail",
    prompt:
      "Create an 85mm close-up detail shot of the main feature in the room with crisp texture, soft bokeh, neutral white balance, and balanced exposure."
  },
  {
    label: "Timelapse Light",
    prompt:
      "Very slow truck right, time-lapse light progression, camera slides laterally while light shifts across the space, shadows gradually move and lengthen, stable cinematic motion."
  }
];

export const creatorStyles = [
  {
    id: "ski-house",
    name: "Ski House Style",
    creator: "By JT Visuals",
    musicCue: "76 BPM cinematic",
    colorGrade: "cool whites, warm practicals, deep exterior blues",
    modelPreference: {
      image: "fal/nano-banana/edit",
      video: "bytedance/seedance-2.0/image-to-video"
    },
    roomSequence: ["Exterior", "Entry", "Living", "Kitchen", "Detail", "Bedroom", "Bathroom", "Exterior"],
    movements: [
      "Drone Top Down Descend",
      "Wide dolly in",
      "Slider Truck Left to Right",
      "Tight truck",
      "Parallax Orbit",
      "Crane Up"
    ],
    beatPattern: [0, 4, 8, 12, 16, 20, 24, 28],
    imageTone:
      "cinematic editorial, crisp mountain light, architectural precision, controlled highlights, premium resort realism"
  },
  {
    id: "editorial-timelapse",
    name: "Editorial Timelapse",
    creator: "AutoHDR Lab",
    musicCue: "84 BPM minimal pulse",
    colorGrade: "neutral whites, dimensional shadows, rich window views",
    modelPreference: {
      image: "fal/nano-banana/edit",
      video: "bytedance/seedance-2.0/image-to-video"
    },
    roomSequence: ["Living", "Kitchen", "Detail", "Dining", "Bedroom", "Bathroom", "Exterior"],
    movements: [
      "Slider Truck Right to Left",
      "Wide slide",
      "Wide dolly in",
      "Tight truck",
      "Dolly In (timelapse)",
      "Crane Down"
    ],
    beatPattern: [0, 3.5, 7, 11, 15, 19, 23],
    imageTone:
      "harsh directional light, crawling shadows, polished editorial architecture, no artificial glow"
  },
  {
    id: "airy-luxury",
    name: "Airy Luxury",
    creator: "Maya Reed",
    musicCue: "68 BPM elegant piano",
    colorGrade: "bright interiors, clean whites, saturated exteriors, gentle contrast",
    modelPreference: {
      image: "fal/nano-banana/edit",
      video: "bytedance/seedance-2.0/image-to-video"
    },
    roomSequence: ["Exterior", "Living", "Kitchen", "Dining", "Bedroom", "Bathroom", "Detail"],
    movements: ["Dolly In (Path-Based)", "Dolly Out (Path-Based)", "Slider Truck Left to Right", "Crane Up"],
    beatPattern: [0, 5, 10, 15, 20, 25, 30],
    imageTone:
      "bright and airy, inviting polished interiors, corrected perspective, soft dimensional shadow"
  },
  {
    id: "moody-modern",
    name: "Moody Modern",
    creator: "Northline Films",
    musicCue: "92 BPM dark electronic",
    colorGrade: "deep blacks, warm accents, contrast-rich glass and stone",
    modelPreference: {
      image: "fal/nano-banana/edit",
      video: "bytedance/seedance-2.0/image-to-video"
    },
    roomSequence: ["Exterior", "Detail", "Living", "Kitchen", "Bedroom", "Bathroom", "Exterior"],
    movements: ["Parallax Orbit (Path-Based)", "Tight truck", "Wide dolly in", "Crane Down", "Orbit (Hyperlapse)"],
    beatPattern: [0, 3, 6, 9, 12, 16, 20],
    imageTone:
      "dramatic contrast, sculpted shadows, premium modern architecture, deep but readable interiors"
  }
];

const movementPrompts = {
  "Dolly In (Path-Based)":
    "Super smooth camera moves forward in a straight line through the space, cinematic, stable motion, photorealistic.",
  "Dolly In (timelapse)":
    "Super smooth camera moves forward in a straight line while the sun lowers in a timelapse, shadows gradually move and lengthen, cinematic.",
  "Dolly Out (Path-Based)":
    "Super smooth camera moves backward in a straight line revealing the space, cinematic, stable motion.",
  "Drone Top Down Descend":
    "Super smooth camera descends in a straight line from a top-down angle, cinematic, premium real estate reveal.",
  "Slider Truck Left to Right":
    "Super smooth camera glides horizontally from left to right, parallel path, cinematic architectural motion.",
  "Slider Truck Right to Left":
    "Super smooth camera glides horizontally from right to left, parallel path, cinematic architectural motion.",
  "Parallax Orbit":
    "Super smooth camera travels in an arc around the subject, subject stays centered, cinematic parallax.",
  "Parallax Orbit (Path-Based)":
    "Super smooth camera travels in an arc around the subject, subject stays centered, cinematic parallax.",
  "Crane Up":
    "Super smooth camera rises vertically upward, straight vertical path, cinematic architectural reveal.",
  "Crane Down":
    "Super smooth camera descends vertically downward, straight vertical path, cinematic reveal.",
  "Orbit (Hyperlapse)":
    "Super smooth camera travels in an arc around subject while sky hyperlapses naturally in the background.",
  "Wide slide":
    "Wide interior shot with slow trucking movement side to side as harsh directional light moves and expands across the modern space. Crisp shadow edges in motion, editorial film style.",
  "Wide dolly in":
    "Wide interior shot with a slow smooth dolly in. Dramatic shadows crawl and shift across furnishings. Balanced exposure and atmospheric architectural cinematography.",
  "Tight truck":
    "Tight interior shot with slow trucking movement side to side as harsh directional light expands across textured surfaces. Shallow depth of field and crisp shadow edges."
};

const roomShotCopy = {
  Exterior: "Establish the property with a premium architectural reveal and confident arrival energy.",
  Entry: "Move through the threshold as if the viewer is stepping into the home.",
  Living: "Show the main volume with dimensional light, window views, and a slow cinematic push.",
  Kitchen: "Feature cabinetry, stone, island geometry, and premium appliance lines.",
  Dining: "Create a graceful transition shot that emphasizes flow and hosting atmosphere.",
  Bedroom: "Slow down the edit and make the room feel calm, warm, and composed.",
  Bathroom: "Use controlled highlights and crisp surfaces to sell spa-level finish.",
  Detail: "Cut close to texture, shadow, millwork, fixtures, or fireplace moments.",
  Amenity: "Reveal the amenity as a lifestyle punctuation shot."
};

export function generateProject({ photos, style }) {
  const orderedPhotos = orderPhotosByStyle(photos, style.roomSequence);
  let cursor = 0;
  const shots = orderedPhotos.map((photo, index) => {
    const duration = index === 0 ? 5 : index % 3 === 0 ? 4.5 : 4;
    const movement = style.movements[index % style.movements.length];
    const shot = buildShot({ photo, style, index, duration, movement, start: cursor });
    cursor += duration;
    return shot;
  });

  return {
    id: `project-${hashString(`${style.id}-${photos.map((photo) => photo.id).join("-")}`)}`,
    slug: `autohdr-${style.id}-motion-project`,
    createdAt: new Date().toISOString(),
    version: "0.1.0",
    style: {
      id: style.id,
      name: style.name,
      creator: style.creator,
      musicCue: style.musicCue,
      colorGrade: style.colorGrade,
      modelPreference: style.modelPreference
    },
    sourcePhotos: photos,
    duration: Number(cursor.toFixed(1)),
    renderSettings: {
      aspectRatio: "16:9",
      resolution: "1920x1080",
      fps: 24,
      transition: "hard cuts on beat with subtle speed ramps",
      output: "mp4"
    },
    shots,
    renderQueue: shots.map(toRenderJob)
  };
}

export function updateShot(project, shotId, patch) {
  const shots = project.shots.map((shot) => (shot.id === shotId ? { ...shot, ...patch } : shot));
  return {
    ...project,
    shots,
    duration: shots.reduce((sum, shot) => sum + Number(shot.duration), 0),
    renderQueue: shots.map(toRenderJob)
  };
}

function buildShot({ photo, style, index, duration, movement, start }) {
  const imagePrompt = [
    `Transform this ${photo.type.toLowerCase()} photo into a cinematic real estate frame.`,
    style.imageTone,
    "Correct perspective so vertical lines are true verticals and horizontals are level.",
    "Preserve architecture, materials, white balance, and all real property details.",
    "Derive light direction only from visible windows, doors, architectural openings, and practical fixtures.",
    "Avoid HDR flattening, plastic texture, warped geometry, fake furniture, and over-smoothed AI artifacts."
  ].join(" ");

  const videoPrompt = [
    movementPrompts[movement] ?? movementPrompts["Dolly In (Path-Based)"],
    roomShotCopy[photo.type] ?? roomShotCopy.Living,
    "Consistent exposure, photorealistic texture, stable motion, no object morphing, no text overlays."
  ].join(" ");

  return {
    id: `shot-${index + 1}-${hashString(photo.id)}`,
    title: `${photo.type} ${index + 1}`,
    roomType: photo.type,
    photo,
    style,
    movement,
    duration,
    start: Number(start.toFixed(1)),
    end: Number((start + duration).toFixed(1)),
    beat: style.beatPattern[index % style.beatPattern.length],
    imagePrompt,
    videoPrompt,
    transitionOut: index % 4 === 3 ? "speed ramp into beat" : "clean beat cut",
    qualityChecks: [
      "No AI wobble on architecture",
      "No furniture morphing",
      "Window views remain natural",
      "Verticals stay straight",
      "Motion matches creator style"
    ]
  };
}

function orderPhotosByStyle(photos, sequence) {
  const buckets = new Map();
  photos.forEach((photo) => {
    const bucket = buckets.get(photo.type) ?? [];
    bucket.push(photo);
    buckets.set(photo.type, bucket);
  });

  const ordered = [];
  sequence.forEach((roomType) => {
    const bucket = buckets.get(roomType);
    if (bucket?.length) ordered.push(bucket.shift());
  });

  photos.forEach((photo) => {
    if (!ordered.some((item) => item.id === photo.id)) ordered.push(photo);
  });

  return ordered;
}

function toRenderJob(shot) {
  return {
    shotId: shot.id,
    sourceImage: shot.photo.name,
    imageModel: shot.style.modelPreference.image,
    videoModel: shot.style.modelPreference.video,
    imagePrompt: shot.imagePrompt,
    videoPrompt: shot.videoPrompt,
    duration: shot.duration,
    targetBeat: shot.beat,
    transitionOut: shot.transitionOut
  };
}

function hashString(value) {
  let hash = 0;
  for (let index = 0; index < value.length; index += 1) {
    hash = (hash << 5) - hash + value.charCodeAt(index);
    hash |= 0;
  }
  return Math.abs(hash).toString(36);
}
