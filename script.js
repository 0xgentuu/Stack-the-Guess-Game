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

class CardStack {
  constructor(canvas) {
    this.canvas = canvas;
    this.cards = []; // { id, el }
    this._nextId = 0;
    this._bindSwipe();
  }

  push(svgMarkup) {
    const id = this._nextId++;
    const el = document.createElement("div");
    el.className = "card";
    el.dataset.id = String(id);
    el.innerHTML = svgMarkup;

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
  tableEl.classList.remove("is-won");
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
    stack.push(svgMarkup);
    updateHud();
    setFeedback("Not quite — a new card joins the pile.", "wrong");
  } catch (err) {
    console.error(err);
    setFeedback("Couldn't fetch that card — check your connection and try again.", "error");
  }
}

function handleWin() {
  tableEl.classList.add("is-won");
  setFeedback(`Solved it! "${state.target}" — took ${state.wrongGuesses} wrong guess(es).`, "win");
  guessInput.disabled = true;
}

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