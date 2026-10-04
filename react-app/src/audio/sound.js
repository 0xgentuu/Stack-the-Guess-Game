// Synthesized applause (Web Audio). No React or DOM in here.
const audio = { ctx: null };

function getAudioCtx() {
  if (!audio.ctx) {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;
    audio.ctx = new AC();
  }
  if (audio.ctx.state === "suspended") audio.ctx.resume();
  return audio.ctx;
}

// Applause: lots of short claps (each a quick flutter of 3 noise snaps) that
// build up, hold, then thin out, with a touch of room reverb so it isn't dry.
function makeClapSample(ctx) {
  const rate = ctx.sampleRate;
  const len = Math.floor(rate * 0.16);
  const buf = ctx.createBuffer(1, len, rate);
  const d = buf.getChannelData(0);
  const snaps = [0, 0.007 + Math.random() * 0.006, 0.016 + Math.random() * 0.008];
  for (let i = 0; i < len; i++) {
    const t = i / rate;
    let env = 0;
    snaps.forEach((s, k) => {
      if (t >= s) env += Math.exp(-(t - s) / (k === 2 ? 0.02 : 0.008));
    });
    if (t > 0.02) env += 0.2 * Math.exp(-(t - 0.02) / 0.04);
    d[i] = (Math.random() * 2 - 1) * Math.min(env, 1.4);
  }
  return buf;
}

function makeReverbImpulse(ctx) {
  const len = Math.floor(ctx.sampleRate * 0.7);
  const ir = ctx.createBuffer(2, len, ctx.sampleRate);
  for (let c = 0; c < 2; c++) {
    const d = ir.getChannelData(c);
    for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 3);
  }
  return ir;
}

export function playWinSound() {
  const ctx = getAudioCtx();
  if (!ctx) return;

  const start = ctx.currentTime + 0.02;
  const samples = [0, 1, 2, 3].map(() => makeClapSample(ctx));

  const out = ctx.createDynamicsCompressor();
  const master = ctx.createGain();
  master.gain.value = 0.9;
  out.connect(master).connect(ctx.destination);

  const verb = ctx.createConvolver();
  verb.buffer = makeReverbImpulse(ctx);
  const wet = ctx.createGain();
  wet.gain.value = 0.3;
  verb.connect(wet).connect(out);

  const total = 2.6;
  let t = 0;
  while (t < total) {
    // loudness: quick build-up, hold, then a long fade as people stop
    const fadeOut = Math.max(0, (t - 1.2) / (total - 1.2));
    const env = Math.min(1, t / 0.35) * (1 - Math.pow(fadeOut, 1.5));

    const src = ctx.createBufferSource();
    src.buffer = samples[Math.floor(Math.random() * samples.length)];
    src.playbackRate.value = 0.8 + Math.random() * 0.5;

    const hp = ctx.createBiquadFilter();
    hp.type = "highpass";
    hp.frequency.value = 600;
    const bp = ctx.createBiquadFilter();
    bp.type = "bandpass";
    bp.frequency.value = 1300 + Math.random() * 1400;
    bp.Q.value = 0.6;

    const gain = ctx.createGain();
    gain.gain.value = 0.38 * env * (0.4 + Math.random() * 0.6);

    let node = src.connect(hp).connect(bp).connect(gain);
    if (ctx.createStereoPanner) {
      const pan = ctx.createStereoPanner();
      pan.pan.value = Math.random() * 1.4 - 0.7;
      node = node.connect(pan);
    }
    node.connect(out);
    node.connect(verb);
    src.start(start + t);

    t += 0.012 + Math.random() * 0.03 + (t / total) * 0.05;
  }
}
