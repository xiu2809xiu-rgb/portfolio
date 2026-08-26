import Image from 'next/image';
import Link from 'next/link';
import { ArrowUpRight } from 'lucide-react';
import { Reveal } from '@/components/common/Reveal';
import { SectionHeading } from '@/components/common/SectionHeading';
import { featuredProjects } from '@/content/projects';

export function FeaturedWork() {
  return (
    <section id="work" className="scroll-mt-24 py-20 md:py-28">
      <div className="wrap">
        <SectionHeading
          index="03"
          title="Featured work"
          description="Written up properly — the problem, what I actually built, and what changed as a result."
        />

        <ul className="grid gap-5 lg:grid-cols-2">
          {featuredProjects.map((project, index) => (
            <Reveal as="li" key={project.slug} delay={index * 0.1}>
              <Link
                href={`/work/${project.slug}`}
                className="group glass glass-hover block h-full overflow-hidden rounded-3xl"
              >
                {/* Projects without imagery yet get a typographic panel rather
                    than a grey placeholder box. */}
                <div className="relative aspect-[16/10] overflow-hidden border-b border-hairline bg-black/40">
                  {project.screenshots.length ? (
                    <>
                      <Image
                        src={project.screenshots[0].src}
                        alt={`${project.title} ${project.titleAccent} — ${project.screenshots[0].title}`}
                        fill
                        sizes="(max-width: 1024px) 100vw, 50vw"
                        className="object-cover object-top transition-transform duration-700 ease-out group-hover:scale-[1.04]"
                        priority={index === 0}
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-[#05070a] via-transparent to-transparent opacity-70" />
                    </>
                  ) : (
                    <div className="flex size-full flex-col justify-center bg-[radial-gradient(ellipse_at_30%_20%,rgba(180,255,57,0.10),transparent_60%)] p-7">
                      <p className="font-heading text-3xl font-extrabold tracking-tight text-foreground/90 sm:text-4xl">
                        {project.title}
                      </p>
                      <p className="mt-2 font-mono text-xs uppercase tracking-widest text-lime">
                        {project.titleAccent}
                      </p>
                    </div>
                  )}

                  {project.award ? (
                    <span className="absolute left-4 top-4 inline-flex items-center gap-1.5 rounded-full border border-lime/50 bg-lime/15 px-3 py-1 font-mono text-[0.62rem] uppercase tracking-widest text-lime backdrop-blur">
                      🥇 {project.award}
                    </span>
                  ) : null}
                </div>

                <div className="p-6 sm:p-7">
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-xs text-lime">{project.index}</span>
                    <span className="font-mono text-[0.65rem] uppercase tracking-widest text-muted-foreground">
                      {project.role}
                      {project.term ? ` · ${project.term}` : ''}
                    </span>
                  </div>

                  <h3 className="mt-3 flex items-start gap-2 font-heading text-xl font-extrabold tracking-tight sm:text-2xl">
                    <span>
                      {project.title}{' '}
                      <span className="text-lime">{project.titleAccent}</span>
                    </span>
                    <ArrowUpRight className="mt-1 size-5 shrink-0 text-muted-foreground transition-all group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-lime" />
                  </h3>

                  <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                    {project.summary}
                  </p>

                  <ul className="mt-5 flex flex-wrap gap-1.5">
                    {project.stack.slice(0, 5).map((tech) => (
                      <li
                        key={tech}
                        className="rounded-md border border-hairline px-2 py-1 font-mono text-[0.62rem] text-muted-foreground"
                      >
                        {tech}
                      </li>
                    ))}
                    {project.stack.length > 5 ? (
                      <li className="rounded-md px-2 py-1 font-mono text-[0.62rem] text-muted-foreground">
                        +{project.stack.length - 5}
                      </li>
                    ) : null}
                  </ul>
                </div>
              </Link>
            </Reveal>
          ))}
        </ul>

        <Reveal delay={0.2}>
          <div className="mt-8 text-center">
            <Link
              href="/work"
              className="link-underline font-mono text-xs uppercase tracking-widest text-muted-foreground transition-colors hover:text-foreground"
            >
              See all work →
            </Link>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
