import { Component, computed, input, output } from '@angular/core';
import { SudokuPuzzle, columnOf, conflictCells, peersOf, rowOf } from '../../core/sudoku';

interface SudokuCell {
  cell: number;
  text: string;
  /** Blank cells the player can select. */
  editable: boolean;
  revealed: boolean;
  conflict: boolean;
  wrong: boolean;
  active: boolean;
  /** Shares a row, column or box with the selected cell. */
  peer: boolean;
  /** Holds the same digit as the selected cell. */
  same: boolean;
  /** Pencil marks laid out on a small grid: the digit if marked, otherwise empty. */
  marks: string[];
  boxRight: boolean;
  boxBottom: boolean;
}

@Component({
  selector: 'app-sudoku-view',
  templateUrl: './sudoku-view.html',
  styleUrl: './sudoku-view.scss',
})
export class SudokuView {
  readonly puzzle = input.required<SudokuPuzzle>();
  /** The digit typed per cell index. */
  readonly entries = input<Record<number, string>>({});
  /** Pencil marks per cell index, e.g. "135". */
  readonly marks = input<Record<number, string>>({});
  /** Cells filled in by a hint. */
  readonly revealed = input<readonly number[]>([]);
  readonly wrong = input<readonly number[]>([]);
  readonly active = input<number | 'answer'>('answer');
  readonly cellSelect = output<number>();

  protected readonly markColumns = computed(() => (this.puzzle().size === 4 ? 2 : 3));

  private readonly digits = computed(() => {
    const puzzle = this.puzzle();
    return puzzle.values.map((value, cell) => {
      if (puzzle.given[cell] || this.revealed().includes(cell)) {
        return value;
      }
      return Number(this.entries()[cell] ?? 0);
    });
  });

  protected readonly cells = computed<SudokuCell[]>(() => {
    const puzzle = this.puzzle();
    const digits = this.digits();
    const conflicts = new Set(conflictCells(puzzle, digits));
    const active = this.active();
    const peers = new Set(typeof active === 'number' ? peersOf(puzzle, active) : []);
    const activeDigit = typeof active === 'number' ? digits[active] : 0;

    return puzzle.values.map((_, cell) => {
      const revealed = !puzzle.given[cell] && this.revealed().includes(cell);
      const editable = !puzzle.given[cell] && !revealed;
      const marked = this.marks()[cell] ?? '';
      return {
        cell,
        text: digits[cell] > 0 ? String(digits[cell]) : '',
        editable,
        revealed,
        conflict: conflicts.has(cell),
        wrong: editable && this.wrong().includes(cell),
        active: active === cell,
        peer: peers.has(cell),
        same: activeDigit > 0 && digits[cell] === activeDigit && active !== cell,
        marks:
          digits[cell] > 0
            ? []
            : Array.from({ length: puzzle.size }, (_, index) =>
                marked.includes(String(index + 1)) ? String(index + 1) : '',
              ),
        boxRight:
          (columnOf(puzzle, cell) + 1) % puzzle.boxCols === 0 &&
          columnOf(puzzle, cell) < puzzle.size - 1,
        boxBottom:
          (rowOf(puzzle, cell) + 1) % puzzle.boxRows === 0 && rowOf(puzzle, cell) < puzzle.size - 1,
      };
    });
  });
}
