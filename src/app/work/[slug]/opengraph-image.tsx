import { ImageResponse } from 'next/og';
import { getProject, projects } from '@/content/projects';
import { OG_SIZE, OgCard } from '@/lib/og';

export const runtime = 'nodejs';
export const size = OG_SIZE;
export const contentType = 'image/png';
export const alt = 'Case study';

export function generateStaticParams() {
  return projects.map((project) => ({ slug: project.slug }));
}

/** One social card per case study, generated at build time. */
export default async function Image({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const project = getProject(slug);

  if (!project) {
    return new ImageResponse(<OgCard eyebrow="Case study" title="Not found" />, size);
  }

  return new ImageResponse(
    (
      <OgCard
        eyebrow={`Case study · ${project.term}`}
        title={`${project.title} ${project.titleAccent}`}
        description={project.summary}
        meta={project.stack.slice(0, 4).join('  ·  ')}
      />
    ),
    size,
  );
}
