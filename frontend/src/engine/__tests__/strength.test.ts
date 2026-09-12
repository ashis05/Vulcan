import { describe, expect, it } from 'vitest';

import { detectPR, detectStall, estimated1RM, setVolume, totalVolume } from '../strength';

describe('estimated1RM (Epley)', () => {
  it('known values', () => {
    expect(estimated1RM(100, 5)).toBeCloseTo(116.667, 3);
    expect(estimated1RM(60, 10)).toBeCloseTo(80, 5);
  });

  it('a single rep returns the weight (Epley overestimates at 1)', () => {
    expect(estimated1RM(120, 1)).toBe(120);
    expect(estimated1RM(120, 0)).toBe(120);
  });
});

describe('volume', () => {
  it('setVolume is weight × reps', () => {
    expect(setVolume({ weightKg: 100, reps: 8 })).toBe(800);
  });

  it('totalVolume excludes warmup sets', () => {
    const sets = [
      { weightKg: 40, reps: 10, setType: 'warmup' as const },
      { weightKg: 100, reps: 5, setType: 'normal' as const },
      { weightKg: 90, reps: 8, setType: 'drop' as const },
    ];
    expect(totalVolume(sets)).toBe(100 * 5 + 90 * 8);
  });
});

describe('detectPR', () => {
  it('first-ever set is a PR', () => {
    expect(detectPR({ weightKg: 100, reps: 5 }, [])).toBe('e1rm');
  });

  it('new max weight is a weight PR', () => {
    expect(detectPR({ weightKg: 105, reps: 3 }, [{ weightKg: 100, reps: 5 }])).toBe('weight');
  });

  it('more reps at the same weight is a reps PR', () => {
    const prior = [
      { weightKg: 100, reps: 5 },
      { weightKg: 100, reps: 6 },
    ];
    expect(detectPR({ weightKg: 100, reps: 7 }, prior)).toBe('reps');
  });

  it('higher e1RM at a lighter weight is an e1rm PR', () => {
    const prior = [{ weightKg: 100, reps: 5 }]; // e1RM ≈ 116.7
    expect(detectPR({ weightKg: 90, reps: 12 }, prior)).toBe('e1rm'); // e1RM = 126
  });

  it('equal performance is not a PR', () => {
    expect(detectPR({ weightKg: 100, reps: 5 }, [{ weightKg: 100, reps: 5 }])).toBeNull();
  });

  it('less weight and fewer reps is not a PR', () => {
    expect(detectPR({ weightKg: 95, reps: 4 }, [{ weightKg: 100, reps: 5 }])).toBeNull();
  });
});

describe('detectStall', () => {
  it('improving history is not stalled', () => {
    expect(detectStall([100, 102, 104, 106])).toBe(false);
  });

  it('flat across the window is stalled', () => {
    expect(detectStall([100, 102, 104, 102, 103, 102])).toBe(true);
  });

  it('a history no longer than the window is never stalled', () => {
    expect(detectStall([100, 102, 104])).toBe(false);
  });
});
