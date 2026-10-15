import { Component, inject } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { formatDuration } from '../../core/format';
import { LEVELS, LEVEL_IDS, LevelId } from '../../core/levels';
import { createSeed } from '../../core/random';
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
  private readonly router = inject(Router);
  protected readonly game = inject(GameService);

  protected readonly levels = LEVEL_IDS.map((id) => LEVELS[id]);
  protected readonly unfinished = (() => {
    const session = inject(PersistenceService).loadSession();
    return session && !session.solved ? session : null;
  })();

  protected readonly formatDuration = formatDuration;

  protected unfinishedRoute(): string[] {
    const session = this.unfinished;
    return session ? puzzleRoute(session.level, session.seed) : ['/'];
  }

  protected unfinishedLabel(): string {
    return this.unfinished ? LEVELS[this.unfinished.level].label : '';
  }

  protected start(level: LevelId): void {
    void this.router.navigate(puzzleRoute(level, createSeed()));
  }
}
