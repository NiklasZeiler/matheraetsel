import { Injectable, computed, inject, signal } from '@angular/core';
import { generatePuzzle } from '../core/generator';
import { LevelId } from '../core/levels';
import { Puzzle } from '../core/puzzle';
import { PersistenceService, Stats } from './persistence.service';

const MAX_INPUT_LENGTH = 4;

@Injectable({ providedIn: 'root' })
export class GameService {
  private readonly persistence = inject(PersistenceService);
  private timerId: ReturnType<typeof setInterval> | null = null;

  readonly puzzle = signal<Puzzle | null>(null);
  readonly input = signal('');
  readonly hintsUsed = signal(0);
  readonly elapsedSeconds = signal(0);
  readonly solved = signal(false);
  /** Increments on every wrong answer so the view can replay its shake animation. */
  readonly wrongAnswers = signal(0);
  readonly stats = signal<Stats>(this.persistence.loadStats());

  readonly maxHints = computed(() => {
    const puzzle = this.puzzle();
    if (!puzzle) {
      return 0;
    }
    // For "what is one X worth" the last symbol is the answer, so it is never revealed.
    return puzzle.question.kind === 'symbol' ? puzzle.symbols.length - 1 : puzzle.symbols.length;
  });

  readonly revealedSymbols = computed(() =>
    (this.puzzle()?.hintOrder ?? []).slice(0, this.hintsUsed()),
  );

  readonly canHint = computed(() => !this.solved() && this.hintsUsed() < this.maxHints());

  start(level: LevelId, seed: number): void {
    const session = this.persistence.loadSession();
    const resumed = session?.level === level && session.seed === seed ? session : null;

    this.puzzle.set(generatePuzzle(level, seed));
    this.input.set('');
    this.hintsUsed.set(resumed?.hintsUsed ?? 0);
    this.elapsedSeconds.set(resumed?.elapsedSeconds ?? 0);
    this.solved.set(resumed?.solved ?? false);
    this.wrongAnswers.set(0);
    this.saveSession();
    this.startTimer();
  }

  stop(): void {
    this.saveSession();
    if (this.timerId !== null) {
      clearInterval(this.timerId);
      this.timerId = null;
    }
  }

  pressDigit(digit: number): void {
    if (this.solved() || this.input().length >= MAX_INPUT_LENGTH) {
      return;
    }
    this.input.update((current) => (current === '0' ? String(digit) : current + digit));
  }

  deleteDigit(): void {
    this.input.update((current) => current.slice(0, -1));
  }

  submit(): void {
    const puzzle = this.puzzle();
    if (!puzzle || this.solved() || this.input() === '') {
      return;
    }
    if (Number(this.input()) === puzzle.question.answer) {
      this.solved.set(true);
      this.stats.set(
        this.persistence.recordSolved(puzzle.level, this.elapsedSeconds(), this.hintsUsed()),
      );
      this.saveSession();
    } else {
      this.wrongAnswers.update((count) => count + 1);
      this.input.set('');
    }
  }

  useHint(): void {
    if (this.canHint()) {
      this.hintsUsed.update((count) => count + 1);
      this.saveSession();
    }
  }

  private startTimer(): void {
    this.stop();
    this.timerId = setInterval(() => {
      if (this.solved() || document.hidden) {
        return;
      }
      this.elapsedSeconds.update((seconds) => seconds + 1);
      this.saveSession();
    }, 1000);
  }

  private saveSession(): void {
    const puzzle = this.puzzle();
    if (puzzle) {
      this.persistence.saveSession({
        level: puzzle.level,
        seed: puzzle.seed,
        elapsedSeconds: this.elapsedSeconds(),
        hintsUsed: this.hintsUsed(),
        solved: this.solved(),
      });
    }
  }
}
