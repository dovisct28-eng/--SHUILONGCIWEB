export function a08Progress(screens) {
  const t = Math.max(0, Math.min(1, screens - 40));
  return { active: screens >= 40 && screens <= 42.1, opacity: t * t * (3 - 2 * t) };
}
