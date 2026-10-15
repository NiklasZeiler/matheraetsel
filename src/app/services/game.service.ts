import { Injectable, computed, inject, signal } from '@angular/core';
import { generatePuzzle } from '../core/generator';
import { LevelId } from '../core/levels';
import { Puzzle } from '../core/puzzle';
import { PersistenceService, Stats } from './persistence.service';

const MAX_INPUT_LENGTH = 4;

/** Where the number pad writes: the final answer or the note of one symbol. */
export type InputTarget = 'answer' | number;

@Injectable({ providedIn: 'root' })
export class GameService {
  private readonly persistence = inject(PersistenceService);
  private timerId: ReturnType<typeof setInterval> | null = null;

  readonly puzzle = signal<Puzzle | null>(null);
  readonly input = signal('');
  readonly notes = signal<Record<number, string>>({});
  readonly target = signal<InputTarget>('answer');
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
    this.notes.set(resumed?.notes ?? {});
    this.target.set('answer');
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

  selectTarget(target: InputTarget): void {
    if (typeof target === 'number' && this.revealedSymbols().includes(target)) {
      return;
    }
    this.target.set(target);
  }

  pressDigit(digit: number): void {
    if (this.solved()) {
      return;
    }
    this.editTarget((current) =>
      current.length >= MAX_INPUT_LENGTH ? current : current === '0' ? String(digit) : current + digit,
    );
  }

  deleteDigit(): void {
    this.editTarget((current) => current.slice(0, -1));
  }

  submit(): void {
    const puzzle = this.puzzle();
    if (!puzzle || this.solved()) {
      return;
    }
    if (this.target() !== 'answer') {
      this.target.set('answer');
      return;
    }
    if (this.input() === '') {
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
      const target = this.target();
      if (typeof target === 'number' && this.revealedSymbols().includes(target)) {
        this.target.set('answer');
      }
      this.saveSession();
    }
  }

  private editTarget(change: (current: string) => string): void {
    const target = this.target();
    if (target === 'answer') {
      this.input.update(change);
    } else {
      this.notes.update((notes) => ({ ...notes, [target]: change(notes[target] ?? '') }));
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
        notes: this.notes(),
      });
    }
  }
}
