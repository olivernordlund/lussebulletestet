// Synthesised sound effects for the reveal screen (Web Audio API, no audio files).
// All music here is original: a short brass fanfare, a snare drum roll,
// a cymbal crash and a cheerful little winner tune.

let ctx: AudioContext | null = null;
let master: GainNode | null = null;
let reverb: ConvolverNode | null = null;
let muted = false;

/** Must be called from a user gesture (click / key press) once, before sounds can play. */
export function unlockAudio() {
  if (typeof window === "undefined") return;
  if (!ctx) {
    const AC = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AC) return;
    ctx = new AC();
    master = ctx.createGain();
    master.gain.value = 0.7;
    master.connect(ctx.destination);
    reverb = ctx.createConvolver();
    reverb.buffer = impulse(ctx, 2.2, 2.5);
    const wet = ctx.createGain();
    wet.gain.value = 0.25;
    reverb.connect(wet).connect(master);
  }
  if (ctx.state === "suspended") ctx.resume();
}

export function toggleMute() {
  muted = !muted;
  if (master && ctx) master.gain.setTargetAtTime(muted ? 0 : 0.7, ctx.currentTime, 0.05);
  return muted;
}

function ready() {
  return ctx && master && !muted ? { ctx, master } : null;
}

function impulse(c: AudioContext, seconds: number, decay: number) {
  const len = c.sampleRate * seconds;
  const buf = c.createBuffer(2, len, c.sampleRate);
  for (let ch = 0; ch < 2; ch++) {
    const d = buf.getChannelData(ch);
    for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, decay);
  }
  return buf;
}

const NOTE: Record<string, number> = {};
["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"].forEach((n, i) => {
  for (let o = 1; o <= 7; o++) NOTE[`${n}${o}`] = 440 * Math.pow(2, (i - 9) / 12 + (o - 4));
});

/** Connect to master and (a bit) to the reverb. */
function out(node: AudioNode, c: AudioContext, m: GainNode, send = 0.6) {
  node.connect(m);
  if (reverb) {
    const s = c.createGain();
    s.gain.value = send;
    node.connect(s).connect(reverb);
  }
}

/** Brass-like note: detuned saws through an opening low-pass filter. */
function brass(freq: number, t: number, dur: number, vol = 0.18) {
  const r = ready();
  if (!r) return;
  const { ctx: c, master: m } = r;
  const g = c.createGain();
  const f = c.createBiquadFilter();
  f.type = "lowpass";
  f.Q.value = 2;
  f.frequency.setValueAtTime(500, t);
  f.frequency.linearRampToValueAtTime(3200, t + 0.06);
  f.frequency.exponentialRampToValueAtTime(1600, t + dur);
  g.gain.setValueAtTime(0, t);
  g.gain.linearRampToValueAtTime(vol, t + 0.03);
  g.gain.setTargetAtTime(vol * 0.75, t + 0.05, 0.1);
  g.gain.setTargetAtTime(0, t + dur, 0.08);
  for (const det of [-6, 0, 7]) {
    const o = c.createOscillator();
    o.type = "sawtooth";
    o.frequency.value = freq;
    o.detune.value = det;
    // tiny vibrato on long notes
    if (dur > 0.5) {
      const lfo = c.createOscillator();
      const lg = c.createGain();
      lfo.frequency.value = 5.5;
      lg.gain.value = 4;
      lfo.connect(lg).connect(o.detune);
      lfo.start(t + 0.25);
      lfo.stop(t + dur + 0.5);
    }
    o.connect(f);
    o.start(t);
    o.stop(t + dur + 0.5);
  }
  f.connect(g);
  out(g, c, m);
}

/** Plucky square/triangle lead for the winner tune. */
function lead(freq: number, t: number, dur: number, vol = 0.12, type: OscillatorType = "square") {
  const r = ready();
  if (!r) return;
  const { ctx: c, master: m } = r;
  const o = c.createOscillator();
  const g = c.createGain();
  const f = c.createBiquadFilter();
  o.type = type;
  o.frequency.value = freq;
  f.type = "lowpass";
  f.frequency.value = 2600;
  g.gain.setValueAtTime(0, t);
  g.gain.linearRampToValueAtTime(vol, t + 0.01);
  g.gain.exponentialRampToValueAtTime(vol * 0.35, t + dur * 0.8);
  g.gain.linearRampToValueAtTime(0, t + dur);
  o.connect(f).connect(g);
  out(g, c, m, 0.35);
  o.start(t);
  o.stop(t + dur + 0.05);
}

function noiseBuffer(c: AudioContext) {
  const b = c.createBuffer(1, c.sampleRate, c.sampleRate);
  const d = b.getChannelData(0);
  for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
  return b;
}

function snare(t: number, vol = 0.25, len = 0.12) {
  const r = ready();
  if (!r) return;
  const { ctx: c, master: m } = r;
  const n = c.createBufferSource();
  n.buffer = noiseBuffer(c);
  const f = c.createBiquadFilter();
  f.type = "bandpass";
  f.frequency.value = 2200;
  f.Q.value = 0.8;
  const g = c.createGain();
  g.gain.setValueAtTime(vol, t);
  g.gain.exponentialRampToValueAtTime(0.001, t + len);
  n.connect(f).connect(g);
  out(g, c, m, 0.3);
  n.start(t);
  n.stop(t + len + 0.02);
}

function kick(t: number, vol = 0.6) {
  const r = ready();
  if (!r) return;
  const { ctx: c, master: m } = r;
  const o = c.createOscillator();
  const g = c.createGain();
  o.frequency.setValueAtTime(140, t);
  o.frequency.exponentialRampToValueAtTime(45, t + 0.15);
  g.gain.setValueAtTime(vol, t);
  g.gain.exponentialRampToValueAtTime(0.001, t + 0.3);
  o.connect(g).connect(m);
  o.start(t);
  o.stop(t + 0.32);
}

function crash(t: number, vol = 0.35) {
  const r = ready();
  if (!r) return;
  const { ctx: c, master: m } = r;
  const n = c.createBufferSource();
  n.buffer = noiseBuffer(c);
  n.loop = true;
  const f = c.createBiquadFilter();
  f.type = "highpass";
  f.frequency.value = 5000;
  const g = c.createGain();
  g.gain.setValueAtTime(vol, t);
  g.gain.exponentialRampToValueAtTime(0.001, t + 2.2);
  n.connect(f).connect(g);
  out(g, c, m, 0.5);
  n.start(t);
  n.stop(t + 2.3);
}

/** Short brass fanfare for when the reveal starts (~2.5 s). */
export function playFanfare() {
  const r = ready();
  if (!r) return;
  const t = r.ctx.currentTime + 0.05;
  const s = 0.13; // triplet pickup
  [
    ["G4", 0, s],
    ["G4", s, s],
    ["G4", 2 * s, s],
    ["C5", 3 * s, 0.45],
    ["G4", 3 * s + 0.5, 0.18],
    ["C5", 3 * s + 0.7, 0.18],
    ["E5", 3 * s + 0.9, 1.3],
  ].forEach(([n, dt, d]) => brass(NOTE[n as string], t + (dt as number), d as number));
  // harmony on the final chord
  brass(NOTE["G4"], t + 3 * s + 0.9, 1.3, 0.12);
  brass(NOTE["C4"], t + 3 * s + 0.9, 1.3, 0.12);
  snare(t + 3 * s, 0.2);
  kick(t + 3 * s + 0.9);
  crash(t + 3 * s + 0.9, 0.18);
}

/** Small "pling" when a place is revealed. */
export function playPling(place: number) {
  const r = ready();
  if (!r) return;
  const t = r.ctx.currentTime + 0.02;
  // higher pitch the closer we get to the top
  const base = ["C5", "D5", "E5", "F5", "G5", "A5", "B5", "C6"][Math.max(0, Math.min(7, 8 - place))];
  lead(NOTE[base], t, 0.25, 0.1, "triangle");
  lead(NOTE[base] * 1.5, t + 0.08, 0.3, 0.07, "triangle");
}

/** Snare drum roll that builds up (duration in seconds). */
export function playDrumRoll(duration = 1.6) {
  const r = ready();
  if (!r) return;
  const t0 = r.ctx.currentTime + 0.02;
  const hits = Math.floor(duration / 0.045);
  for (let i = 0; i < hits; i++) {
    const p = i / hits;
    snare(t0 + i * 0.045 + (Math.random() - 0.5) * 0.008, 0.06 + p * 0.22, 0.08);
  }
}

/** Crash + cheerful winner tune (~7 s). */
export function playWinnerSong() {
  const r = ready();
  if (!r) return;
  const t = r.ctx.currentTime + 0.05;
  const b = 0.24; // eighth note at 125 bpm
  crash(t, 0.4);
  kick(t);
  brass(NOTE["C5"], t, 0.7, 0.14);
  brass(NOTE["E5"], t, 0.7, 0.12);
  brass(NOTE["G5"], t, 0.7, 0.12);

  const start = t + 0.8;
  // original melody, two phrases
  const melody: [string, number][] = [
    ["C5", 1], ["E5", 1], ["G5", 1], ["C6", 1], ["B5", 1], ["G5", 1], ["E5", 1], ["G5", 1],
    ["A5", 1], ["F5", 1], ["D5", 1], ["F5", 1], ["G5", 3], ["G5", 1],
    ["E5", 1], ["G5", 1], ["C6", 1], ["E6", 1], ["D6", 1], ["B5", 1], ["G5", 1], ["B5", 1],
    ["C6", 1], ["G5", 1], ["E5", 1], ["D5", 1], ["C5", 4],
  ];
  let pos = 0;
  for (const [n, len] of melody) {
    lead(NOTE[n], start + pos * b, len * b * 0.95, 0.1);
    pos += len;
  }
  // bass in quarter notes
  const bass = ["C3", "G2", "C3", "G2", "F2", "C3", "G2", "D3", "C3", "G2", "G2", "D3", "C3", "G2", "C3", "C3"];
  bass.forEach((n, i) => lead(NOTE[n], start + i * 2 * b, 2 * b * 0.9, 0.16, "triangle"));
  // simple beat
  for (let i = 0; i < 16; i++) {
    kick(start + i * 2 * b, 0.45);
    if (i % 2 === 1) snare(start + i * 2 * b, 0.18);
  }
  // final chord
  const end = start + pos * b;
  ["C5", "E5", "G5", "C6"].forEach((n) => brass(NOTE[n], end, 1.2, 0.1));
  crash(end, 0.3);
  kick(end);
}
