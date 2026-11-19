'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowUpRight, BookOpen, Braces, Briefcase, CalendarClock, Car, Check, Code2, Copy, Download, Home, Mail, Megaphone, Rss, Terminal, Wrench } from 'lucide-react';
import { toast } from 'sonner';
import {
  Command,
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
  CommandShortcut,
} from '@/components/ui/command';
import { navigationContent } from '@/content/localized/navigation';
import { profileContent } from '@/content/localized/profile';
import { chromeDict } from '@/i18n/dictionaries/chrome';
import { commonDict } from '@/i18n/dictionaries/common';
import { useLocalizePath, useT } from '@/i18n/LocaleProvider';

interface PaletteEntry {
  slug: string;
  title: string;
  subtitle: string;
  /** More to match on than the title — the same title in the other language, say. */
  keywords?: string[];
}

interface CommandPaletteProps {
  projects: PaletteEntry[];
  posts: PaletteEntry[];
}

type SearchKey = keyof (typeof chromeDict)['en']['palette']['search'];

/**
 * What a fixed entry is matched against.
 *
 * Read from both languages on purpose, not from the current one: a bilingual
 * reader types whichever word comes first, so `作品` has to find Work on the
 * English site and `work` has to find 作品 on the Chinese one. cmdk also uses
 * `value` as the item's identity, so that stays the English list everywhere and
 * the Chinese list rides along as keywords.
 */
const searchTerms = (entry: SearchKey) => ({
  value: chromeDict.en.palette.search[entry],
  keywords: [chromeDict.zh.palette.search[entry]],
});

/**
 * ⌘K / Ctrl+K command palette.
 *
 * Data is passed in from a server component rather than fetched, so opening the
 * palette is instant and searching never hits the network — the whole corpus is
 * two case studies and a handful of posts.
 */
export function CommandPalette({ projects, posts }: CommandPaletteProps) {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const router = useRouter();
  const localize = useLocalizePath();
  const t = useT(chromeDict).palette;
  const common = useT(commonDict);
  const { primaryNav, asideNav } = useT(navigationContent);
  const { profile } = useT(profileContent);

  // A page is called here what the navigation calls it, so the two cannot drift.
  const pageLabel = (href: string) =>
    [...primaryNav, ...asideNav].find((item) => item.href === href)?.label ?? href;

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key.toLowerCase() === 'k' && (event.metaKey || event.ctrlKey)) {
        event.preventDefault();
        setOpen((value) => !value);
      }
      // `/` is the other convention people try, but not while they are typing.
      if (event.key === '/' && !open) {
        const target = event.target as HTMLElement | null;
        const typing =
          target?.tagName === 'INPUT' ||
          target?.tagName === 'TEXTAREA' ||
          target?.isContentEditable;
        if (!typing) {
          event.preventDefault();
          setOpen(true);
        }
      }
    };

    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open]);

  const run = useCallback((action: () => void) => {
    setOpen(false);
    // Let the dialog close before navigating, so the exit animation is not cut.
    setTimeout(action, 80);
  }, []);

  const go = useCallback(
    (href: string) => run(() => router.push(localize(href))),
    [localize, router, run],
  );

  const openExternal = useCallback(
    (href: string) => run(() => window.open(href, '_blank', 'noopener,noreferrer')),
    [run],
  );

  const copyEmail = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(profile.email);
      setCopied(true);
      toast.success(t.emailCopied, { description: profile.email });
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error(t.copyFailed, {
        description: t.copyFailedDetail,
      });
    }
    setOpen(false);
  }, [profile.email, t]);

  return (
    <>
      {/* Discoverability: a palette nobody knows about is a palette nobody uses. */}
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label={t.open}
        className="hidden items-center gap-2 rounded-full border border-hairline px-3 py-2 font-mono text-[0.65rem] uppercase tracking-widest text-muted-foreground transition-colors hover:border-lime/40 hover:text-foreground md:inline-flex"
      >
        <Terminal className="size-3.5" />
        <span className="rounded border border-hairline px-1.5 py-0.5 text-[0.6rem]">⌘K</span>
      </button>

      <CommandDialog
        open={open}
        onOpenChange={setOpen}
        title={t.title}
        description={t.description}
      >
        {/*
          This shadcn build of CommandDialog renders a Dialog and drops children
          straight in, without the cmdk <Command> root the items need for their
          shared store — hence the explicit wrapper.
        */}
        <Command>
        <CommandInput placeholder={t.placeholder} />
        <CommandList label={t.results}>
          <CommandEmpty>{t.empty}</CommandEmpty>

          <CommandGroup heading={t.groups.goTo}>
            <CommandItem onSelect={() => go('/')} {...searchTerms('home')}>
              <Home /> {pageLabel('/')}
            </CommandItem>
            <CommandItem onSelect={() => go('/work')} {...searchTerms('work')}>
              <Braces /> {pageLabel('/work')}
            </CommandItem>
            <CommandItem onSelect={() => go('/blog')} {...searchTerms('blog')}>
              <BookOpen /> {pageLabel('/blog')}
            </CommandItem>
            <CommandItem onSelect={() => go('/uses')} {...searchTerms('uses')}>
              <Wrench /> {pageLabel('/uses')}
            </CommandItem>
            <CommandItem onSelect={() => go('/book')} {...searchTerms('book')}>
              <CalendarClock /> {common.header.bookSession}
              <CommandShortcut>↵</CommandShortcut>
            </CommandItem>
          </CommandGroup>

          {/*
            Its own group rather than mixed into "Go to". These are not pages of
            the portfolio, and someone scanning the palette for the work should
            not have to step over a driving game to find it.
          */}
          <CommandGroup heading={common.footer.detours}>
            <CommandItem onSelect={() => go('/drive')} {...searchTerms('drive')}>
              <Car /> {pageLabel('/drive')}
            </CommandItem>
            <CommandItem onSelect={() => go('/pitch')} {...searchTerms('pitch')}>
              <Megaphone /> {pageLabel('/pitch')}
            </CommandItem>
          </CommandGroup>

          {projects.length ? (
            <>
              <CommandSeparator />
              <CommandGroup heading={t.groups.caseStudies}>
                {projects.map((project) => (
                  <CommandItem
                    key={project.slug}
                    value={`${project.title} ${project.subtitle}`}
                    keywords={project.keywords}
                    onSelect={() => go(`/work/${project.slug}`)}
                  >
                    <Braces />
                    <span className="truncate">{project.title}</span>
                    <span className="ml-auto truncate pl-3 font-mono text-[0.65rem] text-muted-foreground">
                      {project.subtitle}
                    </span>
                  </CommandItem>
                ))}
              </CommandGroup>
            </>
          ) : null}

          {posts.length ? (
            <>
              <CommandSeparator />
              <CommandGroup heading={t.groups.writing}>
                {posts.map((post) => (
                  <CommandItem
                    key={post.slug}
                    value={`${post.title} ${post.subtitle}`}
                    keywords={post.keywords}
                    onSelect={() => go(`/blog/${post.slug}`)}
                  >
                    <BookOpen />
                    <span className="truncate">{post.title}</span>
                    <span className="ml-auto shrink-0 pl-3 font-mono text-[0.65rem] text-muted-foreground">
                      {post.subtitle}
                    </span>
                  </CommandItem>
                ))}
              </CommandGroup>
            </>
          ) : null}

          <CommandSeparator />
          <CommandGroup heading={t.groups.actions}>
            <CommandItem onSelect={copyEmail} {...searchTerms('copyEmail')}>
              {copied ? <Check className="text-lime" /> : <Copy />}
              {t.copyEmail}
              <CommandShortcut className="font-mono">{profile.email}</CommandShortcut>
            </CommandItem>
            <CommandItem
              onSelect={() => run(() => window.open(profile.resume, '_blank'))}
              {...searchTerms('resume')}
            >
              <Download /> {t.downloadResume}
            </CommandItem>
            {/* Each language has its own feed, so this opens the one being read. */}
            <CommandItem
              onSelect={() => openExternal(localize('/blog/rss.xml'))}
              {...searchTerms('rss')}
            >
              <Rss /> {t.rssFeed}
            </CommandItem>
          </CommandGroup>

          <CommandSeparator />
          <CommandGroup heading={common.footer.elsewhere}>
            <CommandItem
              onSelect={() => openExternal('https://github.com/Richie280907')}
              {...searchTerms('github')}
            >
              <Code2 /> GitHub <ArrowUpRight className="ml-auto size-3 opacity-50" />
            </CommandItem>
            <CommandItem
              onSelect={() => openExternal('https://www.linkedin.com/in/richiekoh2809/')}
              {...searchTerms('linkedin')}
            >
              <Briefcase /> LinkedIn <ArrowUpRight className="ml-auto size-3 opacity-50" />
            </CommandItem>
            <CommandItem
              onSelect={() => run(() => { window.location.href = `mailto:${profile.email}`; })}
              {...searchTerms('sendEmail')}
            >
              <Mail /> {t.sendEmail} <ArrowUpRight className="ml-auto size-3 opacity-50" />
            </CommandItem>
          </CommandGroup>
        </CommandList>
        </Command>
      </CommandDialog>
    </>
  );
}
