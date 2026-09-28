export type PhotoPose = 'front' | 'side' | 'back';

export const POSE_LABELS: Record<PhotoPose, string> = {
  front: 'Front',
  side: 'Side',
  back: 'Back',
};

export interface ProgressPhoto {
  id: string;
  takenOn: string;
  pose: PhotoPose;
  photoPath: string;
  analysis: PhysiqueAnalysis | null;
}

export interface PhysiqueAnalysis {
  summary: string;
  strong_areas: string[];
  focus_areas: string[];
  posture_notes: string;
  recommendations: string[];
  confidence: 'low' | 'medium' | 'high';
  disclaimer: string;
}

/** Must match `QUOTA_PHYSIQUE_PER_DAYS` on the backend (PLAN.md §7). */
export const PHYSIQUE_WINDOW_DAYS = 7;
