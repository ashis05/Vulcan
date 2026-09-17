import {
  SdkAvailabilityStatus,
  aggregateGroupByPeriod,
  getGrantedPermissions,
  getSdkStatus,
  initialize,
  openHealthConnectSettings,
  requestPermission,
} from 'react-native-health-connect';

import { localDateString } from '@/lib/dates';

const STEPS_READ = { accessType: 'read', recordType: 'Steps' } as const;

export type HealthConnectStatus = 'available' | 'update_required' | 'unavailable';

export async function getHealthConnectStatus(): Promise<HealthConnectStatus> {
  try {
    const status = await getSdkStatus();
    if (status === SdkAvailabilityStatus.SDK_AVAILABLE) return 'available';
    if (status === SdkAvailabilityStatus.SDK_UNAVAILABLE_PROVIDER_UPDATE_REQUIRED) return 'update_required';
    return 'unavailable';
  } catch {
    return 'unavailable';
  }
}

export async function initializeHealthConnect(): Promise<boolean> {
  try {
    return await initialize();
  } catch {
    return false;
  }
}

export function openHealthConnectSettingsApp(): void {
  try {
    openHealthConnectSettings();
  } catch {
    // settings unavailable on this device
  }
}

export async function hasStepsPermission(): Promise<boolean> {
  try {
    await initialize();
    const granted = await getGrantedPermissions();
    return granted.some((p) => p.recordType === 'Steps');
  } catch {
    return false;
  }
}

export async function requestStepsPermission(): Promise<boolean> {
  try {
    await initialize();
    const granted = await requestPermission([STEPS_READ]);
    return granted.some((p) => p.recordType === 'Steps');
  } catch {
    return false;
  }
}

export interface DailySteps {
  date: string;
  steps: number;
}

export { localDateString } from '@/lib/dates';

/**
 * Steps per local calendar day for the [start, end] window, using Health
 * Connect's own aggregation (which merges records from multiple sources) rather
 * than summing raw records — the latter double-counts phone + watch/Fit.
 */
export async function readDailySteps(start: Date, end: Date): Promise<DailySteps[]> {
  await initialize();
  const groups = await aggregateGroupByPeriod({
    recordType: 'Steps',
    timeRangeFilter: { operator: 'between', startTime: start.toISOString(), endTime: end.toISOString() },
    timeRangeSlicer: { period: 'DAYS', length: 1 },
  });
  return groups.map((g) => ({
    date: localDateString(new Date(g.startTime)),
    steps: Math.round(g.result.COUNT_TOTAL ?? 0),
  }));
}
