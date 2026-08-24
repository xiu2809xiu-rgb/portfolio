"use client";
import Logo from "@/assets/logo/logo";
import { Button } from "@/components/ui/button";
import { NavigationMenu, NavigationMenuItem, NavigationMenuLink, NavigationMenuList } from "@/components/ui/navigation-menu";
import { DropdownMenu, DropdownMenuContent, DropdownMenuPortal, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "motion/react";
import { useState, useEffect } from "react";
import { Menu, X } from "lucide-react";

export type NavigationSection = {
  name: string;
  href: string;
  isActive?: boolean;
};

interface NavbarProps {
  navigationData: NavigationSection[];
}

const NavLink = ({
  item,
  onClick,
}: {
  item: NavigationSection;
  onClick?: () => void;
}) => {
  return (
    <li
      className={cn(
        "group flex items-center transition-all duration-500 ease-in-out w-fit",
        item.isActive ? "gap-3" : "gap-0 hover:gap-3",
      )}
    >
      <div
        className={cn(
          "overflow-hidden transition-all duration-500 ease-in-out flex items-center",
          item.isActive
            ? "max-w-6 opacity-100"
            : "max-w-0 opacity-0 group-hover:max-w-6 group-hover:opacity-100",
        )}
      >
        <div className="w-6 h-0.5 rounded-full bg-foreground" />
      </div>
      <a
        href={item.href}
        onClick={onClick}
        className={cn(
          "text-2xl sm:text-3xl sm:leading-10 leading-8 font-medium transition-colors duration-300",
          item.isActive ? "text-foreground" : "text-foreground/80",
        )}
      >
        {item.name}
      </a>
    </li>
  );
};

const Navbar = ({ navigationData }: NavbarProps) => {
  const [menuOpen, setMenuOpen] = useState(false);
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024) {
        setMenuOpen(false);
      }
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);
  return (
    <header className="sticky top-0 z-40 bg-background backdrop-blur-2xl">
      <div className="max-w-7xl mx-auto xl:px-16 lg:px-8 px-4 py-5 w-full">
        <nav className="flex items-center justify-between">
          <a href="#">
            <Logo />
          </a>
          <NavigationMenu className="max-lg:hidden">
            <NavigationMenuList className="gap-6">
              {navigationData.map((navItem) => (
                <NavigationMenuItem key={navItem.name}>
                  <NavigationMenuLink
                    href={navItem.href}
                    className={cn(
                      "p-0 text-base text-foreground hover:text-foreground/80 font-normal hover:bg-transparent focus:bg-transparent data-active:bg-transparent data-[state=open]:bg-transparent",
                      navItem.isActive && "font-medium",
                    )}
                  >
                    {navItem.name}
                  </NavigationMenuLink>
                </NavigationMenuItem>
              ))}
            </NavigationMenuList>
          </NavigationMenu>
          <Button className="max-lg:hidden relative overflow-hidden group h-auto rounded-full px-5 py-2.5 cursor-pointer border border-primary bg-primary text-primary-foreground shadow-none transition-all duration-300">
            <span className="absolute left-1/2 -translate-x-1/2 top-full -translate-y-1/2 w-10 h-10 bg-background rounded-full scale-0 transition-transform duration-700 ease-in-out group-hover:scale-[18]" />
            <span className="relative z-10 group-hover:text-primary transition-colors duration-300">
              Get Started
            </span>
          </Button>

          {/* Mobile Menu */}
          <div className="lg:hidden relative">
            <DropdownMenu open={menuOpen} onOpenChange={setMenuOpen}>
              <AnimatePresence>
                {menuOpen && (
                  <DropdownMenuPortal>
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      onClick={() => setMenuOpen(false)}
                      className="fixed inset-0 z-40 backdrop-blur-sm"
                    />
                  </DropdownMenuPortal>
                )}
              </AnimatePresence>
              <DropdownMenuTrigger className="rounded-full bg-gray-50 hover:bg-gray-50/80 h-auto p-2.5 gap-2 border border-border cursor-pointer">
                <Menu className="w-4 h-4 text-gray-950 cursor-pointer" />
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="end"
                sideOffset={10}
                className="min-w-xs sm:min-w-sm bg-background py-8 px-6 shadow-2xl rounded-3xl border border-border -mt-12 z-50 dark"
              >
                <div className="flex flex-col gap-6">
                  {/* Header */}
                  <div className="flex items-center justify-between">
                    <p className="text-lg font-medium text-foreground">
                      Menu
                    </p>
                    <Button variant="outline" onClick={() => setMenuOpen(false)} className="h-auto p-2.5 cursor-pointer rounded-full">
                      <X size={20} />
                    </Button>
                  </div>
                  <hr className="border-border" />
                  {/* Navigation */}
                  <ul className="flex flex-col gap-3.5">
                    {navigationData.map((item, index) => (
                      <NavLink
                        key={index}
                        item={item}
                        onClick={() => setMenuOpen(false)}
                      />
                    ))}
                  </ul>
                  <Button className="relative overflow-hidden group h-auto rounded-full px-5 py-2.5 cursor-pointer border border-primary bg-primary text-primary-foreground shadow-none transition-all duration-300">
                    <span className="absolute left-1/2 -translate-x-1/2 top-full -translate-y-1/2 w-10 h-10 bg-background rounded-full scale-0 transition-transform duration-700 ease-in-out group-hover:scale-[18]" />
                    <span className="relative z-10 group-hover:text-primary transition-colors duration-300">
                      Get Started
                    </span>
                  </Button>
                </div>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </nav>
      </div>
    </header>
  )
}

export default Navbar