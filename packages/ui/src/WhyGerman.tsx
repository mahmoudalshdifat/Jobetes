export type WhyGermanProps = {
  title: string;
  body: string;
  bulletEmojis?: readonly [string, string, string];
  bullets?: readonly [string, string, string];
};

export function WhyGerman({
  title,
  body,
  bulletEmojis = ['🎓', '🛡', '🌍'],
  bullets,
}: WhyGermanProps): JSX.Element {
  return (
    <section className="bg-surface-white">
      <div className="container-reading py-16">
        <div className="grid gap-10 lg:grid-cols-[1fr_1.2fr] lg:items-start">
          <div>
            <h2 className="text-3xl font-semibold tracking-tight text-ink-strong">{title}</h2>
            <p className="mt-4 max-w-prose text-lg text-ink-soft">{body}</p>
          </div>
          {bullets ? (
            <ul className="space-y-4">
              {bullets.map((b, i) => (
                <li key={i} className="flex items-start gap-4 rounded-2xl bg-surface-warm p-5">
                  <span aria-hidden className="text-2xl">
                    {bulletEmojis[i] ?? '•'}
                  </span>
                  <p className="text-base text-ink-strong">{b}</p>
                </li>
              ))}
            </ul>
          ) : null}
        </div>
      </div>
    </section>
  );
}
