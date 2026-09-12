import { useRouter } from 'expo-router';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { AnvilIcon, PlusIcon } from '@/components/icons';
import { Button } from '@/components/ui/Button';
import { Screen } from '@/components/ui/Screen';
import { EmptyState, RoutineCard, SectionLabel } from '@/features/train/components';
import { useRoutines } from '@/features/train/hooks';
import { colors, fonts, typeScale } from '@/theme';

export default function TrainScreen() {
  const router = useRouter();
  const routines = useRoutines();

  return (
    <Screen>
      <View style={styles.header}>
        <Text style={styles.title}>Train</Text>
      </View>

      <ScrollView style={styles.body} contentContainerStyle={styles.bodyContent}>
        <View style={styles.section}>
          <View style={styles.sectionHead}>
            <SectionLabel>My routines</SectionLabel>
            <Pressable
              onPress={() => router.push('/routine/builder')}
              style={styles.newBtn}
              hitSlop={8}
            >
              <PlusIcon size={16} color={colors.accent.ember500} />
              <Text style={styles.newLabel}>New routine</Text>
            </Pressable>
          </View>

          {routines.isPending ? (
            <ActivityIndicator color={colors.accent.ember500} style={styles.loading} />
          ) : routines.isError ? (
            <Text style={styles.error}>Could not load your routines.</Text>
          ) : routines.data && routines.data.length > 0 ? (
            <View style={styles.list}>
              {routines.data.map((routine) => (
                <RoutineCard
                  key={routine.id}
                  routine={routine}
                  onPress={() => router.push({ pathname: '/routine/[id]', params: { id: routine.id } })}
                />
              ))}
            </View>
          ) : (
            <EmptyState
              icon={<AnvilIcon size={26} color={colors.accent.ember500} />}
              title="No routines yet"
              subtitle="Build a routine to make training repeatable."
            />
          )}
        </View>

        <View style={styles.section}>
          <SectionLabel>History</SectionLabel>
          <EmptyState
            icon={<AnvilIcon size={26} color={colors.text.muted} />}
            title="Nothing forged yet"
            subtitle="Your finished sessions will show up here."
          />
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <Button label="Start empty workout" onPress={() => router.push('/workout/active')} />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: { paddingHorizontal: 16, paddingTop: 24 },
  title: {
    fontFamily: fonts.display.bold,
    fontSize: typeScale.title.size,
    lineHeight: typeScale.title.lineHeight,
    color: colors.text.primary,
  },
  body: { flex: 1 },
  bodyContent: { padding: 16, gap: 22, paddingBottom: 24 },
  section: { gap: 12 },
  sectionHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  newBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, height: 32 },
  newLabel: { color: colors.accent.ember500, fontSize: typeScale.label.size, fontWeight: '600' },
  list: { gap: 10 },
  loading: { paddingVertical: 24 },
  error: { color: colors.semantic.danger, fontSize: typeScale.label.size },
  footer: { paddingHorizontal: 16, paddingBottom: 12 },
});
