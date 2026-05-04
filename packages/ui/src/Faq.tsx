export type FaqItem = { q: string; a: string };
export type FaqProps = { title: string; items: FaqItem[] };

export function Faq({ title, items }: FaqProps): JSX.Element {
  return (
    <section className="container-reading py-14">
      <h2 className="text-2xl font-semibold tracking-tight text-ink-strong">{title}</h2>
      <div className="mt-8 divide-y divide-ink-strong/10 rounded-3xl border border-ink-strong/10 bg-surface-white">
        {items.map((it, i) => (
          <details
            key={i}
            className="group p-5 [&[open]]:bg-surface-warm/40"
          >
            <summary className="flex cursor-pointer items-center justify-between text-base font-medium text-ink-strong outline-none">
              <span>{it.q}</span>
              <span aria-hidden className="ms-3 text-brand-secondary transition-transform group-open:rotate-45">
                +
              </span>
            </summary>
            <p className="mt-3 text-sm leading-relaxed text-ink-soft">{it.a}</p>
          </details>
        ))}
      </div>
    </section>
  );
}
