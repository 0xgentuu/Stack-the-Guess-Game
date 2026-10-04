export default function HelpModal({ open, onClose }) {
  if (!open) return null;
  return (
    <div className="modal-backdrop" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="modal" role="dialog" aria-modal="true" aria-labelledby="helpTitle">
        <h2 id="helpTitle">How to play</h2>
        <ul>
          <li>A secret word is picked. Type a guess and hit <strong>Guess</strong>.</li>
          <li>Wrong guess: a brand-new avatar card lands on the pile, and one more letter of the word is revealed as a hint.</li>
          <li>Click any card to pull it to the front.</li>
          <li>Drag / swipe the pile left or right to cycle which card sits on top.</li>
          <li>Get closer to the real spelling and your hint can jump ahead — the game rewards guesses that are on the right track.</li>
          <li>Stuck? Hit <strong>give up</strong> to reveal the word.</li>
        </ul>
        <button type="button" className="guess-submit" onClick={onClose}>Got it</button>
      </div>
    </div>
  );
}
