// Plain word list — not a library, just an array you can edit directly.
// Matching is case-insensitive and checks whole words where possible to
// avoid catching substrings inside innocent words.
const BLOCKED_WORDS: string[] = [
  // Add / remove freely. Keep lowercase.
];

export function containsBlockedWord(text: string): boolean {
  if (BLOCKED_WORDS.length === 0) return false;
  const lower = text.toLowerCase();
  return BLOCKED_WORDS.some((word) => {
    // \b word boundaries so "class" doesn't get caught by a blocked "ass", etc.
    const escaped = word.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const re = new RegExp(`\\b${escaped}\\b`, "i");
    return re.test(lower);
  });
}