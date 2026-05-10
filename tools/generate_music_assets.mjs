import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";

const SAMPLE_RATE = 44100;
const TWO_PI = Math.PI * 2;
const SCALE = [0, 2, 4, 5, 7, 9, 11];

const tracks = [
  {
    file: "assets/music/sunlit-drive.wav",
    bpm: 122,
    key: 220,
    durationSec: 42,
    style: "house",
    progression: [
      { degree: 0, quality: "maj7" },
      { degree: 5, quality: "min7" },
      { degree: 3, quality: "min7" },
      { degree: 4, quality: "sus2" }
    ],
    bassline: [0, 0, 2, 4, 5, 5, 4, 2],
    hook: [7, 9, 11, 14, 11, 9, 7, 4, 7, 9, 11, 16, 14, 11, 9, 7]
  },
  {
    file: "assets/music/coastal-glide.wav",
    bpm: 108,
    key: 196,
    durationSec: 42,
    style: "coastal",
    progression: [
      { degree: 0, quality: "add9" },
      { degree: 3, quality: "maj7" },
      { degree: 5, quality: "min7" },
      { degree: 4, quality: "sus2" }
    ],
    bassline: [0, 2, 4, 5, 4, 2, 0, -2],
    hook: [11, 9, 7, 9, 11, 14, 16, 14, 11, 9, 7, 9, 11, 14, 9, 7]
  },
  {
    file: "assets/music/summit-arrival.wav",
    bpm: 118,
    key: 174.61,
    durationSec: 42,
    style: "cinematic",
    progression: [
      { degree: 0, quality: "sus2" },
      { degree: 4, quality: "maj7" },
      { degree: 5, quality: "min7" },
      { degree: 3, quality: "maj7" }
    ],
    bassline: [0, 0, 4, 5, 7, 5, 4, 2],
    hook: [7, 7, 11, 14, 16, 14, 11, 9, 7, 9, 11, 14, 18, 16, 14, 11]
  }
];

for (const track of tracks) {
  const rendered = renderTrack(track);
  const wav = encodeWav(rendered, SAMPLE_RATE);
  const output = resolve(process.cwd(), track.file);
  mkdirSync(dirname(output), { recursive: true });
  writeFileSync(output, wav);
}

function renderTrack(track) {
  const totalFrames = Math.floor(track.durationSec * SAMPLE_RATE);
  const left = new Float32Array(totalFrames);
  const right = new Float32Array(totalFrames);
  const beat = 60 / track.bpm;
  const bar = beat * 4;
  const sectionLengthBars = 8;
  const songBars = Math.ceil(track.durationSec / bar);

  for (let frame = 0; frame < totalFrames; frame += 1) {
    const time = frame / SAMPLE_RATE;
    const barIndex = Math.floor(time / bar);
    const beatIndex = Math.floor(time / beat);
    const sixteenthIndex = Math.floor(time / (beat / 4));
    const sectionIndex = Math.floor(barIndex / sectionLengthBars);
    const sectionPhase = (barIndex % sectionLengthBars) / sectionLengthBars;
    const intensity = getSectionIntensity(track.style, sectionIndex, sectionPhase, songBars);
    const chord = chordForBar(track, barIndex);
    const localBarTime = time % bar;
    const localBeatTime = time % beat;
    const localSixteenthTime = time % (beat / 4);
    const swingOffset = swing(sixteenthIndex, beat, track.style);
    const shiftedTime = time + swingOffset;

    let mono = 0;
    mono += padLayer(track, chord, time, localBarTime, intensity) * 0.24;
    mono += subBass(track, beatIndex, shiftedTime, beat, intensity) * 0.28;
    mono += pluckLayer(track, chord, sixteenthIndex, shiftedTime, beat, intensity) * 0.14;
    mono += kickLayer(track.style, localBeatTime, beat, intensity) * 0.62;
    mono += clapLayer(track.style, time, beat, intensity) * 0.2;
    mono += hatLayer(track.style, localSixteenthTime, beat, sixteenthIndex, intensity) * 0.12;
    mono += hookLayer(track, sixteenthIndex, shiftedTime, beat, intensity) * 0.17;
    mono += airLayer(track.style, time, intensity) * 0.05;

    const sidechain = 1 - kickEnvelope(localBeatTime, beat) * 0.42;
    mono *= sidechain;

    const stereo = stereoSpread(track.style, time, intensity);
    const limited = Math.tanh(mono * 1.48) * 0.82;
    left[frame] = limited * (1 - stereo * 0.15);
    right[frame] = limited * (1 + stereo * 0.15);
  }

  fadeInOut(left, right, SAMPLE_RATE * 0.18);
  return [left, right];
}

function chordForBar(track, barIndex) {
  const pattern = track.progression[barIndex % track.progression.length];
  return buildChord(track.key, pattern.degree, pattern.quality);
}

function buildChord(key, degree, quality) {
  const root = noteFreq(key, degree, 0);
  const intervalMap = {
    maj7: [0, 4, 7, 11],
    min7: [0, 3, 7, 10],
    add9: [0, 4, 7, 14],
    sus2: [0, 2, 7, 12]
  };
  const intervals = intervalMap[quality] ?? intervalMap.maj7;
  return intervals.map((interval) => root * 2 ** (interval / 12));
}

function noteFreq(key, step, octaveOffset = 0) {
  const degree = ((step % SCALE.length) + SCALE.length) % SCALE.length;
  const wrappedOctave = Math.floor(step / SCALE.length);
  const semitone = SCALE[degree] + wrappedOctave * 12 + octaveOffset * 12;
  return key * 2 ** (semitone / 12);
}

function getSectionIntensity(style, sectionIndex, sectionPhase, totalBars) {
  const sections = {
    house: [0.5, 0.75, 0.95, 0.8],
    coastal: [0.45, 0.65, 0.82, 0.72],
    cinematic: [0.4, 0.58, 0.88, 0.78]
  }[style] ?? [0.5, 0.7, 0.9, 0.75];
  const base = sections[Math.min(sectionIndex, sections.length - 1)] ?? sections.at(-1);
  return base + Math.sin(sectionPhase * Math.PI) * 0.05 + Math.min(totalBars / 48, 0.08);
}

function swing(stepIndex, beat, style) {
  if (style === "cinematic") return 0;
  const isOffStep = stepIndex % 2 === 1;
  return isOffStep ? beat * (style === "coastal" ? 0.012 : 0.02) : 0;
}

function env(position, attack, decay) {
  if (position < 0) return 0;
  if (position < attack) return position / Math.max(attack, 1e-4);
  return Math.max(0, 1 - (position - attack) / Math.max(decay, 1e-4));
}

function smoothstep(x) {
  const t = Math.max(0, Math.min(1, x));
  return t * t * (3 - 2 * t);
}

function padLayer(track, chord, time, localBarTime, intensity) {
  const open = smoothstep(localBarTime / 0.9);
  let total = 0;
  chord.forEach((frequency, index) => {
    const detune = 1 + index * 0.002;
    const sine = Math.sin(TWO_PI * frequency * time);
    const softSaw = Math.atan(Math.sin(TWO_PI * frequency * detune * time) * 2.5) * 0.75;
    const shimmer = Math.sin(TWO_PI * frequency * 0.5 * time + index * 0.3) * 0.28;
    total += (sine * 0.38 + softSaw * 0.42 + shimmer) * (0.8 / chord.length);
  });
  return total * (0.44 + intensity * 0.2) * open;
}

function subBass(track, beatIndex, time, beat, intensity) {
  const step = track.bassline[beatIndex % track.bassline.length];
  const frequency = noteFreq(track.key, step, -1);
  const phase = time % beat;
  const sustain = track.style === "cinematic" ? beat * 1.4 : beat * 0.95;
  const envelope = env(phase, 0.01, sustain);
  const sine = Math.sin(TWO_PI * frequency * time);
  const second = Math.sin(TWO_PI * frequency * 2 * time) * 0.18;
  const grit = Math.atan(Math.sin(TWO_PI * frequency * time) * 2.3) * 0.25;
  return (sine + second + grit) * envelope * (0.9 + intensity * 0.18);
}

function pluckLayer(track, chord, stepIndex, time, beat, intensity) {
  const division = track.style === "coastal" ? 3 : 2;
  if (stepIndex % division !== 0) return 0;
  const noteIndex = stepIndex % chord.length;
  const frequency = chord[noteIndex] * (track.style === "cinematic" ? 1 : 2);
  const position = time % (beat / 2);
  const envelope = env(position, 0.002, beat * 0.23);
  const tone = Math.sin(TWO_PI * frequency * time);
  const bright = Math.sin(TWO_PI * frequency * 2 * time) * 0.35;
  return (tone + bright) * envelope * (0.45 + intensity * 0.2);
}

function kickEnvelope(localBeatTime, beat) {
  return env(localBeatTime, 0.002, Math.min(0.2, beat * 0.38));
}

function kickLayer(style, localBeatTime, beat, intensity) {
  const envelope = kickEnvelope(localBeatTime, beat);
  const pitchDrop = 130 - Math.min(localBeatTime / 0.18, 1) * (style === "cinematic" ? 70 : 82);
  return Math.sin(TWO_PI * pitchDrop * localBeatTime) * envelope * (0.9 + intensity * 0.12);
}

function clapLayer(style, time, beat, intensity) {
  const barTime = time % (beat * 4);
  const accented = [beat, beat * 3];
  let total = 0;
  for (const hit of accented) {
    const position = barTime - hit;
    if (position < 0 || position > 0.13) continue;
    const envelope = env(position, 0.001, 0.11);
    const noise = hashNoise(time * 5200) * 0.75 + Math.sin(TWO_PI * 240 * time) * 0.15;
    total += noise * envelope;
  }
  return total * (style === "cinematic" ? 0.7 : 1) * (0.7 + intensity * 0.25);
}

function hatLayer(style, localSixteenthTime, beat, stepIndex, intensity) {
  const division = beat / 4;
  if (localSixteenthTime > 0.045) return 0;
  const accent = stepIndex % 4 === 2 ? 1.12 : 0.84;
  const envelope = env(localSixteenthTime, 0.001, division * 0.16);
  const metal = Math.sin(TWO_PI * 6200 * localSixteenthTime) + Math.sin(TWO_PI * 9100 * localSixteenthTime) * 0.42;
  return metal * envelope * accent * (0.55 + intensity * 0.22) * (style === "cinematic" ? 0.7 : 1);
}

function hookLayer(track, stepIndex, time, beat, intensity) {
  const noteLength = track.style === "cinematic" ? beat * 0.75 : beat * 0.5;
  const position = time % noteLength;
  const envelope = env(position, 0.01, noteLength * 0.82);
  const step = track.hook[stepIndex % track.hook.length];
  const frequency = noteFreq(track.key, step, track.style === "cinematic" ? 1 : 0);
  const lead = Math.sin(TWO_PI * frequency * time);
  const wide = Math.sin(TWO_PI * frequency * 2 * time + 0.4) * 0.24;
  const glow = Math.atan(Math.sin(TWO_PI * frequency * 0.5 * time) * 2.1) * 0.18;
  return (lead * 0.72 + wide + glow) * envelope * (0.48 + intensity * 0.16);
}

function airLayer(style, time, intensity) {
  const band = Math.sin(TWO_PI * 7800 * time + Math.sin(time * 0.4) * 0.8);
  const shimmer = hashNoise(time * 8100) * 0.45;
  const slow = 0.5 + 0.5 * Math.sin(time * (style === "coastal" ? 0.9 : 0.7));
  return (band + shimmer) * slow * (0.25 + intensity * 0.12);
}

function stereoSpread(style, time, intensity) {
  const rate = style === "coastal" ? 0.38 : style === "cinematic" ? 0.24 : 0.52;
  return Math.sin(time * rate) * (0.45 + intensity * 0.18);
}

function hashNoise(value) {
  const sine = Math.sin(value * 12.9898 + 78.233) * 43758.5453;
  return (sine - Math.floor(sine)) * 2 - 1;
}

function fadeInOut(left, right, fadeFrames) {
  const total = left.length;
  for (let index = 0; index < fadeFrames; index += 1) {
    const gain = smoothstep(index / fadeFrames);
    left[index] *= gain;
    right[index] *= gain;
    const out = smoothstep((fadeFrames - index) / fadeFrames);
    left[total - 1 - index] *= out;
    right[total - 1 - index] *= out;
  }
}

function encodeWav(channels, sampleRate) {
  const channelCount = channels.length;
  const frameCount = channels[0].length;
  const bytesPerSample = 2;
  const blockAlign = channelCount * bytesPerSample;
  const dataSize = frameCount * blockAlign;
  const buffer = Buffer.alloc(44 + dataSize);

  buffer.write("RIFF", 0);
  buffer.writeUInt32LE(36 + dataSize, 4);
  buffer.write("WAVE", 8);
  buffer.write("fmt ", 12);
  buffer.writeUInt32LE(16, 16);
  buffer.writeUInt16LE(1, 20);
  buffer.writeUInt16LE(channelCount, 22);
  buffer.writeUInt32LE(sampleRate, 24);
  buffer.writeUInt32LE(sampleRate * blockAlign, 28);
  buffer.writeUInt16LE(blockAlign, 32);
  buffer.writeUInt16LE(bytesPerSample * 8, 34);
  buffer.write("data", 36);
  buffer.writeUInt32LE(dataSize, 40);

  let offset = 44;
  for (let frame = 0; frame < frameCount; frame += 1) {
    for (let channel = 0; channel < channelCount; channel += 1) {
      const sample = Math.max(-1, Math.min(1, channels[channel][frame]));
      buffer.writeInt16LE(sample < 0 ? sample * 0x8000 : sample * 0x7fff, offset);
      offset += 2;
    }
  }

  return buffer;
}
