import { Injectable, signal } from '@angular/core';
import { formatDuration, hintsLabel } from '../core/format';
import { LEVELS, LevelId } from '../core/levels';
import { PUZZLE_TYPE_LABEL, PuzzleType } from '../core/puzzle';
import { ChallengeResult, puzzleUrl } from '../core/share-link';

@Injectable({ providedIn: 'root' })
export class ShareService {
  /** Short feedback text shown after copying; cleared automatically. */
  readonly notice = signal('');

  async sharePuzzle(
    type: PuzzleType,
    level: LevelId,
    seed: number,
    result?: ChallengeResult,
  ): Promise<void> {
    const baseUrl = window.location.href.split('#')[0];
    const url = puzzleUrl(baseUrl, type, level, seed, result);
    const label = `${PUZZLE_TYPE_LABEL[type]}, ${LEVELS[level].label}`;
    const text = result
      ? `Ich habe das Matherätsel (${label}) in ${formatDuration(result.seconds)} ${hintsLabel(result.hints)} gelöst. Kannst du das schlagen?`
      : `Kannst du mein Matherätsel (${label}) lösen?`;

    if (navigator.share) {
      try {
        await navigator.share({ title: 'Matherätsel', text, url });
        return;
      } catch (error) {
        if (error instanceof DOMException && error.name === 'AbortError') {
          return;
        }
      }
    }
    await this.copy(`${text} ${url}`);
  }

  private async copy(text: string): Promise<void> {
    try {
      await navigator.clipboard.writeText(text);
      this.showNotice('Link kopiert');
    } catch {
      this.showNotice('Kopieren nicht möglich');
    }
  }

  private showNotice(message: string): void {
    this.notice.set(message);
    setTimeout(() => this.notice.set(''), 2500);
  }
}
