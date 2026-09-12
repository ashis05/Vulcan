import { describe, expect, it } from 'vitest';

import { stepKcalBonus } from '../steps';

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