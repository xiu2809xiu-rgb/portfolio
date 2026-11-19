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
import { profileContent } from '@/content/localized/profile';
import { projectsContent } from '@/content/localized/projects';
import { defaultLocale, htmlLang, isLocale, locales, localizePath } from '@/i18n/config';
import { commonDict } from '@/i18n/dictionaries/common';
import { LocaleProvider } from '@/i18n/LocaleProvider';
import { getPosts } from '@/lib/blog';
import { getSiteConfig, siteUrl } from '@/lib/site';
import '../globals.css';

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

/*
  One entry per language, so both trees are prerendered at build time. Anything
  else in the `[lang]` position is rendered on demand and 404s.
*/
export function generateStaticParams() {
  return locales.map((lang) => ({ lang }));
}

/**
 * The root layout must not throw on an unknown language — there is no boundary
 * above it to catch a `notFound()`. It falls back to English here, and the page
 * underneath is what 404s, inside this layout's own chrome.
 */
const resolveLocale = (lang: string) => (isLocale(lang) ? lang : defaultLocale);

export async function generateMetadata({ params }: LayoutProps<'/[lang]'>): Promise<Metadata> {
  const locale = resolveLocale((await params).lang);
  const site = getSiteConfig(locale);
  const { profile } = profileContent[locale];
  const shareImage = localizePath(locale, '/opengraph-image');

  return {
    metadataBase: new URL(siteUrl),
    title: {
      default: site.name,
      template: `%s — ${profile.fullName}`,
    },
    description: site.description,
    keywords: [...site.keywords],
    authors: [{ name: profile.legalName, url: siteUrl }],
    creator: profile.legalName,
    openGraph: {
      type: 'website',
      locale: site.locale,
      url: localizePath(locale, '/'),
      siteName: profile.fullName,
      title: site.name,
      description: site.description,
      images: [{ url: shareImage, width: 1200, height: 630, alt: site.name }],
    },
    twitter: {
      card: 'summary_large_image',
      title: site.name,
      description: site.description,
      images: [shareImage],
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
    manifest: localizePath(locale, '/manifest.webmanifest'),
    /*
      Only the feed here. Canonical and hreflang are set by each page for its
      own path: metadata is inherited, so a canonical declared at the root would
      be silently applied to every page that forgot to declare one, telling
      search engines they are all the home page.
    */
    alternates: {
      types: {
        'application/rss+xml': [
          { url: localizePath(locale, '/blog/rss.xml'), title: site.rssTitle },
        ],
      },
    },
  };
}

export const viewport: Viewport = {
  themeColor: '#05070a',
  colorScheme: 'dark',
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
};

export default async function RootLayout({ children, params }: LayoutProps<'/[lang]'>) {
  const locale = resolveLocale((await params).lang);
  const t = commonDict[locale];
  const { profile } = profileContent[locale];
  const { projects } = projectsContent[locale];
  // Loaded on the server so the palette has its corpus before it ever opens.
  const posts = await getPosts(locale);
  /*
    The same entries in the other language, as extra words to match on. Someone
    reading the Chinese site may well remember a post by its English title, and
    the other way round; this lets either find it without showing both.
  */
  const otherLocale = locale === 'en' ? 'zh' : 'en';
  const otherProjects = projectsContent[otherLocale].projects;
  const otherPosts = await getPosts(otherLocale);
  const twinOf = <T extends { slug: string }>(list: readonly T[], slug: string) =>
    list.find((entry) => entry.slug === slug);

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

  return (
    <html
      lang={htmlLang[locale]}
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
          {t.skipToContent}
        </a>

        <LocaleProvider locale={locale}>
        <AudioProvider>
        <EntrySequence />
        <ScrollProgress />
        <CursorLayer />
        <SiteHeader
          commandPalette={
            <CommandPalette
              projects={projects.map((project) => {
                const twin = twinOf(otherProjects, project.slug);
                return {
                  slug: project.slug,
                  title: `${project.title} ${project.titleAccent}`,
                  subtitle: project.term ?? project.role,
                  keywords: twin
                    ? [`${twin.title} ${twin.titleAccent}`, twin.term ?? twin.role]
                    : undefined,
                };
              })}
              posts={posts.map((post) => {
                const twin = twinOf(otherPosts, post.slug);
                return {
                  slug: post.slug,
                  title: post.title,
                  subtitle: t.minutes(post.readingMinutes),
                  keywords: twin && twin.title !== post.title ? [twin.title] : undefined,
                };
              })}
            />
          }
        />

        <main id="main" className="relative">
          {children}
        </main>

        <SiteFooter locale={locale} />
        <AudioControl />
        </AudioProvider>
        </LocaleProvider>
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
          containerAriaLabel={t.toast.region}
          toastOptions={{ closeButtonAriaLabel: t.toast.close }}
        />
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
