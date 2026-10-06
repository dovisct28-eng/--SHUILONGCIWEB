export function a08Progress(screens) {
  const reveal = (start, length) => {
    const t = Math.max(0, Math.min(1, (screens - start) / length));
    return t * t * (3 - 2 * t);
  };
  return {active: screens >= 40 && screens <= 42.1, opacity: reveal(40.65,.35),
    chapter: reveal(40.65,.2), title: reveal(40.72,.23), body: reveal(40.82,.25), cta: reveal(40.98,.25)};
}
