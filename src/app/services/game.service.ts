import { Injectable, computed, inject, signal } from '@angular/core';
import { generateAny } from '../core/generate-any';
import { maxHints, notesEnabled } from '../core/hints';
import { blankCells } from '../core/kreuzzahl';
import { LevelId } from '../core/levels';
import { AnyPuzzle, PuzzleType } from '../core/puzzle';
import { PersistenceService, Stats } from './persistence.service';

const MAX_INPUT_LENGTH = 4;

/** Where the number pad writes: the final answer or the note of one symbol. */
export type InputTarget = 'answer' | number;

@Injectable({ providedIn: 'root' })
export class GameService {
  private readonly persistence = inject(PersistenceService);
  private timerId: ReturnType<typeof setInterval> | null = null;

  readonly puzzle = signal<AnyPuzzle | null>(null);
  readonly input = signal('');
  readonly notes = signal<Record<number, string>>({});
  readonly target = signal<InputTarget>('answer');
  readonly hintsUsed = signal(0);
  readonly elapsedSeconds = signal(0);
  readonly solved = signal(false);
  /** Increments on every wrong answer so the view can replay its shake animation. */
  readonly wrongAnswers = signal(0);
  /** Kreuzzahl: cells that were filled in wrongly at the last full check. */
  readonly wrongCells = signal<number[]>([]);
  readonly stats = signal<Record<PuzzleType, Stats>>({
    gleichung: this.persistence.loadStats('gleichung'),
    waage: this.persistence.loadStats('waage'),
    mobile: this.persistence.loadStats('mobile'),
    kreuzzahl: this.persistence.loadStats('kreuzzahl'),
  });

  readonly maxHints = computed(() => {
    const puzzle = this.puzzle();
    return puzzle ? maxHints(puzzle) : 0;
  });

  readonly notesEnabled = computed(() => {
    const puzzle = this.puzzle();
    return puzzle ? notesEnabled(puzzle) : false;
  });

  readonly revealedSymbols = computed(() =>
    (this.puzzle()?.hintOrder ?? []).slice(0, this.hintsUsed()),
  );

  readonly canHint = computed(() => !this.solved() && this.hintsUsed() < this.maxHints());

  start(type: PuzzleType, level: LevelId, seed: number): void {
    const session = this.persistence.loadSession();
    const resumed =
      session?.type === type && session.level === level && session.seed === seed ? session : null;

    this.puzzle.set(generateAny(type, level, seed));
    this.input.set('');
    this.notes.set(resumed?.notes ?? {});
    this.wrongCells.set([]);
    this.hintsUsed.set(resumed?.hintsUsed ?? 0);
    this.elapsedSeconds.set(resumed?.elapsedSeconds ?? 0);
    this.solved.set(resumed?.solved ?? false);
    this.wrongAnswers.set(0);
    this.target.set(this.puzzle()?.kind === 'kreuzzahl' ? this.nextBlank(-1) : 'answer');
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
      current.length >= MAX_INPUT_LENGTH
        ? current
        : current === '0'
          ? String(digit)
          : current + digit,
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
    if (puzzle.kind === 'kreuzzahl') {
      // The confirm key only moves on; a full grid is checked automatically.
      const current = this.target();
      this.target.set(this.nextBlank(typeof current === 'number' ? current : -1));
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
      this.finishSolved();
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
        this.target.set(this.puzzle()?.kind === 'kreuzzahl' ? this.nextBlank(target) : 'answer');
      }
      this.checkCells();
      this.saveSession();
    }
  }

  private editTarget(change: (current: string) => string): void {
    const target = this.target();
    if (target === 'answer') {
      this.input.update(change);
    } else {
      this.notes.update((notes) => ({ ...notes, [target]: change(notes[target] ?? '') }));
      this.wrongCells.set([]);
      this.checkCells();
      this.saveSession();
    }
  }

  private finishSolved(): void {
    const puzzle = this.puzzle();
    if (!puzzle || this.solved()) {
      return;
    }
    this.solved.set(true);
    const type: PuzzleType = puzzle.kind;
    const updated = this.persistence.recordSolved(
      type,
      puzzle.level,
      this.elapsedSeconds(),
      this.hintsUsed(),
    );
    this.stats.update((all) => ({ ...all, [type]: updated }));
    this.saveSession();
  }

  /** Kreuzzahl: once every blank holds a number, solve the puzzle or mark the wrong cells. */
  private checkCells(): void {
    const puzzle = this.puzzle();
    if (puzzle?.kind !== 'kreuzzahl' || this.solved()) {
      return;
    }
    const revealed = this.revealedSymbols();
    const blanks = blankCells(puzzle);
    const entries = this.notes();
    if (blanks.some((cell) => !revealed.includes(cell) && !entries[cell])) {
      return;
    }
    const wrong = blanks.filter(
      (cell) => !revealed.includes(cell) && Number(entries[cell]) !== puzzle.values[cell],
    );
    if (wrong.length === 0) {
      this.finishSolved();
    } else {
      this.wrongCells.set(wrong);
      this.wrongAnswers.update((count) => count + 1);
    }
  }

  /** Next blank cell after `after` that no hint has filled in yet, wrapping around. */
  private nextBlank(after: number): InputTarget {
    const puzzle = this.puzzle();
    if (puzzle?.kind !== 'kreuzzahl') {
      return 'answer';
    }
    const revealed = this.revealedSymbols();
    const open = blankCells(puzzle).filter((cell) => !revealed.includes(cell));
    return open.find((cell) => cell > after) ?? open[0] ?? 'answer';
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
        type: puzzle.kind,
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
