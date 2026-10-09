import { useState } from 'react';
import { useRouter } from 'expo-router';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  View,
} from 'react-native';
import { Image } from 'expo-image';

import { CameraIcon, ChartIcon, PlusIcon, SparkIcon } from '@/components/icons';
import { Button } from '@/components/ui/Button';
import { CoachNote } from '@/components/ui/CoachNote';
import { Screen } from '@/components/ui/Screen';
import { useCheckInReminder, useProgressPhotos } from '@/features/progress/hooks';
import { createSignedUrl } from '@/features/progress/api';
import { pickComparePair, posesWithPhotos } from '@/features/progress/compare';
import { POSE_LABELS, type ProgressPhoto } from '@/features/progress/types';
import { useQuery } from '@tanstack/react-query';
import { colors, fonts, radius, typeScale } from '@/theme';

function PhotoThumb({ photo, onPress }: { photo: ProgressPhoto; onPress: () => void }) {
  const signed = useQuery({
    queryKey: ['progress-photo-url', photo.photoPath],
    queryFn: () => createSignedUrl(photo.photoPath),
    staleTime: 50 * 60 * 1000,
  });

  return (
    <Pressable onPress={onPress} style={styles.thumb}>
      {signed.data ? (
        <Image source={{ uri: signed.data }} style={styles.thumbImage} contentFit="cover" transition={150} />
      ) : (
        <View style={[styles.thumbImage, styles.thumbEmpty]} />
      )}
      <View style={styles.thumbMeta}>
        <Text style={styles.thumbPose}>{POSE_LABELS[photo.pose]}</Text>
        <Text style={styles.thumbDate}>{photo.takenOn.slice(5)}</Text>
      </View>
    </Pressable>
  );
}

export default function ProgressScreen() {
  const router = useRouter();
  const photos = useProgressPhotos();
  const reminder = useCheckInReminder();
  const list = photos.data ?? [];
  const latestWithAnalysis = list.find((p) => p.analysis);
  const canCompare = posesWithPhotos(list).some((pose) => pickComparePair(list, pose));
  const [showAll, setShowAll] = useState(false);
  const visible = showAll ? list : list.slice(0, 6);

  return (
    <Screen>
      <ScrollView style={styles.body} contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <Text style={styles.title}>Progress</Text>
          {list.length > 0 ? (
            <Pressable onPress={() => router.push('/progress/checkin')} style={styles.newBtn} hitSlop={8}>
              <PlusIcon size={16} color={colors.accent.ember500} />
              <Text style={styles.newLabel}>Check in</Text>
            </Pressable>
          ) : null}
        </View>

        {photos.isPending ? (
          <ActivityIndicator color={colors.accent.ember500} style={styles.loading} />
        ) : list.length === 0 ? (
          <View style={styles.empty}>
            <CameraIcon size={30} color={colors.accent.ember500} />
            <Text style={styles.emptyTitle}>No check-ins yet</Text>
            <Text style={styles.emptySub}>
              Add physique photos and VULCAN can assess your development and shape your next program.
            </Text>
            <Button label="Start a check-in" onPress={() => router.push('/progress/checkin')} />
          </View>
        ) : (
          <>
            {latestWithAnalysis ? (
              <CoachNote
                title="Latest analysis"
                body={latestWithAnalysis.analysis!.summary}
                foot={latestWithAnalysis.analysis!.disclaimer}
              />
            ) : null}

            <View style={styles.sectionHead}>
              <Text style={styles.sectionLabel}>Check-ins</Text>
              {list.length > 6 ? (
                <Pressable onPress={() => setShowAll((v) => !v)} hitSlop={8} style={styles.newBtn}>
                  <Text style={styles.newLabel}>{showAll ? 'Show less' : 'See all'}</Text>
                </Pressable>
              ) : null}
            </View>

            <View style={styles.grid}>
              {visible.map((photo) => (
                <PhotoThumb
                  key={photo.id}
                  photo={photo}
                  onPress={() =>
                    router.push({ pathname: '/progress/analysis', params: { id: photo.id } })
                  }
                />
              ))}
            </View>

            {canCompare ? (
              <Button
                label="Compare first vs latest"
                variant="secondary"
                leading={<ChartIcon size={18} color={colors.accent.ember500} />}
                onPress={() => router.push('/progress/compare')}
              />
            ) : null}

            <View style={styles.reminderRow}>
              <View style={styles.reminderText}>
                <Text style={styles.reminderTitle}>Monthly check-in reminder</Text>
                <Text style={styles.reminderSub}>
                  A gentle nudge every 4 weeks to take new photos.
                </Text>
              </View>
              <Switch
                value={reminder.enabled}
                disabled={reminder.isLoading || reminder.toggle.isPending}
                onValueChange={(next) => reminder.toggle.mutate(next)}
                trackColor={{ false: colors.bg.overlay, true: colors.accent.ember500 }}
                thumbColor={colors.text.primary}
              />
            </View>

            <Button
              label="New check-in"
              leading={<SparkIcon size={18} color={colors.text.onAccent} filled />}
              onPress={() => router.push('/progress/checkin')}
            />
          </>
        )}
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  body: { flex: 1 },
  content: { padding: 16, gap: 16, paddingBottom: 110 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  title: {
    fontFamily: fonts.display.bold,
    fontSize: typeScale.title.size,
    lineHeight: typeScale.title.lineHeight,
    color: colors.text.primary,
  },
  newBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, height: 32 },
  newLabel: { color: colors.accent.ember500, fontSize: typeScale.label.size, fontWeight: '600' },
  loading: { paddingVertical: 40 },
  empty: { alignItems: 'center', justifyContent: 'center', gap: 10, paddingVertical: 48 },
  emptyTitle: {
    color: colors.text.primary,
    fontFamily: fonts.display.bold,
    fontSize: typeScale.h2.size,
  },
  emptySub: {
    color: colors.text.secondary,
    fontSize: typeScale.body.size,
    textAlign: 'center',
    paddingHorizontal: 16,
  },
  sectionHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  sectionLabel: {
    color: colors.text.secondary,
    fontSize: typeScale.label.size,
    fontWeight: '600',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  thumb: {
    flexBasis: '31%',
    flexGrow: 1,
    aspectRatio: 3 / 4,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border.hairline,
    backgroundColor: colors.bg.card,
    overflow: 'hidden',
  },
  thumbImage: { width: '100%', height: '100%' },
  thumbEmpty: { backgroundColor: colors.bg.overlay },
  thumbMeta: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 8,
    paddingVertical: 5,
    backgroundColor: 'rgba(11,11,13,0.7)',
  },
  thumbPose: { color: colors.text.primary, fontSize: typeScale.caption.size, fontWeight: '600' },
  thumbDate: { color: colors.text.muted, fontSize: typeScale.caption.size },
  reminderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border.hairline,
    borderRadius: radius.md,
    backgroundColor: colors.bg.card,
  },
  reminderText: { flex: 1, gap: 2 },
  reminderTitle: { color: colors.text.primary, fontSize: typeScale.body.size, fontWeight: '600' },
  reminderSub: { color: colors.text.muted, fontSize: typeScale.caption.size },
});
