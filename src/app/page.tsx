import { AboutSection } from '@/components/sections/AboutSection';
import { AchievementsSection } from '@/components/sections/AchievementsSection';
import { ContactSection } from '@/components/sections/ContactSection';
import { ExperienceSection } from '@/components/sections/ExperienceSection';
import { WorkPortal } from '@/components/sections/WorkPortal';
import { HeroSection } from '@/components/sections/HeroSection';
import { MarqueeStrip } from '@/components/sections/MarqueeStrip';
import { ProcessSection } from '@/components/sections/ProcessSection';
import { SkillsSection } from '@/components/sections/SkillsSection';
import { StackCloud } from '@/components/sections/StackCloud';
import { StatsBand } from '@/components/sections/StatsBand';
import { TestimonialsSection } from '@/components/sections/TestimonialsSection';

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
      <ExperienceSection />
      <ProcessSection />
      <AchievementsSection />
      <TestimonialsSection />
      <ContactSection />
    </>
  );
}
