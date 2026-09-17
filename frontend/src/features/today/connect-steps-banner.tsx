import { StyleSheet, Text, View } from 'react-native';

import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { colors, typeScale } from '@/theme';

import { useConnectHealthConnect, useHasStepsPermission, useHealthConnectStatus } from './hooks';
import { openHealthConnectSettingsApp } from './health-connect';

/**
 * Steps permission banner. Hidden once granted; when Health Connect is missing
 * or denied it points the user at the manual-entry fallback instead.
 */
export function ConnectStepsBanner({ onManualEntry }: { onManualEntry: () => void }) {
  const status = useHealthConnectStatus();
  const granted = useHasStepsPermission();
  const connect = useConnectHealthConnect();

  if (status.isPending) return null;
  if (status.data === 'available' && granted.data === true) return null;

  if (status.data !== 'available') {
    return (
      <Card style={styles.banner}>
        <Text style={styles.text}>
          {status.data === 'update_required'
            ? 'Health Connect needs an update — enter steps manually for now.'
            : 'Health Connect isn’t available on this device — enter steps manually.'}
        </Text>
        <View style={styles.actions}>
          {status.data === 'update_required' ? (
            <Button
              label="Open Health Connect"
              variant="ghost"
              onPress={openHealthConnectSettingsApp}
              fullWidth={false}
            />
          ) : null}
          <Button label="Enter steps" variant="secondary" onPress={onManualEntry} fullWidth={false} />
        </View>
      </Card>
    );
  }

  return (
    <Card style={styles.banner}>
      <Text style={styles.text}>
        Connect Health Connect to add your steps to today’s calorie budget.
      </Text>
      <View style={styles.actions}>
        <Button
          label={connect.isPending ? 'Connecting…' : 'Connect steps'}
          onPress={() => connect.mutate()}
          disabled={connect.isPending}
          fullWidth={false}
        />
        <Button label="Enter manually" variant="ghost" onPress={onManualEntry} fullWidth={false} />
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  banner: { gap: 12 },
  text: { color: colors.text.secondary, fontSize: typeScale.label.size, lineHeight: 20 },
  actions: { flexDirection: 'row', alignItems: 'center', gap: 10, flexWrap: 'wrap' },
});
