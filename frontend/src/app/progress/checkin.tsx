import { useState } from 'react';
import { useRouter } from 'expo-router';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';

import { CameraIcon, GalleryIcon } from '@/components/icons';
import { Button } from '@/components/ui/Button';
import { Screen } from '@/components/ui/Screen';
import { useAddProgressPhoto } from '@/features/progress/hooks';
import { POSE_LABELS, type PhotoPose } from '@/features/progress/types';
import { colors, fonts, radius, typeScale } from '@/theme';

const POSES: PhotoPose[] = ['front', 'side', 'back'];

export default function CheckInScreen() {
  const router = useRouter();
  const addPhoto = useAddProgressPhoto();
  const [pose, setPose] = useState<PhotoPose>('front');
  const [uri, setUri] = useState<string | null>(null);

  const capture = async (fromCamera: boolean) => {
    if (fromCamera) {
      const permission = await ImagePicker.requestCameraPermissionsAsync();
      if (!permission.granted) {
        Alert.alert('Camera needed', 'Enable camera access to take a check-in photo.');
        return;
      }
    }
    const result = fromCamera
      ? await ImagePicker.launchCameraAsync({ quality: 0.9, allowsEditing: false })
      : await ImagePicker.launchImageLibraryAsync({ quality: 0.9, allowsEditing: false });
    if (!result.canceled && result.assets[0]) setUri(result.assets[0].uri);
  };

  const save = () => {
    if (!uri) return;
    addPhoto.mutate(
      { uri, pose },
      {
        onSuccess: () => router.back(),
        onError: () => Alert.alert('Upload failed', 'Check your connection and try again.'),
      },
    );
  };

  return (
    <Screen>
      <View style={styles.nav}>
        <Pressable onPress={() => router.back()} style={styles.cancel} hitSlop={8}>
          <Text style={styles.cancelLabel}>Cancel</Text>
        </Pressable>
        <Text style={styles.navTitle}>Check-in</Text>
        <View style={styles.navSpacer} />
      </View>

      <ScrollView style={styles.body} contentContainerStyle={styles.content}>
        <View style={styles.frame}>
          {uri ? (
            <Image source={{ uri }} style={styles.preview} contentFit="cover" transition={150} />
          ) : (
            <View style={styles.frameEmpty}>
              <CameraIcon size={30} color="rgba(255,106,0,0.5)" />
            </View>
          )}
        </View>

        <View style={styles.poses}>
          {POSES.map((p) => {
            const selected = p === pose;
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

        <View style={styles.captureRow}>
          <Pressable onPress={() => capture(true)} style={styles.captureBtn}>
            <CameraIcon size={20} color={colors.text.primary} />
            <Text style={styles.captureLabel}>Camera</Text>
          </Pressable>
          <Pressable onPress={() => capture(false)} style={styles.captureBtn}>
            <GalleryIcon size={20} color={colors.text.primary} />
            <Text style={styles.captureLabel}>Gallery</Text>
          </Pressable>
        </View>

        <Text style={styles.privacy}>
          Photos stay private to your account in a locked bucket — they’re only read server-side to
          generate your analysis.
        </Text>

        <Button
          label={addPhoto.isPending ? 'Saving…' : 'Save photo'}
          onPress={save}
          disabled={!uri || addPhoto.isPending}
        />
      </ScrollView>
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
  cancel: { height: 44, justifyContent: 'center', minWidth: 72 },
  cancelLabel: { color: colors.text.secondary, fontSize: typeScale.label.size, fontWeight: '600' },
  navTitle: {
    color: colors.text.primary,
    fontFamily: fonts.display.bold,
    fontSize: typeScale.h2.size,
  },
  navSpacer: { minWidth: 72 },
  body: { flex: 1 },
  content: { padding: 16, gap: 16, paddingBottom: 40 },
  frame: {
    aspectRatio: 3 / 4,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border.hairline,
    backgroundColor: colors.bg.card,
    overflow: 'hidden',
  },
  frameEmpty: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  preview: { width: '100%', height: '100%' },
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
  captureRow: { flexDirection: 'row', gap: 10 },
  captureBtn: {
    flex: 1,
    height: 52,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.border.hairline,
    backgroundColor: colors.bg.card,
  },
  captureLabel: { color: colors.text.primary, fontSize: typeScale.body.size, fontWeight: '600' },
  privacy: { color: colors.text.muted, fontSize: typeScale.caption.size, lineHeight: 16 },
});
