import { Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { colors } from '@/theme';

export default function HomeScreen() {
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg.base }}>
      <View className="flex-1 items-center justify-center gap-2 px-4">
        <Text className="font-display text-display font-bold text-text-primary">VULCAN</Text>
        <Text className="text-label text-text-secondary">Forged by VULCAN</Text>
        <View className="mt-2 h-1 w-16 rounded-pill bg-ember-500" />
      </View>
    </SafeAreaView>
  );
}