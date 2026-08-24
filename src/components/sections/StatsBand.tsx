import { Counter } from '@/components/common/Counter';
import { Reveal } from '@/components/common/Reveal';
import { headlineStats } from '@/content/profile';

export function StatsBand() {
  return (
    <section className="border-b border-hairline py-12 md:py-16" aria-label="At a glance">
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
