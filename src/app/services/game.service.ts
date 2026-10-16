import { Injectable, computed, inject, signal } from '@angular/core';
import { generateAny } from '../core/generate-any';
import { maxHints, notesEnabled } from '../core/hints';
import { blankCells, isCellPuzzle } from '../core/cells';
import { peersOf } from '../core/sudoku';
import { DailyState, dailySeed, dailyStreak, dayKey } from '../core/daily';
import { LevelId } from '../core/levels';
import { AnyPuzzle, PuzzleType } from '../core/puzzle';
import type { SudokuPuzzle } from '../core/sudoku';
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
  /** Sudoku pencil marks per cell, e.g. "135". */
  readonly marks = signal<Record<number, string>>({});
  /** Sudoku: digits set pencil marks instead of the cell value. */
  readonly pencilMode = signal(false);
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
    pyramide: this.persistence.loadStats('pyramide'),
    sudoku: this.persistence.loadStats('sudoku'),
  });

  /** Completed daily puzzles per day (stored locally). */
  readonly daily = signal<DailyState>(this.persistence.loadDaily());
  readonly streak = computed(() => dailyStreak(this.daily(), dayKey()));
  /** True while playing today's daily puzzle of this type and level. */
  readonly isDaily = computed(() => {
    const puzzle = this.puzzle();
    return puzzle ? puzzle.seed === dailySeed(dayKey(), puzzle.kind, puzzle.level) : false;
  });

  readonly maxHints = computed(() => {
    const puzzle = this.puzzle();
    return puzzle ? maxHints(puzzle) : 0;
  });

  readonly notesEnabled = computed(() => {
    const puzzle = this.puzzle();
    return puzzle ? notesEnabled(puzzle) : false;
  });

  /** Cell puzzles: the cells a hint filled in. They are chosen when the hint is used. */
  private readonly hintedCells = signal<number[]>([]);

  /**
   * What the hints revealed so far: cell indices in cell puzzles, otherwise the first entries
   * of the puzzle's fixed hint order (symbols or sub-mobile ids).
   */
  readonly revealedSymbols = computed(() => {
    const puzzle = this.puzzle();
    if (!puzzle) {
      return [];
    }
    return isCellPuzzle(puzzle) ? this.hintedCells() : puzzle.hintOrder.slice(0, this.hintsUsed());
  });

  /** Blank cells that hold nothing or a wrong number yet: the only ones a hint is worth for. */
  private readonly hintCandidates = computed(() => {
    const puzzle = this.puzzle();
    if (!puzzle || !isCellPuzzle(puzzle)) {
      return [];
    }
    const revealed = this.hintedCells();
    const entries = this.notes();
    return blankCells(puzzle).filter(
      (cell) => !revealed.includes(cell) && Number(entries[cell] ?? 0) !== puzzle.values[cell],
    );
  });

  readonly canHint = computed(() => {
    const puzzle = this.puzzle();
    const hasTarget = puzzle && isCellPuzzle(puzzle) ? this.hintCandidates().length > 0 : true;
    return !this.solved() && this.hintsUsed() < this.maxHints() && hasTarget;
  });

  start(type: PuzzleType, level: LevelId, seed: number): void {
    const session = this.persistence.loadSession();
    const resumed =
      session?.type === type && session.level === level && session.seed === seed ? session : null;

    this.puzzle.set(generateAny(type, level, seed));
    this.input.set('');
    this.notes.set(resumed?.notes ?? {});
    this.marks.set(resumed?.marks ?? {});
    this.pencilMode.set(false);
    this.wrongCells.set([]);
    this.hintsUsed.set(resumed?.hintsUsed ?? 0);
    const puzzle = this.puzzle();
    // Sessions saved before hints were chosen per cell fall back to the fixed order.
    this.hintedCells.set(
      resumed?.hinted ?? (puzzle ? puzzle.hintOrder.slice(0, resumed?.hintsUsed ?? 0) : []),
    );
    this.elapsedSeconds.set(resumed?.elapsedSeconds ?? 0);
    this.solved.set(resumed?.solved ?? false);
    this.wrongAnswers.set(0);
    this.target.set(this.isCells() ? this.nextBlank(-1) : 'answer');
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

  togglePencil(): void {
    this.pencilMode.update((on) => !on);
  }

  pressDigit(digit: number): void {
    if (this.solved()) {
      return;
    }
    const puzzle = this.puzzle();
    if (puzzle?.kind === 'sudoku') {
      this.pressSudokuDigit(puzzle, digit);
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
    if (this.puzzle()?.kind === 'sudoku') {
      this.deleteSudokuDigit();
      return;
    }
    this.editTarget((current) => current.slice(0, -1));
  }

  submit(): void {
    const puzzle = this.puzzle();
    if (!puzzle || this.solved()) {
      return;
    }
    if (isCellPuzzle(puzzle)) {
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
      if (this.isCells()) {
        this.revealHintCell();
      }
      const target = this.target();
      if (typeof target === 'number' && this.revealedSymbols().includes(target)) {
        this.target.set(this.isCells() ? this.nextBlank(target) : 'answer');
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

  /**
   * Fills in one blank that is empty or wrong: the selected one if it qualifies, otherwise the
   * next one in the puzzle's deduction order, otherwise the first remaining.
   */
  private revealHintCell(): void {
    const puzzle = this.puzzle();
    const candidates = this.hintCandidates();
    if (!puzzle || !isCellPuzzle(puzzle) || candidates.length === 0) {
      return;
    }
    const selected = this.target();
    const cell =
      typeof selected === 'number' && candidates.includes(selected)
        ? selected
        : (puzzle.hintOrder.find((next) => candidates.includes(next)) ?? candidates[0]);

    this.hintedCells.update((cells) => [...cells, cell]);
    this.notes.update(({ [cell]: _removed, ...rest }) => rest);
    this.marks.update(({ [cell]: _removed, ...rest }) => rest);
    this.wrongCells.update((cells) => cells.filter((wrong) => wrong !== cell));
  }

  private pressSudokuDigit(puzzle: SudokuPuzzle, digit: number): void {
    const cell = this.target();
    if (typeof cell !== 'number' || digit < 1 || digit > puzzle.size) {
      return;
    }
    if (this.pencilMode()) {
      if (this.notes()[cell]) {
        return;
      }
      const current = this.marks()[cell] ?? '';
      const next = current.includes(String(digit))
        ? current.replace(String(digit), '')
        : [...current, String(digit)].sort().join('');
      this.marks.update((all) => ({ ...all, [cell]: next }));
    } else {
      this.notes.update((all) => ({ ...all, [cell]: String(digit) }));
      // The digit is placed: drop its pencil marks and the same digit from peers' marks.
      const peers = new Set(peersOf(puzzle, cell));
      this.marks.update((all) =>
        Object.fromEntries(
          Object.entries(all).map(([key, text]) => [
            key,
            Number(key) === cell
              ? ''
              : peers.has(Number(key))
                ? text.replace(String(digit), '')
                : text,
          ]),
        ),
      );
      this.wrongCells.set([]);
      this.checkCells();
    }
    this.saveSession();
  }

  private deleteSudokuDigit(): void {
    const cell = this.target();
    if (typeof cell !== 'number') {
      return;
    }
    if (this.notes()[cell]) {
      this.notes.update(({ [cell]: _removed, ...rest }) => rest);
      this.wrongCells.set([]);
    } else {
      this.marks.update(({ [cell]: _removed, ...rest }) => rest);
    }
    this.saveSession();
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
    if (this.isDaily()) {
      this.daily.set(this.persistence.recordDaily(dayKey(), type, puzzle.level));
    }
    this.saveSession();
  }

  private isCells(): boolean {
    const puzzle = this.puzzle();
    return puzzle ? isCellPuzzle(puzzle) : false;
  }

  /** Kreuzzahl: once every blank holds a number, solve the puzzle or mark the wrong cells. */
  private checkCells(): void {
    const puzzle = this.puzzle();
    if (!puzzle || !isCellPuzzle(puzzle) || this.solved()) {
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
    if (!puzzle || !isCellPuzzle(puzzle)) {
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
        marks: this.marks(),
        hinted: this.hintedCells(),
      });
    }
  }
}
