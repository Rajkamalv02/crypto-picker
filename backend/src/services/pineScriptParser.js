const logger = require("../utils/logger");

/**
 * Pine Script Parser - Phase 1 & 2
 * Supports: Core indicators, basic conditions, crossover/crossunder, strategy signals
 */

// Token Types
const TokenType = {
  // Literals
  NUMBER: "NUMBER",
  STRING: "STRING",
  IDENTIFIER: "IDENTIFIER",

  // Keywords
  VAR: "VAR",
  VARIP: "VARIP",
  IF: "IF",
  ELSE: "ELSE",
  TRUE: "TRUE",
  FALSE: "FALSE",
  NA: "NA",
  STRATEGY: "STRATEGY",
  INDICATOR: "INDICATOR",

  // Operators
  PLUS: "PLUS",
  MINUS: "MINUS",
  MULTIPLY: "MULTIPLY",
  DIVIDE: "DIVIDE",
  MODULO: "MODULO",
  ASSIGN: "ASSIGN",
  EQUAL: "EQUAL",
  NOT_EQUAL: "NOT_EQUAL",
  GREATER: "GREATER",
  LESS: "LESS",
  GREATER_EQUAL: "GREATER_EQUAL",
  LESS_EQUAL: "LESS_EQUAL",

  // Logical
  AND: "AND",
  OR: "OR",
  NOT: "NOT",

  // Punctuation
  LPAREN: "LPAREN",
  RPAREN: "RPAREN",
  LBRACKET: "LBRACKET",
  RBRACKET: "RBRACKET",
  COMMA: "COMMA",
  DOT: "DOT",
  COLON: "COLON",
  NEWLINE: "NEWLINE",

  // Special
  EOF: "EOF",
  COMMENT: "COMMENT",
};

// Lexer - Tokenizes Pine Script code
class Lexer {
  constructor(code) {
    this.code = code;
    this.pos = 0;
    this.line = 1;
    this.column = 1;
  }

  peek(offset = 0) {
    return this.code[this.pos + offset] || null;
  }

  advance() {
    const char = this.code[this.pos];
    this.pos++;
    if (char === "\n") {
      this.line++;
      this.column = 1;
    } else {
      this.column++;
    }
    return char;
  }

  skipWhitespace() {
    while (this.peek() && /[ \t\r]/.test(this.peek())) {
      this.advance();
    }
  }

  skipComment() {
    if (this.peek() === "/" && this.peek(1) === "/") {
      // Single-line comment
      while (this.peek() && this.peek() !== "\n") {
        this.advance();
      }
      return true;
    }
    if (this.peek() === "/" && this.peek(1) === "*") {
      // Multi-line comment
      this.advance(); // /
      this.advance(); // *
      while (this.peek()) {
        if (this.peek() === "*" && this.peek(1) === "/") {
          this.advance(); // *
          this.advance(); // /
          break;
        }
        this.advance();
      }
      return true;
    }
    return false;
  }

  readNumber() {
    let num = "";
    while (this.peek() && /[0-9.]/.test(this.peek())) {
      num += this.advance();
    }
    return parseFloat(num);
  }

  readString(quote) {
    this.advance(); // Skip opening quote
    let str = "";
    while (this.peek() && this.peek() !== quote) {
      str += this.advance();
    }
    this.advance(); // Skip closing quote
    return str;
  }

  readIdentifier() {
    let id = "";
    while (this.peek() && /[a-zA-Z0-9_.]/.test(this.peek())) {
      id += this.advance();
    }
    return id;
  }

  tokenize() {
    const tokens = [];

    while (this.pos < this.code.length) {
      this.skipWhitespace();

      if (this.skipComment()) continue;

      const char = this.peek();

      if (!char) break;

      // Newline
      if (char === "\n") {
        tokens.push({ type: TokenType.NEWLINE, value: "\n", line: this.line });
        this.advance();
        continue;
      }

      // Numbers
      if (/[0-9]/.test(char)) {
        const num = this.readNumber();
        tokens.push({ type: TokenType.NUMBER, value: num, line: this.line });
        continue;
      }

      // Strings
      if (char === '"' || char === "'") {
        const str = this.readString(char);
        tokens.push({ type: TokenType.STRING, value: str, line: this.line });
        continue;
      }

      // Identifiers and Keywords
      if (/[a-zA-Z_]/.test(char)) {
        const id = this.readIdentifier();

        // Check for keywords
        const keywords = {
          var: TokenType.VAR,
          varip: TokenType.VARIP,
          if: TokenType.IF,
          else: TokenType.ELSE,
          true: TokenType.TRUE,
          false: TokenType.FALSE,
          na: TokenType.NA,
          and: TokenType.AND,
          or: TokenType.OR,
          not: TokenType.NOT,
          strategy: TokenType.STRATEGY,
          indicator: TokenType.INDICATOR,
        };

        const tokenType = keywords[id] || TokenType.IDENTIFIER;
        tokens.push({ type: tokenType, value: id, line: this.line });
        continue;
      }

      // Operators and Punctuation
      const operators = {
        "+": TokenType.PLUS,
        "-": TokenType.MINUS,
        "*": TokenType.MULTIPLY,
        "/": TokenType.DIVIDE,
        "%": TokenType.MODULO,
        "(": TokenType.LPAREN,
        ")": TokenType.RPAREN,
        "[": TokenType.LBRACKET,
        "]": TokenType.RBRACKET,
        ",": TokenType.COMMA,
        ".": TokenType.DOT,
        ":": TokenType.COLON,
      };

      // Two-character operators
      if (char === "=" && this.peek(1) === "=") {
        tokens.push({ type: TokenType.EQUAL, value: "==", line: this.line });
        this.advance();
        this.advance();
        continue;
      }
      if (char === "!" && this.peek(1) === "=") {
        tokens.push({
          type: TokenType.NOT_EQUAL,
          value: "!=",
          line: this.line,
        });
        this.advance();
        this.advance();
        continue;
      }
      if (char === ">" && this.peek(1) === "=") {
        tokens.push({
          type: TokenType.GREATER_EQUAL,
          value: ">=",
          line: this.line,
        });
        this.advance();
        this.advance();
        continue;
      }
      if (char === "<" && this.peek(1) === "=") {
        tokens.push({
          type: TokenType.LESS_EQUAL,
          value: "<=",
          line: this.line,
        });
        this.advance();
        this.advance();
        continue;
      }
      if (char === ":") {
        if (this.peek(1) === "=") {
          tokens.push({ type: TokenType.ASSIGN, value: ":=", line: this.line });
          this.advance();
          this.advance();
          continue;
        }
      }

      // Single-character operators
      if (char === "=") {
        tokens.push({ type: TokenType.ASSIGN, value: "=", line: this.line });
        this.advance();
        continue;
      }
      if (char === ">") {
        tokens.push({ type: TokenType.GREATER, value: ">", line: this.line });
        this.advance();
        continue;
      }
      if (char === "<") {
        tokens.push({ type: TokenType.LESS, value: "<", line: this.line });
        this.advance();
        continue;
      }

      if (operators[char]) {
        tokens.push({ type: operators[char], value: char, line: this.line });
        this.advance();
        continue;
      }

      // Unknown character
      throw new Error(`Unexpected character '${char}' at line ${this.line}`);
    }

    tokens.push({ type: TokenType.EOF, value: null, line: this.line });
    return tokens;
  }
}

// AST Node Types
const ASTNodeType = {
  PROGRAM: "PROGRAM",
  ASSIGNMENT: "ASSIGNMENT",
  BINARY_OP: "BINARY_OP",
  UNARY_OP: "UNARY_OP",
  FUNCTION_CALL: "FUNCTION_CALL",
  IDENTIFIER: "IDENTIFIER",
  LITERAL: "LITERAL",
  IF_STATEMENT: "IF_STATEMENT",
};

// Parser - Builds AST from tokens
class Parser {
  constructor(tokens) {
    this.tokens = tokens.filter((t) => t.type !== TokenType.NEWLINE); // Ignore newlines for simplicity
    this.pos = 0;
  }

  peek(offset = 0) {
    return this.tokens[this.pos + offset] || { type: TokenType.EOF };
  }

  advance() {
    return this.tokens[this.pos++];
  }

  expect(type) {
    const token = this.advance();
    if (token.type !== type) {
      throw new Error(
        `Expected ${type} but got ${token.type} at line ${token.line}`,
      );
    }
    return token;
  }

  parse() {
    const statements = [];
    while (this.peek().type !== TokenType.EOF) {
      statements.push(this.parseStatement());
    }
    return { type: ASTNodeType.PROGRAM, statements };
  }

  parseStatement() {
    const token = this.peek();

    // Variable declaration
    if (token.type === TokenType.VAR || token.type === TokenType.VARIP) {
      this.advance();
      const name = this.expect(TokenType.IDENTIFIER).value;
      this.expect(TokenType.ASSIGN);
      const value = this.parseExpression();
      return { type: ASTNodeType.ASSIGNMENT, name, value, isVar: true };
    }

    // Assignment
    if (
      token.type === TokenType.IDENTIFIER &&
      this.peek(1).type === TokenType.ASSIGN
    ) {
      const name = this.advance().value;
      this.advance(); // =
      const value = this.parseExpression();
      return { type: ASTNodeType.ASSIGNMENT, name, value };
    }

    // If statement
    if (token.type === TokenType.IF) {
      return this.parseIfStatement();
    }

    // Expression statement
    return this.parseExpression();
  }

  parseIfStatement() {
    this.expect(TokenType.IF);
    const condition = this.parseExpression();
    // For simplicity, we're not handling full block syntax
    // Just assume single-line if for now
    return {
      type: ASTNodeType.IF_STATEMENT,
      condition,
      consequent: null,
      alternate: null,
    };
  }

  parseExpression() {
    return this.parseLogicalOr();
  }

  parseLogicalOr() {
    let left = this.parseLogicalAnd();
    while (this.peek().type === TokenType.OR) {
      const op = this.advance().value;
      const right = this.parseLogicalAnd();
      left = { type: ASTNodeType.BINARY_OP, op, left, right };
    }
    return left;
  }

  parseLogicalAnd() {
    let left = this.parseComparison();
    while (this.peek().type === TokenType.AND) {
      const op = this.advance().value;
      const right = this.parseComparison();
      left = { type: ASTNodeType.BINARY_OP, op, left, right };
    }
    return left;
  }

  parseComparison() {
    let left = this.parseAdditive();
    const compOps = [
      TokenType.EQUAL,
      TokenType.NOT_EQUAL,
      TokenType.GREATER,
      TokenType.LESS,
      TokenType.GREATER_EQUAL,
      TokenType.LESS_EQUAL,
    ];
    while (compOps.includes(this.peek().type)) {
      const op = this.advance().value;
      const right = this.parseAdditive();
      left = { type: ASTNodeType.BINARY_OP, op, left, right };
    }
    return left;
  }

  parseAdditive() {
    let left = this.parseMultiplicative();
    while ([TokenType.PLUS, TokenType.MINUS].includes(this.peek().type)) {
      const op = this.advance().value;
      const right = this.parseMultiplicative();
      left = { type: ASTNodeType.BINARY_OP, op, left, right };
    }
    return left;
  }

  parseMultiplicative() {
    let left = this.parseUnary();
    while (
      [TokenType.MULTIPLY, TokenType.DIVIDE, TokenType.MODULO].includes(
        this.peek().type,
      )
    ) {
      const op = this.advance().value;
      const right = this.parseUnary();
      left = { type: ASTNodeType.BINARY_OP, op, left, right };
    }
    return left;
  }

  parseUnary() {
    if (
      this.peek().type === TokenType.NOT ||
      this.peek().type === TokenType.MINUS
    ) {
      const op = this.advance().value;
      const operand = this.parseUnary();
      return { type: ASTNodeType.UNARY_OP, op, operand };
    }
    return this.parsePrimary();
  }

  parsePrimary() {
    const token = this.peek();

    // Literals
    if (token.type === TokenType.NUMBER) {
      this.advance();
      return { type: ASTNodeType.LITERAL, value: token.value };
    }
    if (token.type === TokenType.STRING) {
      this.advance();
      return { type: ASTNodeType.LITERAL, value: token.value };
    }
    if (token.type === TokenType.TRUE) {
      this.advance();
      return { type: ASTNodeType.LITERAL, value: true };
    }
    if (token.type === TokenType.FALSE) {
      this.advance();
      return { type: ASTNodeType.LITERAL, value: false };
    }
    if (token.type === TokenType.NA) {
      this.advance();
      return { type: ASTNodeType.LITERAL, value: null };
    }

    // Function call or identifier
    if (token.type === TokenType.IDENTIFIER) {
      const name = this.advance().value;

      // Check for function call
      if (this.peek().type === TokenType.LPAREN) {
        this.advance(); // (
        const args = [];
        while (this.peek().type !== TokenType.RPAREN) {
          args.push(this.parseExpression());
          if (this.peek().type === TokenType.COMMA) {
            this.advance();
          }
        }
        this.expect(TokenType.RPAREN);
        return { type: ASTNodeType.FUNCTION_CALL, name, args };
      }

      // Check for method call (e.g., ta.rsi)
      if (this.peek().type === TokenType.DOT) {
        this.advance(); // .
        const method = this.expect(TokenType.IDENTIFIER).value;
        const fullName = `${name}.${method}`;

        if (this.peek().type === TokenType.LPAREN) {
          this.advance(); // (
          const args = [];
          while (this.peek().type !== TokenType.RPAREN) {
            args.push(this.parseExpression());
            if (this.peek().type === TokenType.COMMA) {
              this.advance();
            }
          }
          this.expect(TokenType.RPAREN);
          return { type: ASTNodeType.FUNCTION_CALL, name: fullName, args };
        }
      }

      return { type: ASTNodeType.IDENTIFIER, name };
    }

    // Parenthesized expression
    if (token.type === TokenType.LPAREN) {
      this.advance();
      const expr = this.parseExpression();
      this.expect(TokenType.RPAREN);
      return expr;
    }

    throw new Error(`Unexpected token ${token.type} at line ${token.line}`);
  }
}

// Execution Engine
class Executor {
  constructor(ast, priceData) {
    this.ast = ast;
    this.priceData = priceData; // { open, high, low, close, volume }
    this.variables = {};
    this.signals = [];
  }

  execute() {
    for (const statement of this.ast.statements) {
      this.executeStatement(statement);
    }
    return { variables: this.variables, signals: this.signals };
  }

  executeStatement(node) {
    if (node.type === ASTNodeType.ASSIGNMENT) {
      const value = this.evaluateExpression(node.value);
      this.variables[node.name] = value;
      return value;
    }
    if (node.type === ASTNodeType.IF_STATEMENT) {
      const condition = this.evaluateExpression(node.condition);
      // Simplified: just track the condition result
      return condition;
    }
    return this.evaluateExpression(node);
  }

  evaluateExpression(node) {
    if (node.type === ASTNodeType.LITERAL) {
      return node.value;
    }

    if (node.type === ASTNodeType.IDENTIFIER) {
      // Built-in series
      if (node.name === "close") return this.priceData.map((d) => d.close);
      if (node.name === "open") return this.priceData.map((d) => d.open);
      if (node.name === "high") return this.priceData.map((d) => d.high);
      if (node.name === "low") return this.priceData.map((d) => d.low);
      if (node.name === "volume") return this.priceData.map((d) => d.volume);

      // User variables
      if (this.variables[node.name] !== undefined) {
        return this.variables[node.name];
      }

      throw new Error(`Undefined variable: ${node.name}`);
    }

    if (node.type === ASTNodeType.BINARY_OP) {
      const left = this.evaluateExpression(node.left);
      const right = this.evaluateExpression(node.right);
      return this.applyBinaryOp(node.op, left, right);
    }

    if (node.type === ASTNodeType.UNARY_OP) {
      const operand = this.evaluateExpression(node.operand);
      if (node.op === "not") return !operand;
      if (node.op === "-")
        return Array.isArray(operand) ? operand.map((v) => -v) : -operand;
    }

    if (node.type === ASTNodeType.FUNCTION_CALL) {
      return this.callFunction(node.name, node.args);
    }

    throw new Error(`Unknown node type: ${node.type}`);
  }

  applyBinaryOp(op, left, right) {
    // Handle series operations
    const isLeftArray = Array.isArray(left);
    const isRightArray = Array.isArray(right);

    if (isLeftArray || isRightArray) {
      const len = Math.max(
        isLeftArray ? left.length : 1,
        isRightArray ? right.length : 1,
      );
      const result = [];
      for (let i = 0; i < len; i++) {
        const l = isLeftArray ? left[i] : left;
        const r = isRightArray ? right[i] : right;
        result.push(this.applyScalarOp(op, l, r));
      }
      return result;
    }

    return this.applyScalarOp(op, left, right);
  }

  applyScalarOp(op, left, right) {
    switch (op) {
      case "+":
        return left + right;
      case "-":
        return left - right;
      case "*":
        return left * right;
      case "/":
        return left / right;
      case "%":
        return left % right;
      case "==":
        return left === right;
      case "!=":
        return left !== right;
      case ">":
        return left > right;
      case "<":
        return left < right;
      case ">=":
        return left >= right;
      case "<=":
        return left <= right;
      case "and":
        return left && right;
      case "or":
        return left || right;
      default:
        throw new Error(`Unknown operator: ${op}`);
    }
  }

  callFunction(name, args) {
    const evaluatedArgs = args.map((arg) => this.evaluateExpression(arg));

    // Technical Analysis functions
    if (name === "ta.rsi") {
      const [source, length = 14] = evaluatedArgs;
      return this.calculateRSI(source, length);
    }
    if (name === "ta.sma") {
      const [source, length] = evaluatedArgs;
      return this.calculateSMA(source, length);
    }
    if (name === "ta.ema") {
      const [source, length] = evaluatedArgs;
      return this.calculateEMA(source, length);
    }
    if (name === "ta.crossover") {
      const [series1, series2] = evaluatedArgs;
      return this.detectCrossover(series1, series2);
    }
    if (name === "ta.crossunder") {
      const [series1, series2] = evaluatedArgs;
      return this.detectCrossunder(series1, series2);
    }

    // Math functions
    if (name === "math.abs") {
      const [value] = evaluatedArgs;
      return Array.isArray(value)
        ? value.map((v) => Math.abs(v))
        : Math.abs(value);
    }
    if (name === "math.max") {
      return Math.max(...evaluatedArgs);
    }
    if (name === "math.min") {
      return Math.min(...evaluatedArgs);
    }

    throw new Error(`Unknown function: ${name}`);
  }

  // Technical Indicators
  calculateRSI(prices, length) {
    if (prices.length < length + 1) return [];
    let gains = 0;
    let losses = 0;

    for (let i = 1; i <= length; i++) {
      const diff = prices[i] - prices[i - 1];
      if (diff >= 0) gains += diff;
      else losses -= diff;
    }

    let avgGain = gains / length;
    let avgLoss = losses / length;
    const rsiValues = [];
    let rs = avgLoss === 0 ? 100 : avgGain / avgLoss;
    rsiValues.push(100 - 100 / (1 + rs));

    for (let i = length + 1; i < prices.length; i++) {
      const diff = prices[i] - prices[i - 1];
      let currentGain = diff >= 0 ? diff : 0;
      let currentLoss = diff < 0 ? -diff : 0;

      avgGain = (avgGain * (length - 1) + currentGain) / length;
      avgLoss = (avgLoss * (length - 1) + currentLoss) / length;

      rs = avgLoss === 0 ? 100 : avgGain / avgLoss;
      rsiValues.push(100 - 100 / (1 + rs));
    }
    return rsiValues;
  }

  calculateSMA(prices, length) {
    if (prices.length < length) return [];
    const smas = [];
    for (let i = length - 1; i < prices.length; i++) {
      const slice = prices.slice(i - length + 1, i + 1);
      const sum = slice.reduce((a, b) => a + b, 0);
      smas.push(sum / length);
    }
    return smas;
  }

  calculateEMA(prices, length) {
    if (prices.length < length) return [];
    const emas = [];
    const k = 2 / (length + 1);
    let currentEma =
      prices.slice(0, length).reduce((a, b) => a + b, 0) / length;
    emas.push(currentEma);

    for (let i = length; i < prices.length; i++) {
      currentEma = (prices[i] - currentEma) * k + currentEma;
      emas.push(currentEma);
    }
    return emas;
  }

  detectCrossover(series1, series2) {
    if (!Array.isArray(series1) || !Array.isArray(series2)) return false;
    const len = Math.min(series1.length, series2.length);
    if (len < 2) return false;
    const prev1 = series1[len - 2];
    const prev2 = series2[len - 2];
    const curr1 = series1[len - 1];
    const curr2 = series2[len - 1];
    return prev1 <= prev2 && curr1 > curr2;
  }

  detectCrossunder(series1, series2) {
    if (!Array.isArray(series1) || !Array.isArray(series2)) return false;
    const len = Math.min(series1.length, series2.length);
    if (len < 2) return false;
    const prev1 = series1[len - 2];
    const prev2 = series2[len - 2];
    const curr1 = series1[len - 1];
    const curr2 = series2[len - 1];
    return prev1 >= prev2 && curr1 < curr2;
  }
}

// Main Parse Function
const parsePineScript = (pineCode, priceData) => {
  try {
    logger.info("Parsing Pine Script code");

    const lexer = new Lexer(pineCode);
    const tokens = lexer.tokenize();

    const parser = new Parser(tokens);
    const ast = parser.parse();

    const executor = new Executor(ast, priceData);
    const result = executor.execute();

    logger.info("Pine Script execution completed");
    return { success: true, result };
  } catch (error) {
    logger.error("Pine Script parsing error:", error.message);
    return { success: false, error: error.message };
  }
};

module.exports = {
  parsePineScript,
  Lexer,
  Parser,
  Executor,
};
