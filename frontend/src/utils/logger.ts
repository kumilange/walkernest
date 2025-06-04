/**
 * Simple logging utility with environment-based control
 * Provides different log levels that can be enabled/disabled based on environment
 */

type LogLevel = "debug" | "info" | "warn" | "error";

interface LoggerConfig {
  enabled: boolean;
  level: LogLevel;
}

class Logger {
  private config: LoggerConfig;

  constructor() {
    // Enable logging in development mode or when explicitly enabled
    const isDevelopment = import.meta.env.DEV;
    const isLoggingEnabled = import.meta.env.VITE_ENABLE_LOGGING === "true";

    this.config = {
      enabled: isDevelopment || isLoggingEnabled,
      level: (import.meta.env.VITE_LOG_LEVEL as LogLevel) || "info",
    };
  }

  private shouldLog(level: LogLevel): boolean {
    if (!this.config.enabled) return false;

    const levels: Record<LogLevel, number> = {
      debug: 0,
      info: 1,
      warn: 2,
      error: 3,
    };

    return levels[level] >= levels[this.config.level];
  }

  private formatMessage(
    level: LogLevel,
    message: string,
    ...args: unknown[]
  ): [string, ...unknown[]] {
    const timestamp = new Date().toISOString();
    const prefix = `[${timestamp}] [${level.toUpperCase()}]`;
    return [`${prefix} ${message}`, ...args];
  }

  debug(message: string, ...args: unknown[]): void {
    if (this.shouldLog("debug")) {
      console.debug(...this.formatMessage("debug", message, ...args));
    }
  }

  info(message: string, ...args: unknown[]): void {
    if (this.shouldLog("info")) {
      console.info(...this.formatMessage("info", message, ...args));
    }
  }

  warn(message: string, ...args: unknown[]): void {
    if (this.shouldLog("warn")) {
      console.warn(...this.formatMessage("warn", message, ...args));
    }
  }

  error(message: string, ...args: unknown[]): void {
    if (this.shouldLog("error")) {
      console.error(...this.formatMessage("error", message, ...args));
    }
  }
}

// Export a singleton instance
export const logger = new Logger();

// Export the class for testing purposes
export { Logger };
