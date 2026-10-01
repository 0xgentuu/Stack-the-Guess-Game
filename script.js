const DICEBEAR_STYLES = [
  "bottts",
  "adventurer",
  "big-ears",
  "croodles",
  "fun-emoji",
  "icons",
  "identicon",
  "pixel-art",
  "rings",
  "shapes",
  "thumbs",
];

const WORD_BANK = [
  "kernel", "cipher", "socket", "buffer", "daemon",
  "thread", "vector", "syntax", "router", "compiler",
  "runtime", "pointer", "closure", "variable", "iterator",
];

const canvasEl = document.getElementById("canvas");
const emptyStateEl = document.getElementById("emptyState");
const tableEl = document.querySelector(".table");
const hintDisplayEl = document.getElementById("hintDisplay");
const guessForm = document.getElementById("guessForm");
const guessInput = document.getElementById("guessInput");
const feedbackEl = document.getElementById("feedback");
const statWrongEl = document.getElementById("statWrong");
const statCardsEl = document.getElementById("statCards");
const btnNewWord = document.getElementById("btnNewWord");
const btnHelp = document.getElementById("btnHelp");
const btnCloseHelp = document.getElementById("btnCloseHelp");
const helpBackdrop = document.getElementById("helpBackdrop");
const burstEl = document.getElementById("burst");
const btnMute = document.getElementById("btnMute");
const btnGiveUp = document.getElementById("btnGiveUp");

class CardStack {
  constructor(canvas) {
    this.canvas = canvas;
    this.cards = []; // { id, el }
    this._nextId = 0;
    this._bindSwipe();
  }

  push(svgMarkup, label) {
    const id = this._nextId++;
    const el = document.createElement("div");
    el.className = "card";
    el.dataset.id = String(id);
    el.innerHTML = svgMarkup;

    if (label) {
      const tag = document.createElement("span");
      tag.className = "card-tag";
      tag.textContent = label;
      el.appendChild(tag);
    }

    el.style.setProperty("--rot", `${(Math.random() * 18 - 9).toFixed(2)}deg`);
    el.style.setProperty("--dx", `${(Math.random() * 22 - 11).toFixed(1)}px`);
    el.style.setProperty("--dy", `${(Math.random() * 16 - 8).toFixed(1)}px`);

    el.addEventListener("click", () => this.select(id));

    this.canvas.appendChild(el);
    this.cards.push({ id, el });
    this._restack();
    this._toggleEmptyState();
    return id;
  }

  select(id) {
    this.cards.forEach((c) => c.el.classList.remove("is-selected"));
    const card = this.cards.find((c) => c.id === id);
    if (!card) return;
    card.el.classList.add("is-selected");

    this.cards = this.cards.filter((c) => c.id !== id);
    this.cards.push(card);
    this._restack();
  }

  cycle(direction) {
    if (this.cards.length < 2) return;
    if (direction === "forward") {
      const top = this.cards.pop();
      this.cards.unshift(top);
    } else {
      const back = this.cards.shift();
      this.cards.push(back);
    }
    this._restack();
  }

  clear() {
    this.cards.forEach((c) => c.el.remove());
    this.cards = [];
    this._toggleEmptyState();
  }

  get size() {
    return this.cards.length;
  }

  _restack() {
    this.cards.forEach((c, i) => {
      c.el.style.zIndex = String(i);
    });
  }

  _toggleEmptyState() {
    emptyStateEl.classList.toggle("is-hidden", this.cards.length > 0);
  }

  _bindSwipe() {
    let startX = null;
    let dragging = false;

    const start = (x) => {
      startX = x;
      dragging = true;
    };
    const end = (x) => {
      if (!dragging || startX === null) return;
      const delta = x - startX;
      const THRESHOLD = 40;
      if (delta <= -THRESHOLD) this.cycle("forward");
      else if (delta >= THRESHOLD) this.cycle("backward");
      dragging = false;
      startX = null;
    };

    this.canvas.addEventListener("pointerdown", (e) => start(e.clientX));
    window.addEventListener("pointerup", (e) => end(e.clientX));
    this.canvas.addEventListener("touchstart", (e) => start(e.touches[0].clientX), { passive: true });
    window.addEventListener("touchend", (e) => end(e.changedTouches[0].clientX), { passive: true });
  }
}

/* ---------- win celebration: sound + paper burst ---------- */
const audio = { ctx: null, muted: false };
try { audio.muted = localStorage.getItem("stack-muted") === "1"; } catch (e) {}

function syncMuteButton() {
  btnMute.setAttribute("aria-pressed", String(audio.muted));
  btnMute.setAttribute("aria-label", audio.muted ? "Sound off" : "Sound on");
}

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

function playWinSound() {
  if (audio.muted) return;
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

const CONFETTI_COLORS = ["#EF4F87", "#FFC857", "#3FCF8E", "#FBF3E6"];

function celebrate() {
  playWinSound();

  for (let i = 0; i < 30; i++) {
    const piece = document.createElement("span");
    piece.className = "confetti";
    const angle = Math.random() * Math.PI * 2;
    const dist = 110 + Math.random() * 130;
    piece.style.setProperty("--x", `${(Math.cos(angle) * dist).toFixed(0)}px`);
    piece.style.setProperty("--y", `${(Math.sin(angle) * dist - 40).toFixed(0)}px`);
    piece.style.setProperty("--r", `${(Math.random() * 720 - 360).toFixed(0)}deg`);
    piece.style.setProperty("--d", `${(0.9 + Math.random() * 0.7).toFixed(2)}s`);
    piece.style.background = CONFETTI_COLORS[i % CONFETTI_COLORS.length];
    piece.style.width = `${8 + Math.random() * 6}px`;
    piece.style.height = `${10 + Math.random() * 8}px`;
    burstEl.appendChild(piece);
    piece.addEventListener("animationend", () => piece.remove());
  }

  const sticker = document.createElement("div");
  sticker.className = "win-sticker";
  const word = document.createElement("strong");
  word.textContent = state.target + "!";
  const sub = document.createElement("span");
  sub.textContent = state.wrongGuesses === 0 ? "first try" : `${state.wrongGuesses} wrong`;
  sticker.append(word, sub);
  burstEl.appendChild(sticker);
}

btnMute.addEventListener("click", () => {
  audio.muted = !audio.muted;
  try { localStorage.setItem("stack-muted", audio.muted ? "1" : "0"); } catch (e) {}
  syncMuteButton();
});
syncMuteButton();

const stack = new CardStack(canvasEl);


async function fetchAvatarSVG(seed, style) {
  const url = "https://api.dicebear.com/9.x/" + style + "/svg?seed=" + encodeURIComponent(seed);

  const response = await fetch(url);

  if (!response.ok) {
    throw new Error("Could not load avatar, status: " + response.status);
  }

  const svg = await response.text();
  return svg;
}


function computeHintLength(guess, target, currentLength) {
  guess = guess.toLowerCase();
  target = target.toLowerCase();

  let matching = 0;
  for (let i = 0; i < guess.length && i < target.length; i++) {
    if (guess[i] === target[i]) {
      matching++;
    } else {
      break;
    }
  }

  let newLength = currentLength + 1;
  if (matching + 1 > newLength) {
    newLength = matching + 1;
  }

  if (newLength > target.length) {
    newLength = target.length;
  }

  return newLength;
}

const state = {
  target: "",
  hintLength: 0,
  wrongGuesses: 0,
};

function pickRandom(list) {
  return list[Math.floor(Math.random() * list.length)];
}

function newRound() {
  state.target = pickRandom(WORD_BANK);
  state.hintLength = 0;
  state.wrongGuesses = 0;
  stack.clear();
  burstEl.innerHTML = "";
  tableEl.classList.remove("is-won", "is-gave-up");
  btnGiveUp.disabled = false;
  updateHud();
  renderHint();
  setFeedback("", null);
  guessInput.disabled = false;
  guessInput.value = "";
  guessInput.focus();
}

function updateHud() {
  statWrongEl.textContent = String(state.wrongGuesses);
  statCardsEl.textContent = String(stack.size);
}

function renderHint() {
  const revealed = state.target.slice(0, state.hintLength);
  const blanks = state.target.length - state.hintLength;
  const revealedSpan = revealed
    ? `<span class="revealed">${revealed.toUpperCase()}</span>`
    : "";
  const blankSpan = blanks > 0
    ? `<span class="blank">${" _".repeat(blanks).trim()}</span>`
    : "";
  hintDisplayEl.innerHTML = [revealedSpan, blankSpan].filter(Boolean).join(" ");
}

function setFeedback(message, kind) {
  feedbackEl.textContent = message;
  feedbackEl.className = "feedback" + (kind ? ` is-${kind}` : "");
}

async function handleWrongGuess(guess) {
  state.wrongGuesses += 1;
  state.hintLength = computeHintLength(guess, state.target, state.hintLength);
  updateHud();
  renderHint();

  const style = pickRandom(DICEBEAR_STYLES);
  try {
    const svgMarkup = await fetchAvatarSVG(guess, style);
    stack.push(svgMarkup, guess);
    updateHud();
    setFeedback("Not quite — a new card joins the pile.", "wrong");
  } catch (err) {
    console.error(err);
    setFeedback("Couldn't fetch that card — check your connection and try again.", "error");
  }
}

function handleWin() {
  state.hintLength = state.target.length; // reveal the full word
  renderHint();
  tableEl.classList.add("is-won");
  setFeedback(`Solved it! "${state.target}" — took ${state.wrongGuesses} wrong guess(es).`, "win");
  guessInput.disabled = true;
  btnGiveUp.disabled = true;
  celebrate();
}

function handleGiveUp() {
  if (guessInput.disabled) return; // round already over
  state.hintLength = state.target.length;
  renderHint();
  tableEl.classList.add("is-gave-up");
  setFeedback(`The word was "${state.target}". Hit the refresh button for a new one.`, "wrong");
  guessInput.disabled = true;
  btnGiveUp.disabled = true;

  const sticker = document.createElement("div");
  sticker.className = "win-sticker is-giveup";
  const sub = document.createElement("span");
  sub.textContent = "the word was";
  const word = document.createElement("strong");
  word.textContent = state.target;
  sticker.append(sub, word);
  burstEl.appendChild(sticker);
}

btnGiveUp.addEventListener("click", handleGiveUp);

guessForm.addEventListener("submit", (e) => {
  e.preventDefault();
  const raw = guessInput.value.trim().toLowerCase();
  if (!raw) return;
  guessInput.value = "";

  if (raw === state.target) {
    handleWin();
    return;
  }
  handleWrongGuess(raw);
});

btnNewWord.addEventListener("click", newRound);

btnHelp.addEventListener("click", () => { helpBackdrop.hidden = false; });
btnCloseHelp.addEventListener("click", () => { helpBackdrop.hidden = true; });
helpBackdrop.addEventListener("click", (e) => {
  if (e.target === helpBackdrop) helpBackdrop.hidden = true;
});

newRound();