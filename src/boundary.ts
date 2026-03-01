/**
 * Error Boundary — Catch errors and show fallback UI
 */
export class ErrorBoundary {
    private containerId: string;
    private fallbackHtml: string;
    private onError: ((error: Error) => void) | null = null;
    private originalContent = '';

    constructor(containerId: string) {
        this.containerId = containerId;
        this.fallbackHtml = `<div style="font-family:-apple-system,sans-serif;padding:24px;text-align:center">
      <div style="font-size:32px;margin-bottom:12px">⚠️</div>
      <h3 style="margin:0 0 8px;font-size:16px;color:#1F2937">Something went wrong</h3>
      <p style="margin:0 0 16px;font-size:14px;color:#6B7280">An unexpected error occurred.</p>
      <button id="__eb_retry__" style="padding:8px 20px;background:#3B82F6;color:#fff;border:none;border-radius:6px;cursor:pointer;font-size:14px">Try Again</button></div>`;
    }

    /** Set custom fallback HTML */
    setFallback(html: string): this { this.fallbackHtml = html; return this; }

    /** Set error handler */
    setErrorHandler(handler: (error: Error) => void): this { this.onError = handler; return this; }

    /** Wrap a function with error boundary */
    wrap<T>(fn: () => T): T | null {
        try { return fn(); } catch (error) { this.handleError(error as Error); return null; }
    }

    /** Wrap an async function with error boundary */
    async wrapAsync<T>(fn: () => Promise<T>): Promise<T | null> {
        try { return await fn(); } catch (error) { this.handleError(error as Error); return null; }
    }

    /** Protect a container — catch any errors within */
    protect(renderFn: () => string): this {
        const container = document.getElementById(this.containerId);
        if (!container) return this;
        try {
            this.originalContent = renderFn();
            container.innerHTML = this.originalContent;
        } catch (error) { this.handleError(error as Error); }
        return this;
    }

    /** Install global error handler */
    installGlobal(): this {
        window.addEventListener('error', (e) => this.handleError(e.error || new Error(e.message)));
        window.addEventListener('unhandledrejection', (e) => this.handleError(new Error(e.reason?.message || String(e.reason))));
        return this;
    }

    private handleError(error: Error): void {
        console.error('[ErrorBoundary]', error);
        this.onError?.(error);
        const container = document.getElementById(this.containerId);
        if (container) {
            container.innerHTML = this.fallbackHtml;
            container.querySelector('#__eb_retry__')?.addEventListener('click', () => {
                if (this.originalContent) container.innerHTML = this.originalContent;
            });
        }
    }
}
