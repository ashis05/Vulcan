export function friendlyAuthError(error: { message?: string; status?: number } | null): string {
  if (!error?.message) return 'Something went wrong. Please try again.';
  const m = error.message.toLowerCase();
  if (m.includes('invalid login credentials')) return 'Incorrect email or password.';
  if (m.includes('email not confirmed')) return 'Please confirm your email before logging in.';
  if (m.includes('already registered')) return 'An account with this email already exists.';
  if (m.includes('password should be at least')) return 'Password must be at least 6 characters.';
  if (m.includes('rate limit')) return 'Too many attempts — wait a moment and try again.';
  if (m.includes('network') || m.includes('failed to fetch')) return 'Network error — check your connection.';
  return error.message;
}