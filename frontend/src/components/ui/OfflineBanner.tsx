import { useNetInfo } from '@react-native-community/netinfo';
import { StyleSheet, Text, View } from 'react-native';

import { colors, radius, typeScale } from '@/theme';

export function OfflineBanner() {
  const { isConnected } = useNetInfo();
  if (isConnected !== false) return null;

  return (
    <View style={styles.banner}>
      <Text style={styles.text}>Offline — saved on this device, syncing when you reconnect.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    marginHorizontal: 14,
    marginTop: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: radius.sm,
    backgroundColor: colors.bg.overlay,
    borderWidth: 1,
    borderColor: colors.border.hairline,
  },
  text: { color: colors.text.secondary, fontSize: typeScale.caption.size },
});
