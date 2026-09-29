import { useMemo, useState } from 'react';
import { useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import {
  ActivityIndicator,
  PanResponder,
  Pressable,
  StyleSheet,
  Text,
  View,
  type LayoutChangeEvent,
} from 'react-native';
import { Image } from 'expo-image';

import { ArrowLeftIcon, ChartIcon } from '@/components/icons';
import { Button } from '@/components/ui/Button';
import { Screen } from '@/components/ui/Screen';
import { createSignedUrl } from '@/features/progress/api';
import { pickComparePair, posesWithPhotos } from '@/features/progress/compare';
import { useProgressPhotos } from '@/features/progress/hooks';
import { POSE_LABELS, type PhotoPose, type ProgressPhoto } from '@/features/progress/types';
import { colors, fonts, radius, typeScale } from '@/theme';

function useSignedUrl(photo: ProgressPhoto | undefined) {
  return useQuery({
    queryKey: ['progress-photo-url', photo?.photoPath],
    queryFn: () => createSignedUrl(photo!.photoPath),
    enabled: !!photo,
    staleTime: 50 * 60 * 1000,
  });
}

function clamp(value: number, max: number): number {
  return Math.max(0, Math.min(max, value));
}

function WipeSlider({
  before,
  after,
  beforeDate,
  afterDate,
}: {
  before: ProgressPhoto;
  after: ProgressPhoto;
  beforeDate: string;
  afterDate: string;
}) {
  const beforeUrl = useSignedUrl(before);
  const afterUrl = useSignedUrl(after);
  const [width, setWidth] = useState(0);
  const [x, setX] = useState(0);

  // Rebuilt when the frame measures so handlers always see the current width.
  const responder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onMoveShouldSetPanResponder: () => true,
        onPanResponderGrant: (evt) => setX(clamp(evt.nativeEvent.locationX, width)),
        onPanResponderMove: (evt) => setX(clamp(evt.nativeEvent.locationX, width)),
      }),
    [width],
  );

  const onLayout = (e: LayoutChangeEvent) => {
    const w = e.nativeEvent.layout.width;
    setWidth(w);
    setX((current) => (current === 0 ? w / 2 : current));
  };

  const ready = beforeUrl.data && afterUrl.data;

  return (
    <View style={styles.wipeWrap} onLayout={onLayout} {...responder.panHandlers}>
      {ready ? (
        <>
          <Image source={{ uri: afterUrl.data! }} style={styles.wipeImage} contentFit="cover" />
          <View style={[styles.wipeBeforeClip, { width: x }]}>
            <Image
              source={{ uri: beforeUrl.data! }}
              style={[styles.wipeImage, { width }]}
              contentFit="cover"
            />
          </View>
          <View style={[styles.divider, { left: x - 1 }]} pointerEvents="none">
            <View style={styles.dividerHandle}>
              <Text style={styles.dividerGrip}>⇆</Text>
            </View>
          </View>
          <View style={[styles.dateTag, styles.dateTagLeft]} pointerEvents="none">
            <Text style={styles.dateTagText}>{beforeDate}</Text>
          </View>
          <View style={[styles.dateTag, styles.dateTagRight]} pointerEvents="none">
            <Text style={styles.dateTagText}>{afterDate}</Text>
          </View>
        </>
      ) : (
        <ActivityIndicator color={colors.accent.ember500} />
      )}
    </View>
  );
}

export default function CompareScreen() {
  const router = useRouter();
  const photos = useProgressPhotos();
  const list = photos.data ?? [];
  const poses = posesWithPhotos(list);
  const [pose, setPose] = useState<PhotoPose | null>(null);

  const activePose = pose ?? poses[0] ?? 'front';
  const pair = pickComparePair(list, activePose);

  return (
    <Screen>
      <View style={styles.nav}>
        <Pressable onPress={() => router.back()} style={styles.back} hitSlop={8}>
          <ArrowLeftIcon size={18} color={colors.text.primary} />
          <Text style={styles.backLabel}>Progress</Text>
        </Pressable>
        <Text style={styles.navTitle}>Compare</Text>
        <View style={styles.navSpacer} />
      </View>

      {photos.isPending ? (
        <View style={styles.center}>
          <ActivityIndicator color={colors.accent.ember500} />
        </View>
      ) : !pair ? (
        <View style={styles.center}>
          <ChartIcon size={30} color={colors.text.muted} />
          <Text style={styles.emptyTitle}>Not enough check-ins</Text>
          <Text style={styles.emptyBody}>
            Add at least two photos in the same pose to see your progress side by side.
          </Text>
        </View>
      ) : (
        <View style={styles.body}>
          {poses.length > 1 ? (
            <View style={styles.poses}>
              {poses.map((p) => {
                const selected = p === activePose;
                return (
                  <Pressable
                    key={p}
                    onPress={() => setPose(p)}
                    style={[styles.pose, selected && styles.poseSelected]}
                    accessibilityState={{ selected }}
                  >
                    <Text style={[styles.poseText, selected && styles.poseTextSelected]}>
                      {POSE_LABELS[p]}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          ) : null}

          <WipeSlider
            before={pair.first}
            after={pair.latest}
            beforeDate={pair.first.takenOn}
            afterDate={pair.latest.takenOn}
          />

          <Text style={styles.hint}>Drag the handle to compare your first and latest check-in.</Text>

          <View style={styles.legend}>
            <View style={styles.legendRow}>
              <Text style={styles.legendLabel}>First</Text>
              <Text style={styles.legendValue}>{pair.first.takenOn}</Text>
            </View>
            <View style={styles.legendRow}>
              <Text style={styles.legendLabel}>Latest</Text>
              <Text style={styles.legendValue}>{pair.latest.takenOn}</Text>
            </View>
          </View>

          <Button
            label="Open latest analysis"
            onPress={() =>
              router.push({ pathname: '/progress/analysis', params: { id: pair.latest.id } })
            }
          />
        </View>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  nav: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  back: { flexDirection: 'row', alignItems: 'center', gap: 6, height: 44, minWidth: 72 },
  backLabel: { color: colors.text.secondary, fontSize: typeScale.label.size, fontWeight: '600' },
  navTitle: {
    color: colors.text.primary,
    fontFamily: fonts.display.bold,
    fontSize: typeScale.h2.size,
  },
  navSpacer: { minWidth: 72 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12, padding: 24 },
  emptyTitle: {
    color: colors.text.primary,
    fontFamily: fonts.display.bold,
    fontSize: typeScale.h2.size,
  },
  emptyBody: { color: colors.text.secondary, fontSize: typeScale.body.size, textAlign: 'center' },
  body: { flex: 1, padding: 16, gap: 16 },
  poses: { flexDirection: 'row', gap: 8 },
  pose: {
    flex: 1,
    height: 40,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.border.hairline,
    backgroundColor: colors.bg.card,
    alignItems: 'center',
    justifyContent: 'center',
  },
  poseSelected: { borderColor: colors.accent.ember500, backgroundColor: colors.accent.ember500 },
  poseText: { color: colors.text.secondary, fontSize: typeScale.label.size, fontWeight: '600' },
  poseTextSelected: { color: colors.text.onAccent },
  wipeWrap: {
    aspectRatio: 3 / 4,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border.hairline,
    backgroundColor: colors.bg.card,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  wipeImage: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, height: '100%' },
  wipeBeforeClip: { position: 'absolute', top: 0, left: 0, bottom: 0, overflow: 'hidden' },
  divider: { position: 'absolute', top: 0, bottom: 0, width: 2, backgroundColor: colors.accent.ember500 },
  dividerHandle: {
    position: 'absolute',
    top: '50%',
    left: -18,
    width: 38,
    height: 38,
    marginTop: -19,
    borderRadius: 19,
    backgroundColor: colors.accent.ember500,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dividerGrip: { color: colors.text.onAccent, fontSize: 18, fontWeight: '700' },
  dateTag: {
    position: 'absolute',
    bottom: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: radius.pill,
    backgroundColor: 'rgba(11,11,13,0.7)',
  },
  dateTagLeft: { left: 12 },
  dateTagRight: { right: 12 },
  dateTagText: { color: colors.text.primary, fontSize: typeScale.caption.size, fontWeight: '600' },
  hint: { color: colors.text.muted, fontSize: typeScale.caption.size, textAlign: 'center' },
  legend: {
    borderWidth: 1,
    borderColor: colors.border.hairline,
    borderRadius: radius.md,
    backgroundColor: colors.bg.card,
    paddingHorizontal: 16,
  },
  legendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 48,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.hairline,
  },
  legendLabel: { color: colors.text.secondary, fontSize: typeScale.body.size, fontWeight: '600' },
  legendValue: { color: colors.text.primary, fontSize: typeScale.body.size },
});
