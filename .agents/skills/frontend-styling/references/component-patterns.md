# Component Patterns

## Standard Component Structure

Components in `packages/ui/src/` follow this pattern:

1. **Prop types** extending HTML element attributes
2. **Variant/size maps** as `Record<string, string>` constants
3. **Forward ref** for composability
4. **`cn()` merging** with base classes, variant classes, and `className` override last

## Example

```tsx
import { forwardRef } from 'react';
import { cn } from './cn.js';

export type MyVariant = 'default' | 'active';

export interface MyComponentProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: MyVariant;
}

const VARIANT_STYLES: Record<MyVariant, string> = {
  default: 'bg-surface-warm text-ink-strong',
  active: 'bg-brand-primary text-white',
};

export const MyComponent = forwardRef<HTMLDivElement, MyComponentProps>(
  function MyComponent({ variant = 'default', className, children, ...rest }, ref) {
    return (
      <div
        ref={ref}
        className={cn(
          'rounded-2xl p-4 transition-colors',
          VARIANT_STYLES[variant],
          className,
        )}
        {...rest}
      >
        {children}
      </div>
    );
  }
);
```

## Rules

- Always accept `className` prop and pass it as the **last** argument to `cn()`
- Use Tailwind utility classes; avoid inline `style` props
- Prefer semantic color tokens (`bg-brand-primary`) over raw hex values
- Export new shared components from `packages/ui/src/index.ts`
- Add a co-located `.test.tsx` file for shared UI components

## App-level patterns

### Code-splitting with React.lazy

Route-level pages should be lazy-loaded to reduce initial bundle size:

```tsx
import React, { Suspense } from 'react';

const DoctorPage = React.lazy(() =>
  import('./pages/DoctorPage.js').then((m) => ({ default: m.DoctorPage })),
);

// In render:
<Suspense fallback={<PageLoader />}>
  {route === 'doctor' ? <DoctorPage /> : null}
</Suspense>
```

Keep `HomePage` eager (it is the landing page). Always provide a simple fallback spinner.

### Error Boundary

Wrap route content in an Error Boundary to prevent white-screen crashes:

```tsx
class ErrorBoundary extends Component<{ children: ReactNode; onReset: () => void }, { hasError: boolean }> {
  static getDerivedStateFromError() {
    return { hasError: true };
  }

  override render() {
    if (this.state.hasError) {
      return (
        <section className="container-reading py-12 text-center">
          <h1 className="text-xl font-semibold text-ink-strong">Something went wrong</h1>
          <p className="mt-2 text-ink-soft">Please try again or go back home.</p>
          <Button className="mt-6" onClick={() => { this.setState({ hasError: false }); this.props.onReset(); }}>
            Go home
          </Button>
        </section>
      );
    }
    return this.props.children;
  }
}
```

### Accessibility

- **Skip link**: Add as first focusable element, `sr-only` until focused
- **`aria-current="page"`**: Add to active navigation buttons
- **`aria-label`**: Add to `<nav>` landmarks
- **Focus-visible**: Always use `focus-visible:ring-*` instead of `focus:ring-*`
