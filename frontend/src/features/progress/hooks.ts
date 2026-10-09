import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/use-auth';

import * as api from './api';
import { uploadProgressPhoto } from './photo';
import {
  cancelCheckInReminder,
  isReminderEnabled,
  scheduleCheckInReminder,
} from './reminder';
import type { PhotoPose, PhysiqueAnalysis } from './types';

async function accessToken(): Promise<string> {
  const { data } = await supabase.auth.getSession();
  return data.session?.access_token ?? '';
}

export function useProgressPhotos() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['progress-photos', user?.id],
    queryFn: api.fetchProgressPhotos,
    enabled: !!user,
  });
}

export function useAddProgressPhoto() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ uri, pose }: { uri: string; pose: PhotoPose }) => {
      const path = await uploadProgressPhoto(user!.id, uri);
      return api.createProgressPhoto(user!.id, { pose, photoPath: path });
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['progress-photos'] }),
  });
}

export function useDeleteProgressPhoto() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.deleteProgressPhoto(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['progress-photos'] }),
  });
}

/** Analyze one or more stored photos, persisting the analysis onto the check-in row. */export function useAnalyzePhysique() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      photoPaths,
      primaryId,
      compareTo,
    }: {
      photoPaths: string[];
      primaryId: string;
      compareTo?: string;
    }): Promise<PhysiqueAnalysis> => {
      const analysis = await api.analyzePhysique(await accessToken(), photoPaths, compareTo);
      await api.saveAnalysis(primaryId, analysis);
      return analysis;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['progress-photos'] });
      queryClient.invalidateQueries({ queryKey: ['program'] });
    },
  });
}

/** The 4-week check-in reminder opt-in (local notification, skippable). */
export function useCheckInReminder() {
  const queryClient = useQueryClient();
  const enabled = useQuery({ queryKey: ['check-in-reminder'], queryFn: isReminderEnabled });

  const toggle = useMutation({
    mutationFn: async (next: boolean): Promise<boolean> => {
      if (!next) {
        await cancelCheckInReminder();
        return false;
      }
      return scheduleCheckInReminder();
    },
    onSuccess: (value) => queryClient.setQueryData(['check-in-reminder'], value),
  });

  return { enabled: enabled.data ?? false, isLoading: enabled.isPending, toggle };
}
