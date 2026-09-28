export interface ProgramExercise {
  name: string;
  sets: number;
  reps: string;
  rpe?: number | null;
  rest_seconds?: number | null;
  notes?: string | null;
  primary_muscle?: string | null;
  equipment?: string | null;
}

export interface ProgramSession {
  day_label: string;
  exercises: ProgramExercise[];
}

export interface ProgramWeek {
  sessions: ProgramSession[];
}

export interface ProgramPayload {
  name: string;
  weeks: ProgramWeek[];
  progression_notes: string;
  rationale: string;
}

export interface ActiveProgram {
  id: string;
  status: string;
  rationale: string | null;
  prompt_version: string | null;
  created_at: string;
  program: ProgramPayload;
}

/** Must match `QUOTA_PROGRAM_PER_DAYS` on the backend (PLAN.md §7). */
export const PROGRAM_WINDOW_DAYS = 7;
