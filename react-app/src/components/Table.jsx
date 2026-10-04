import { useEffect, useRef } from "react";
import Card from "./Card";

export default function Table({ game, onSelect, onCycle, onConfettiDone }) {
  const { cards, selectedId, status, target, wrongGuesses, confetti } = game;
  const startX = useRef(null);

  // Syncing with an outside system (the window), so this is a legitimate effect.
  useEffect(() => {
    const end = (e) => {
      if (startX.current === null) return;
      const delta = e.clientX - startX.current;
      startX.current = null;
      if (delta <= -40) onCycle("forward");
      else if (delta >= 40) onCycle("backward");
    };
    window.addEventListener("pointerup", end);
    return () => window.removeEventListener("pointerup", end);
  }, [onCycle]);

  const cls = "table" + (status === "won" ? " is-won" : "") + (status === "gaveup" ? " is-gave-up" : "");

  return (
    <main className={cls}>
      <div className="burst" aria-hidden="true">
        {confetti.map((p) => (
          <span key={p.id} className="confetti" style={p.style} onAnimationEnd={() => onConfettiDone(p.id)} />
        ))}
        {status === "won" && (
          <div className="win-sticker">
            <strong>{target}!</strong>
            <span>{wrongGuesses === 0 ? "first try" : `${wrongGuesses} wrong`}</span>
          </div>
        )}
        {status === "gaveup" && (
          <div className="win-sticker is-giveup">
            <span>the word was</span>
            <strong>{target}</strong>
          </div>
        )}
      </div>

      <div className="canvas" aria-label="Card stack of guessed avatars" onPointerDown={(e) => { startX.current = e.clientX; }}>
        {cards.map((card, i) => (
          <Card key={card.id} card={card} index={i} selected={card.id === selectedId} onSelect={onSelect} />
        ))}
      </div>

      {cards.length === 0 && (
        <p className="empty-state">
          Every wrong guess drops a new card onto the pile. Click a card to bring it up front, or swipe the pile left / right to cycle through it.
        </p>
      )}
    </main>
  );
}
