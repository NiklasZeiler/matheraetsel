import { Component, inject } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { formatDuration } from '../../core/format';
import { LEVELS, LEVEL_IDS, LevelId } from '../../core/levels';
import { createSeed } from '../../core/random';
import { PUZZLE_TYPE_LABEL, PuzzleType } from '../../core/puzzle';
import { puzzleRoute } from '../../core/share-link';
import { WAAGE_LEVELS } from '../../core/waage-levels';
import { GameService } from '../../services/game.service';
import { PersistenceService } from '../../services/persistence.service';

@Component({
  selector: 'app-home-page',
  imports: [RouterLink],
  templateUrl: './home-page.html',
  styleUrl: './home-page.scss',
})
export class HomePage {
  private readonly router = inject(Router);
  protected readonly game = inject(GameService);

  protected readonly sections: {
    type: PuzzleType;
    title: string;
    levels: { id: LevelId; label: string; description: string }[];
  }[] = [
    {
      type: 'gleichung',
      title: PUZZLE_TYPE_LABEL.gleichung,
      levels: LEVEL_IDS.map((id) => LEVELS[id]),
    },
    {
      type: 'waage',
      title: PUZZLE_TYPE_LABEL.waage,
      levels: LEVEL_IDS.map((id) => ({
        id,
        label: LEVELS[id].label,
        description: WAAGE_LEVELS[id].description,
      })),
    },
  ];
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
    return session ? `${PUZZLE_TYPE_LABEL[session.type]} · ${LEVELS[session.level].label}` : '';
  }

  protected start(type: PuzzleType, level: LevelId): void {
    void this.router.navigate(puzzleRoute(type, level, createSeed()));
  }
}
