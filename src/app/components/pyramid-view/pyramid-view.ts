import { Component, computed, input, output } from '@angular/core';
import { PyramidPuzzle, pyramidIndex } from '../../core/pyramid';

interface Stone {
  cell: number;
  text: string;
  editable: boolean;
  revealed: boolean;
  wrong: boolean;
  active: boolean;
}

@Component({
  selector: 'app-pyramid-view',
  templateUrl: './pyramid-view.html',
  styleUrl: './pyramid-view.scss',
})
export class PyramidView {
  readonly puzzle = input.required<PyramidPuzzle>();
  /** What the player typed per cell index. */
  readonly entries = input<Record<number, string>>({});
  /** Cells filled in by a hint. */
  readonly revealed = input<readonly number[]>([]);
  readonly wrong = input<readonly number[]>([]);
  readonly active = input<number | 'answer'>('answer');
  readonly cellSelect = output<number>();

  protected readonly rows = computed<Stone[][]>(() => {
    const puzzle = this.puzzle();
    return Array.from({ length: puzzle.rows }, (_, row) =>
      Array.from({ length: row + 1 }, (_, column) => this.stone(pyramidIndex(row, column))),
    );
  });

  private stone(cell: number): Stone {
    const puzzle = this.puzzle();
    const given = puzzle.given[cell];
    const revealed = !given && this.revealed().includes(cell);
    const editable = !given && !revealed;
    return {
      cell,
      text: given || revealed ? String(puzzle.values[cell]) : (this.entries()[cell] ?? ''),
      editable,
      revealed,
      wrong: editable && this.wrong().includes(cell),
      active: editable && this.active() === cell,
    };
  }
}
