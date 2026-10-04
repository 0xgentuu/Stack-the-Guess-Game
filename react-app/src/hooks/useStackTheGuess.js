import { useState, useRef, useCallback } from "react";
import { WORD_BANK, DICEBEAR_STYLES, pickRandom } from "../game/wordBank";
import { fetchAvatarSVG } from "../game/dicebear";
import { computeHintLength } from "../game/hints";
import { playWinSound } from "../audio/sound";

const COLORS = ["#EF4F87", "#FFC857", "#3FCF8E", "#FBF3E6"];

const makeConfetti = () =>
  Array.from({ length: 30 }, (_, id) => {
    const angle = Math.random() * Math.PI * 2;
    const dist = 110 + Math.random() * 130;
    return {
      id,
      style: {
        "--x": `${(Math.cos(angle) * dist).toFixed(0)}px`,
        "--y": `${(Math.sin(angle) * dist - 40).toFixed(0)}px`,
        "--r": `${(Math.random() * 720 - 360).toFixed(0)}deg`,
        "--d": `${(0.9 + Math.random() * 0.7).toFixed(2)}s`,
        background: COLORS[id % COLORS.length],
        width: `${8 + Math.random() * 6}px`,
        height: `${10 + Math.random() * 8}px`,
      },
    };
  });

const newGame = () => ({
  target: pickRandom(WORD_BANK),
  hintLength: 0,
  wrongGuesses: 0,
  cards: [], // array order = stacking order (last = on top)
  selectedId: null,
  status: "playing", // "playing" | "won" | "gaveup"
  feedback: { message: "", kind: null },
  confetti: [],
});

// All game state + handlers live here so App.jsx stays thin.
export function useStackTheGuess() {
  const [game, setGame] = useState(newGame);
  const [guess, setGuess] = useState("");
  const [round, setRound] = useState(0);
  const [muted, setMuted] = useState(() => {
    try { return localStorage.getItem("stack-muted") === "1"; } catch { return false; }
  });
  const nextId = useRef(0);
  const roundRef = useRef(0); // lets a slow fetch know its round has ended

  async function submitGuess(e) {
    e.preventDefault();
    const raw = guess.trim().toLowerCase();
    if (!raw || game.status !== "playing") return;
    setGuess("");

    if (raw === game.target) {
      if (!muted) playWinSound();
      setGame((g) => ({
        ...g,
        status: "won",
        hintLength: g.target.length,
        confetti: makeConfetti(),
        feedback: { message: `Solved it! "${g.target}" — took ${g.wrongGuesses} wrong guess(es).`, kind: "win" },
      }));
      return;
    }

    const myRound = roundRef.current;
    setGame((g) => ({
      ...g,
      wrongGuesses: g.wrongGuesses + 1,
      hintLength: computeHintLength(raw, g.target, g.hintLength),
    }));

    // The fetch runs here, in the event handler, because a submitted guess caused it.
    try {
      const svg = await fetchAvatarSVG(raw, pickRandom(DICEBEAR_STYLES));
      if (roundRef.current !== myRound) return;
      const card = {
        id: nextId.current++,
        svg,
        label: raw,
        rot: (Math.random() * 18 - 9).toFixed(2),
        dx: (Math.random() * 22 - 11).toFixed(1),
        dy: (Math.random() * 16 - 8).toFixed(1),
      };
      setGame((g) => ({
        ...g,
        cards: [...g.cards, card],
        feedback: { message: "Not quite — a new card joins the pile.", kind: "wrong" },
      }));
    } catch (err) {
      console.error(err);
      if (roundRef.current !== myRound) return;
      setGame((g) => ({
        ...g,
        feedback: { message: "Couldn't fetch that card — check your connection and try again.", kind: "error" },
      }));
    }
  }

  const giveUp = () =>
    setGame((g) =>
      g.status !== "playing" ? g : {
        ...g,
        status: "gaveup",
        hintLength: g.target.length,
        feedback: { message: `The word was "${g.target}". Hit the refresh button for a new one.`, kind: "wrong" },
      }
    );

  const selectCard = useCallback((id) => {
    setGame((g) => {
      const card = g.cards.find((c) => c.id === id);
      if (!card) return g;
      return { ...g, selectedId: id, cards: [...g.cards.filter((c) => c.id !== id), card] };
    });
  }, []);

  const cycle = useCallback((direction) => {
    setGame((g) => {
      if (g.cards.length < 2) return g;
      const cards = [...g.cards];
      if (direction === "forward") cards.unshift(cards.pop());
      else cards.push(cards.shift());
      return { ...g, cards };
    });
  }, []);

  const newRound = () => {
    roundRef.current += 1;
    setGame(newGame());
    setGuess("");
    setRound((r) => r + 1);
  };

  const removeConfetti = useCallback((id) => {
    setGame((g) => ({ ...g, confetti: g.confetti.filter((p) => p.id !== id) }));
  }, []);

  const toggleMute = () => {
    const next = !muted;
    setMuted(next);
    try { localStorage.setItem("stack-muted", next ? "1" : "0"); } catch { /* storage unavailable */ }
  };

  return { game, guess, setGuess, round, muted, toggleMute, submitGuess, giveUp, selectCard, cycle, newRound, removeConfetti };
}
