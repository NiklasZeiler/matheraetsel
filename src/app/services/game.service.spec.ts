import { TestBed } from '@angular/core/testing';
import { dailySeed, dayKey } from '../core/daily';
import { SudokuPuzzle, peersOf } from '../core/sudoku';
import { GameService } from './game.service';

describe('GameService notes', () => {
  let game: GameService;

  beforeEach(() => {
    localStorage.clear();
    game = TestBed.inject(GameService);
    game.start('gleichung', 'leicht', 1);
  });

  afterEach(() => game.stop());

  it('writes digits to the selected note instead of the answer', () => {
    game.selectTarget(0);
    game.pressDigit(4);
    game.pressDigit(2);

    expect(game.notes()[0]).toBe('42');
    expect(game.input()).toBe('');
  });

  it('returns to the answer field when confirming a note', () => {
    game.selectTarget(1);
    game.submit();

    expect(game.target()).toBe('answer');
    expect(game.solved()).toBe(false);
  });

  it('does not allow editing a revealed symbol', () => {
    game.useHint();
    const revealed = game.revealedSymbols()[0];
    game.selectTarget(revealed);

    expect(game.target()).toBe('answer');
  });

  it('keeps notes when the puzzle is resumed', () => {
    game.selectTarget(0);
    game.pressDigit(7);
    game.stop();

    game.start('gleichung', 'leicht', 1);

    expect(game.notes()[0]).toBe('7');
  });

  it('offers no notes and sentence hints in ratio waage puzzles', () => {
    game.start('waage', 'leicht', 1);

    expect(game.notesEnabled()).toBe(false);
    expect(game.maxHints()).toBe(1);
  });

  it('keeps notes for numbered waage puzzles and tracks stats per type', () => {
    game.start('waage', 'schwer', 1);
    expect(game.notesEnabled()).toBe(true);

    const puzzle = game.puzzle();
    if (puzzle) {
      for (const digit of String(puzzle.question.answer)) {
        game.pressDigit(Number(digit));
      }
    }
    game.submit();

    expect(game.solved()).toBe(true);
    expect(game.stats().waage.schwer.solved).toBe(1);
    expect(game.stats().gleichung.schwer.solved).toBe(0);
  });

  it('gives number mobiles sentence hints and no notes', () => {
    game.start('mobile', 'mittel', 3);

    expect(game.notesEnabled()).toBe(false);
    expect(game.maxHints()).toBeGreaterThanOrEqual(1);
  });

  it('solves a picture mobile by entering the answer', () => {
    game.start('mobile', 'schwer', 3);
    const puzzle = game.puzzle();
    expect(game.notesEnabled()).toBe(true);

    if (puzzle) {
      for (const digit of String(puzzle.question.answer)) {
        game.pressDigit(Number(digit));
      }
    }
    game.submit();

    expect(game.solved()).toBe(true);
    expect(game.stats().mobile.schwer.solved).toBe(1);
  });

  describe('kreuzzahl', () => {
    function blanks(): { cell: number; value: number }[] {
      const puzzle = game.puzzle();
      if (puzzle?.kind !== 'kreuzzahl') {
        throw new Error('expected a kreuzzahl puzzle');
      }
      return puzzle.given.flatMap((given, cell) =>
        given ? [] : [{ cell, value: puzzle.values[cell] }],
      );
    }

    function enter(cell: number, value: number): void {
      game.selectTarget(cell);
      for (const digit of String(value)) {
        game.pressDigit(Number(digit));
      }
    }

    beforeEach(() => game.start('kreuzzahl', 'schwer', 5));

    it('starts on the first blank and offers no notes section', () => {
      expect(typeof game.target()).toBe('number');
      expect(game.notesEnabled()).toBe(false);
    });

    it('is solved automatically once every blank is right', () => {
      const all = blanks();
      all.slice(0, -1).forEach(({ cell, value }) => enter(cell, value));
      expect(game.solved()).toBe(false);

      const last = all[all.length - 1];
      enter(last.cell, last.value);

      expect(game.solved()).toBe(true);
      expect(game.stats().kreuzzahl.schwer.solved).toBe(1);
    });

    it('marks wrong cells when the grid is full and clears them on edit', () => {
      const all = blanks();
      all.forEach(({ cell, value }, index) => enter(cell, index === 0 ? value + 1 : value));

      expect(game.solved()).toBe(false);
      expect(game.wrongCells()).toEqual([all[0].cell]);

      game.selectTarget(all[0].cell);
      game.deleteDigit();
      expect(game.wrongCells()).toEqual([]);
    });

    it('fills a blank with the next hint and never solves the puzzle by hints alone', () => {
      const max = game.maxHints();
      for (let hint = 0; hint < max; hint++) {
        game.useHint();
      }

      expect(game.revealedSymbols()).toHaveLength(max);
      expect(game.solved()).toBe(false);
      expect(game.canHint()).toBe(false);
    });
  });

  describe('zahlenschloss', () => {
    function typeCode(code: string): void {
      for (const digit of code) {
        game.pressDigit(Number(digit));
      }
    }

    it('solves once every slot holds the right digit', () => {
      game.start('zahlenschloss', 'leicht', 5);
      const puzzle = game.puzzle();
      if (puzzle?.kind !== 'zahlenschloss') {
        throw new Error('expected a lock');
      }
      const hinted = game.revealedSymbols();
      expect(hinted).toEqual([]);

      typeCode(puzzle.question.answer);

      expect(game.solved()).toBe(true);
    });

    it('clears the entry after a wrong code without marking any slot', () => {
      game.start('zahlenschloss', 'leicht', 5);
      const puzzle = game.puzzle();
      if (puzzle?.kind !== 'zahlenschloss') {
        throw new Error('expected a lock');
      }
      const wrong = puzzle.code.map((digit) => (digit + 1) % 10).join('');

      typeCode(wrong);

      expect(game.solved()).toBe(false);
      expect(game.wrongAnswers()).toBe(1);
      expect(game.notes()).toEqual({});
      expect(game.wrongCells()).toEqual([]);
      expect(game.target()).toBe(0);
    });

    it('fills a selected slot and moves on to the next empty one', () => {
      game.start('zahlenschloss', 'schwer', 5);
      game.selectTarget(2);
      game.pressDigit(7);

      expect(game.notes()[2]).toBe('7');
      expect(game.target()).toBe(3);
    });

    it('reveals a fixed position with a hint and needs only the other digits', () => {
      game.start('zahlenschloss', 'leicht', 5);
      const puzzle = game.puzzle();
      if (puzzle?.kind !== 'zahlenschloss') {
        throw new Error('expected a lock');
      }
      expect(game.maxHints()).toBe(1);

      game.useHint();
      const revealed = game.revealedSymbols()[0];
      expect(revealed).toBe(puzzle.hintOrder[0]);
      expect(game.target()).not.toBe(revealed);

      const rest = puzzle.code.flatMap((digit, position) => (position === revealed ? [] : [digit]));
      typeCode(rest.join(''));

      expect(game.solved()).toBe(true);
      expect(game.canHint()).toBe(false);
    });

    it('keeps crossed-out digits and lets the player undo them', () => {
      game.start('zahlenschloss', 'mittel', 5);
      game.toggleExcluded(3);
      game.toggleExcluded(8);
      expect(Object.keys(game.marks())).toEqual(['3', '8']);

      game.toggleExcluded(3);
      expect(Object.keys(game.marks())).toEqual(['8']);
    });

    it('deletes the last typed digit', () => {
      game.start('zahlenschloss', 'schwer', 5);
      game.pressDigit(1);
      game.pressDigit(2);
      game.deleteDigit();

      expect(game.notes()).toEqual({ 0: '1' });
      expect(game.target()).toBe(1);
    });
  });

  describe('progress', () => {
    function solveCurrent(): void {
      const puzzle = game.puzzle();
      if (puzzle) {
        for (const digit of String(puzzle.question.answer)) {
          game.pressDigit(Number(digit));
        }
      }
      game.submit();
    }

    it('awards XP once and keeps it after a reload', () => {
      game.start('waage', 'schwer', 4242);
      solveCurrent();

      expect(game.lastAward()?.total).toBe(53);
      expect(game.progress().totalXp).toBe(53);

      game.start('waage', 'schwer', 4242);
      expect(game.lastAward()).toBeNull();
      expect(JSON.parse(localStorage.getItem('raetsel.progress.v1') ?? '{}').totalXp).toBe(53);
    });

    it('adds the daily bonus on the daily puzzle', () => {
      game.start('waage', 'leicht', dailySeed(dayKey(), 'waage', 'leicht'));
      solveCurrent();

      expect(game.lastAward()?.dailyBonus).toBe(25);
      expect(game.progress().bestStreak).toBe(1);
    });
  });

  describe('daily puzzles', () => {
    function solveCurrent(): void {
      const puzzle = game.puzzle();
      if (puzzle) {
        for (const digit of String(puzzle.question.answer)) {
          game.pressDigit(Number(digit));
        }
      }
      game.submit();
    }

    it("recognises today's daily puzzle and counts the streak after solving it", () => {
      game.start('waage', 'schwer', dailySeed(dayKey(), 'waage', 'schwer'));
      expect(game.isDaily()).toBe(true);
      expect(game.streak()).toBe(0);

      solveCurrent();

      expect(game.solved()).toBe(true);
      expect(game.streak()).toBe(1);
      expect(game.daily()[dayKey()]).toContain('waage:schwer');
    });

    it('does not count an ordinary puzzle as daily', () => {
      game.start('waage', 'schwer', 12345);
      expect(game.isDaily()).toBe(false);

      solveCurrent();

      expect(game.streak()).toBe(0);
    });
  });

  describe('pyramide', () => {
    it('is solved when all blanks hold the right numbers', () => {
      game.start('pyramide', 'mittel', 4);
      const puzzle = game.puzzle();
      if (puzzle?.kind !== 'pyramide') {
        throw new Error('expected a pyramid');
      }
      puzzle.given.forEach((given, cell) => {
        if (!given) {
          game.selectTarget(cell);
          for (const digit of String(puzzle.values[cell])) {
            game.pressDigit(Number(digit));
          }
        }
      });

      expect(game.solved()).toBe(true);
      expect(game.stats().pyramide.mittel.solved).toBe(1);
    });
  });

  describe('sudoku', () => {
    function setup(): { cells: number[]; values: number[]; puzzle: SudokuPuzzle } {
      game.start('sudoku', 'leicht', 3);
      const puzzle = game.puzzle();
      if (puzzle?.kind !== 'sudoku') {
        throw new Error('expected a sudoku');
      }
      const cells = puzzle.given.flatMap((given, cell) => (given ? [] : [cell]));
      return { cells, values: puzzle.values, puzzle };
    }

    it('starts on a blank cell and has no per-picture notes', () => {
      const { cells } = setup();
      expect(cells).toContain(game.target());
      expect(game.notesEnabled()).toBe(false);
    });

    it('sets pencil marks in pencil mode and clears them when a digit is placed', () => {
      const { cells } = setup();
      const cell = cells[0];
      game.selectTarget(cell);
      game.togglePencil();
      game.pressDigit(2);
      game.pressDigit(3);
      expect(game.marks()[cell]).toBe('23');

      game.pressDigit(2);
      expect(game.marks()[cell]).toBe('3');

      game.togglePencil();
      game.pressDigit(4);
      expect(game.notes()[cell]).toBe('4');
      expect(game.marks()[cell]).toBe('');
    });

    it('removes a placed digit from the pencil marks of its peers', () => {
      const { cells, puzzle } = setup();
      const [first, second] = cells;
      game.selectTarget(second);
      game.togglePencil();
      game.pressDigit(1);
      game.pressDigit(2);
      game.togglePencil();

      game.selectTarget(first);
      game.pressDigit(1);

      const shareUnit = peersOf(puzzle, first).includes(second);
      expect(game.marks()[second]).toBe(shareUnit ? '2' : '12');
    });

    it('ignores digits larger than the grid', () => {
      const { cells } = setup();
      game.selectTarget(cells[0]);
      game.pressDigit(7);
      expect(game.notes()[cells[0]]).toBeUndefined();
    });

    it('deletes the digit first and the pencil marks afterwards', () => {
      const { cells } = setup();
      const cell = cells[0];
      game.selectTarget(cell);
      game.togglePencil();
      game.pressDigit(1);
      game.togglePencil();
      game.pressDigit(2);

      game.deleteDigit();
      expect(game.notes()[cell]).toBeUndefined();
      expect(game.marks()[cell]).toBe('');

      game.togglePencil();
      game.pressDigit(3);
      game.deleteDigit();
      expect(game.marks()[cell]).toBeUndefined();
    });

    it('is solved once every blank holds the right digit', () => {
      const { cells, values } = setup();
      for (const cell of cells) {
        game.selectTarget(cell);
        game.pressDigit(values[cell]);
      }

      expect(game.solved()).toBe(true);
      expect(game.stats().sudoku.leicht.solved).toBe(1);
    });

    it('marks wrong cells after a full but wrong grid and keeps hints below the blank count', () => {
      const { cells, values } = setup();
      cells.forEach((cell, index) => {
        game.selectTarget(cell);
        const wrong = (values[cell] % 4) + 1;
        game.pressDigit(index === 0 ? wrong : values[cell]);
      });

      expect(game.solved()).toBe(false);
      expect(game.wrongCells()).toEqual([cells[0]]);
      expect(game.maxHints()).toBeLessThan(cells.length);
    });
  });

  describe('hints in cell puzzles', () => {
    function cellPuzzle(): { blanks: number[]; values: number[] } {
      const puzzle = game.puzzle();
      if (puzzle?.kind !== 'sudoku') {
        throw new Error('expected a sudoku');
      }
      return {
        blanks: puzzle.given.flatMap((given, cell) => (given ? [] : [cell])),
        values: puzzle.values,
      };
    }

    beforeEach(() => game.start('sudoku', 'mittel', 7));

    it('skips cells that already hold the right number', () => {
      const { blanks, values } = cellPuzzle();
      const puzzle = game.puzzle();
      const firstInOrder = puzzle?.hintOrder[0] ?? blanks[0];
      game.selectTarget(blanks.find((cell) => cell !== firstInOrder) ?? blanks[0]);
      game.selectTarget(firstInOrder);
      game.pressDigit(values[firstInOrder]);

      game.useHint();

      expect(game.revealedSymbols()).toHaveLength(1);
      expect(game.revealedSymbols()[0]).not.toBe(firstInOrder);
      expect(blanks).toContain(game.revealedSymbols()[0]);
    });

    it('reveals the selected cell when it is empty or wrong', () => {
      const { blanks, values } = cellPuzzle();
      const chosen = blanks[blanks.length - 1];
      game.selectTarget(chosen);
      game.pressDigit((values[chosen] % 6) + 1);

      game.useHint();

      expect(game.revealedSymbols()).toEqual([chosen]);
      expect(game.notes()[chosen]).toBeUndefined();
    });

    it('offers no hint when every remaining blank already holds the right number', () => {
      const { blanks, values } = cellPuzzle();
      blanks.slice(0, -1).forEach((cell) => {
        game.selectTarget(cell);
        game.pressDigit(values[cell]);
      });
      const last = blanks[blanks.length - 1];
      game.selectTarget(last);
      game.pressDigit((values[last] % 6) + 1);

      expect(game.canHint()).toBe(true);
      game.useHint();

      expect(game.revealedSymbols()).toEqual([last]);
    });

    it('remembers revealed cells after the puzzle is reopened', () => {
      game.useHint();
      const revealed = [...game.revealedSymbols()];
      game.stop();

      game.start('sudoku', 'mittel', 7);

      expect(game.revealedSymbols()).toEqual(revealed);
      expect(game.hintsUsed()).toBe(1);
    });
  });
});
