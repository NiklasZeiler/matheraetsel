import { Component, DestroyRef, computed, effect, inject, input, untracked } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { ExpressionView } from '../../components/expression-view/expression-view';
import { Numpad } from '../../components/numpad/numpad';
import { formatDuration, hintsLabel } from '../../core/format';
import { LEVELS } from '../../core/levels';
import { createSeed } from '../../core/random';
import { decodeSeed, parseChallenge, parseLevel, puzzleRoute } from '../../core/share-link';
import { GameService } from '../../services/game.service';
import { ShareService } from '../../services/share.service';

@Component({
  selector: 'app-puzzle-page',
  imports: [RouterLink, ExpressionView, Numpad],
  templateUrl: './puzzle-page.html',
  styleUrl: './puzzle-page.scss',
})
export class PuzzlePage {
  protected readonly game = inject(GameService);
  protected readonly shareService = inject(ShareService);
  private readonly router = inject(Router);

  // Bound from the route (:level, :seed) and the query string (?t=…&h=…).
  readonly level = input<string>();
  readonly seed = input<string>();
  readonly t = input<string>();
  readonly h = input<string>();

  protected readonly formatDuration = formatDuration;
  protected readonly hintsLabel = hintsLabel;

  protected readonly levelLabel = computed(() => {
    const level = parseLevel(this.level());
    return level ? LEVELS[level].label : '';
  });

  protected readonly groupRepeats = computed(() => {
    const level = parseLevel(this.level());
    return level ? LEVELS[level].groupRepeats : false;
  });

  protected readonly challenge = computed(() => parseChallenge(this.t(), this.h()));

  protected readonly challengeVerdict = computed(() => {
    const challenge = this.challenge();
    if (!challenge || !this.game.solved()) {
      return '';
    }
    const seconds = this.game.elapsedSeconds();
    if (seconds < challenge.seconds) {
      return 'Geschafft: Du warst schneller!';
    }
    return seconds === challenge.seconds ? 'Gleichstand!' : 'Diesmal war die Vorgabe schneller.';
  });

  protected readonly revealed = computed(() => {
    const puzzle = this.game.puzzle();
    if (!puzzle) {
      return [];
    }
    return this.game
      .revealedSymbols()
      .map((symbol) => ({ picture: puzzle.symbols[symbol], value: puzzle.values[symbol] }));
  });

  protected readonly hintsLeft = computed(() => this.game.maxHints() - this.game.hintsUsed());

  constructor() {
    effect(() => {
      const level = parseLevel(this.level());
      const seed = decodeSeed(this.seed());
      untracked(() => {
        if (level === null || seed === null) {
          void this.router.navigate(['/']);
        } else {
          this.game.start(level, seed);
        }
      });
    });
    inject(DestroyRef).onDestroy(() => this.game.stop());
  }

  protected newPuzzle(): void {
    const puzzle = this.game.puzzle();
    if (puzzle) {
      void this.router.navigate(puzzleRoute(puzzle.level, createSeed()));
    }
  }

  protected sharePuzzle(): void {
    const puzzle = this.game.puzzle();
    if (puzzle) {
      void this.shareService.sharePuzzle(puzzle.level, puzzle.seed);
    }
  }

  protected shareResult(): void {
    const puzzle = this.game.puzzle();
    if (puzzle) {
      void this.shareService.sharePuzzle(puzzle.level, puzzle.seed, {
        seconds: this.game.elapsedSeconds(),
        hints: this.game.hintsUsed(),
      });
    }
  }
}
