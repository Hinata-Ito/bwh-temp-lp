// HTML に文字列を入れるときのエスケープ
export function esc(s) {
  return String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

// 2026-10-26 → 2026.10.26
export function dotDate(s) {
  return String(s || '').replace(/-/g, '.');
}
