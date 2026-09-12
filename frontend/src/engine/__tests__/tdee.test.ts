import { describe, expect, it } from 'vitest';

import { ACTIVITY_MULTIPLIERS, bmrKatchMcArdle, bmrMifflinStJeor, leanMassKg, tdeeFromBmr } from '../tdee';

describe('bmrMifflinStJeor', () => {
  it('known input: 80kg male, 180cm, 25y → 1805', () => {
    expect(bmrMifflinStJeor('male', 80, 180, 25)).toBe(1805);
  });

  it('known input: 60kg female, 165cm, 30y → 1320.25', () => {
    // 10×60 + 6.25×165 − 5×30 − 161 = 600 + 1031.25 − 150 − 161 = 1320.25
    expect(bmrMifflinStJeor('female', 60, 165, 30)).toBe(1320.25);
  });

  it('sex constant is 166 kcal apart for identical inputs', () => {
    const male = bmrMifflinStJeor('male', 70, 175, 30);
    const female = bmrMifflinStJeor('female', 70, 175, 30);
    expect(male - female).toBe(166);
  });
});

describe('bmrKatchMcArdle', () => {
  it('known input: 65kg lean mass → 1774', () => {
    expect(bmrKatchMcArdle(65)).toBe(1774); // 370 + 21.6 × 65
  });

  it('scales linearly with lean mass', () => {
    expect(bmrKatchMcArdle(50)).toBe(1450); // 370 + 21.6 × 50
  });
});

describe('leanMassKg', () => {
  it('80kg at 20% body fat → 64kg lean', () => {
    expect(leanMassKg(80, 20)).toBeCloseTo(64, 5);
  });

  it('0% body fat → full mass', () => {
    expect(leanMassKg(70, 0)).toBe(70);
  });
});

describe('tdeeFromBmr', () => {
  it('applies the activity multiplier', () => {
    expect(tdeeFromBmr(1800, 'sedentary')).toBeCloseTo(2160, 5);
    expect(tdeeFromBmr(1800, 'light')).toBeCloseTo(2475, 5);
    expect(tdeeFromBmr(1800, 'moderate')).toBeCloseTo(2790, 5);
    expect(tdeeFromBmr(1800, 'very_active')).toBeCloseTo(3105, 5);
  });

  it('every level maps to a distinct multiplier', () => {
    const keys = Object.keys(ACTIVITY_MULTIPLIERS);
    expect(keys).toHaveLength(4);
    const values = new Set(Object.values(ACTIVITY_MULTIPLIERS));
    expect(values.size).toBe(4);
  });
});