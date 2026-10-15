export function formatDuration(totalSeconds: number): string {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

export function hintsLabel(count: number): string {
  if (count === 0) {
    return 'ohne Hinweis';
  }
  return count === 1 ? 'mit 1 Hinweis' : `mit ${count} Hinweisen`;
}
