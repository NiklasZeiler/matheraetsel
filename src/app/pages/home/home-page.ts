import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CATEGORIES, categoryOf } from '../../core/categories';
import { formatDuration } from '../../core/format';
import { LEVELS } from '../../core/levels';
import { PuzzleType } from '../../core/puzzle';
import { puzzleRoute } from '../../core/share-link';
import { GameService } from '../../services/game.service';
import { PersistenceService } from '../../services/persistence.service';

@Component({
  selector: 'app-home-page',
  imports: [RouterLink],
  templateUrl: './home-page.html',
  styleUrl: './home-page.scss',
})
export class HomePage {
  protected readonly game = inject(GameService);
  protected readonly categories = CATEGORIES;
  protected readonly unfinished = (() => {
    const session = inject(PersistenceService).loadSession();
    return session && !session.solved ? session : null;
  })();

  protected readonly formatDuration = formatDuration;

  protected unfinishedRoute(): string[] {
    const session = this.unfinished;
    return session ? puzzleRoute(session.type, session.level, session.seed) : ['/'];
  }

  protected unfinishedLabel(): string {
    const session = this.unfinished;
    if (!session) {
      return '';
    }
    const title = categoryOf(session.type)?.title ?? '';
    return `${title} · ${LEVELS[session.level].label}`;
  }

  protected solvedCount(type: PuzzleType): number {
    return Object.values(this.game.stats()[type]).reduce((sum, level) => sum + level.solved, 0);
  }
}
