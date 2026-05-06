import React, { useCallback, useEffect, useState, Suspense, Component, type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { EmergencyBanner, LangToggle, Button, cn, ThemeToggle, getTheme, setTheme, listenSystemTheme, ToastProvider } from '@jobetes/ui';
import type { Locale } from '@jobetes/shared-schemas';
import { AuthProvider, useAuth } from './auth/AuthContext.js';
import { HomePage } from './pages/HomePage.js';

const DoctorPage = React.lazy(() => import('./pages/DoctorPage.js').then((m) => ({ default: m.DoctorPage })));
const IntakePage = React.lazy(() => import('./pages/IntakePage.js').then((m) => ({ default: m.IntakePage })));
const AppointmentPage = React.lazy(() => import('./pages/AppointmentPage.js').then((m) => ({ default: m.AppointmentPage })));
const LegalPage = React.lazy(() => import('./pages/LegalPage.js').then((m) => ({ default: m.LegalPage })));
const LoginPage = React.lazy(() => import('./pages/LoginPage.js').then((m) => ({ default: m.LoginPage })));

type Route = 'home' | 'doctor' | 'intake' | 'appointment' | 'legal' | 'login';

const VALID_ROUTES: Route[] = ['home', 'doctor', 'intake', 'appointment', 'legal', 'login'];

function parseHash(): Route {
  const hash = window.location.hash.replace(/^#\/?/, '');
  return (VALID_ROUTES.includes(hash as Route) ? hash : 'home') as Route;
}

function useHashRoute(): [Route, (r: Route) => void] {
  const [route, setRouteState] = useState<Route>(parseHash);

  useEffect(() => {
    const onHashChange = () => setRouteState(parseHash());
    window.addEventListener('hashchange', onHashChange);
    return () => window.removeEventListener('hashchange', onHashChange);
  }, []);

  const setRoute = useCallback((r: Route) => {
    window.location.hash = r === 'home' ? '' : r;
    setRouteState(r);
  }, []);

  return [route, setRoute];
}

/** Simple centered spinner for Suspense fallback. */
function PageLoader(): JSX.Element {
  return (
    <div className="flex items-center justify-center py-24">
      <div className="h-8 w-8 animate-spin rounded-full border-2 border-brand-primary border-t-transparent" />
    </div>
  );
}

/** React Error Boundary to prevent total white-screen crashes. */
class ErrorBoundary extends Component<{ children: ReactNode; onReset: () => void }, { hasError: boolean }> {
  constructor(props: { children: ReactNode; onReset: () => void }) {
    super(props);
    this.state = { hasError: false };
  }

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

function AppShell(): JSX.Element {
  const { t, i18n } = useTranslation();
  const { status, signOut } = useAuth();
  const [route, setRoute] = useHashRoute();
  const [theme, setThemeState] = React.useState<ReturnType<typeof getTheme>>(getTheme);
  const [mobileOpen, setMobileOpen] = React.useState(false);

  React.useEffect(() => {
    const unsubscribe = listenSystemTheme(() => {
      if (theme === 'system') setTheme('system');
    });
    return unsubscribe;
  }, [theme]);

  const handleThemeChange = (newTheme: React.ComponentProps<typeof ThemeToggle>['current']) => {
    setThemeState(newTheme);
    setTheme(newTheme);
  };

  const closeMobile = () => setMobileOpen(false);

  // Update document title on route change
  useEffect(() => {
    const titleKey = `page.title.${route}` as const;
    const brandName = t('brand.name');
    const pageTitle = t(titleKey, { defaultValue: brandName });
    document.title = pageTitle === brandName ? brandName : `${pageTitle} — ${brandName}`;
  }, [route, t]);

  const navItems: { key: Route; label: string }[] = [
    { key: 'doctor', label: t('nav.doctor') },
    { key: 'intake', label: t('nav.intake') },
    { key: 'appointment', label: t('nav.appointment') },
    { key: 'legal', label: t('nav.legal') },
  ];

  return (
    <div className="min-h-screen bg-surface-warm dark:bg-ink-strong">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:z-50 focus:rounded-b-2xl focus:bg-brand-primary focus:px-4 focus:py-2 focus:text-white"
      >
        {t('a11y.skipToContent')}
      </a>

      <EmergencyBanner message={t('emergency.banner')} />

      <header className="border-b border-ink-strong/10 bg-surface-white/80 backdrop-blur dark:border-surface-white/10 dark:bg-ink-strong/80">
        <div className="container-reading flex items-center justify-between py-3">
          <button
            type="button"
            onClick={() => setRoute('home')}
            className="text-lg font-semibold tracking-tight text-brand-primary"
          >
            {t('brand.name')}
          </button>
          <div className="flex items-center gap-2">
            <nav className="hidden items-center gap-2 text-sm md:flex" aria-label={t('nav.label')}>
              {navItems.map((item) => (
                <button
                  key={item.key}
                  type="button"
                  onClick={() => setRoute(item.key)}
                  aria-current={route === item.key ? 'page' : undefined}
                  className={cn(
                    'px-2 py-1 rounded-lg transition-colors',
                    route === item.key
                      ? 'bg-brand-primary/10 text-brand-primary font-medium'
                      : 'text-ink-soft hover:bg-ink-strong/5',
                  )}
                >
                  {item.label}
                </button>
              ))}
              {status === 'authenticated' ? (
                <button type="button" onClick={() => void signOut()} className="px-2 py-1">
                  {t('auth.signOut')}
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => setRoute('login')}
                  aria-current={route === 'login' ? 'page' : undefined}
                  className={cn(
                    'px-2 py-1 rounded-lg transition-colors',
                    route === 'login'
                      ? 'bg-brand-primary/10 text-brand-primary font-medium'
                      : 'text-ink-soft hover:bg-ink-strong/5',
                  )}
                >
                  {t('nav.login')}
                </button>
              )}
              <LangToggle
                current={i18n.resolvedLanguage as Locale}
                onChange={(loc) => void i18n.changeLanguage(loc)}
                label={t('lang.toggle')}
              />
              <ThemeToggle current={theme} onChange={handleThemeChange} />
            </nav>

            {/* Mobile menu toggle */}
            <button
              type="button"
              className="inline-flex h-10 w-10 items-center justify-center rounded-lg text-ink-strong md:hidden dark:text-surface-white"
              aria-label={t('nav.toggle')}
              aria-expanded={mobileOpen}
              onClick={() => setMobileOpen((o) => !o)}
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden>
                {mobileOpen ? (
                  <>
                    <line x1="18" y1="6" x2="6" y2="18" />
                    <line x1="6" y1="6" x2="18" y2="18" />
                  </>
                ) : (
                  <>
                    <line x1="3" y1="6" x2="21" y2="6" />
                    <line x1="3" y1="12" x2="21" y2="12" />
                    <line x1="3" y1="18" x2="21" y2="18" />
                  </>
                )}
              </svg>
            </button>
          </div>

          {/* Mobile nav dropdown */}
          {mobileOpen ? (
            <div className="absolute inset-x-0 top-full z-50 border-b border-ink-strong/10 bg-surface-white/95 p-4 shadow-lg backdrop-blur md:hidden dark:border-surface-white/10 dark:bg-ink-strong/95">
              <nav className="flex flex-col gap-2" aria-label={t('nav.label')}>
                {navItems.map((item) => (
                  <button
                    key={item.key}
                    type="button"
                    onClick={() => { setRoute(item.key); closeMobile(); }}
                    aria-current={route === item.key ? 'page' : undefined}
                    className={cn(
                      'px-3 py-2 rounded-lg text-start transition-colors',
                      route === item.key
                        ? 'bg-brand-primary/10 text-brand-primary font-medium'
                        : 'text-ink-soft hover:bg-ink-strong/5 dark:text-ink-soft',
                    )}
                  >
                    {item.label}
                  </button>
                ))}
                {status === 'authenticated' ? (
                  <button type="button" onClick={() => { void signOut(); closeMobile(); }} className="px-3 py-2 text-start">
                    {t('auth.signOut')}
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => { setRoute('login'); closeMobile(); }}
                    aria-current={route === 'login' ? 'page' : undefined}
                    className={cn(
                      'px-3 py-2 rounded-lg text-start transition-colors',
                      route === 'login'
                        ? 'bg-brand-primary/10 text-brand-primary font-medium'
                        : 'text-ink-soft hover:bg-ink-strong/5',
                    )}
                  >
                    {t('nav.login')}
                  </button>
                )}
                <div className="flex items-center gap-2 px-3 pt-2">
                  <LangToggle
                    current={i18n.resolvedLanguage as Locale}
                    onChange={(loc) => void i18n.changeLanguage(loc)}
                    label={t('lang.toggle')}
                  />
                  <ThemeToggle current={theme} onChange={handleThemeChange} />
                </div>
              </nav>
            </div>
          ) : null}
        </div>
      </header>

      <main id="main-content">
        <ErrorBoundary onReset={() => setRoute('home')}>
          <Suspense fallback={<PageLoader />}>
            {route === 'home' ? <HomePage onStartIntake={() => setRoute('intake')} /> : null}
            {route === 'doctor' ? <DoctorPage /> : null}
            {route === 'intake' ? <IntakePage /> : null}
            {route === 'appointment' ? <AppointmentPage /> : null}
            {route === 'legal' ? <LegalPage /> : null}
            {route === 'login' ? <LoginPage onSuccess={() => setRoute('home')} /> : null}
          </Suspense>
        </ErrorBoundary>
      </main>

      <footer className="mt-16 border-t border-ink-strong/10 bg-surface-white py-8 text-center text-sm text-ink-soft dark:border-surface-white/10 dark:bg-ink-strong dark:text-ink-soft">
        <div className="container-reading">{t('footer.copyright')}</div>
      </footer>
    </div>
  );
}

export function App(): JSX.Element {
  return (
    <ToastProvider>
      <AuthProvider>
        <AppShell />
      </AuthProvider>
    </ToastProvider>
  );
}
