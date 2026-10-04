export const DICEBEAR_STYLES = [
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

export const WORD_BANK = [
  "kernel", "cipher", "socket", "buffer", "daemon",
  "thread", "vector", "syntax", "router", "compiler",
  "runtime", "pointer", "closure", "variable", "iterator",
];


export function pickRandom(list) {
  return list[Math.floor(Math.random() * list.length)];
}
