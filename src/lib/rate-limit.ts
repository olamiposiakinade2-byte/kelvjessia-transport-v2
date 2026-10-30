const requests = new Map<string, { count: number; resetAt: number }>();
export function allowRequest(key: string, max = 5, windowMs = 60_000) {
  const now = Date.now(); const current = requests.get(key);
  if (!current || current.resetAt < now) { requests.set(key, { count: 1, resetAt: now + windowMs }); return true; }
  if (current.count >= max) return false;
  current.count++; return true;
}
