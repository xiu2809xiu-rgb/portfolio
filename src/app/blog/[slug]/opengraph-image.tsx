import { ImageResponse } from 'next/og';
import { getPost, getPosts } from '@/lib/blog';
import { OG_SIZE, OgCard } from '@/lib/og';

export const runtime = 'nodejs';
export const size = OG_SIZE;
export const contentType = 'image/png';
export const alt = 'Blog post';

export async function generateStaticParams() {
  const posts = await getPosts();
  return posts.map((post) => ({ slug: post.slug }));
}

/** One social card per post, so a shared link previews its own title. */
export default async function Image({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const post = await getPost(slug);

  if (!post) {
    return new ImageResponse(<OgCard eyebrow="Writing" title="Not found" />, size);
  }

  return new ImageResponse(
    (
      <OgCard
        eyebrow={`Writing · ${post.readingMinutes} min read`}
        title={post.title}
        description={post.description}
        meta={post.tags.join('  ·  ')}
        accent="#39ffd8"
      />
    ),
    size,
  );
}
