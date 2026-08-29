'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  ArrowUpRight,
  BookOpen,
  Braces,
  CalendarClock,
  Check,
  Copy,
  Download,
  Code2,
  Home,
  Briefcase,
  Mail,
  Rss,
  Terminal,
  Wrench,
} from 'lucide-react';
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
import { profile } from '@/content/profile';

interface PaletteEntry {
  slug: string;
  title: string;
  subtitle: string;
}

interface CommandPaletteProps {
  projects: PaletteEntry[];
  posts: PaletteEntry[];
}

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

  const go = useCallback((href: string) => run(() => router.push(href)), [router, run]);

  const openExternal = useCallback(
    (href: string) => run(() => window.open(href, '_blank', 'noopener,noreferrer')),
    [run],
  );

  const copyEmail = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(profile.email);
      setCopied(true);
      toast.success('Email copied', { description: profile.email });
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error('Could not copy — your browser blocked clipboard access.');
    }
    setOpen(false);
  }, []);

  return (
    <>
      {/* Discoverability: a palette nobody knows about is a palette nobody uses. */}
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Open command palette"
        className="hidden items-center gap-2 rounded-full border border-hairline px-3 py-2 font-mono text-[0.65rem] uppercase tracking-widest text-muted-foreground transition-colors hover:border-lime/40 hover:text-foreground md:inline-flex"
      >
        <Terminal className="size-3.5" />
        <span className="rounded border border-hairline px-1.5 py-0.5 text-[0.6rem]">⌘K</span>
      </button>

      <CommandDialog
        open={open}
        onOpenChange={setOpen}
        title="Command palette"
        description="Search and jump anywhere on this site"
      >
        {/*
          This shadcn build of CommandDialog renders a Dialog and drops children
          straight in, without the cmdk <Command> root the items need for their
          shared store — hence the explicit wrapper.
        */}
        <Command>
        <CommandInput placeholder="Jump to a page, project, or post…" />
        <CommandList>
          <CommandEmpty>Nothing matches that.</CommandEmpty>

          <CommandGroup heading="Go to">
            <CommandItem onSelect={() => go('/')} value="home start">
              <Home /> Home
            </CommandItem>
            <CommandItem onSelect={() => go('/work')} value="work projects case studies">
              <Braces /> Work
            </CommandItem>
            <CommandItem onSelect={() => go('/blog')} value="blog writing posts articles">
              <BookOpen /> Blog
            </CommandItem>
            <CommandItem onSelect={() => go('/uses')} value="uses tools setup gear stack">
              <Wrench /> Uses
            </CommandItem>
            <CommandItem onSelect={() => go('/book')} value="book schedule calendar meeting call">
              <CalendarClock /> Book a session
              <CommandShortcut>↵</CommandShortcut>
            </CommandItem>
          </CommandGroup>

          {projects.length ? (
            <>
              <CommandSeparator />
              <CommandGroup heading="Case studies">
                {projects.map((project) => (
                  <CommandItem
                    key={project.slug}
                    value={`${project.title} ${project.subtitle}`}
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
              <CommandGroup heading="Writing">
                {posts.map((post) => (
                  <CommandItem
                    key={post.slug}
                    value={`${post.title} ${post.subtitle}`}
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
          <CommandGroup heading="Actions">
            <CommandItem onSelect={copyEmail} value="copy email address contact">
              {copied ? <Check className="text-lime" /> : <Copy />}
              Copy email
              <CommandShortcut className="font-mono">{profile.email}</CommandShortcut>
            </CommandItem>
            <CommandItem
              onSelect={() => run(() => window.open(profile.resume, '_blank'))}
              value="resume cv download pdf"
            >
              <Download /> Download résumé
            </CommandItem>
            <CommandItem onSelect={() => openExternal('/blog/rss.xml')} value="rss feed subscribe">
              <Rss /> RSS feed
            </CommandItem>
          </CommandGroup>

          <CommandSeparator />
          <CommandGroup heading="Elsewhere">
            <CommandItem
              onSelect={() => openExternal('https://github.com/Richie280907')}
              value="github code repos source"
            >
              <Code2 /> GitHub <ArrowUpRight className="ml-auto size-3 opacity-50" />
            </CommandItem>
            <CommandItem
              onSelect={() => openExternal('https://www.linkedin.com/in/richiekoh2809/')}
              value="linkedin profile professional"
            >
              <Briefcase /> LinkedIn <ArrowUpRight className="ml-auto size-3 opacity-50" />
            </CommandItem>
            <CommandItem
              onSelect={() => run(() => { window.location.href = `mailto:${profile.email}`; })}
              value="email mail write message"
            >
              <Mail /> Send an email <ArrowUpRight className="ml-auto size-3 opacity-50" />
            </CommandItem>
          </CommandGroup>
        </CommandList>
        </Command>
      </CommandDialog>
    </>
  );
}
