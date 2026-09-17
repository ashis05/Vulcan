import { useRef, useState } from 'react';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ActivityIndicator, Linking, Pressable, StyleSheet, Text, View } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';

import { ArrowLeftIcon, FlipCameraIcon, GalleryIcon } from '@/components/icons';
import { Button } from '@/components/ui/Button';
import { Screen } from '@/components/ui/Screen';
import { FOOD_SCAN_LIMIT, analyzeFoodPhoto } from '@/features/nutrition/ai';
import { uploadMealPhoto } from '@/features/nutrition/photo';
import { ApiError } from '@/lib/api';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/use-auth';
import { colors, fonts, radius, typeScale } from '@/theme';

export default function ScanScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { date } = useLocalSearchParams<{ date?: string }>();
  const cameraRef = useRef<CameraView>(null);
  const [permission, requestPermission] = useCameraPermissions();
  const [facing, setFacing] = useState<'back' | 'front'>('back');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const analyze = async (uri: string) => {
    if (!user) return;
    setBusy(true);
    setError(null);
    try {
      const { data } = await supabase.auth.getSession();
      const token = data.session?.access_token;
      if (!token) throw new Error('You need to be signed in.');

      const photoPath = await uploadMealPhoto(user.id, uri);
      const estimate = await analyzeFoodPhoto(token, photoPath);
      router.push({
        pathname: '/meal/confirm',
        params: {
          photoPath,
          localUri: uri,
          estimate: JSON.stringify(estimate),
          date: date ?? '',
        },
      });
    } catch (e) {
      if (e instanceof ApiError && e.status === 429) {
        setError('You’ve used all your food scans today. The forge cools at midnight.');
      } else if (e instanceof ApiError && e.status === 422) {
        setError('Couldn’t read that photo — try better light and a top-down shot.');
      } else if (e instanceof ApiError && e.status === 502) {
        setError('The estimate failed. Please try again.');
      } else {
        setError(e instanceof Error ? e.message : 'Something went wrong.');
      }
    } finally {
      setBusy(false);
    }
  };

  const capture = async () => {
    if (busy) return;
    const photo = await cameraRef.current?.takePictureAsync({ quality: 0.7 });
    if (photo?.uri) await analyze(photo.uri);
  };

  const pickFromGallery = async () => {
    if (busy) return;
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 1 });
    const uri = result.canceled ? null : result.assets[0]?.uri;
    if (uri) await analyze(uri);
  };

  if (!permission) {
    return (
      <Screen>
        <View style={styles.center}>
          <ActivityIndicator color={colors.accent.ember500} />
        </View>
      </Screen>
    );
  }

  if (!permission.granted) {
    return (
      <Screen>
        <View style={styles.nav}>
          <Pressable onPress={() => router.back()} style={styles.back} hitSlop={8}>
            <ArrowLeftIcon size={18} color={colors.text.primary} />
            <Text style={styles.backLabel}>Add meal</Text>
          </Pressable>
        </View>
        <View style={styles.center}>
          <Text style={styles.permTitle}>Camera access needed</Text>
          <Text style={styles.permBody}>
            VULCAN uses the camera to scan your meals. You can also pick a photo from your gallery.
          </Text>
          {permission.canAskAgain ? (
            <Button label="Allow camera" onPress={() => requestPermission()} />
          ) : (
            <Button label="Open settings" variant="secondary" onPress={() => Linking.openSettings()} />
          )}
          <Button label="Choose from gallery" variant="ghost" onPress={pickFromGallery} />
        </View>
      </Screen>
    );
  }

  return (
    <Screen>
      <View style={styles.nav}>
        <Pressable onPress={() => router.back()} style={styles.back} hitSlop={8}>
          <ArrowLeftIcon size={18} color={colors.text.primary} />
          <Text style={styles.backLabel}>Add meal</Text>
        </Pressable>
        <Text style={styles.navHint}>FLAT LAY · WHOLE PLATE</Text>
      </View>

      <View style={styles.camWrap}>
        <CameraView ref={cameraRef} style={StyleSheet.absoluteFill} facing={facing} />
        <View style={styles.guides} pointerEvents="none" />
        <View style={styles.hint} pointerEvents="none">
          <Text style={styles.hintText}>Plate in frame for a cleaner read</Text>
        </View>

        {busy ? (
          <View style={styles.busy}>
            <ActivityIndicator color={colors.accent.ember500} size="large" />
            <Text style={styles.busyText}>Reading your plate…</Text>
          </View>
        ) : null}
      </View>

      {error ? (
        <View style={styles.errorCard}>
          <Text style={styles.errorText}>{error}</Text>
          <Pressable onPress={() => setError(null)} hitSlop={8}>
            <Text style={styles.errorDismiss}>Dismiss</Text>
          </Pressable>
        </View>
      ) : null}

      <View style={styles.foot}>
        <View style={styles.footRow}>
          <Pressable onPress={pickFromGallery} style={styles.iconBtn} accessibilityLabel="Gallery">
            <GalleryIcon size={22} color={colors.text.secondary} />
          </Pressable>
          <View style={styles.shutterSlot}>
            <Pressable onPress={capture} disabled={busy} style={styles.shutter} accessibilityLabel="Capture">
              <View style={styles.shutterInner} />
            </Pressable>
          </View>
          <Pressable
            onPress={() => setFacing((f) => (f === 'back' ? 'front' : 'back'))}
            style={styles.iconBtn}
            accessibilityLabel="Flip camera"
          >
            <FlipCameraIcon size={22} color={colors.text.secondary} />
          </Pressable>
        </View>
        <Text style={styles.footCaption}>
          Up to {FOOD_SCAN_LIMIT} scans a day · the forge cools at midnight
        </Text>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 14, padding: 24 },
  nav: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 10,
  },
  back: { flexDirection: 'row', alignItems: 'center', gap: 6, height: 44 },
  backLabel: { color: colors.text.secondary, fontSize: typeScale.label.size, fontWeight: '600' },
  navHint: { color: colors.text.muted, fontSize: typeScale.caption.size, letterSpacing: 1 },
  camWrap: { flex: 1, overflow: 'hidden' },
  guides: {
    position: 'absolute',
    left: '12%',
    right: '12%',
    top: '16%',
    bottom: '12%',
    borderWidth: 2,
    borderColor: 'rgba(255,106,0,0.85)',
    borderRadius: radius.md,
  },
  hint: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 16,
    alignItems: 'center',
  },
  hintText: {
    color: colors.text.secondary,
    fontSize: typeScale.caption.size,
    backgroundColor: 'rgba(11,11,13,0.7)',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: radius.pill,
    overflow: 'hidden',
  },
  permTitle: {
    color: colors.text.primary,
    fontFamily: fonts.display.bold,
    fontSize: typeScale.h2.size,
    textAlign: 'center',
  },
  permBody: {
    color: colors.text.secondary,
    fontSize: typeScale.label.size,
    lineHeight: 20,
    textAlign: 'center',
    marginBottom: 4,
  },
  busy: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    backgroundColor: 'rgba(0,0,0,0.6)',
  },
  busyText: { color: colors.text.primary, fontSize: typeScale.label.size, fontWeight: '600' },
  errorCard: {
    marginHorizontal: 16,
    marginBottom: 10,
    padding: 14,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.semantic.danger,
    backgroundColor: colors.bg.card,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  errorText: { flex: 1, color: colors.text.secondary, fontSize: typeScale.label.size },
  errorDismiss: { color: colors.accent.ember500, fontSize: typeScale.label.size, fontWeight: '700' },
  foot: { paddingHorizontal: 16, paddingBottom: 22, paddingTop: 14, gap: 14 },
  footRow: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  iconBtn: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.bg.elevated,
  },
  shutterSlot: { flex: 1, alignItems: 'center' },
  shutter: {
    width: 72,
    height: 72,
    borderRadius: 36,
    borderWidth: 4,
    borderColor: colors.text.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  shutterInner: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: colors.text.primary,
  },
  footCaption: { color: colors.text.muted, fontSize: typeScale.caption.size, textAlign: 'center' },
});
