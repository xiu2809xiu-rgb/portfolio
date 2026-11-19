import type { Metadata } from 'next';
import { Link } from '@/i18n/Link';
import { notFound } from 'next/navigation';
import { ArrowLeft, ArrowUpRight, Lightbulb } from 'lucide-react';
import { Reveal } from '@/components/common/Reveal';
import { CodeBlock } from '@/components/work/CodeBlock';
import { ProjectGallery } from '@/components/work/ProjectGallery';
import { ScrollStory } from '@/components/work/ScrollStory';
import { projectsContent } from '@/content/localized/projects';
import { projects as everyProject } from '@/content/projects';
import { localizePath, ogLocale } from '@/i18n/config';
import { workDict } from '@/i18n/dictionaries/work';
import { getLocale, localizedAlternates, notFoundMetadata } from '@/i18n/server';
import { absoluteUrl } from '@/lib/site';

/*
  Every slug is known at build time, so each page is prerendered. An unknown
  slug is deliberately NOT refused at the routing layer with
  `dynamicParams = false`: that hands the request to the framework's built-in
  404, which has no layout to render in now that the root layout lives under
  `[lang]`. Letting it reach `notFound()` below sends it to
  `[lang]/not-found.tsx` instead — the site's own 404, in the reader's language.
*/

/* Slugs are shared between languages, so the English list names every page. */
export function generateStaticParams() {
  return everyProject.map((project) => ({ slug: project.slug }));
}

export async function generateMetadata({
  params,
}: PageProps<'/[lang]/work/[slug]'>): Promise<Metadata> {
  const { slug } = await params;
  const locale = await getLocale();
  const project = projectsContent[locale].getProject(slug);
  if (!project) return notFoundMetadata(locale);

  const title = `${project.title} ${project.titleAccent}`;
  const path = `/work/${project.slug}`;

  return {
    title,
    description: project.summary,
    alternates: localizedAlternates(locale, path),
    openGraph: {
      title,
      description: project.summary,
      type: 'article',
      url: absoluteUrl(localizePath(locale, path)),
      locale: ogLocale[locale],
      // No explicit image: the sibling opengraph-image route generates a card
      // per case study, and pointing at screenshots[0] crashed for the projects
      // that have no imagery yet.
    },
  };
}

export default async function ProjectPage({ params }: PageProps<'/[lang]/work/[slug]'>) {
  const { slug } = await params;
  const locale = await getLocale();
  const { getProject, projects } = projectsContent[locale];
  const project = getProject(slug);
  if (!project) notFound();

  const t = workDict[locale];

  /*
    The one after this in the order /work lists them, wrapping at the end — so
    following "Next" from any case study walks through all of them and comes back
    round, rather than every page pointing at the first.
  */
  const position = projects.findIndex((entry) => entry.slug === project.slug);
  const following = projects[(position + 1) % projects.length];
  const otherProject = following && following.slug !== project.slug ? following : undefined;
  // Bound locally so the narrowing survives into the map callbacks below.
  const architecture = project.architecture;

  return (
    <article className="pb-24 pt-32 md:pt-40">
      <div className="wrap">
        <Link
          href="/work"
          className="group inline-flex items-center gap-2 font-mono text-xs uppercase tracking-widest text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="size-4 transition-transform group-hover:-translate-x-0.5" />
          {t.caseStudy.allWork}
        </Link>

        <header className="mt-8 max-w-4xl">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
            <span className="font-mono text-sm text-lime">{project.index}</span>
            <span className="font-mono text-[0.65rem] uppercase tracking-widest text-muted-foreground">
              {project.role} · {project.module}
              {project.term ? ` · ${project.term}` : ''}
            </span>
            {project.award ? (
              <span className="inline-flex items-center gap-1.5 rounded-full border border-lime/50 bg-lime/15 px-2.5 py-0.5 font-mono text-[0.6rem] uppercase tracking-widest text-lime">
                🥇 {project.award}
              </span>
            ) : null}
            <span className="inline-flex items-center gap-1.5 rounded-full border border-success/30 bg-success/10 px-2.5 py-0.5 font-mono text-[0.6rem] uppercase tracking-widest text-success">
              <span className="size-1.5 rounded-full bg-success" />
              {project.status === 'completed' ? t.status.completed : t.status.inProgress}
            </span>
          </div>

          <h1 className="mt-4 font-heading text-[clamp(2.25rem,7vw,4.5rem)] font-extrabold leading-[1.02] tracking-[-0.03em]">
            {project.title} <span className="text-lime">{project.titleAccent}</span>
          </h1>

          <p className="mt-5 max-w-2xl text-base leading-relaxed text-muted-foreground sm:text-lg">
            {project.summary}
          </p>

          {project.team ? (
            <p className="mt-4 font-mono text-xs text-muted-foreground">{project.team}</p>
          ) : null}
        </header>

        {/* Hero shot stays a plain gallery — it is the "what does this look
            like" answer, and it should not require scrolling to get. Projects
            without imagery yet simply skip it rather than showing a placeholder. */}
        {project.screenshots.length ? (
          <div className="mt-10">
            <ProjectGallery screenshots={project.screenshots} />
          </div>
        ) : null}

        {/* Metrics */}
        <Reveal>
          <ul className="mt-12 grid grid-cols-2 gap-6 border-y border-hairline py-8 sm:grid-cols-4">
            {project.metrics.map((metric) => (
              <li key={metric.label}>
                <p className="font-heading text-3xl font-extrabold text-lime sm:text-4xl">
                  {metric.value}
                  {metric.suffix ?? ''}
                </p>
                <p className="mt-1 font-mono text-[0.62rem] uppercase tracking-wider text-muted-foreground">
                  {metric.label}
                </p>
              </li>
            ))}
          </ul>
        </Reveal>

        {/* Features + stack */}
        <div className="mt-12 grid gap-10 lg:grid-cols-[1fr_18rem]">
          <Reveal>
            <h2 className="eyebrow mb-4">{t.caseStudy.whatItDoes}</h2>
            <ul className="grid gap-2 sm:grid-cols-2">
              {project.features.map((feature) => (
                <li
                  key={feature}
                  className="rounded-xl border border-hairline bg-white/[0.02] px-4 py-3 text-sm"
                >
                  {feature}
                </li>
              ))}
            </ul>
          </Reveal>

          <Reveal delay={0.1}>
            <h2 className="eyebrow mb-4">{t.caseStudy.builtWith}</h2>
            <ul className="flex flex-wrap gap-1.5">
              {project.stack.map((tech) => (
                <li
                  key={tech}
                  className="rounded-md border border-hairline px-2.5 py-1.5 font-mono text-[0.68rem] text-muted-foreground"
                >
                  {tech}
                </li>
              ))}
            </ul>
          </Reveal>
        </div>

        {/* Scroll-driven walkthrough */}
        {project.story?.length && project.screenshots.length ? (
          <section className="mt-20">
            <Reveal>
              <h2 className="eyebrow mb-2">{t.caseStudy.walkthrough}</h2>
              <p className="mb-10 max-w-xl text-sm text-muted-foreground">
                {t.caseStudy.walkthroughHint}
              </p>
            </Reveal>
            <ScrollStory screenshots={project.screenshots} beats={project.story} />
          </section>
        ) : null}

        {/* STAR case study */}
        <Reveal>
          <section className="mt-20">
            <h2 className="eyebrow mb-6">{t.caseStudy.theCaseStudy}</h2>
            <div className="grid gap-4 lg:grid-cols-3">
              {project.caseStudy.map((section) => (
                <div key={section.label} className="glass rounded-2xl p-6">
                  <h3 className="font-heading text-sm font-bold uppercase tracking-wider text-lime">
                    {section.label}
                  </h3>
                  <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                    {section.body}
                  </p>
                </div>
              ))}
            </div>
          </section>
        </Reveal>

        {/* Architecture */}
        {architecture ? (
        <Reveal>
          <section className="mt-16">
            <h2 className="eyebrow mb-6">{t.caseStudy.architecture}</h2>
            <div className="glass rounded-2xl p-6 sm:p-8">
              <ol className="flex flex-wrap items-center gap-3">
                {architecture.flow.map((node, index) => (
                  <li key={node} className="flex items-center gap-3">
                    <span className="rounded-xl border border-hairline bg-white/[0.03] px-4 py-2.5 font-mono text-xs">
                      {node}
                    </span>
                    {index < architecture.flow.length - 1 ? (
                      <span className="text-lime" aria-hidden>
                        →
                      </span>
                    ) : null}
                  </li>
                ))}
              </ol>
              <p className="mt-5 max-w-3xl text-sm leading-relaxed text-muted-foreground">
                {architecture.description}
              </p>
            </div>
          </section>
        </Reveal>
        ) : null}

        {/* Code sample */}
        {project.code ? (
          <Reveal>
            <section className="mt-16">
              <h2 className="eyebrow mb-6">{t.caseStudy.code}</h2>
              <CodeBlock
                filename={project.code.filename}
                language={project.code.language}
                source={project.code.source}
              />
            </section>
          </Reveal>
        ) : null}

        {/* Demo video */}
        {project.video ? (
          <Reveal>
            <section className="mt-16">
              <h2 className="eyebrow mb-6">{t.caseStudy.demo}</h2>
              <div className="aspect-video overflow-hidden rounded-2xl border border-hairline bg-black">
                <iframe
                  src={project.video}
                  title={t.caseStudy.demoTitle(`${project.title} ${project.titleAccent}`)}
                  allow="accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  loading="lazy"
                  className="size-full"
                />
              </div>
            </section>
          </Reveal>
        ) : null}

        {/* Learnings */}
        <Reveal>
          <section className="mt-16">
            <h2 className="mb-6 flex items-center gap-2 font-heading text-xl font-bold tracking-tight">
              <Lightbulb className="size-5 text-lime" />
              {t.caseStudy.takeaways}
            </h2>
            <ul className="space-y-3">
              {project.learnings.map((learning) => (
                <li
                  key={learning}
                  className="flex gap-3 border-l-2 border-lime/30 pl-4 text-sm leading-relaxed text-muted-foreground"
                >
                  {learning}
                </li>
              ))}
            </ul>
          </section>
        </Reveal>

        {/* Links + next project */}
        {project.demoNote ? (
          <Reveal>
            <p className="mt-16 rounded-xl border border-warning/25 bg-warning/[0.06] p-4 text-sm leading-relaxed text-warning">
              {project.demoNote}
            </p>
          </Reveal>
        ) : null}

        <div className="mt-10 flex flex-wrap items-center gap-3 border-t border-hairline pt-10">
          {project.links.map((link) => (
            <a
              key={link.href}
              href={link.href}
              target="_blank"
              rel="noreferrer noopener"
              className="inline-flex items-center gap-2 rounded-full border border-hairline px-5 py-3 font-mono text-xs uppercase tracking-widest transition-colors hover:border-lime/40 hover:bg-lime/5"
            >
              {link.label}
              <ArrowUpRight className="size-4" />
            </a>
          ))}

          {otherProject ? (
            <Link
              href={`/work/${otherProject.slug}`}
              className="group ml-auto inline-flex items-center gap-2 font-mono text-xs uppercase tracking-widest text-muted-foreground transition-colors hover:text-foreground"
            >
              {t.caseStudy.next(`${otherProject.title} ${otherProject.titleAccent}`)}
              <ArrowUpRight className="size-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
            </Link>
          ) : null}
        </div>
      </div>
    </article>
  );
}
