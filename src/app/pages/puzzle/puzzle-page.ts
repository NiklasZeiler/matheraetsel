import { Component, DestroyRef, computed, effect, inject, input, untracked } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { ExpressionView } from '../../components/expression-view/expression-view';
import { Numpad } from '../../components/numpad/numpad';
import { FitWidth } from '../../components/fit-width/fit-width';
import { MobileView } from '../../components/mobile-view/mobile-view';
import { PanView } from '../../components/pan-view/pan-view';
import { ScaleView } from '../../components/scale-view/scale-view';
import { formatDuration, hintsLabel } from '../../core/format';
import { LEVELS } from '../../core/levels';
import { barWeight, mobileLabel, subMobiles } from '../../core/mobile';
import { PUZZLE_TYPE_LABEL, PuzzleType } from '../../core/puzzle';
import { createSeed } from '../../core/random';
import { decodeSeed, parseChallenge, parseLevel, puzzleRoute } from '../../core/share-link';
import { GameService } from '../../services/game.service';
import { ShareService } from '../../services/share.service';

@Component({
  selector: 'app-puzzle-page',
  imports: [RouterLink, ExpressionView, Numpad, PanView, ScaleView, MobileView, FitWidth],
  templateUrl: './puzzle-page.html',
  styleUrl: './puzzle-page.scss',
})
export class PuzzlePage {
  protected readonly game = inject(GameService);
  protected readonly shareService = inject(ShareService);
  private readonly router = inject(Router);

  // Bound from the route data, params (:level, :seed) and the query string (?t=…&h=…).
  readonly type = input<PuzzleType>('gleichung');
  readonly level = input<string>();
  readonly seed = input<string>();
  readonly t = input<string>();
  readonly h = input<string>();

  protected readonly formatDuration = formatDuration;
  protected readonly hintsLabel = hintsLabel;

  protected readonly levelLabel = computed(() => {
    const level = parseLevel(this.level());
    return level ? `${PUZZLE_TYPE_LABEL[this.type()]} · ${LEVELS[level].label}` : '';
  });

  protected readonly gleichung = computed(() => {
    const puzzle = this.game.puzzle();
    return puzzle?.kind === 'gleichung' ? puzzle : null;
  });

  protected readonly waage = computed(() => {
    const puzzle = this.game.puzzle();
    return puzzle?.kind === 'waage' ? puzzle : null;
  });

  protected readonly mobile = computed(() => {
    const puzzle = this.game.puzzle();
    return puzzle?.kind === 'mobile' ? puzzle : null;
  });

  protected readonly mobileUnknown = computed(() => {
    const question = this.mobile()?.question;
    return question?.kind === 'unknown' ? question : null;
  });

  protected readonly mobileSymbol = computed(() => {
    const question = this.mobile()?.question;
    return question?.kind === 'symbol' ? question : null;
  });

  protected readonly mobilePart = computed(() => {
    const question = this.mobile()?.question;
    return question?.kind === 'part' ? question : null;
  });

  /** Number mobiles: hints name a sub-mobile and give its total weight. */
  protected readonly mobileHints = computed(() => {
    const puzzle = this.mobile();
    if (!puzzle || puzzle.mode !== 'numbers') {
      return [];
    }
    const mobiles = subMobiles(puzzle.root);
    return this.game.revealedSymbols().flatMap((id) => {
      const found = mobiles.find((item) => item.id === id);
      return found ? [{ label: mobileLabel(id), total: barWeight(found.bar, puzzle.values) }] : [];
    });
  });

  protected readonly waageCount = computed(() => {
    const question = this.waage()?.question;
    return question?.kind === 'count' ? question : null;
  });

  protected readonly waageSymbol = computed(() => {
    const question = this.waage()?.question;
    return question?.kind === 'symbol' ? question : null;
  });

  protected readonly waageExpression = computed(() => {
    const question = this.waage()?.question;
    return question?.kind === 'expression' ? question : null;
  });

  /** Ratio waage hints are sentences like "🍓 wiegt so viel wie 🍋 🍋 🍋". */
  protected readonly ratioHints = computed(() => {
    const puzzle = this.waage();
    if (!puzzle || puzzle.unit === null) {
      return [];
    }
    const unitPicture = puzzle.symbols[puzzle.unit];
    const unitValue = puzzle.values[puzzle.unit];
    return this.game.revealedSymbols().map((symbol) => ({
      picture: puzzle.symbols[symbol],
      equivalent: Array.from({ length: puzzle.values[symbol] / unitValue }, () => unitPicture),
    }));
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

  /** One entry per picture: the player's own guess, or the true value once a hint revealed it. */
  protected readonly noteItems = computed(() => {
    const puzzle = this.game.puzzle();
    if (!puzzle) {
      return [];
    }
    const revealed = this.game.revealedSymbols();
    const notes = this.game.notes();
    return puzzle.symbols.map((picture, symbol) => {
      const isRevealed = revealed.includes(symbol);
      return {
        symbol,
        picture,
        revealed: isRevealed,
        text: isRevealed ? String(puzzle.values[symbol]) : (notes[symbol] ?? ''),
      };
    });
  });

  protected readonly hintsLeft = computed(() => this.game.maxHints() - this.game.hintsUsed());

  constructor() {
    effect(() => {
      const type = this.type();
      const level = parseLevel(this.level());
      const seed = decodeSeed(this.seed());
      untracked(() => {
        if (level === null || seed === null) {
          void this.router.navigate(['/']);
        } else {
          this.game.start(type, level, seed);
        }
      });
    });
    inject(DestroyRef).onDestroy(() => this.game.stop());
  }

  protected newPuzzle(): void {
    const puzzle = this.game.puzzle();
    if (puzzle) {
      void this.router.navigate(puzzleRoute(puzzle.kind, puzzle.level, createSeed()));
    }
  }

  protected sharePuzzle(): void {
    const puzzle = this.game.puzzle();
    if (puzzle) {
      void this.shareService.sharePuzzle(puzzle.kind, puzzle.level, puzzle.seed);
    }
  }

  protected shareResult(): void {
    const puzzle = this.game.puzzle();
    if (puzzle) {
      void this.shareService.sharePuzzle(puzzle.kind, puzzle.level, puzzle.seed, {
        seconds: this.game.elapsedSeconds(),
        hints: this.game.hintsUsed(),
      });
    }
  }
}
