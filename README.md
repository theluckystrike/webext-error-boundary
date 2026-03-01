# webext-error-boundary — Error Boundary for Extension UIs
> **Built by [Zovo](https://zovo.one)** | `npm i webext-error-boundary`

Catch errors, show fallback UI with retry, protect containers, and install global handlers.

```typescript
import { ErrorBoundary } from 'webext-error-boundary';
const eb = new ErrorBoundary('app');
eb.setErrorHandler((e) => reportCrash(e));
eb.protect(() => renderApp());
eb.installGlobal();
const result = await eb.wrapAsync(() => riskyOperation());
```
MIT License
