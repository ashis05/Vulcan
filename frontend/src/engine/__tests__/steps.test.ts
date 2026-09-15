import { describe, expect, it } from 'vitest';

import { TREND_ADJUSTMENT_KCAL, stepKcalBonus, trendAdjustment } from '../steps';

describe('stepKcalBonus', () => {
  it('10,000 steps × 80kg → 400 kcal', () => {
    expect(stepKcalBonus(10000, 80)).toBe(400);
  });

  it('zero steps → zero bonus', () => {
    expect(stepKcalBonus(0, 80)).toBe(0);
  });

  it('scales with weight', () => {
    expect(stepKcalBonus(10000, 60)).toBe(300);
  });
});

describe('trendAdjustment', () => {
  it('nudges down on a cut with no meaningful loss', () => {
    expect(trendAdjustment([80, 80.1, 80.0], 'cut')).toBe(-TREND_ADJUSTMENT_KCAL);
  });

  it('leaves a working cut alone', () => {
    expect(trendAdjustment([80, 79.4, 79.0], 'cut')).toBe(0);
  });

  it('nudges up on a bulk with no meaningful gain', () => {
    expect(trendAdjustment([70, 70.0, 70.1], 'bulk')).toBe(TREND_ADJUSTMENT_KCAL);
  });

  it('leaves a working bulk alone', () => {
    expect(trendAdjustment([70, 70.4, 70.8], 'bulk')).toBe(0);
  });

  it('maintain never adjusts, and a short series is a no-op', () => {
    expect(trendAdjustment([80, 81], 'maintain')).toBe(0);
    expect(trendAdjustment([80], 'cut')).toBe(0);
  });
});
