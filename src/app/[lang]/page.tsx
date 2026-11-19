import type { Metadata } from 'next';
import { AboutSection } from '@/components/sections/AboutSection';
import { AchievementsSection } from '@/components/sections/AchievementsSection';
import { ContactSection } from '@/components/sections/ContactSection';
import { ExperienceSection } from '@/components/sections/ExperienceSection';
import { DetoursSection } from '@/components/sections/DetoursSection';
import { WorkPortal } from '@/components/sections/WorkPortal';
import { HeroSection } from '@/components/sections/HeroSection';
import { MarqueeStrip } from '@/components/sections/MarqueeStrip';
import { ProcessSection } from '@/components/sections/ProcessSection';
import { SkillsSection } from '@/components/sections/SkillsSection';
import { StackCloud } from '@/components/sections/StackCloud';
import { StatsBand } from '@/components/sections/StatsBand';
import { TestimonialsSection } from '@/components/sections/TestimonialsSection';
import { getLocale, localizedAlternates } from '@/i18n/server';

/*
  Title and description come from the layout. What the home page has to add is
  its own address: the canonical URL and the pointer to the other language are
  per-page facts, and the layout deliberately does not guess them.
*/
export async function generateMetadata(): Promise<Metadata> {
  return { alternates: localizedAlternates(await getLocale(), '/') };
}

export default function HomePage() {
  return (
    <>
      <HeroSection />
      <MarqueeStrip />
      <StatsBand />
      <AboutSection />
      <SkillsSection />
      <StackCloud />
      <WorkPortal />
      <DetoursSection />
      <ExperienceSection />
      <ProcessSection />
      <AchievementsSection />
      <TestimonialsSection />
      <ContactSection />
    </>
  );
}
