import { useState } from "react";
import { useStackTheGuess } from "./hooks/useStackTheGuess";
import Hud from "./components/Hud";
import Table from "./components/Table";
import ControlPanel from "./components/ControlPanel";
import HelpModal from "./components/HelpModal";

export default function App() {
  const [helpOpen, setHelpOpen] = useState(false);
  const s = useStackTheGuess();
  const { game } = s;

  return (
    <>
      <div className="stage">
        <Hud
          wrong={game.wrongGuesses}
          cardCount={game.cards.length}
          muted={s.muted}
          onToggleMute={s.toggleMute}
          onHelp={() => setHelpOpen(true)}
          onNewWord={s.newRound}
        />
        <Table game={game} onSelect={s.selectCard} onCycle={s.cycle} onConfettiDone={s.removeConfetti} />
        <ControlPanel
          game={game}
          guess={s.guess}
          round={s.round}
          onGuessChange={s.setGuess}
          onSubmit={s.submitGuess}
          onGiveUp={s.giveUp}
        />
      </div>
      <HelpModal open={helpOpen} onClose={() => setHelpOpen(false)} />
    </>
  );
}
