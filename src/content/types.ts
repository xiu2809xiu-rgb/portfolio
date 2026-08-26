/**
 * Shared content types.
 *
 * Everything the site renders comes from `src/content`. Pages and sections never
 * hard-code copy — they read from here, so a change lands everywhere at once and
 * the whole site stays type-checked.
 */

export interface Link {
  readonly label: string;
  readonly href: string;
  /** External links open in a new tab and get rel="noreferrer". */
  readonly external?: boolean;
  readonly icon?: string;
}

export interface Profile {
  readonly fullName: string;
  readonly shortName: string;
  readonly legalName: string;
  readonly role: string;
  readonly tagline: string;
  readonly location: string;
  readonly timezone: string;
  readonly email: string;
  readonly photo: string;
  readonly resume: string;
  readonly bio: readonly string[];
  readonly facts: readonly { label: string; value: string }[];
  readonly exploring: readonly string[];
  readonly socials: readonly Link[];
}

export interface SkillGroup {
  readonly name: string;
  readonly icon: string;
  readonly blurb: string;
  readonly items: readonly string[];
  readonly levels?: readonly { name: string; value: number }[];
}

export interface CaseStudySection {
  readonly label: string;
  readonly body: string;
}

export interface Screenshot {
  readonly src: string;
  readonly title: string;
  readonly url: string;
}

export interface Metric {
  readonly value: number | string;
  readonly label: string;
  readonly suffix?: string;
}

/** One step of the scroll-driven walkthrough on a case study page. */
export interface StoryBeat {
  /** Index into the project's `screenshots`. */
  readonly shot: number;
  readonly label: string;
  readonly heading: string;
  readonly body: string;
}

export interface Project {
  readonly slug: string;
  readonly index: string;
  readonly title: string;
  readonly titleAccent: string;
  readonly role: string;
  readonly module: string;
  /** Omitted where the dates are not confirmed — never guessed. */
  readonly term?: string;
  readonly status: 'completed' | 'in-progress';
  /** Shown in Featured Work on the home page. Others appear only on /work. */
  readonly featured?: boolean;
  /** Award or placing, printed as a badge. */
  readonly award?: string;
  /** Team credit line. */
  readonly team?: string;
  /** Caveat displayed beside the live demo link. */
  readonly demoNote?: string;
  readonly summary: string;
  readonly features: readonly string[];
  readonly stack: readonly string[];
  /** Empty where no imagery exists yet; cards fall back to a text treatment. */
  readonly screenshots: readonly Screenshot[];
  /** Optional scroll-driven walkthrough; falls back to the gallery if absent. */
  readonly story?: readonly StoryBeat[];
  readonly caseStudy: readonly CaseStudySection[];
  readonly metrics: readonly Metric[];
  readonly architecture?: {
    readonly flow: readonly string[];
    readonly description: string;
  };
  readonly code?: {
    readonly filename: string;
    readonly language: string;
    readonly source: string;
  };
  readonly video?: string;
  readonly learnings: readonly string[];
  readonly links: readonly Link[];
}

export interface ExperienceEntry {
  readonly period: string;
  readonly title: string;
  readonly organisation: string;
  readonly description: string;
  readonly coursework?: readonly string[];
}

export interface ProcessStep {
  readonly index: string;
  readonly icon: string;
  readonly title: string;
  readonly body: string;
  /** A real instance of this step, so the process is evidenced not asserted. */
  readonly evidence?: string;
}

export interface Achievement {
  readonly icon: string;
  readonly title: string;
  readonly organisation: string;
  readonly body: string;
  readonly year?: string;
  /** Renders smaller, below the main grid. */
  readonly minor?: boolean;
}

export interface Testimonial {
  readonly quote: string;
  readonly name: string;
  readonly title: string;
  readonly avatar?: string;
  readonly emoji?: string;
}

export interface UsesCategory {
  readonly name: string;
  readonly icon: string;
  readonly entries: readonly { name: string; note: string }[];
}
