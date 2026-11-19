import { Counter } from '@/components/common/Counter';
import { Reveal } from '@/components/common/Reveal';
import { profileContent } from '@/content/localized/profile';
import { homeDict } from '@/i18n/dictionaries/home';
import { getLocale } from '@/i18n/server';

export async function StatsBand() {
  const locale = await getLocale();
  const t = homeDict[locale].stats;
  const { headlineStats } = profileContent[locale];

  return (
    <section className="border-b border-hairline py-12 md:py-16" aria-label={t.label}>
      <div className="wrap grid grid-cols-2 gap-8 md:grid-cols-4">
        {headlineStats.map((stat, index) => (
          <Reveal key={stat.label} delay={index * 0.08}>
            <p className="font-heading text-3xl font-extrabold tracking-tight text-lime sm:text-4xl md:text-5xl">
              <Counter value={stat.value} suffix={stat.suffix} />
            </p>
            <p className="mt-2 font-mono text-[0.65rem] uppercase tracking-widest text-muted-foreground">
              {stat.label}
            </p>
          </Reveal>
        ))}
      </div>
    </section>
  );
}
