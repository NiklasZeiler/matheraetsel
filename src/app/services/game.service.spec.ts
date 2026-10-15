import { TestBed } from '@angular/core/testing';
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
});
