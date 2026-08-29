import type { Metadata, Viewport } from 'next';
import { Analytics } from '@vercel/analytics/next';
import { SpeedInsights } from '@vercel/speed-insights/next';
import { Crimson_Pro, Outfit, Space_Mono } from 'next/font/google';
import { Toaster } from '@/components/ui/sonner';
import { SiteFooter } from '@/components/layout/SiteFooter';
import { SiteHeader } from '@/components/layout/SiteHeader';
import { AudioControl } from '@/components/layout/AudioControl';
import { AudioProvider } from '@/components/layout/AudioProvider';
import { CommandPalette } from '@/components/layout/CommandPalette';
import { CursorLayer } from '@/components/layout/CursorLayer';
import { EntrySequence, introGuardScript } from '@/components/layout/EntrySequence';
import { ScrollProgress } from '@/components/layout/ScrollProgress';
import { profile } from '@/content/profile';
import { projects } from '@/content/projects';
import { getPosts } from '@/lib/blog';
import { siteConfig, siteUrl } from '@/lib/site';
import './globals.css';

/* Self-hosted by next/font — no render-blocking request to Google at runtime. */
const outfit = Outfit({
  subsets: ['latin'],
  variable: '--font-outfit',
  display: 'swap',
});

const spaceMono = Space_Mono({
  subsets: ['latin'],
  weight: ['400', '700'],
  variable: '--font-space-mono',
  display: 'swap',
});

const crimson = Crimson_Pro({
  subsets: ['latin'],
  style: ['italic'],
  weight: ['300', '400'],
  variable: '--font-crimson',
  display: 'swap',
});

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: siteConfig.name,
    template: `%s — ${profile.fullName}`,
  },
  description: siteConfig.description,
  keywords: [...siteConfig.keywords],
  authors: [{ name: profile.legalName, url: siteUrl }],
  creator: profile.legalName,
  openGraph: {
    type: 'website',
    locale: siteConfig.locale,
    url: siteUrl,
    siteName: profile.fullName,
    title: siteConfig.name,
    description: siteConfig.description,
    images: [{ url: '/opengraph-image', width: 1200, height: 630, alt: siteConfig.name }],
  },
  twitter: {
    card: 'summary_large_image',
    title: siteConfig.name,
    description: siteConfig.description,
    images: ['/opengraph-image'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, 'max-image-preview': 'large' },
  },
  icons: {
    icon: [
      { url: '/icon.svg', type: 'image/svg+xml' },
      { url: '/favicon.ico', sizes: '48x48' },
    ],
    apple: '/apple-icon.png',
  },
  manifest: '/manifest.webmanifest',
  alternates: {
    canonical: '/',
    types: { 'application/rss+xml': [{ url: '/blog/rss.xml', title: `${profile.fullName} — Writing` }] },
  },
};

export const viewport: Viewport = {
  themeColor: '#05070a',
  colorScheme: 'dark',
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
};

/** JSON-LD so search engines can read the person, not just the page. */
const personSchema = {
  '@context': 'https://schema.org',
  '@type': 'Person',
  name: profile.legalName,
  alternateName: profile.fullName,
  url: siteUrl,
  image: `${siteUrl}${profile.photo}`,
  jobTitle: profile.role,
  email: `mailto:${profile.email}`,
  address: { '@type': 'PostalAddress', addressLocality: profile.location },
  alumniOf: { '@type': 'EducationalOrganization', name: 'Nanyang Polytechnic' },
  knowsAbout: ['Web Development', 'Python', 'Flask', 'TypeScript', 'React', 'UX Design'],
  sameAs: profile.socials.filter((social) => social.external).map((social) => social.href),
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  // Loaded on the server so the palette has its corpus before it ever opens.
  const posts = await getPosts();
  return (
    <html
      lang="en"
      className={`dark ${outfit.variable} ${spaceMono.variable} ${crimson.variable}`}
      suppressHydrationWarning
    >
      <head>
        {/* Must run before first paint — see EntrySequence. */}
        <script dangerouslySetInnerHTML={{ __html: introGuardScript }} />
      </head>
      <body className="grain min-h-dvh bg-background text-foreground antialiased">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(personSchema) }}
        />

        {/*
          Scroll reveals render their `initial` state as inline `opacity:0` during
          SSR, which JavaScript then animates away. Without JS that never happens
          and the page reads as empty — so force every hidden element visible.
        */}
        <noscript>
          <style>{`[style*="opacity:0"],[style*="opacity: 0"]{opacity:1!important;transform:none!important;filter:none!important}`}</style>
        </noscript>

        <a
          href="#main"
          className="sr-only rounded-md bg-lime px-4 py-2 font-mono text-sm text-black focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[200]"
        >
          Skip to content
        </a>

        <AudioProvider>
        <EntrySequence />
        <ScrollProgress />
        <CursorLayer />
        <SiteHeader
          commandPalette={
            <CommandPalette
              projects={projects.map((project) => ({
                slug: project.slug,
                title: `${project.title} ${project.titleAccent}`,
                subtitle: project.term ?? project.role,
              }))}
              posts={posts.map((post) => ({
                slug: post.slug,
                title: post.title,
                subtitle: `${post.readingMinutes} min`,
              }))}
            />
          }
        />

        <main id="main" className="relative">
          {children}
        </main>

        <SiteFooter />
        <AudioControl />
        </AudioProvider>
        {/* No richColors: it swaps in sonner's own semantic palette, which renders
            as a white card on this near-black page. The toast is themed in
            globals.css under .cn-toast instead. */}
        <Toaster
          /*
            Top-right, not bottom-right. The toast guidance is explicit that a
            toast must not cover important content, and at the bottom of /book it
            sat squarely on top of the "Your timezone" assurance card. Up here it
            clears the header and overlaps nothing.
          */
          position="top-right"
          offset={88}
          closeButton
          duration={4500}
        />
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
