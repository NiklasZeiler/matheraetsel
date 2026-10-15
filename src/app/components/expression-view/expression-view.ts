import { Component, computed, input } from '@angular/core';
import {
  Expression,
  OPERATOR_LABEL,
  describe,
  groupRepeatedSymbols,
  toTokens,
} from '../../core/expression';

interface DisplayToken {
  text: string;
  kind: 'symbol' | 'group' | 'operator' | 'bracket';
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
  /** Writes "a + a" as "aa" so players must read the repeated pictures as a count. */
  readonly groupRepeats = input(false);

  protected readonly tokens = computed<DisplayToken[]>(() =>
    this.visibleTokens().map((token): DisplayToken => {
      switch (token.kind) {
        case 'group':
          return { text: this.symbols()[token.symbol].repeat(token.count), kind: 'group' };
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

  private readonly visibleTokens = computed(() => {
    const tokens = toTokens(this.expression());
    return this.groupRepeats() ? groupRepeatedSymbols(tokens) : tokens;
  });

  protected readonly label = computed(
    () => `${describe(this.expression(), this.symbols())} = ${this.result() ?? 'gesucht'}`,
  );
}
