function randInt(min: number, max: number) {
  const minCeiled = Math.ceil(min);
  const maxFloored = Math.floor(max);
  return Math.floor(Math.random() * (maxFloored - minCeiled) + minCeiled);
}

function randFloat(min: number, max: number) {
    return Math.random() * (max - min) + min;
}

export const rand = {
    randInt,
    randFloat,
}