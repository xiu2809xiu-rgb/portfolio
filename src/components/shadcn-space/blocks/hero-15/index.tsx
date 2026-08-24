import Navbar from "@/components/shadcn-space/blocks/hero-15/navbar";
import type { NavigationSection } from "@/components/shadcn-space/blocks/hero-15/navbar";
import HeroSection from "@/components/shadcn-space/blocks/hero-15/hero";
import type { BrandList } from "@/components/shadcn-space/blocks/hero-15/hero";

const navigationData: NavigationSection[] = [
  {
    name: "Benefits",
    href: "#",
    isActive: true, 
  },
  {
    name: "Features",
    href: "#",
  },
  {
    name: "Testimonials",
    href: "#",
  },
  {
    name: "Newsletter",
    href: "#",
  }
];

const brandList: BrandList[] = [
    {
      image: "https://images.shadcnspace.com/assets/brand-logo/logo-icon-dark-1.svg",
      name: "Brand 1",
    },
    {
      image: "https://images.shadcnspace.com/assets/brand-logo/logo-icon-dark-2.svg",
      name: "Brand 2",
    },
    {
      image: "https://images.shadcnspace.com/assets/brand-logo/logo-icon-dark-3.svg",
      name: "Brand 3",
    },
    {
      image: "https://images.shadcnspace.com/assets/brand-logo/logo-icon-dark-4.svg",
      name: "Brand 4",
    }
  ];

const HeroPage = () => {
  return (
    <div className="dark bg-background">
        <Navbar navigationData={navigationData} />
        <HeroSection brandList={brandList}/>
    </div>
  )
}

export default HeroPage