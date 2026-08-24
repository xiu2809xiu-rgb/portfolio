import { cn } from '@/lib/utils';

interface SectionHeadingProps {
  /** Two-digit section number, e.g. "03". */
  index?: string;
  title: string;
  description?: string;
  className?: string;
  as?: 'h1' | 'h2';
}

/**
 * The numbered rule-and-title used at the top of every section.
 *
 * One component rather than repeated markup, so the vertical rhythm and the
 * hairline treatment stay identical everywhere.
 */
export function SectionHeading({
  index,
  title,
  description,
  className,
  as: Tag = 'h2',
}: SectionHeadingProps) {
  return (
    <div className={cn('mb-10 md:mb-14', className)}>
      <div className="flex items-center gap-4">
        {index ? <span className="eyebrow shrink-0">{index}</span> : null}
        <Tag className="font-heading text-3xl font-extrabold tracking-tight sm:text-4xl md:text-5xl">
          {title}
        </Tag>
        <div className="h-px flex-1 bg-gradient-to-r from-hairline to-transparent" />
      </div>
      {description ? (
        <p className="mt-5 max-w-2xl text-base leading-relaxed text-muted-foreground">
          {description}
        </p>
      ) : null}
    </div>
  );
}
