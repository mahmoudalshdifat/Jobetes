export type Testimonial = { body: string; author: string };
export type TestimonialsProps = { title: string; items: Testimonial[] };

/**
 * Patient-quote section. Phase 0 ships placeholder personas — replace
 * with real, consented quotes before public launch.
 */
export function Testimonials({ title, items }: TestimonialsProps): JSX.Element {
  return (
    <section className="container-reading py-14">
      <h2 className="text-2xl font-semibold tracking-tight text-ink-strong">{title}</h2>
      <ul className="mt-8 grid gap-6 md:grid-cols-3">
        {items.map((t, i) => (
          <li
            key={i}
            className="rounded-3xl border border-ink-strong/10 bg-surface-white p-6 shadow-sm"
          >
            <blockquote className="text-base leading-relaxed text-ink-strong">
              <span aria-hidden className="text-3xl leading-none text-brand-secondary">
                “
              </span>
              <p className="mt-2">{t.body}</p>
            </blockquote>
            <footer className="mt-4 text-sm text-ink-soft">{t.author}</footer>
          </li>
        ))}
      </ul>
    </section>
  );
}
