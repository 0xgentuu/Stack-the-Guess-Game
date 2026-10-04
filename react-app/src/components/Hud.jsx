const icon = { viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 2, strokeLinecap: "round", strokeLinejoin: "round" };

export default function Hud({ wrong, cardCount, muted, onToggleMute, onHelp, onNewWord }) {
  return (
    <header className="hud">
      <div className="hud-title">
        <h1>Stack the Guess</h1>
        <p className="hud-subtitle">Guess wrong, grow the pile.</p>
      </div>

      <div className="hud-stats">
        <div className="stat"><span className="stat-value">{wrong}</span><span className="stat-label">wrong</span></div>
        <div className="stat"><span className="stat-value">{cardCount}</span><span className="stat-label">in stack</span></div>

        <button type="button" className="icon-btn" aria-label={muted ? "Sound off" : "Sound on"} aria-pressed={muted} title="Sound" onClick={onToggleMute}>
          <svg className="ico-on" {...icon}><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" /><path d="M15.54 8.46a5 5 0 0 1 0 7.07" /><path d="M19.07 4.93a10 10 0 0 1 0 14.14" /></svg>
          <svg className="ico-off" {...icon}><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" /><line x1="23" y1="9" x2="17" y2="15" /><line x1="17" y1="9" x2="23" y2="15" /></svg>
        </button>
        <button type="button" className="icon-btn" aria-label="How to play" title="How to play" onClick={onHelp}>
          <svg {...icon}><circle cx="12" cy="12" r="10" /><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" /><line x1="12" y1="17" x2="12.01" y2="17" /></svg>
        </button>
        <button type="button" className="icon-btn" aria-label="New word" title="New word" onClick={onNewWord}>
          <svg {...icon}><path d="M21 12a9 9 0 1 1-2.64-6.36" /><polyline points="21 3 21 9 15 9" /></svg>
        </button>
      </div>
    </header>
  );
}
