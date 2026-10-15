import { Component, computed, input } from '@angular/core';
import { Expression, OPERATOR_LABEL, describe, toTokens } from '../../core/expression';

interface DisplayToken {
  text: string;
  kind: 'symbol' | 'operator' | 'bracket';
}

@Component({
  selector: 'app-expression-view',
  templateUrl: './expression-view.html',
  styleUrl: './expression-view.scss',
})
export class ExpressionView {
  readonly expression = input.required<Expression>();
  readonly symbols = input.required<readonly string[]>();
  /** Shown after "="; a question mark when the result is what the player must find. */
  readonly result = input<number | null>(null);

  protected readonly tokens = computed<DisplayToken[]>(() =>
    toTokens(this.expression()).map((token): DisplayToken => {
      switch (token.kind) {
        case 'symbol':
          return { text: this.symbols()[token.symbol], kind: 'symbol' };
        case 'operator':
          return { text: OPERATOR_LABEL[token.operator], kind: 'operator' };
        case 'open':
          return { text: '(', kind: 'bracket' };
        case 'close':
          return { text: ')', kind: 'bracket' };
      }
    }),
  );

  protected readonly label = computed(
    () => `${describe(this.expression(), this.symbols())} = ${this.result() ?? 'gesucht'}`,
  );
}
