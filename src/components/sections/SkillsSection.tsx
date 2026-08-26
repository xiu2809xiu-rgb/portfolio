import { Reveal } from '@/components/common/Reveal';
import { SectionHeading } from '@/components/common/SectionHeading';
import { skillGroups } from '@/content/resume';

/**
 * Grouped technology list.
 *
 * The proficiency bars that used to sit here are gone: self-assessed percentages
 * are unverifiable and needed a disclaimer that conceded as much. What each of
 * these was actually used for is in the case studies, which is a better answer.
 */
export function SkillsSection() {
  return (
    <section id="skills" className="scroll-mt-24 py-20 md:py-28">
      <div className="wrap">
        <SectionHeading
          index="02"
          title="Skills"
          description="What I build with. Where each of these was actually used is in the case studies."
        />

        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {skillGroups.map((group, index) => (
            <Reveal as="li" key={group.name} delay={index * 0.06}>
              <div className="glass glass-hover flex h-full flex-col rounded-2xl p-6">
                <span className="text-2xl" aria-hidden>
                  {group.icon}
                </span>
                <h3 className="mt-3 font-heading text-lg font-bold tracking-tight">
                  {group.name}
                </h3>
                <p className="mt-1 text-sm text-muted-foreground">{group.blurb}</p>

                <ul className="mt-4 flex flex-wrap gap-1.5">
                  {group.items.map((item) => (
                    <li
                      key={item}
                      className="rounded-full border border-hairline px-2.5 py-1 font-mono text-[0.65rem] text-muted-foreground"
                    >
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            </Reveal>
          ))}
        </ul>
      </div>
    </section>
  );
}
