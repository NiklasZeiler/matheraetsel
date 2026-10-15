import { Component, computed, input } from '@angular/core';
import { Pan } from '../../core/waage';

@Component({
  selector: 'app-pan-view',
  templateUrl: './pan-view.html',
  styleUrl: './pan-view.scss',
})
export class PanView {
  readonly pan = input.required<Pan>();
  readonly symbols = input.required<readonly string[]>();
  readonly pictures = computed(() => this.pan().pictures.map((symbol) => this.symbols()[symbol]));
  protected readonly label = computed(() =>
    [...this.pictures(), ...this.pan().weights.map((weight) => `${weight}`)].join(' '),
  );
}
