export function computeHintLength(guess, target, currentLength) {
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
