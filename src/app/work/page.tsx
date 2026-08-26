import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowUpRight } from 'lucide-react';
import { Reveal } from '@/components/common/Reveal';
import { projects } from '@/content/projects';

export const metadata: Metadata = {
  title: 'Work',
  description:
    'Case studies from shipped work — SmartRecap (1st place, NYP × AWS Hackathon 2026), CertAIn, Singink, SwapLah, and a CCA website built from wireframe to deploy.',
  alternates: { canonical: '/work' },
};

export default function WorkPage() {
  return (
    <div className="wrap pb-24 pt-32 md:pt-40">
      <header className="max-w-3xl">
        <p className="eyebrow">~/richie/work</p>
        <h1 className="mt-4 font-heading text-[clamp(2.25rem,7vw,4.5rem)] font-extrabold leading-[1.02] tracking-[-0.03em]">
          Things I have <span className="text-gradient-lime">actually shipped</span>
        </h1>
        <p className="mt-5 text-base leading-relaxed text-muted-foreground sm:text-lg">
          Full case studies. Each covers the problem I was handed, what I built, the trade-offs I
          made, and what changed as a result — not just a screenshot and a tech list.
        </p>
      </header>

      <ul className="mt-16 space-y-6">
        {projects.map((project, index) => (
          <Reveal as="li" key={project.slug} delay={index * 0.08}>
            <Link
              href={`/work/${project.slug}`}
              className="group glass glass-hover grid overflow-hidden rounded-3xl lg:grid-cols-[1.1fr_1fr]"
            >
              <div className="relative aspect-[16/10] overflow-hidden bg-black/40 lg:aspect-auto lg:min-h-[22rem]">
                {project.screenshots.length ? (
                  <>
                    <Image
                      src={project.screenshots[0].src}
                      alt={`${project.title} ${project.titleAccent}`}
                      fill
                      sizes="(max-width: 1024px) 100vw, 55vw"
                      className="object-cover object-top transition-transform duration-700 ease-out group-hover:scale-[1.04]"
                      priority={index === 0}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#05070a]/80 via-transparent to-transparent" />
                  </>
                ) : (
                  <div className="flex size-full flex-col justify-center bg-[radial-gradient(ellipse_at_30%_20%,rgba(180,255,57,0.10),transparent_60%)] p-8">
                    <p className="font-heading text-4xl font-extrabold tracking-tight text-foreground/90">
                      {project.title}
                    </p>
                    <p className="mt-2 font-mono text-xs uppercase tracking-widest text-lime">
                      {project.titleAccent}
                    </p>
                  </div>
                )}

                {project.award ? (
                  <span className="absolute left-5 top-5 inline-flex items-center gap-1.5 rounded-full border border-lime/50 bg-lime/15 px-3 py-1 font-mono text-[0.62rem] uppercase tracking-widest text-lime backdrop-blur">
                    🥇 {project.award}
                  </span>
                ) : null}
              </div>

              <div className="flex flex-col justify-center p-7 sm:p-10">
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                  <span className="font-mono text-xs text-lime">{project.index}</span>
                  <span className="font-mono text-[0.65rem] uppercase tracking-widest text-muted-foreground">
                    {project.role}
                  </span>
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-success/30 bg-success/10 px-2.5 py-0.5 font-mono text-[0.6rem] uppercase tracking-widest text-success">
                    <span className="size-1.5 rounded-full bg-success" />
                    {project.status === 'completed' ? 'Completed' : 'In progress'}
                  </span>
                </div>

                <h2 className="mt-3 flex items-start gap-2 font-heading text-2xl font-extrabold tracking-tight sm:text-3xl">
                  <span>
                    {project.title} <span className="text-lime">{project.titleAccent}</span>
                  </span>
                  <ArrowUpRight className="mt-1.5 size-5 shrink-0 text-muted-foreground transition-all group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-lime" />
                </h2>

                <p className="mt-1 font-mono text-xs text-muted-foreground">
                  {project.module}
                  {project.term ? ` · ${project.term}` : ''}
                </p>
                {project.team ? (
                  <p className="mt-1 font-mono text-xs text-muted-foreground">{project.team}</p>
                ) : null}

                <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
                  {project.summary}
                </p>

                <ul className="mt-6 grid grid-cols-2 gap-4 border-t border-hairline pt-5 sm:grid-cols-4">
                  {project.metrics.map((metric) => (
                    <li key={metric.label}>
                      <p className="font-heading text-lg font-extrabold text-lime">
                        {metric.value}
                        {metric.suffix ?? ''}
                      </p>
                      <p className="mt-0.5 font-mono text-[0.58rem] uppercase tracking-wider text-muted-foreground">
                        {metric.label}
                      </p>
                    </li>
                  ))}
                </ul>
              </div>
            </Link>
          </Reveal>
        ))}
      </ul>
    </div>
  );
}
