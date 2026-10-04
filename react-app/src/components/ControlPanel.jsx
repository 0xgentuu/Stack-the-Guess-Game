import { useEffect, useRef } from "react";

export default function ControlPanel({ game, guess, round, onGuessChange, onSubmit, onGiveUp }) {
  const { target, hintLength, status, feedback } = game;
  const inputRef = useRef(null);
  const over = status !== "playing";
  const revealed = target.slice(0, hintLength).toUpperCase();
  const blanks = target.length - hintLength;

  // Focus the input whenever a new round starts.
  useEffect(() => { inputRef.current?.focus(); }, [round]);

  return (
    <section className="control-panel">
      <div className="hint-row">
        <span className="hint-label">
          <svg className="hint-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2a7 7 0 0 0-4 12.74V17a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1v-2.26A7 7 0 0 0 12 2z" /><line x1="9" y1="21" x2="15" y2="21" /><line x1="10" y1="18" x2="14" y2="18" /></svg>
          hint
        </span>
        <span className="hint-display">
          {revealed && <span className="revealed">{revealed}</span>}
          {revealed && blanks > 0 && " "}
          {blanks > 0 && <span className="blank">{" _".repeat(blanks).trim()}</span>}
        </span>
        <button type="button" className="giveup-btn" disabled={over} onClick={onGiveUp}>give up</button>
      </div>

      <form className="guess-form" autoComplete="off" onSubmit={onSubmit}>
        <input
          ref={inputRef}
          type="text"
          className="guess-input"
          placeholder="type your guess"
          aria-label="Your guess"
          required
          disabled={over}
          value={guess}
          onChange={(e) => onGuessChange(e.target.value)}
        />
        <button type="submit" className="guess-submit">Guess</button>
      </form>

      <p className={"feedback" + (feedback.kind ? ` is-${feedback.kind}` : "")} role="status" aria-live="polite">{feedback.message}</p>
    </section>
  );
}
