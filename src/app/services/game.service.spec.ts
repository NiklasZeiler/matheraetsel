import { TestBed } from '@angular/core/testing';
import { GameService } from './game.service';

describe('GameService notes', () => {
  let game: GameService;

  beforeEach(() => {
    localStorage.clear();
    game = TestBed.inject(GameService);
    game.start('leicht', 1);
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

    game.start('leicht', 1);

    expect(game.notes()[0]).toBe('7');
  });
});
