/**
 * webext-error-boundary
 * Error boundary pattern for Chrome Extension UIs
 */

export interface ErrorBoundaryProps {
  fallback?: (error: Error, reset: () => void) => HTMLElement;
  onError?: (error: Error, errorInfo: ErrorBoundaryErrorInfo) => void;
  onReset?: () => void;
  errorStorageKey?: string;
  enableReporting?: boolean;
  maxRetries?: number;
}

export interface ErrorBoundaryErrorInfo {
  componentStack: string;
  timestamp: number;
  userAgent?: string;
  url?: string;
}

interface ErrorRecord {
  id: string;
  message: string;
  stack?: string;
  timestamp: number;
  componentStack?: string;
  resolved: boolean;
}

export class ErrorBoundary {
  private fallback?: ErrorBoundaryProps['fallback'];
  private onError?: ErrorBoundaryProps['onError'];
  private onReset?: ErrorBoundaryProps['onReset'];
  private errorStorageKey: string;
  private enableReporting: boolean;
  private maxRetries: number;
  private error: Error | null = null;
  private errorInfo: ErrorBoundaryErrorInfo | null = null;
  private retryCount = 0;
  private container: HTMLElement | null = null;

  constructor(props: ErrorBoundaryProps = {}) {
    this.fallback = props.fallback;
    this.onError = props.onError;
    this.onReset = props.onReset;
    this.errorStorageKey = props.errorStorageKey || 'error_boundary_errors';
    this.enableReporting = props.enableReporting !== false;
    this.maxRetries = props.maxRetries || 3;
  }

  wrap<T extends (...args: unknown[]) => unknown>(
    fn: T,
    errorMessage: string = 'Operation failed'
  ): (...args: Parameters<T>) => ReturnType<T> | undefined {
    return (...args: Parameters<T>): ReturnType<T> | undefined => {
      try {
        const result = fn(...args);
        if (result instanceof Promise) {
          return result.catch(error => {
            this.handleError(new Error(`${errorMessage}: ${error}`));
            return undefined;
          }) as ReturnType<T>;
        }
        return result;
      } catch (error) {
        this.handleError(error as Error);
        return undefined;
      }
    };
  }

  wrapComponent<P extends Record<string, unknown>>(
    Component: (props: P) => HTMLElement,
    props: P
  ): HTMLElement {
    try {
      return Component(props);
    } catch (error) {
      this.handleError(error as Error);
      return this.renderFallback();
    }
  }

  private handleError(error: Error): void {
    this.error = error;
    this.errorInfo = {
      componentStack: error.stack || '',
      timestamp: Date.now(),
      userAgent: navigator.userAgent,
      url: window.location.href
    };

    this.retryCount++;

    if (this.enableReporting) {
      this.reportError(error);
    }

    if (this.onError) {
      this.onError(error, this.errorInfo);
    }

    if (this.container) {
      this.renderFallback();
    }
  }

  private renderFallback(): HTMLElement {
    const container = this.container;
    if (!container) return document.createElement('div');

    container.innerHTML = '';

    if (this.fallback && this.error) {
      const fallbackElement = this.fallback(this.error, () => this.reset());
      container.appendChild(fallbackElement);
    } else {
      container.appendChild(this.createDefaultFallback());
    }

    return container;
  }

  private createDefaultFallback(): HTMLElement {
    const fallback = document.createElement('div');
    fallback.className = 'error-boundary-fallback';
    fallback.innerHTML = `
      <div class="error-content">
        <h2>Something went wrong</h2>
        <p class="error-message">${this.error?.message || 'An unexpected error occurred'}</p>
        <div class="error-actions">
          <button class="retry-btn">Try Again</button>
          <button class="report-btn">Report Issue</button>
        </div>
        ${this.retryCount > 1 ? `<p class="retry-warning">Retries: ${this.retryCount}/${this.maxRetries}</p>` : ''}
      </div>
      <style>
        .error-boundary-fallback {
          padding: 24px;
          text-align: center;
          background: #fff;
          border-radius: 8px;
          box-shadow: 0 2px 8px rgba(0,0,0,0.1);
          margin: 16px;
        }
        .error-content h2 {
          color: #d32f2f;
          margin: 0 0 12px;
        }
        .error-message {
          color: #666;
          font-family: monospace;
          background: #f5f5f5;
          padding: 12px;
          border-radius: 4px;
          margin: 12px 0;
        }
        .error-actions {
          display: flex;
          gap: 12px;
          justify-content: center;
          margin-top: 16px;
        }
        .retry-btn, .report-btn {
          padding: 8px 24px;
          border: none;
          border-radius: 4px;
          cursor: pointer;
          font-size: 14px;
        }
        .retry-btn {
          background: #1976d2;
          color: white;
        }
        .report-btn {
          background: #f5f5f5;
          color: #666;
        }
        .retry-warning {
          color: #f57c00;
          font-size: 12px;
          margin-top: 12px;
        }
      </style>
    `;

    const retryBtn = fallback.querySelector('.retry-btn');
    const reportBtn = fallback.querySelector('.report-btn');

    retryBtn?.addEventListener('click', () => this.reset());
    reportBtn?.addEventListener('click', () => this.reportError(this.error!));

    return fallback;
  }

  mount(containerId: string): void {
    const container = document.getElementById(containerId);
    if (!container) {
      throw new Error(`Container ${containerId} not found`);
    }
    this.container = container;
  }

  reset(): void {
    this.error = null;
    this.errorInfo = null;
    this.retryCount = 0;

    if (this.onReset) {
      this.onReset();
    }

    if (this.container) {
      this.container.innerHTML = '';
    }
  }

  private async reportError(error: Error): Promise<void> {
    const errorRecord: ErrorRecord = {
      id: `err_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      message: error.message,
      stack: error.stack,
      timestamp: Date.now(),
      componentStack: this.errorInfo?.componentStack,
      resolved: false
    };

    try {
      const stored = await chrome.storage.local.get(this.errorStorageKey);
      const errors: ErrorRecord[] = stored[this.errorStorageKey] || [];
      errors.push(errorRecord);

      const trimmed = errors.slice(-50);
      await chrome.storage.local.set({ [this.errorStorageKey]: trimmed });
    } catch (e) {
      console.error('[ErrorBoundary] Failed to store error:', e);
    }
  }

  async getErrorHistory(): Promise<ErrorRecord[]> {
    try {
      const stored = await chrome.storage.local.get(this.errorStorageKey);
      return stored[this.errorStorageKey] || [];
    } catch {
      return [];
    }
  }

  async clearErrorHistory(): Promise<void> {
    await chrome.storage.local.remove(this.errorStorageKey);
  }

  hasError(): boolean {
    return this.error !== null;
  }

  getError(): Error | null {
    return this.error;
  }

  getRetryCount(): number {
    return this.retryCount;
  }

  canRetry(): boolean {
    return this.retryCount < this.maxRetries;
  }
}

export class CrashReporter {
  private storageKey: string;
  private listeners: Set<(error: ErrorRecord) => void> = new Set();

  constructor(storageKey: string = 'crash_reporter_errors') {
    this.storageKey = storageKey;
    this.setupGlobalHandler();
  }

  private setupGlobalHandler(): void {
    window.addEventListener('error', (event) => {
      const error: Error = event.error || new Error(event.message);
      this.report(error, {
        type: 'unhandled-error',
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno
      });
    });

    window.addEventListener('unhandledrejection', (event) => {
      const error = event.reason instanceof Error 
        ? event.reason 
        : new Error(String(event.reason));
      this.report(error, { type: 'unhandled-rejection' });
    });
  }

  async report(error: Error, context?: Record<string, unknown>): Promise<void> {
    const record: ErrorRecord = {
      id: `crash_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      message: error.message,
      stack: error.stack,
      timestamp: Date.now(),
      resolved: false
    };

    try {
      const stored = await chrome.storage.local.get(this.storageKey);
      const crashes: ErrorRecord[] = stored[this.storageKey] || [];
      crashes.push(record);

      const trimmed = crashes.slice(-100);
      await chrome.storage.local.set({ [this.storageKey]: trimmed });

      this.notifyListeners(record);
    } catch (e) {
      console.error('[CrashReporter] Failed to report:', e);
    }
  }

  async getCrashes(): Promise<ErrorRecord[]> {
    try {
      const stored = await chrome.storage.local.get(this.storageKey);
      return stored[this.storageKey] || [];
    } catch {
      return [];
    }
  }

  async markResolved(crashId: string): Promise<void> {
    try {
      const crashes = await this.getCrashes();
      const updated = crashes.map(c => 
        c.id === crashId ? { ...c, resolved: true } : c
      );
      await chrome.storage.local.set({ [this.storageKey]: updated });
    } catch (e) {
      console.error('[CrashReporter] Failed to mark resolved:', e);
    }
  }

  async clearCrashes(): Promise<void> {
    await chrome.storage.local.remove(this.storageKey);
  }

  subscribe(listener: (error: ErrorRecord) => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notifyListeners(error: ErrorRecord): void {
    this.listeners.forEach(listener => {
      try {
        listener(error);
      } catch (e) {
        console.error('[CrashReporter] Listener error:', e);
      }
    });
  }
}

export function createErrorBoundary(props?: ErrorBoundaryProps): ErrorBoundary {
  return new ErrorBoundary(props);
}

export function createCrashReporter(storageKey?: string): CrashReporter {
  return new CrashReporter(storageKey);
}

export function withErrorBoundary<P extends Record<string, unknown>>(
  Component: (props: P) => HTMLElement,
  props: P,
  errorBoundary: ErrorBoundary
): HTMLElement {
  return errorBoundary.wrapComponent(Component, props);
}
