export async function runCancellableCountdown(
  steps: number,
  delayMs: number,
  sleep: (milliseconds: number) => Promise<void>,
  isActive: () => boolean,
  showStep: (step: number) => void,
): Promise<boolean> {
  for (let step = steps; step >= 1; step--) {
    if (!isActive()) return false;
    showStep(step);
    await sleep(delayMs);
    if (!isActive()) return false;
  }
  return true;
}
