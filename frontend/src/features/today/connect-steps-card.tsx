import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';

import { ChartIcon } from '@/components/icons';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { colors, fonts, typeScale } from '@/theme';

import {
  useAutoSyncSteps,
  useConnectHealthConnect,
  useDailyActivity,
  useHasStepsPermission,
  useHealthConnectStatus,
} from './hooks';
import { localDateString, openHealthConnectSettingsApp } from './health-connect';

const todayIso = () => localDateString(new Date());

export function ConnectStepsCard() {
  const status = useHealthConnectStatus();
  const granted = useHasStepsPermission();
  const connect = useConnectHealthConnect();
  const activity = useDailyActivity(8);
  const isGranted = granted.data === true;
  const sync = useAutoSyncSteps(isGranted);

  const rows = activity.data ?? [];
  const today = rows.find((d) => d.activity_date === todayIso());
  const completedDays = rows.filter((d) => d.activity_date !== todayIso()).slice(0, 7);
  const avg =
    completedDays.length > 0
      ? Math.round(completedDays.reduce((n, d) => n + d.steps, 0) / completedDays.length)
      : 0;

  if (status.isPending) {
    return (
      <Card>
        <ActivityIndicator color={colors.accent.ember500} />
      </Card>
    );
  }

  if (status.data !== 'available') {
    return (
      <Card style={styles.card}>
        <Text style={styles.title}>Steps</Text>
        <Text style={styles.muted}>
          {status.data === 'update_required'
            ? 'Health Connect needs an update to sync your steps.'
            : 'Health Connect isn’t available on this device.'}
        </Text>
        {status.data === 'update_required' ? (
          <Button label="Open Health Connect" variant="ghost" onPress={openHealthConnectSettingsApp} />
        ) : null}
      </Card>
    );
  }

  return (
    <Card style={styles.card}>
      <View style={styles.head}>
        <ChartIcon size={18} color={colors.steps} />
        <Text style={styles.title}>Steps</Text>
        <Text style={styles.muted}>read-only · Android</Text>
      </View>

      {!isGranted ? (
        <>
          <Text style={styles.muted}>Connect Health Connect to add your steps to today’s calorie budget.</Text>
          <Button
            label={connect.isPending ? 'Connecting…' : 'Connect steps'}
            onPress={() => connect.mutate()}
            disabled={connect.isPending}
          />
        </>
      ) : (
        <>
          <View style={styles.numbers}>
            <View style={styles.stat}>
              <Text style={styles.statValue}>{(today?.steps ?? 0).toLocaleString()}</Text>
              <Text style={styles.statLabel}>today</Text>
            </View>
            <View style={styles.stat}>
              <Text style={styles.statValue}>{(today?.step_bonus_kcal ?? 0).toLocaleString()}</Text>
              <Text style={styles.statLabel}>kcal bonus</Text>
            </View>
            <View style={styles.stat}>
              <Text style={styles.statValue}>{avg.toLocaleString()}</Text>
              <Text style={styles.statLabel}>7-day avg</Text>
            </View>
          </View>
          <Text style={styles.muted}>{sync.isPending ? 'Syncing…' : 'Auto-syncs while you’re here.'}</Text>
        </>
      )}
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { gap: 12 },
  head: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  title: { color: colors.text.primary, fontFamily: fonts.display.bold, fontSize: typeScale.h3.size, flex: 1 },
  muted: { color: colors.text.muted, fontSize: typeScale.caption.size },
  numbers: { flexDirection: 'row', gap: 10 },
  stat: {
    flex: 1,
    borderWidth: 1,
    borderColor: colors.border.hairline,
    borderRadius: 12,
    backgroundColor: colors.bg.elevated,
    padding: 12,
    gap: 2,
  },
  statValue: {
    color: colors.text.primary,
    fontFamily: fonts.display.bold,
    fontSize: typeScale.h2.size,
    fontVariant: ['tabular-nums'],
  },
  statLabel: { color: colors.text.muted, fontSize: typeScale.caption.size },
});
