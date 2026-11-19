import type { NextConfig } from "next";

/*
  Two languages, one of them without a prefix.

  Every page lives under `app/[lang]`. Chinese is reached at `/zh/…` directly.
  English is the default and keeps the URLs it has always had, so an unprefixed
  request is rewritten — not redirected — to `/en/…`: the address bar never
  changes, and nothing that was already linked or indexed moves.

  The rewrites are returned as a plain array on purpose. That places them after
  static files and non-dynamic routes but before dynamic ones, which is exactly
  the window needed: `/img/…`, `/sitemap.xml` and `/api/health` are served
  as-is, and only what is left reaches the rule and becomes `/en/…`. Without the
  rewrite, `/work` would match `[lang]` itself, with "work" as the language.

  The first-segment pattern excludes the two locales, and the prefixes that are
  dynamic but not pages (`/api/bookings/[reference]` would otherwise be caught,
  since dynamic routes are matched after this).
*/
const NOT_A_PAGE = "(?:en|zh|api|_next|_vercel)(?:/|$)";

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      { source: "/", destination: "/en" },
      {
        source: `/:first((?!${NOT_A_PAGE})[^/]+)/:rest*`,
        destination: "/en/:first/:rest*",
      },
    ];
  },

  async redirects() {
    return [
      /*
        `/en/work` and `/work` would otherwise be the same page at two
        addresses. Generated share images are left alone: Next emits their URLs
        with the internal `/en` prefix, and a crawler fetching one should get
        the image rather than a redirect to chase.
      */
      { source: "/en", destination: "/", permanent: true },
      {
        source: "/en/:path((?!.*(?:opengraph|twitter)-image).*)",
        destination: "/:path",
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
