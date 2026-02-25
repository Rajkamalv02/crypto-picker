const logger = require("./logger");

/**
 * Pine Code Validator
 * Validates Pine Script code for security and syntax issues
 */

const MAX_EXECUTION_TIME = 5000; // 5 seconds
const MAX_LOOP_ITERATIONS = 10000;
const MAX_CODE_LENGTH = 50000; // 50KB

class PineCodeValidator {
  constructor() {
    this.errors = [];
    this.warnings = [];
  }

  validate(pineCode) {
    this.errors = [];
    this.warnings = [];

    // Check code length
    if (pineCode.length > MAX_CODE_LENGTH) {
      this.errors.push({
        type: "SIZE_LIMIT",
        message: `Code exceeds maximum length of ${MAX_CODE_LENGTH} characters`,
      });
      return { valid: false, errors: this.errors, warnings: this.warnings };
    }

    // Check for potentially dangerous patterns
    this.checkDangerousPatterns(pineCode);

    // Check for infinite loops (basic detection)
    this.checkInfiniteLoops(pineCode);

    // Check for valid Pine Script version
    this.checkVersion(pineCode);

    return {
      valid: this.errors.length === 0,
      errors: this.errors,
      warnings: this.warnings,
    };
  }

  checkDangerousPatterns(code) {
    // Check for file system access attempts
    const dangerousPatterns = [
      /require\s*\(/gi,
      /import\s+/gi,
      /eval\s*\(/gi,
      /Function\s*\(/gi,
      /process\./gi,
      /child_process/gi,
      /fs\./gi,
      /__dirname/gi,
      /__filename/gi,
    ];

    dangerousPatterns.forEach((pattern) => {
      if (pattern.test(code)) {
        this.errors.push({
          type: "SECURITY",
          message: `Potentially dangerous pattern detected: ${pattern.source}`,
        });
      }
    });
  }

  checkInfiniteLoops(code) {
    // Basic check for while loops without obvious break conditions
    const whileLoops = code.match(/while\s*\([^)]+\)/gi);
    if (whileLoops && whileLoops.length > 0) {
      this.warnings.push({
        type: "LOOP_WARNING",
        message:
          "While loops detected. Ensure they have proper exit conditions.",
      });
    }

    // Check for for loops with suspicious conditions
    const forLoops = code.match(/for\s*\([^)]+\)/gi);
    if (forLoops && forLoops.length > 5) {
      this.warnings.push({
        type: "LOOP_WARNING",
        message: "Multiple for loops detected. Code complexity may be high.",
      });
    }
  }

  checkVersion(code) {
    // Check for Pine Script version declaration
    const versionMatch = code.match(/\/\/@version\s*=\s*(\d+)/i);
    if (!versionMatch) {
      this.warnings.push({
        type: "VERSION_WARNING",
        message: "No Pine Script version declared. Assuming v5.",
      });
    } else {
      const version = parseInt(versionMatch[1]);
      if (version < 4) {
        this.warnings.push({
          type: "VERSION_WARNING",
          message: `Pine Script v${version} detected. Consider upgrading to v5 for better features.`,
        });
      }
    }
  }

  /**
   * Validate execution with timeout
   */
  static async validateExecution(executionFn) {
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(
          new Error(`Execution timeout: exceeded ${MAX_EXECUTION_TIME}ms`),
        );
      }, MAX_EXECUTION_TIME);

      try {
        const result = executionFn();
        clearTimeout(timeout);
        resolve(result);
      } catch (error) {
        clearTimeout(timeout);
        reject(error);
      }
    });
  }

  /**
   * Sanitize Pine Script code
   */
  static sanitize(code) {
    // Remove any potential script tags or HTML
    let sanitized = code.replace(/<script[^>]*>.*?<\/script>/gi, "");
    sanitized = sanitized.replace(/<[^>]+>/g, "");

    // Limit line length
    const lines = sanitized.split("\n");
    const sanitizedLines = lines.map((line) => {
      if (line.length > 500) {
        return line.substring(0, 500) + " // [truncated]";
      }
      return line;
    });

    return sanitizedLines.join("\n");
  }
}

module.exports = {
  PineCodeValidator,
  MAX_EXECUTION_TIME,
  MAX_LOOP_ITERATIONS,
  MAX_CODE_LENGTH,
};
