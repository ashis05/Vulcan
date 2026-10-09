import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/use-auth';

import * as api from './api';
import type { ProgramPayload } from './types';

async function accessToken(): Promise<string> {
  const { data } = await supabase.auth.getSession();
  return data.session?.access_token ?? '';
}

export function useActiveProgram() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['program', 'active', user?.id],
    queryFn: async () => api.fetchActiveProgram(await accessToken()),
    enabled: !!user,
  });
}

export function useLastForgedDate() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['program', 'forged', user?.id],
    queryFn: api.fetchLastForgedDate,
    enabled: !!user,
  });
}

export function useGenerateProgram() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: { notes?: string; focusAreas?: string[] }) =>
      api.generateProgram(await accessToken(), input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['program'] });
      queryClient.invalidateQueries({ queryKey: ['routines'] });
    },
  });
}

export function useRenameProgram() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload, name }: { id: string; payload: ProgramPayload; name: string }) =>
      api.renameProgram(id, payload, name),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['program'] }),
  });
}
