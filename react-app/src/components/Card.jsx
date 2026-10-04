export default function Card({ card, index, selected, onSelect }) {
  return (
    <div
      className={"card" + (selected ? " is-selected" : "")}
      style={{ "--rot": `${card.rot}deg`, "--dx": `${card.dx}px`, "--dy": `${card.dy}px`, zIndex: index }}
      onClick={() => onSelect(card.id)}
    >
      {/* SVG comes from the DiceBear API, which we chose and trust. dangerouslySetInnerHTML is
          named that way because injecting an untrusted string could run scripts (XSS); only
          safe here because the source is trusted and the markup is just an avatar. */}
      <div className="card-art" dangerouslySetInnerHTML={{ __html: card.svg }} />
      <span className="card-tag">{card.label}</span>
    </div>
  );
}
