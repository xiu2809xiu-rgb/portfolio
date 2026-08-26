import { Reveal } from '@/components/common/Reveal';
import { SectionHeading } from '@/components/common/SectionHeading';
import { achievements, earlierExperience } from '@/content/resume';

export function AchievementsSection() {
  const main = achievements.filter((entry) => !entry.minor);
  const minor = achievements.filter((entry) => entry.minor);

  return (
    <section id="achievements" className="scroll-mt-24 py-20 md:py-28">
      <div className="wrap">
        <SectionHeading
          index="06"
          title="Achievements"
          description="Competitions, certifications, and the responsibilities I have been trusted with."
        />

        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {main.map((achievement, index) => (
            <Reveal as="li" key={achievement.title} delay={(index % 3) * 0.08}>
              <article className="glass glass-hover h-full rounded-2xl p-6">
                <span className="text-2xl" aria-hidden>
                  {achievement.icon}
                </span>
                <h3 className="mt-3 font-heading text-base font-bold leading-snug tracking-tight">
                  {achievement.title}
                </h3>
                <p className="mt-1 font-mono text-[0.65rem] uppercase tracking-widest text-lime">
                  {achievement.organisation}
                  {achievement.year ? ` · ${achievement.year}` : ''}
                </p>
                <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                  {achievement.body}
                </p>
              </article>
            </Reveal>
          ))}
        </ul>

        {/* Smaller, older entries — present for completeness, not competing
            with the case studies for attention. */}
        {minor.length || earlierExperience ? (
          <Reveal delay={0.15}>
            <div className="mt-8 space-y-2 border-t border-hairline pt-6">
              {minor.map((entry) => (
                <p key={entry.title} className="text-sm text-muted-foreground">
                  <span className="text-foreground">{entry.title}</span>
                  {' — '}
                  {entry.organisation}. {entry.body}
                </p>
              ))}
              <p className="text-sm text-muted-foreground">{earlierExperience}</p>
            </div>
          </Reveal>
        ) : null}
      </div>
    </section>
  );
}
