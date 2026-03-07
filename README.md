[![CI](https://github.com/theluckystrike/webext-error-boundary/actions/workflows/ci.yml/badge.svg)](https://github.com/theluckystrike/webext-error-boundary/actions)
[![npm](https://img.shields.io/npm/v/webext-error-boundary)](https://www.npmjs.com/package/webext-error-boundary)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue.svg)](https://www.typescriptlang.org/)

# webext-error-boundary

Error boundary for Chrome extension UIs - catch rendering errors, fallback UI, crash reporting integration, and recovery actions for MV3.

## Installation

```bash
npm install webext-error-boundary
```

```bash
npm i webext-error-boundary
```

## Usage

```typescript
import { ErrorBoundary } from 'webext-error-boundary';

const eb = new ErrorBoundary('app');
eb.setErrorHandler((e) => reportCrash(e));
eb.protect(() => renderApp());
eb.installGlobal();
const result = await eb.wrapAsync(() => riskyOperation());
```

## API

### Constructor

```typescript
new ErrorBoundary(containerId: string)
```

Creates an error boundary that wraps the specified container element.

### Methods

**setFallback(html: string): this**

Set custom fallback HTML to display when an error occurs.

**setErrorHandler(handler: (error: Error) => void): this**

Set a custom error handler callback that receives the error.

**wrap<T>(fn: () => T): T | null**

Wrap a synchronous function with error boundary protection. Returns the function result or null on error.

**wrapAsync<T>(fn: () => Promise<T>): Promise<T | null>**

Wrap an asynchronous function with error boundary protection. Returns the promise result or null on error.

**protect(renderFn: () => string): this**

Protect a container by catching errors during render. Stores original content for retry functionality.

**installGlobal(): this**

Install global error handlers for uncaught errors and unhandled promise rejections.

### Default Fallback

When an error occurs and no custom fallback is set, a default error UI is displayed with:
- Warning icon
- "Something went wrong" message
- "Try Again" button to retry the last rendered content

## Example

```typescript
// Initialize error boundary for your app container
const boundary = new ErrorBoundary('root');

// Optional: integrate with your crash reporting
boundary.setErrorHandler((error) => {
  console.error('Crash reported:', error);
});

// Protect your render function
boundary.protect(() => {
  document.getElementById('root').innerHTML = renderApp();
});

// Install global handlers for uncaught errors
boundary.installGlobal();

// Wrap async operations
const data = await boundary.wrapAsync(() => fetchData());
```

## Requirements

- TypeScript 5.3+
- Chrome Extension with Manifest V3

## About

Built by theluckystrike. Part of the zovo.one ecosystem for building resilient browser extensions.

MIT License

## License

MIT
