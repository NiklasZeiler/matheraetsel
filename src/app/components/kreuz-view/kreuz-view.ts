import { Component, computed, input, output } from '@angular/core';
import { OPERATOR_LABEL } from '../../core/expression';
import { KreuzPuzzle } from '../../core/kreuzzahl';

type ItemKind = 'cell' | 'operator' | 'equals' | 'result' | 'empty';

interface GridItem {
  kind: ItemKind;
  text: string;
  cell: number;
  /** Blank cells the player can select. */
  editable: boolean;
  revealed: boolean;
  wrong: boolean;
  active: boolean;
}

/** The grid is laid out as rows of: cell, operator, cell, ..., "=", result. */
@Component({
  selector: 'app-kreuz-view',
  templateUrl: './kreuz-view.html',
  styleUrl: './kreuz-view.scss',
})
export class KreuzView {
  readonly puzzle = input.required<KreuzPuzzle>();
  /** What the player typed per cell index. */
  readonly entries = input<Record<number, string>>({});
  /** Cells filled in by a hint. */
  readonly revealed = input<readonly number[]>([]);
  readonly wrong = input<readonly number[]>([]);
  readonly active = input<number | 'answer'>('answer');
  readonly cellSelect = output<number>();

  protected readonly template = computed(() => {
    const size = this.puzzle().size;
    // Cells are wide, operators and equals signs narrow; the last column holds results.
    const tracks = Array.from({ length: 2 * size + 1 }, (_, index) =>
      index % 2 === 0 && index < 2 * size - 1 ? '3rem' : index === 2 * size ? '3rem' : '1.3rem',
    );
    return tracks.join(' ');
  });

  protected readonly items = computed<GridItem[]>(() => {
    const puzzle = this.puzzle();
    const size = puzzle.size;
    const last = 2 * size;
    const items: GridItem[] = [];
    const base = { cell: -1, editable: false, revealed: false, wrong: false, active: false };

    for (let row = 0; row <= last; row++) {
      for (let column = 0; column <= last; column++) {
        const rowIndex = row / 2;
        const columnIndex = column / 2;
        const rowIsCells = row % 2 === 0 && row < last;
        const columnIsCells = column % 2 === 0 && column < last;

        if (rowIsCells && columnIsCells) {
          items.push(this.cellItem(rowIndex * size + columnIndex));
        } else if (rowIsCells && column < last - 1) {
          const operator = puzzle.rowOperators[rowIndex][(column - 1) / 2];
          items.push({ ...base, kind: 'operator', text: OPERATOR_LABEL[operator] });
        } else if (rowIsCells && column === last - 1) {
          items.push({ ...base, kind: 'equals', text: '=' });
        } else if (rowIsCells && column === last) {
          items.push({ ...base, kind: 'result', text: String(puzzle.rowResults[rowIndex]) });
        } else if (row < last - 1 && columnIsCells) {
          const operator = puzzle.columnOperators[columnIndex][(row - 1) / 2];
          items.push({ ...base, kind: 'operator', text: OPERATOR_LABEL[operator] });
        } else if (row === last - 1 && columnIsCells) {
          items.push({ ...base, kind: 'equals', text: '=' });
        } else if (row === last && columnIsCells) {
          items.push({ ...base, kind: 'result', text: String(puzzle.columnResults[columnIndex]) });
        } else {
          items.push({ ...base, kind: 'empty', text: '' });
        }
      }
    }
    return items;
  });

  private cellItem(cell: number): GridItem {
    const puzzle = this.puzzle();
    if (puzzle.given[cell]) {
      return this.item(cell, String(puzzle.values[cell]), false, false);
    }
    if (this.revealed().includes(cell)) {
      return this.item(cell, String(puzzle.values[cell]), false, true);
    }
    return this.item(cell, this.entries()[cell] ?? '', true, false);
  }

  private item(cell: number, text: string, editable: boolean, revealed: boolean): GridItem {
    return {
      kind: 'cell',
      text,
      cell,
      editable,
      revealed,
      wrong: editable && this.wrong().includes(cell),
      active: editable && this.active() === cell,
    };
  }
}
