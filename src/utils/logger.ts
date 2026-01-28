/**
 * Structured logging utility for the Klaviyo MCP Server
 *
 * Features:
 * - Log levels (debug, info, warn, error)
 * - Sensitive data masking
 * - Structured context
 */

import { LOG_CONFIG } from '../config.js';

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

const LOG_LEVELS: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
};

/**
 * Mask sensitive data in strings and objects
 */
function maskSensitiveData(data: unknown): unknown {
  if (!LOG_CONFIG.maskSensitiveData) return data;

  if (typeof data === 'string') {
    // Mask API keys
    return data.replace(/pk_[a-zA-Z0-9]+/g, 'pk_***MASKED***');
  }

  if (typeof data === 'object' && data !== null) {
    const masked: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(data)) {
      // Mask sensitive field names
      if (['api_key', 'apiKey', 'authorization', 'password', 'secret', 'token'].includes(key.toLowerCase())) {
        masked[key] = '***MASKED***';
      } else {
        masked[key] = maskSensitiveData(value);
      }
    }
    return masked;
  }

  return data;
}

/**
 * Format log message with timestamp and level
 */
function formatMessage(level: LogLevel, message: string, context?: unknown): string {
  const timestamp = new Date().toISOString();
  const levelStr = level.toUpperCase().padEnd(5);

  let output = `[${timestamp}] ${levelStr} ${message}`;

  if (context !== undefined) {
    const maskedContext = maskSensitiveData(context);
    output += ` ${JSON.stringify(maskedContext)}`;
  }

  return output;
}

/**
 * Check if a log level should be output
 */
function shouldLog(level: LogLevel): boolean {
  return LOG_LEVELS[level] >= LOG_LEVELS[LOG_CONFIG.level];
}

/**
 * Logger instance
 */
export const logger = {
  debug(message: string, context?: unknown): void {
    if (shouldLog('debug')) {
      console.error(formatMessage('debug', message, context));
    }
  },

  info(message: string, context?: unknown): void {
    if (shouldLog('info')) {
      console.error(formatMessage('info', message, context));
    }
  },

  warn(message: string, context?: unknown): void {
    if (shouldLog('warn')) {
      console.error(formatMessage('warn', message, context));
    }
  },

  error(message: string, context?: unknown): void {
    if (shouldLog('error')) {
      console.error(formatMessage('error', message, context));
    }
  },

  /**
   * Log an API request (if enabled)
   */
  request(method: string, url: string, body?: unknown): void {
    if (LOG_CONFIG.logRequests) {
      this.debug(`API Request: ${method} ${url}`, body ? { body: maskSensitiveData(body) } : undefined);
    }
  },

  /**
   * Log an API response (if enabled)
   */
  response(method: string, url: string, status: number, duration: number): void {
    if (LOG_CONFIG.logResponses) {
      this.debug(`API Response: ${method} ${url} -> ${status}`, { duration: `${duration}ms` });
    }
  },
};

export default logger;
