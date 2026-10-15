import { Component, computed, effect, inject, input, untracked } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { categoryOf } from '../../core/categories';
import { formatDuration } from '../../core/format';
import { LevelId } from '../../core/levels';
import { isPuzzleType, PuzzleType } from '../../core/puzzle';
import { createSeed } from '../../core/random';
import { puzzleRoute } from '../../core/share-link';
import { GameService } from '../../services/game.service';

@Component({
  selector: 'app-category-page',
  imports: [RouterLink],
  templateUrl: './category-page.html',
  styleUrl: './category-page.scss',
})
export class CategoryPage {
  private readonly router = inject(Router);
  protected readonly game = inject(GameService);

  /** Bound from the route parameter (:type). */
  readonly type = input<string>();

  protected readonly puzzleType = computed<PuzzleType | null>(() => {
    const type = this.type();
    return isPuzzleType(type) ? type : null;
  });

  protected readonly category = computed(() => {
    const type = this.puzzleType();
    return type ? (categoryOf(type) ?? null) : null;
  });

  protected readonly formatDuration = formatDuration;

  constructor() {
    effect(() => {
      if (this.puzzleType() === null) {
        untracked(() => void this.router.navigate(['/']));
      }
    });
  }

  protected start(level: LevelId): void {
    const type = this.puzzleType();
    if (type) {
      void this.router.navigate(puzzleRoute(type, level, createSeed()));
    }
  }
}
