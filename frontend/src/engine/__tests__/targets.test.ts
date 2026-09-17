import { describe, expect, it } from 'vitest';

import {
  KCAL_FLOOR,
  MAX_PACE_DELTA_TDEE_PCT,
  adaptiveTdee,
  clampPaceKgWk,
  computeTargets,
  maxPaceKgWk,
  paceToKcalDelta,
  DEFAULT_PACE_KG_WK,
} from '../targets';

const base = {
  sex: 'male' as const,
  weightKg: 80,
  heightCm: 180,
  ageYears: 30,
  activityLevel: 'moderate' as const,
  goal: 'cut' as const,
  paceKgWk: -0.5,
};

describe('computeTargets', () => {
  it('known input: 80kg male, 180cm, 30y, moderate, cut @ −0.5 kg/wk', () => {
    const t = computeTargets(base);
    expect(t.bmr).toBe(1780); // 800 + 1125 − 150 + 5
    expect(t.tdee).toBe(2759); // 1780 × 1.55
    expect(t.paceDeltaKcal).toBe(-550); // −0.5 × 7700 ÷ 7
    expect(t.targetKcal).toBe(2209); // 2759 − 550
    expect(t.proteinG).toBe(176); // 2.2 g/kg × 80
    expect(t.fatG).toBe(61); // 25% of 2209 ÷ 9
    expect(t.carbsG).toBe(239); // remainder
  });

  it('macro calories sum to the kcal target (±5%)', () => {
    const inputs = [
      base,
      { ...base, goal: 'bulk' as const, paceKgWk: 0.3 },
      { ...base, goal: 'maintain' as const, paceKgWk: 0 },
      {
        sex: 'female' as const,
        weightKg: 55,
        heightCm: 160,
        ageYears: 40,
        activityLevel: 'light' as const,
        goal: 'cut' as const,
        paceKgWk: -0.5,
      },
    ];
    for (const input of inputs) {
      const t = computeTargets(input);
      const macroKcal = t.proteinG * 4 + t.carbsG * 4 + t.fatG * 9;
      expect(Math.abs(macroKcal - t.targetKcal) / t.targetKcal).toBeLessThan(0.05);
    }
  });

  it('maintenance keeps TDEE (pace 0, no delta)', () => {
    const t = computeTargets({ ...base, goal: 'maintain', paceKgWk: 0 });
    expect(t.paceDeltaKcal).toBe(0);
    expect(t.targetKcal).toBe(t.tdee);
  });

  it('bulk uses maintenance protein rate (1.8 g/kg)', () => {
    const t = computeTargets({ ...base, goal: 'bulk', paceKgWk: 0.3 });
    expect(t.proteinG).toBe(144); // 1.8 × 80
  });

  it('bulk defaults to a +10%-ish surplus', () => {
    const t = computeTargets({ ...base, goal: 'bulk', paceKgWk: DEFAULT_PACE_KG_WK.bulk });
    const pct = t.paceDeltaKcal / t.tdee;
    expect(pct).toBeGreaterThan(0.05);
    expect(pct).toBeLessThan(0.15);
  });

  it('cut default lands at a −20%-ish deficit (PLAN.md cross-check)', () => {
    const t = computeTargets({ ...base, goal: 'cut', paceKgWk: DEFAULT_PACE_KG_WK.cut });
    const pct = Math.abs(t.paceDeltaKcal) / t.tdee;
    expect(pct).toBeGreaterThan(0.15);
    expect(pct).toBeLessThan(0.25);
  });

  it('clamps to the sex-specific kcal floor', () => {
    const tiny = computeTargets({
      sex: 'female',
      weightKg: 45,
      heightCm: 150,
      ageYears: 70,
      activityLevel: 'sedentary',
      goal: 'cut',
      paceKgWk: -1,
    });
    expect(tiny.targetKcal).toBe(KCAL_FLOOR.female);

    const maleFloor = computeTargets({
      sex: 'male',
      weightKg: 50,
      heightCm: 160,
      ageYears: 60,
      activityLevel: 'sedentary',
      goal: 'cut',
      paceKgWk: -1,
    });
    expect(maleFloor.targetKcal).toBe(KCAL_FLOOR.male);
  });

  it('carbs never go negative', () => {
    const t = computeTargets({ ...base, paceKgWk: -1, activityLevel: 'sedentary' });
    expect(t.carbsG).toBeGreaterThanOrEqual(0);
  });
});

describe('paceToKcalDelta', () => {
  it('scales linearly ×1100 per kg/wk', () => {
    expect(paceToKcalDelta(-0.5)).toBe(-550);
    expect(paceToKcalDelta(0.3)).toBe(330);
    expect(paceToKcalDelta(0)).toBe(0);
  });
});

describe('maxPaceKgWk', () => {
  it('scales the safe rate to bodyweight', () => {
    expect(maxPaceKgWk(80, 'cut')).toBe(0.8); // 1% BW
    expect(maxPaceKgWk(80, 'recomp')).toBe(0.8);
    expect(maxPaceKgWk(80, 'bulk')).toBe(0.4); // 0.5% BW
    expect(maxPaceKgWk(80, 'maintain')).toBe(0);
  });
});

describe('clampPaceKgWk', () => {
  it('caps magnitude to the bodyweight rate', () => {
    expect(clampPaceKgWk(-2, 80, 'cut')).toBe(-0.8);
    expect(clampPaceKgWk(2, 80, 'bulk')).toBe(0.4);
  });

  it('enforces the goal direction', () => {
    expect(clampPaceKgWk(0.5, 80, 'cut')).toBe(0);
    expect(clampPaceKgWk(-0.2, 80, 'bulk')).toBe(0);
    expect(clampPaceKgWk(-0.5, 80, 'maintain')).toBe(0);
  });
});

describe('safety caps', () => {
  it('caps the pace delta at ±25% of TDEE', () => {
    const t = computeTargets({ ...base, paceKgWk: -1 });
    const cap = Math.round(t.tdee * MAX_PACE_DELTA_TDEE_PCT);
    expect(t.effectivePaceKgWk).toBe(-0.8); // rate-clamped from −1
    expect(t.paceDeltaKcal).toBe(-cap); // then TDEE-capped (−880 → −690)
    expect(t.targetKcal).toBe(t.tdee - cap);
  });

  it('leaves safe paces untouched (default cut)', () => {
    const t = computeTargets({ ...base, paceKgWk: DEFAULT_PACE_KG_WK.cut });
    expect(t.effectivePaceKgWk).toBe(DEFAULT_PACE_KG_WK.cut);
    expect(t.paceDeltaKcal).toBe(-550);
  });
});

describe('Katch-McArdle path', () => {
  it('uses lean mass when body-fat % is provided', () => {
    const t = computeTargets({ ...base, bodyfatPct: 20 });
    expect(t.bmr).toBe(1752); // 370 + 21.6 × 64
    expect(t.tdee).toBe(2716); // 1752.4 × 1.55
  });

  it('ignores invalid body-fat values and falls back to Mifflin', () => {
    expect(computeTargets({ ...base, bodyfatPct: 0 }).bmr).toBe(1780);
    expect(computeTargets({ ...base, bodyfatPct: 120 }).bmr).toBe(1780);
    expect(computeTargets({ ...base, bodyfatPct: null }).bmr).toBe(1780);
  });
});

describe('tdeeOverride (adaptive maintenance)', () => {
  it('uses the supplied maintenance instead of Mifflin × activity', () => {
    const t = computeTargets({ ...base, tdeeOverride: 3000 });
    expect(t.tdee).toBe(3000);
    expect(t.paceDeltaKcal).toBe(-550);
    expect(t.targetKcal).toBe(2450);
  });

  it('ignores invalid overrides and falls back to the equation', () => {
    expect(computeTargets({ ...base, tdeeOverride: 0 }).tdee).toBe(2759);
    expect(computeTargets({ ...base, tdeeOverride: null }).tdee).toBe(2759);
    expect(computeTargets({ ...base, tdeeOverride: -100 }).tdee).toBe(2759);
  });

  it('still caps the pace delta at ±25% of the adaptive maintenance', () => {
    const t = computeTargets({ ...base, paceKgWk: -1, tdeeOverride: 2200 });
    const cap = Math.round(2200 * MAX_PACE_DELTA_TDEE_PCT);
    expect(t.targetKcal).toBe(2200 - cap);
  });
});

describe('adaptiveTdee', () => {
  it('infers maintenance above intake when losing weight', () => {
    // avg intake 2500, lost 0.2 kg over 2 days → 2500 + (0.2 × 7700 ÷ 2)
    expect(adaptiveTdee([2500, 2500, 2500], [80, 79.9, 79.8])).toBe(3270);
  });

  it('infers maintenance below intake when gaining weight', () => {
    expect(adaptiveTdee([3000, 3000, 3000], [70, 70.1, 70.2])).toBe(2230);
  });

  it('returns null without enough data', () => {
    expect(adaptiveTdee([2500, 2500], [80, 79.8])).toBeNull();
    expect(adaptiveTdee([2500, 2500, 2500], [80])).toBeNull();
  });
});