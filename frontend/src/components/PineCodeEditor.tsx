"use client";

import { useState, useEffect } from "react";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { vscDarkPlus } from "react-syntax-highlighter/dist/esm/styles/prism";

interface PineCodeEditorProps {
  onSave?: (code: string, name: string, description: string) => void;
  initialCode?: string;
  initialName?: string;
  initialDescription?: string;
  mode?: "create" | "edit";
}

interface ValidationResult {
  valid: boolean;
  errors: Array<{ type: string; message: string }>;
  warnings: Array<{ type: string; message: string }>;
}

const PINE_TEMPLATES = {
  rsi: `// RSI Strategy Template
//@version=5
strategy("RSI Strategy", overlay=false)

// Parameters
rsiLength = input.int(14, "RSI Length")
overbought = input.int(70, "Overbought Level")
oversold = input.int(30, "Oversold Level")

// Calculate RSI
rsi = ta.rsi(close, rsiLength)

// Generate signals
buySignal = ta.crossover(rsi, oversold)
sellSignal = ta.crossunder(rsi, overbought)

// Plot
plot(rsi, "RSI", color=color.blue)
hline(overbought, "Overbought", color=color.red)
hline(oversold, "Oversold", color=color.green)
hline(50, "Midline", color=color.gray)`,

  sma: `// SMA Crossover Strategy Template
//@version=5
strategy("SMA Crossover", overlay=true)

// Parameters
shortPeriod = input.int(9, "Short SMA")
longPeriod = input.int(21, "Long SMA")

// Calculate SMAs
shortSma = ta.sma(close, shortPeriod)
longSma = ta.sma(close, longPeriod)

// Generate signals
buySignal = ta.crossover(shortSma, longSma)
sellSignal = ta.crossunder(shortSma, longSma)

// Plot
plot(shortSma, "Short SMA", color=color.blue)
plot(longSma, "Long SMA", color=color.red)`,

  macd: `// MACD Strategy Template
//@version=5
strategy("MACD Strategy", overlay=false)

// Parameters
fastLength = input.int(12, "Fast Length")
slowLength = input.int(26, "Slow Length")
signalLength = input.int(9, "Signal Length")

// Calculate MACD
[macdLine, signalLine, histLine] = ta.macd(close, fastLength, slowLength, signalLength)

// Generate signals
buySignal = ta.crossover(macdLine, signalLine)
sellSignal = ta.crossunder(macdLine, signalLine)

// Plot
plot(macdLine, "MACD", color=color.blue)
plot(signalLine, "Signal", color=color.orange)
plot(histLine, "Histogram", color=color.gray, style=plot.style_histogram)`,
};

export default function PineCodeEditor({
  onSave,
  initialCode = "",
  initialName = "",
  initialDescription = "",
  mode = "create",
}: PineCodeEditorProps) {
  const [code, setCode] = useState(initialCode);
  const [name, setName] = useState(initialName);
  const [description, setDescription] = useState(initialDescription);
  const [activeTab, setActiveTab] = useState<"editor" | "templates" | "help">("editor");
  const [validation, setValidation] = useState<ValidationResult | null>(null);
  const [isValidating, setIsValidating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Auto-validate on code change (debounced)
  useEffect(() => {
    const timer = setTimeout(() => {
      if (code.trim()) {
        validateCode();
      }
    }, 1000);
    return () => clearTimeout(timer);
  }, [code]);

  const validateCode = async () => {
    setIsValidating(true);
    try {
      const response = await fetch("http://localhost:5000/api/strategies/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code }),
      });
      const result = await response.json();
      setValidation(result);
    } catch (error) {
      console.error("Validation error:", error);
    } finally {
      setIsValidating(false);
    }
  };

  const handleSave = async () => {
    if (!name.trim()) {
      alert("Please enter a strategy name");
      return;
    }

    if (!code.trim()) {
      alert("Please enter Pine Script code");
      return;
    }

    setIsSaving(true);
    try {
      if (onSave) {
        onSave(code, name, description);
      } else {
        // Default save behavior
        const endpoint = mode === "create" 
          ? "http://localhost:5000/api/strategies/upload"
          : `http://localhost:5000/api/strategies/${name}/code`;
        
        const method = mode === "create" ? "POST" : "PUT";
        
        const response = await fetch(endpoint, {
          method,
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name, code, description }),
        });

        const result = await response.json();
        
        if (response.ok) {
          alert(result.message || "Strategy saved successfully!");
        } else {
          alert(result.error || "Failed to save strategy");
        }
      }
    } catch (error) {
      console.error("Save error:", error);
      alert("Failed to save strategy");
    } finally {
      setIsSaving(false);
    }
  };

  const loadTemplate = (templateKey: keyof typeof PINE_TEMPLATES) => {
    setCode(PINE_TEMPLATES[templateKey]);
    setActiveTab("editor");
  };

  return (
    <div className="pine-code-editor">
      <style jsx>{`
        .pine-code-editor {
          display: flex;
          flex-direction: column;
          height: 100%;
          background: #1e1e1e;
          color: #d4d4d4;
          border-radius: 8px;
          overflow: hidden;
        }

        .editor-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 16px;
          background: #252526;
          border-bottom: 1px solid #3e3e42;
        }

        .editor-title {
          font-size: 18px;
          font-weight: 600;
        }

        .editor-tabs {
          display: flex;
          gap: 8px;
          background: #252526;
          padding: 0 16px;
          border-bottom: 1px solid #3e3e42;
        }

        .tab {
          padding: 12px 20px;
          background: transparent;
          border: none;
          color: #969696;
          cursor: pointer;
          border-bottom: 2px solid transparent;
          transition: all 0.2s;
        }

        .tab:hover {
          color: #d4d4d4;
        }

        .tab.active {
          color: #fff;
          border-bottom-color: #007acc;
        }

        .editor-content {
          flex: 1;
          overflow-y: auto;
          padding: 16px;
        }

        .form-group {
          margin-bottom: 16px;
        }

        .form-label {
          display: block;
          margin-bottom: 8px;
          font-size: 14px;
          color: #cccccc;
        }

        .form-input {
          width: 100%;
          padding: 10px;
          background: #3c3c3c;
          border: 1px solid #3e3e42;
          border-radius: 4px;
          color: #d4d4d4;
          font-size: 14px;
        }

        .form-input:focus {
          outline: none;
          border-color: #007acc;
        }

        .code-editor {
          position: relative;
        }

        .code-textarea {
          width: 100%;
          min-height: 400px;
          padding: 12px;
          background: #1e1e1e;
          border: 1px solid #3e3e42;
          border-radius: 4px;
          color: #d4d4d4;
          font-family: 'Consolas', 'Monaco', 'Courier New', monospace;
          font-size: 14px;
          line-height: 1.6;
          resize: vertical;
        }

        .code-textarea:focus {
          outline: none;
          border-color: #007acc;
        }

        .validation-status {
          margin-top: 12px;
          padding: 12px;
          border-radius: 4px;
          font-size: 13px;
        }

        .validation-status.valid {
          background: #1e3a1e;
          border: 1px solid #2d5a2d;
          color: #6cc644;
        }

        .validation-status.invalid {
          background: #3a1e1e;
          border: 1px solid #5a2d2d;
          color: #f97583;
        }

        .validation-status.validating {
          background: #3a3a1e;
          border: 1px solid #5a5a2d;
          color: #f9c74f;
        }

        .error-list, .warning-list {
          margin-top: 8px;
          padding-left: 20px;
        }

        .error-item, .warning-item {
          margin: 4px 0;
        }

        .editor-actions {
          display: flex;
          gap: 12px;
          padding: 16px;
          background: #252526;
          border-top: 1px solid #3e3e42;
        }

        .btn {
          padding: 10px 20px;
          border: none;
          border-radius: 4px;
          font-size: 14px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s;
        }

        .btn-primary {
          background: #007acc;
          color: #fff;
        }

        .btn-primary:hover:not(:disabled) {
          background: #005a9e;
        }

        .btn-secondary {
          background: #3c3c3c;
          color: #d4d4d4;
        }

        .btn-secondary:hover:not(:disabled) {
          background: #505050;
        }

        .btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .templates-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
          gap: 16px;
        }

        .template-card {
          padding: 16px;
          background: #252526;
          border: 1px solid #3e3e42;
          border-radius: 8px;
          cursor: pointer;
          transition: all 0.2s;
        }

        .template-card:hover {
          border-color: #007acc;
          transform: translateY(-2px);
        }

        .template-title {
          font-size: 16px;
          font-weight: 600;
          margin-bottom: 8px;
        }

        .template-preview {
          font-size: 12px;
          color: #969696;
          font-family: 'Consolas', 'Monaco', 'Courier New', monospace;
          white-space: pre-wrap;
          max-height: 100px;
          overflow: hidden;
        }

        .help-content {
          line-height: 1.8;
        }

        .help-content h3 {
          margin-top: 24px;
          margin-bottom: 12px;
          color: #007acc;
        }

        .help-content code {
          background: #3c3c3c;
          padding: 2px 6px;
          border-radius: 3px;
          font-family: 'Consolas', 'Monaco', 'Courier New', monospace;
        }
      `}</style>

      <div className="editor-header">
        <div className="editor-title">
          {mode === "create" ? "Create New Strategy" : "Edit Strategy"}
        </div>
      </div>

      <div className="editor-tabs">
        <button
          className={`tab ${activeTab === "editor" ? "active" : ""}`}
          onClick={() => setActiveTab("editor")}
        >
          Editor
        </button>
        <button
          className={`tab ${activeTab === "templates" ? "active" : ""}`}
          onClick={() => setActiveTab("templates")}
        >
          Templates
        </button>
        <button
          className={`tab ${activeTab === "help" ? "active" : ""}`}
          onClick={() => setActiveTab("help")}
        >
          Help
        </button>
      </div>

      <div className="editor-content">
        {activeTab === "editor" && (
          <>
            <div className="form-group">
              <label className="form-label">Strategy Name</label>
              <input
                type="text"
                className="form-input"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="my_custom_strategy"
                disabled={mode === "edit"}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Description (Optional)</label>
              <input
                type="text"
                className="form-input"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Brief description of your strategy"
              />
            </div>

            <div className="form-group">
              <label className="form-label">Pine Script Code</label>
              <div className="code-editor">
                <textarea
                  className="code-textarea"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  placeholder="Paste your Pine Script code here..."
                  spellCheck={false}
                />
              </div>
            </div>

            {validation && (
              <div
                className={`validation-status ${
                  isValidating
                    ? "validating"
                    : validation.valid
                    ? "valid"
                    : "invalid"
                }`}
              >
                {isValidating ? (
                  "Validating..."
                ) : validation.valid ? (
                  <>
                    ✓ Code is valid
                    {validation.warnings.length > 0 && (
                      <div className="warning-list">
                        <strong>Warnings:</strong>
                        {validation.warnings.map((w, i) => (
                          <div key={i} className="warning-item">
                            • {w.message}
                          </div>
                        ))}
                      </div>
                    )}
                  </>
                ) : (
                  <>
                    ✗ Validation failed
                    <div className="error-list">
                      {validation.errors.map((e, i) => (
                        <div key={i} className="error-item">
                          • {e.message}
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </div>
            )}
          </>
        )}

        {activeTab === "templates" && (
          <div className="templates-grid">
            <div className="template-card" onClick={() => loadTemplate("rsi")}>
              <div className="template-title">RSI Strategy</div>
              <div className="template-preview">
                {PINE_TEMPLATES.rsi.substring(0, 150)}...
              </div>
            </div>
            <div className="template-card" onClick={() => loadTemplate("sma")}>
              <div className="template-title">SMA Crossover</div>
              <div className="template-preview">
                {PINE_TEMPLATES.sma.substring(0, 150)}...
              </div>
            </div>
            <div className="template-card" onClick={() => loadTemplate("macd")}>
              <div className="template-title">MACD Strategy</div>
              <div className="template-preview">
                {PINE_TEMPLATES.macd.substring(0, 150)}...
              </div>
            </div>
          </div>
        )}

        {activeTab === "help" && (
          <div className="help-content">
            <h3>Pine Script Quick Reference</h3>
            <p>
              Pine Script is a domain-specific language for writing custom indicators and strategies.
            </p>

            <h3>Supported Functions</h3>
            <ul>
              <li><code>ta.rsi(source, length)</code> - Relative Strength Index</li>
              <li><code>ta.sma(source, length)</code> - Simple Moving Average</li>
              <li><code>ta.ema(source, length)</code> - Exponential Moving Average</li>
              <li><code>ta.crossover(series1, series2)</code> - Detect bullish crossover</li>
              <li><code>ta.crossunder(series1, series2)</code> - Detect bearish crossunder</li>
            </ul>

            <h3>Built-in Variables</h3>
            <ul>
              <li><code>close</code> - Closing price</li>
              <li><code>open</code> - Opening price</li>
              <li><code>high</code> - High price</li>
              <li><code>low</code> - Low price</li>
              <li><code>volume</code> - Trading volume</li>
            </ul>

            <h3>Example</h3>
            <pre style={{ background: "#3c3c3c", padding: "12px", borderRadius: "4px" }}>
{`rsi = ta.rsi(close, 14)
buySignal = rsi < 30
sellSignal = rsi > 70`}
            </pre>
          </div>
        )}
      </div>

      <div className="editor-actions">
        <button
          className="btn btn-primary"
          onClick={handleSave}
          disabled={isSaving || !validation?.valid}
        >
          {isSaving ? "Saving..." : mode === "create" ? "Create Strategy" : "Update Strategy"}
        </button>
        <button
          className="btn btn-secondary"
          onClick={() => validateCode()}
          disabled={isValidating}
        >
          {isValidating ? "Validating..." : "Validate Code"}
        </button>
      </div>
    </div>
  );
}
