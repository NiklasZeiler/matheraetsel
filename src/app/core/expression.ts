export type Operator = '+' | '-' | '*' | '/';

export interface SymbolLeaf {
  kind: 'symbol';
  symbol: number;
}

export interface BinaryNode {
  kind: 'binary';
  operator: Operator;
  left: Expression;
  right: Expression;
}

export type Expression = SymbolLeaf | BinaryNode;

export type Token =
  | { kind: 'symbol'; symbol: number }
  | { kind: 'operator'; operator: Operator }
  | { kind: 'open' }
  | { kind: 'close' };

const PRECEDENCE: Record<Operator, number> = { '+': 1, '-': 1, '*': 2, '/': 2 };

export const OPERATOR_LABEL: Record<Operator, string> = {
  '+': '+',
  '-': '−',
  '*': '•',
  '/': ':',
};

export function symbolLeaf(symbol: number): SymbolLeaf {
  return { kind: 'symbol', symbol };
}

export function binary(operator: Operator, left: Expression, right: Expression): BinaryNode {
  return { kind: 'binary', operator, left, right };
}

/**
 * Evaluates with school-math rules: every intermediate result must be a whole number
 * between 1 and `limit`. Returns null when a symbol is unknown or a rule is violated.
 */
export function evaluate(
  expression: Expression,
  values: readonly (number | undefined)[],
  limit: number,
): number | null {
  if (expression.kind === 'symbol') {
    return values[expression.symbol] ?? null;
  }
  const left = evaluate(expression.left, values, limit);
  const right = evaluate(expression.right, values, limit);
  if (left === null || right === null) {
    return null;
  }
  let result: number;
  switch (expression.operator) {
    case '+':
      result = left + right;
      break;
    case '-':
      result = left - right;
      break;
    case '*':
      result = left * right;
      break;
    case '/':
      if (left % right !== 0) {
        return null;
      }
      result = left / right;
      break;
  }
  return result >= 1 && result <= limit ? result : null;
}

/** Symbols in reading order, one entry per occurrence. */
export function symbolOccurrences(expression: Expression): number[] {
  if (expression.kind === 'symbol') {
    return [expression.symbol];
  }
  return [...symbolOccurrences(expression.left), ...symbolOccurrences(expression.right)];
}

export function distinctSymbols(expression: Expression): number[] {
  return [...new Set(symbolOccurrences(expression))];
}

function needsParentheses(child: Expression, parent: Operator, side: 'left' | 'right'): boolean {
  if (child.kind === 'symbol') {
    return false;
  }
  const childPrecedence = PRECEDENCE[child.operator];
  const parentPrecedence = PRECEDENCE[parent];
  return (
    childPrecedence < parentPrecedence || (side === 'right' && childPrecedence === parentPrecedence)
  );
}

function wrapped(expression: Expression, parent: Operator, side: 'left' | 'right'): Token[] {
  const tokens = toTokens(expression);
  return needsParentheses(expression, parent, side)
    ? [{ kind: 'open' }, ...tokens, { kind: 'close' }]
    : tokens;
}

export function toTokens(expression: Expression): Token[] {
  if (expression.kind === 'symbol') {
    return [{ kind: 'symbol', symbol: expression.symbol }];
  }
  return [
    ...wrapped(expression.left, expression.operator, 'left'),
    { kind: 'operator', operator: expression.operator },
    ...wrapped(expression.right, expression.operator, 'right'),
  ];
}

export type GroupedToken = Token | { kind: 'group'; symbol: number; count: number };

/**
 * Display helper: turns "a + a + a" into one group (shown as "aaa"). Only runs that form a
 * complete sum term are grouped, so "b + a • a" or "b - a + a" keep their plus signs.
 */
export function groupRepeatedSymbols(tokens: readonly Token[]): GroupedToken[] {
  const grouped: GroupedToken[] = [];
  let index = 0;
  while (index < tokens.length) {
    const token = tokens[index];
    if (token.kind === 'symbol') {
      let last = index;
      while (isPlusThenSymbol(tokens, last, token.symbol)) {
        last += 2;
      }
      const before = tokens[index - 1];
      const after = tokens[last + 1];
      const startsTerm =
        !before ||
        before.kind === 'open' ||
        (before.kind === 'operator' && before.operator === '+');
      const endsTerm =
        !after ||
        after.kind === 'close' ||
        (after.kind === 'operator' && (after.operator === '+' || after.operator === '-'));
      if (last > index && startsTerm && endsTerm) {
        grouped.push({ kind: 'group', symbol: token.symbol, count: (last - index) / 2 + 1 });
        index = last + 1;
        continue;
      }
    }
    grouped.push(token);
    index++;
  }
  return grouped;
}

function isPlusThenSymbol(tokens: readonly Token[], position: number, symbol: number): boolean {
  const operator = tokens[position + 1];
  const next = tokens[position + 2];
  return (
    operator?.kind === 'operator' &&
    operator.operator === '+' &&
    next?.kind === 'symbol' &&
    next.symbol === symbol
  );
}

export function hasParentheses(expression: Expression): boolean {
  return toTokens(expression).some((token) => token.kind === 'open');
}

/** True for shapes like a + (b - c) where the brackets never change the result. */
export function hasRedundantParentheses(expression: Expression): boolean {
  if (expression.kind === 'symbol') {
    return false;
  }
  const rightIsSamePrecedence =
    expression.right.kind === 'binary' &&
    PRECEDENCE[expression.right.operator] === PRECEDENCE[expression.operator];
  const associative = expression.operator === '+' || expression.operator === '*';
  return (
    (associative && rightIsSamePrecedence) ||
    hasRedundantParentheses(expression.left) ||
    hasRedundantParentheses(expression.right)
  );
}

/** True when a symbol on the right of "-" or ":" also appears on its left, e.g. a + b - a. */
export function hasCancellingSymbols(expression: Expression): boolean {
  if (expression.kind === 'symbol') {
    return false;
  }
  if (expression.operator === '-' || expression.operator === '/') {
    const rightSymbols = new Set(symbolOccurrences(expression.right));
    if (symbolOccurrences(expression.left).some((symbol) => rightSymbols.has(symbol))) {
      return true;
    }
  }
  return hasCancellingSymbols(expression.left) || hasCancellingSymbols(expression.right);
}

export function describe(expression: Expression, symbols: readonly string[]): string {
  return toTokens(expression)
    .map((token) => {
      switch (token.kind) {
        case 'symbol':
          return symbols[token.symbol];
        case 'operator':
          return OPERATOR_LABEL[token.operator];
        case 'open':
          return '(';
        case 'close':
          return ')';
      }
    })
    .join(' ')
    .replace(/\( /g, '(')
    .replace(/ \)/g, ')');
}
