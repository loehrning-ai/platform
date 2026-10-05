// ─── Safe formula language for data-driven widgets ─────────────────
//
// Lesson JSON describes calculators, goals and verdicts as small formulas
// ("min(turnover * 0.07, 35000000)", "fpr_a - fpr_b < 0.02"). This module
// parses them into an AST and evaluates them against a scope. It never uses
// eval/Function, has no property access, no assignment and no loops, so an
// authoring mistake can produce a wrong number but never run code.
//
// Grammar (lowest to highest precedence):
//   ternary   := or ( "?" ternary ":" ternary )?
//   or        := and ( "||" and )*
//   and       := equality ( "&&" equality )*
//   equality  := compare ( ("==" | "!=") compare )*
//   compare   := additive ( ("<" | "<=" | ">" | ">=") additive )*
//   additive  := multiplicative ( ("+" | "-") multiplicative )*
//   multiplicative := power ( ("*" | "/" | "%") power )*
//   power     := unary ( "^" power )?
//   unary     := ("-" | "!" | "+") unary | primary
//   primary   := number | string | true | false | ident | ident "(" args ")" | "(" ternary ")"

export type ExpressionValue = number | string | boolean;
export type ExpressionScope = Readonly<Record<string, ExpressionValue>>;

export class ExpressionError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ExpressionError";
  }
}

type Token =
  | { readonly type: "num"; readonly value: number }
  | { readonly type: "str"; readonly value: string }
  | { readonly type: "ident"; readonly value: string }
  | { readonly type: "op"; readonly value: string };

type Node =
  | { readonly kind: "lit"; readonly value: ExpressionValue }
  | { readonly kind: "var"; readonly name: string }
  | { readonly kind: "unary"; readonly op: string; readonly arg: Node }
  | {
      readonly kind: "binary";
      readonly op: string;
      readonly left: Node;
      readonly right: Node;
    }
  | {
      readonly kind: "ternary";
      readonly test: Node;
      readonly then: Node;
      readonly otherwise: Node;
    }
  | { readonly kind: "call"; readonly name: string; readonly args: readonly Node[] };

const OPERATORS = [
  "&&",
  "||",
  "==",
  "!=",
  "<=",
  ">=",
  "<",
  ">",
  "+",
  "-",
  "*",
  "/",
  "%",
  "^",
  "!",
  "?",
  ":",
  "(",
  ")",
  ",",
] as const;

const MAX_SOURCE_LENGTH = 500;

function tokenize(source: string): Token[] {
  if (source.length > MAX_SOURCE_LENGTH) {
    throw new ExpressionError("Expression is too long");
  }
  const tokens: Token[] = [];
  let i = 0;
  while (i < source.length) {
    const ch = source[i];
    if (/\s/.test(ch)) {
      i += 1;
      continue;
    }
    if (/[0-9.]/.test(ch)) {
      const match = /^(?:\d+\.?\d*|\.\d+)(?:e[+-]?\d+)?/i.exec(source.slice(i));
      if (!match) throw new ExpressionError(`Invalid number at ${i}`);
      tokens.push({ type: "num", value: Number(match[0]) });
      i += match[0].length;
      continue;
    }
    if (ch === "'" || ch === '"') {
      const end = source.indexOf(ch, i + 1);
      if (end === -1) throw new ExpressionError("Unterminated string");
      tokens.push({ type: "str", value: source.slice(i + 1, end) });
      i = end + 1;
      continue;
    }
    if (/[A-Za-z_]/.test(ch)) {
      const match = /^[A-Za-z_][A-Za-z0-9_]*/.exec(source.slice(i));
      tokens.push({ type: "ident", value: match![0] });
      i += match![0].length;
      continue;
    }
    const op = OPERATORS.find((candidate) => source.startsWith(candidate, i));
    if (!op) throw new ExpressionError(`Unexpected character "${ch}"`);
    tokens.push({ type: "op", value: op });
    i += op.length;
  }
  return tokens;
}

class Parser {
  private index = 0;

  constructor(private readonly tokens: readonly Token[]) {}

  parse(): Node {
    const node = this.ternary();
    if (this.index < this.tokens.length) {
      throw new ExpressionError("Unexpected trailing input");
    }
    return node;
  }

  private peekOp(...ops: string[]): string | null {
    const token = this.tokens[this.index];
    return token?.type === "op" && ops.includes(token.value)
      ? token.value
      : null;
  }

  private expectOp(op: string): void {
    if (!this.peekOp(op)) throw new ExpressionError(`Expected "${op}"`);
    this.index += 1;
  }

  private ternary(): Node {
    const test = this.binary(0);
    if (this.peekOp("?")) {
      this.index += 1;
      const then = this.ternary();
      this.expectOp(":");
      const otherwise = this.ternary();
      return { kind: "ternary", test, then, otherwise };
    }
    return test;
  }

  private static readonly LEVELS: readonly (readonly string[])[] = [
    ["||"],
    ["&&"],
    ["==", "!="],
    ["<", "<=", ">", ">="],
    ["+", "-"],
    ["*", "/", "%"],
  ];

  private binary(level: number): Node {
    if (level >= Parser.LEVELS.length) return this.power();
    let left = this.binary(level + 1);
    let op = this.peekOp(...Parser.LEVELS[level]);
    while (op) {
      this.index += 1;
      const right = this.binary(level + 1);
      left = { kind: "binary", op, left, right };
      op = this.peekOp(...Parser.LEVELS[level]);
    }
    return left;
  }

  private power(): Node {
    const base = this.unary();
    if (this.peekOp("^")) {
      this.index += 1;
      return { kind: "binary", op: "^", left: base, right: this.power() };
    }
    return base;
  }

  private unary(): Node {
    const op = this.peekOp("-", "!", "+");
    if (op) {
      this.index += 1;
      return { kind: "unary", op, arg: this.unary() };
    }
    return this.primary();
  }

  private primary(): Node {
    const token = this.tokens[this.index];
    if (!token) throw new ExpressionError("Unexpected end of expression");
    this.index += 1;
    if (token.type === "num") return { kind: "lit", value: token.value };
    if (token.type === "str") return { kind: "lit", value: token.value };
    if (token.type === "ident") {
      if (token.value === "true") return { kind: "lit", value: true };
      if (token.value === "false") return { kind: "lit", value: false };
      if (this.peekOp("(")) {
        this.index += 1;
        const args: Node[] = [];
        if (!this.peekOp(")")) {
          args.push(this.ternary());
          while (this.peekOp(",")) {
            this.index += 1;
            args.push(this.ternary());
          }
        }
        this.expectOp(")");
        if (!(token.value in FUNCTIONS)) {
          throw new ExpressionError(`Unknown function "${token.value}"`);
        }
        return { kind: "call", name: token.value, args };
      }
      return { kind: "var", name: token.value };
    }
    if (token.value === "(") {
      const inner = this.ternary();
      this.expectOp(")");
      return inner;
    }
    throw new ExpressionError(`Unexpected "${token.value}"`);
  }
}

function num(value: ExpressionValue): number {
  if (typeof value === "number") return value;
  if (typeof value === "boolean") return value ? 1 : 0;
  const parsed = Number(value);
  if (Number.isNaN(parsed)) {
    throw new ExpressionError(`"${value}" is not a number`);
  }
  return parsed;
}

function truthy(value: ExpressionValue): boolean {
  if (typeof value === "string") return value.length > 0;
  return Boolean(value);
}

const FUNCTIONS: Readonly<
  Record<string, (args: readonly ExpressionValue[]) => ExpressionValue>
> = {
  min: (args) => Math.min(...args.map(num)),
  max: (args) => Math.max(...args.map(num)),
  abs: ([x]) => Math.abs(num(x)),
  floor: ([x]) => Math.floor(num(x)),
  ceil: ([x]) => Math.ceil(num(x)),
  sqrt: ([x]) => Math.sqrt(num(x)),
  log10: ([x]) => Math.log10(num(x)),
  pow: ([x, y]) => num(x) ** num(y),
  round: ([x, digits]) => {
    const factor = 10 ** (digits === undefined ? 0 : num(digits));
    return Math.round(num(x) * factor) / factor;
  },
  clamp: ([x, lo, hi]) => Math.min(num(hi), Math.max(num(lo), num(x))),
};

function evaluateNode(node: Node, scope: ExpressionScope): ExpressionValue {
  switch (node.kind) {
    case "lit":
      return node.value;
    case "var": {
      if (!Object.prototype.hasOwnProperty.call(scope, node.name)) {
        throw new ExpressionError(`Unknown variable "${node.name}"`);
      }
      return scope[node.name];
    }
    case "unary": {
      const arg = evaluateNode(node.arg, scope);
      if (node.op === "!") return !truthy(arg);
      return node.op === "-" ? -num(arg) : num(arg);
    }
    case "ternary":
      return truthy(evaluateNode(node.test, scope))
        ? evaluateNode(node.then, scope)
        : evaluateNode(node.otherwise, scope);
    case "call":
      return FUNCTIONS[node.name](
        node.args.map((arg) => evaluateNode(arg, scope)),
      );
    case "binary": {
      if (node.op === "&&") {
        return (
          truthy(evaluateNode(node.left, scope)) &&
          truthy(evaluateNode(node.right, scope))
        );
      }
      if (node.op === "||") {
        return (
          truthy(evaluateNode(node.left, scope)) ||
          truthy(evaluateNode(node.right, scope))
        );
      }
      const left = evaluateNode(node.left, scope);
      const right = evaluateNode(node.right, scope);
      switch (node.op) {
        case "==":
          return typeof left === "string" || typeof right === "string"
            ? String(left) === String(right)
            : num(left) === num(right);
        case "!=":
          return typeof left === "string" || typeof right === "string"
            ? String(left) !== String(right)
            : num(left) !== num(right);
        case "<":
          return num(left) < num(right);
        case "<=":
          return num(left) <= num(right);
        case ">":
          return num(left) > num(right);
        case ">=":
          return num(left) >= num(right);
        case "+":
          return typeof left === "string" || typeof right === "string"
            ? `${left}${right}`
            : num(left) + num(right);
        case "-":
          return num(left) - num(right);
        case "*":
          return num(left) * num(right);
        case "/":
          return num(left) / num(right);
        case "%":
          return num(left) % num(right);
        case "^":
          return num(left) ** num(right);
        default:
          throw new ExpressionError(`Unknown operator "${node.op}"`);
      }
    }
  }
}

export interface CompiledExpression {
  readonly source: string;
  /** Free variables the formula reads (useful for authoring validation). */
  readonly variables: readonly string[];
  evaluate(scope: ExpressionScope): ExpressionValue;
}

function collectVariables(node: Node, into: Set<string>): void {
  switch (node.kind) {
    case "var":
      into.add(node.name);
      return;
    case "unary":
      collectVariables(node.arg, into);
      return;
    case "binary":
      collectVariables(node.left, into);
      collectVariables(node.right, into);
      return;
    case "ternary":
      collectVariables(node.test, into);
      collectVariables(node.then, into);
      collectVariables(node.otherwise, into);
      return;
    case "call":
      node.args.forEach((arg) => collectVariables(arg, into));
      return;
    default:
      return;
  }
}

const compileCache = new Map<string, CompiledExpression>();

/** Parse once, evaluate many times. Throws ExpressionError on bad syntax. */
export function compileExpression(source: string): CompiledExpression {
  const cached = compileCache.get(source);
  if (cached) return cached;
  const ast = new Parser(tokenize(source)).parse();
  const variables = new Set<string>();
  collectVariables(ast, variables);
  const compiled: CompiledExpression = {
    source,
    variables: [...variables],
    evaluate: (scope) => evaluateNode(ast, scope),
  };
  compileCache.set(source, compiled);
  return compiled;
}

/** Evaluate a formula; returns `fallback` instead of throwing. */
export function evaluateExpression(
  source: string,
  scope: ExpressionScope,
  fallback: ExpressionValue = Number.NaN,
): ExpressionValue {
  try {
    return compileExpression(source).evaluate(scope);
  } catch {
    return fallback;
  }
}

/** Evaluate to a number (NaN when invalid or non-numeric). */
export function evaluateNumber(source: string, scope: ExpressionScope): number {
  const value = evaluateExpression(source, scope);
  try {
    return num(value);
  } catch {
    return Number.NaN;
  }
}

/** Evaluate to a boolean (false when invalid). */
export function evaluateCondition(
  source: string,
  scope: ExpressionScope,
): boolean {
  return truthy(evaluateExpression(source, scope, false));
}
