// Dev sanity check: validates the Supabase URL + anon key from frontend/.env.
// Usage: node scripts/check-supabase.mjs
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const env = readFileSync(join(root, '.env'), 'utf8');
const get = (k) => env.split(/\r?\n/).find((l) => l.startsWith(k + '='))?.split('=').slice(1).join('=').trim() ?? '';

const url = get('EXPO_PUBLIC_SUPABASE_URL');
const anon = get('EXPO_PUBLIC_SUPABASE_ANON_KEY');

if (!url || !anon) {
  console.error('✗ EXPO_PUBLIC_SUPABASE_URL or EXPO_PUBLIC_SUPABASE_ANON_KEY missing in frontend/.env');
  process.exit(1);
}

console.log(`URL:   ${url}`);
console.log(`Anon:  ${anon.slice(0, 12)}…${anon.slice(-6)}`);

const health = await fetch(`${url}/auth/v1/health`, {
  headers: { apikey: anon },
});
console.log(`health  → ${health.status}`);
if (!health.ok) {
  console.error('✗ Supabase project unreachable — check the URL.');
  process.exit(1);
}

const res = await fetch(`${url}/auth/v1/token?grant_type=password`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json', apikey: anon },
  body: JSON.stringify({ email: 'probe@vulcan.test', password: 'definitely-not-a-real-password' }),
});
console.log(`anon probe → ${res.status}`);

if (res.status === 400) {
  console.log('✓ Anon key accepted (400 = valid key, bad credentials).');
} else if (res.status === 401) {
  console.error('✗ Anon key rejected (401) — check EXPO_PUBLIC_SUPABASE_ANON_KEY.');
  process.exit(1);
} else {
  console.log(`? Unexpected status — inspect manually (${res.status}).`);
}