import { Reveal } from '@/components/common/Reveal';
import { SectionHeading } from '@/components/common/SectionHeading';
import { achievements, earlierExperience } from '@/content/resume';
import { AwardCard } from './AwardCard';

/**
 * Achievements, with the first-place result rendered as a holographic card.
 *
 * The card is not decoration bolted onto a list. A holo finish means the rare
 * one, so the section is arranged the way a page of cards is: the pull on the
 * left, the rest of the set beside it. The entry the card stands for is flagged
 * `featured` in the résumé data and filtered out here, so it is never printed
 * twice.
 *
 * The remaining entries lost their emoji in the process. Beside something that
 * is actually rendered, a row of emoji reads as placeholder art — the same
 * objection that took them off the pitch page — so they are numbered instead,
 * which matches the mono idiom the rest of the site already uses.
 */
export function AchievementsSection() {
  const featured = achievements.find((entry) => entry.featured);
  const main = achievements.filter((entry) => !entry.minor && !entry.featured);
  const minor = achievements.filter((entry) => entry.minor);

  return (
    <section id="achievements" className="scroll-mt-24 py-20 md:py-28">
      <div className="wrap">
        <SectionHeading
          index="06"
          title="Achievements"
          description="Competitions, certifications, and the responsibilities I have been trusted with."
        />

        <div className="grid gap-12 lg:grid-cols-[22rem_1fr] lg:gap-16">
          {featured ? (
            <Reveal>
              <div>
                <AwardCard />
                <p className="mx-auto mt-6 max-w-[22rem] text-center text-sm leading-relaxed text-muted-foreground">
                  {featured.body}
                </p>
              </div>
            </Reveal>
          ) : null}

          <ul className="space-y-px">
            {main.map((achievement, index) => (
              <Reveal as="li" key={achievement.title} delay={index * 0.06}>
                <article className="group border-t border-hairline py-5 transition-colors hover:border-lime/40">
                  <div className="flex items-baseline gap-4">
                    <span className="font-mono text-[0.65rem] tabular-nums text-muted-foreground/60">
                      {String(index + 2).padStart(2, '0')}
                    </span>
                    <div className="min-w-0 flex-1">
                      <h3 className="font-heading text-base font-bold leading-snug tracking-tight">
                        {achievement.title}
                      </h3>
                      <p className="mt-1 font-mono text-[0.65rem] uppercase tracking-widest text-lime">
                        {achievement.organisation}
                        {achievement.year ? ` · ${achievement.year}` : ''}
                      </p>
                      <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                        {achievement.body}
                      </p>
                    </div>
                  </div>
                </article>
              </Reveal>
            ))}
          </ul>
        </div>

        {/* Smaller, older entries — present for completeness, not competing
            with the case studies for attention. */}
        {minor.length || earlierExperience ? (
          <Reveal delay={0.15}>
            <div className="mt-10 space-y-2 border-t border-hairline pt-6">
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
