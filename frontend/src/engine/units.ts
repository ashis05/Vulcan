export const KG_PER_LB = 0.45359237;
export const CM_PER_IN = 2.54;

export function kgToLb(kg: number): number {
  return kg / KG_PER_LB;
}

export function lbToKg(lb: number): number {
  return lb * KG_PER_LB;
}

export function cmToIn(cm: number): number {
  return cm / CM_PER_IN;
}

export function inToCm(inches: number): number {
  return inches * CM_PER_IN;
}

export interface FtIn {
  feet: number;
  inches: number;
}

export function cmToFtIn(cm: number): FtIn {
  const totalIn = Math.round(cm / CM_PER_IN);
  const feet = Math.floor(totalIn / 12);
  return { feet, inches: totalIn % 12 };
}

export function ftInToCm(feet: number, inches: number): number {
  return (feet * 12 + inches) * CM_PER_IN;
}

export function formatFtIn(fi: FtIn): string {
  return `${fi.feet}' ${fi.inches}"`;
}

/** Whole years between an ISO birth date (yyyy-mm-dd) and today (or a given date). */
export function ageFromBirthDate(birthDate: string, today: Date = new Date()): number {
  const [y, m, d] = birthDate.split('-').map(Number);
  let age = today.getFullYear() - y;
  const beforeBirthday = today.getMonth() + 1 < m || (today.getMonth() + 1 === m && today.getDate() < d);
  if (beforeBirthday) age -= 1;
  return Math.max(0, age);
}