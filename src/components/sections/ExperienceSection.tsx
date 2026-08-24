import { Reveal } from '@/components/common/Reveal';
import { SectionHeading } from '@/components/common/SectionHeading';
import { experience } from '@/content/resume';

export function ExperienceSection() {
  return (
    <section id="experience" className="scroll-mt-24 py-20 md:py-28">
      <div className="wrap">
        <SectionHeading index="04" title="Experience" />

        <ol className="relative">
          {experience.map((entry, index) => (
            <Reveal as="li" key={entry.title} delay={index * 0.07}>
              <div className="group grid gap-3 border-t border-hairline py-8 md:grid-cols-[10rem_1fr] md:gap-10">
                <p className="font-mono text-[0.68rem] uppercase tracking-widest text-lime md:pt-1">
                  {entry.period}
                </p>

                <div>
                  <h3 className="font-heading text-xl font-bold tracking-tight sm:text-2xl">
                    {entry.title}
                  </h3>
                  <p className="mt-1 font-mono text-xs text-muted-foreground">
                    {entry.organisation}
                  </p>
                  <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted-foreground">
                    {entry.description}
                  </p>

                  {entry.coursework ? (
                    <ul className="mt-4 flex flex-wrap gap-1.5">
                      {entry.coursework.map((course) => (
                        <li
                          key={course}
                          className="rounded-md border border-hairline px-2 py-1 font-mono text-[0.62rem] text-muted-foreground"
                        >
                          {course}
                        </li>
                      ))}
                    </ul>
                  ) : null}
                </div>
              </div>
            </Reveal>
          ))}
        </ol>
      </div>
    </section>
  );
}
