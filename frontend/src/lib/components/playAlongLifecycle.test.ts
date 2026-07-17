import { describe, expect, it, vi } from 'vitest';
import { runCancellableCountdown } from './playAlongLifecycle';

describe('PlayAlong countdown lifecycle', () => {
  it('finishes cancellation before the caller can acquire audio', async () => {
    let active = true;
    const acquire = vi.fn();
    const completed = await runCancellableCountdown(
      3,
      700,
      async () => {
        active = false;
      },
      () => active,
      vi.fn(),
    );
    if (completed) acquire();
    expect(completed).toBe(false);
    expect(acquire).not.toHaveBeenCalled();
  });
});
