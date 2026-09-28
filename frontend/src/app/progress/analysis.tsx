import { useState } from 'react';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Image } from 'expo-image';
import { useQuery } from '@tanstack/react-query';

import { ArrowLeftIcon, SparkIcon } from '@/components/icons';
import { Button } from '@/components/ui/Button';
import { CoachNote } from '@/components/ui/CoachNote';
import { Screen } from '@/components/ui/Screen';
import { createSignedUrl } from '@/features/progress/api';
import { useAnalyzePhysique, useDeleteProgressPhoto, useProgressPhotos } from '@/features/progress/hooks';
import { POSE_LABELS, type PhysiqueAnalysis } from '@/features/progress/types';
import { ApiError } from '@/lib/api';
import { colors, radius, typeScale } from '@/theme';

function Chip({ label }: { label: string }) {
  return (
    <View style={styles.chip}>
      <Text style={styles.chipText}>{label}</Text>
    </View>
  );
}

export default function AnalysisScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const photos = useProgressPhotos();
  const analyze = useAnalyzePhysique();
  const remove = useDeleteProgressPhoto();

  const photo = (photos.data ?? []).find((p) => p.id === id);
  const [freshAnalysis, setFreshAnalysis] = useState<PhysiqueAnalysis | null>(null);
  const [error, setError] = useState<string | null>(null);

  const analysis = freshAnalysis ?? photo?.analysis ?? null;

  const signed = useQuery({
    queryKey: ['progress-photo-url', photo?.photoPath],
    queryFn: () => createSignedUrl(photo!.photoPath),
    enabled: !!photo,
    staleTime: 50 * 60 * 1000,
  });

  const run = () => {
    if (!photo) return;
    setError(null);
    analyze.mutate(
      { photoPaths: [photo.photoPath], primaryId: photo.id },
      {
        onSuccess: (result) => setFreshAnalysis(result),
        onError: (err) => {
          if (err instanceof ApiError && err.status === 429) {
            setError('You’ve already analyzed recently. Physique analysis resets after 7 days.');
          } else if (err instanceof ApiError && err.status === 422) {
            setError('Couldn’t read that photo. Try even lighting, a plain background, and a clear frame.');
          } else {
            setError('The analysis failed. Please retry.');
          }
        },
      },
    );
  };

  return (
    <Screen>
      <View style={styles.nav}>
        <Pressable onPress={() => router.back()} style={styles.back} hitSlop={8}>
          <ArrowLeftIcon size={18} color={colors.text.primary} />
          <Text style={styles.backLabel}>Progress</Text>
        </Pressable>
        <View style={styles.aiBadge}>
          <SparkIcon size={12} color={colors.accent.ember500} filled />
          <Text style={styles.aiBadgeText}>Physique</Text>
        </View>
      </View>

      {photos.isPending || !photo ? (
        <View style={styles.center}>
          <ActivityIndicator color={colors.accent.ember500} />
        </View>
      ) : (
        <ScrollView style={styles.body} contentContainerStyle={styles.content}>
          <View style={styles.photoBand}>
            {signed.data ? (
              <Image source={{ uri: signed.data }} style={styles.photo} contentFit="cover" transition={150} />
            ) : (
              <View style={[styles.photo, styles.photoEmpty]} />
            )}
            <View style={styles.photoMeta}>
              <Text style={styles.photoMetaText}>
                {POSE_LABELS[photo.pose]} · {photo.takenOn}
              </Text>
            </View>
          </View>

          {analyze.isPending ? (
            <View style={styles.analyzing}>
              <ActivityIndicator color={colors.accent.ember500} />
              <Text style={styles.analyzingText}>Assessing your development…</Text>
            </View>
          ) : analysis ? (
            <>
              <CoachNote title="Summary" body={analysis.summary} foot={analysis.disclaimer} />

              {analysis.strong_areas.length > 0 ? (
                <View style={styles.block}>
                  <Text style={styles.overline}>Strong areas</Text>
                  <View style={styles.chips}>
                    {analysis.strong_areas.map((a) => (
                      <Chip key={a} label={a} />
                    ))}
                  </View>
                </View>
              ) : null}

              {analysis.focus_areas.length > 0 ? (
                <View style={styles.block}>
                  <Text style={styles.overline}>Focus areas</Text>
                  <View style={styles.chips}>
                    {analysis.focus_areas.map((a) => (
                      <Chip key={a} label={a} />
                    ))}
                  </View>
                  <Text style={styles.hint}>
                    These feed into your next forged program automatically.
                  </Text>
                </View>
              ) : null}

              {analysis.posture_notes ? (
                <View style={styles.block}>
                  <Text style={styles.overline}>Posture</Text>
                  <Text style={styles.body_text}>{analysis.posture_notes}</Text>
                </View>
              ) : null}

              {analysis.recommendations.length > 0 ? (
                <View style={styles.block}>
                  <Text style={styles.overline}>Recommendations</Text>
                  {analysis.recommendations.map((r, i) => (
                    <Text key={i} style={styles.bullet}>
                      • {r}
                    </Text>
                  ))}
                </View>
              ) : null}

              <Button
                label="Forge a program from this"
                onPress={() => router.push('/program/generate')}
              />
            </>
          ) : (
            <Button
              label="Analyze with VULCAN"
              leading={<SparkIcon size={18} color={colors.text.onAccent} filled />}
              onPress={run}
            />
          )}

          {error ? <Text style={styles.error}>{error}</Text> : null}

          <Button
            label="Delete check-in"
            variant="destructive"
            onPress={() =>
              remove.mutate(photo.id, { onSuccess: () => router.back() })
            }
          />
        </ScrollView>
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
  aiBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderWidth: 1,
    borderColor: colors.accent.ember500,
    borderRadius: radius.pill,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  aiBadgeText: { color: colors.accent.ember500, fontSize: typeScale.caption.size, fontWeight: '700' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  body: { flex: 1 },
  content: { padding: 16, gap: 16, paddingBottom: 40 },
  photoBand: {
    aspectRatio: 3 / 4,
    borderRadius: radius.lg,
    overflow: 'hidden',
    backgroundColor: colors.bg.card,
  },
  photo: { width: '100%', height: '100%' },
  photoEmpty: { backgroundColor: colors.bg.overlay },
  photoMeta: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: 'rgba(11,11,13,0.7)',
  },
  photoMetaText: { color: colors.text.primary, fontSize: typeScale.label.size, fontWeight: '600' },
  analyzing: { alignItems: 'center', gap: 10, paddingVertical: 28 },
  analyzingText: { color: colors.accent.ember400, fontSize: typeScale.label.size, fontWeight: '600' },
  block: { gap: 8 },
  overline: {
    color: colors.text.secondary,
    fontSize: typeScale.label.size,
    fontWeight: '600',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  chip: {
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.accent.ember500,
    backgroundColor: 'rgba(255,106,0,0.08)',
    paddingHorizontal: 12,
    height: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chipText: { color: colors.accent.ember400, fontSize: typeScale.label.size, fontWeight: '600' },
  body_text: { color: colors.text.secondary, fontSize: typeScale.body.size, lineHeight: typeScale.body.lineHeight },
  bullet: { color: colors.text.secondary, fontSize: typeScale.body.size, lineHeight: typeScale.body.lineHeight },
  hint: { color: colors.text.muted, fontSize: typeScale.caption.size, marginTop: 2 },
  error: { color: colors.semantic.danger, fontSize: typeScale.label.size },
});
