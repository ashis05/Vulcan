import { describe, expect, it } from 'vitest';

import {
  cmToFtIn,
  ftInToCm,
  inToCm,
  kgToLb,
  lbToKg,
  ageFromBirthDate,
  formatFtIn,
} from '../units';

describe('kg ↔ lb', () => {
  it('round-trips', () => {
    expect(kgToLb(80)).toBeCloseTo(176.37, 2);
    expect(lbToKg(176.37)).toBeCloseTo(80, 2);
  });

  it('lb is heavier per unit', () => {
    expect(kgToLb(1)).toBeCloseTo(2.2046, 3);
  });
});

describe('cm ↔ ft/in', () => {
  it('round-trips height', () => {
    expect(ftInToCm(5, 10)).toBeCloseTo(177.8, 1);
    expect(cmToFtIn(177.8)).toEqual({ feet: 5, inches: 10 });
    const fi = cmToFtIn(180);
    expect(ftInToCm(fi.feet, fi.inches)).toBeCloseTo(180, 0);
  });

  it('carries 12 inches into a foot', () => {
    expect(cmToFtIn(180.34)).toEqual({ feet: 5, inches: 11 });
    expect(cmToFtIn(182.88)).toEqual({ feet: 6, inches: 0 });
  });

  it('formats ft/in labels', () => {
    expect(formatFtIn({ feet: 6, inches: 0 })).toBe("6' 0\"");
  });

  it('inch conversions', () => {
    expect(inToCm(1)).toBeCloseTo(2.54, 2);
    expect(cmToFtIn(152.4).feet).toBe(5);
  });
});

describe('ageFromBirthDate', () => {
  const today = new Date('2026-08-30');

  it('computes completed years', () => {
    expect(ageFromBirthDate('1998-08-15', today)).toBe(28);
    expect(ageFromBirthDate('1998-09-01', today)).toBe(27);
  });

  it('clamps at zero', () => {
    expect(ageFromBirthDate('2030-01-01', today)).toBe(0);
  });
});