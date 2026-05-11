"use client";
import { motion } from "framer-motion";
import { GlassButton } from "@/components/ui/apple-tahoe-liquid-glass-button";
import { LiquidGlassContainer } from "@/components/ui/liquid-glass-container";

import { useEffect, useState } from "react";
import Image from "next/image";

const links = [
  { name: "Home", id: "home" },
  { name: "Work", id: "work" },
  { name: "About", id: "about" },
  { name: "FAQ's", id: "faqs" }
];

export function Navbar() {
  const [activeSection, setActiveSection] = useState("home");
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    // Automatically update the active pill based on scroll position
    const handleScroll = () => {
      const sections = links.map(link => document.getElementById(link.id));
      const scrollPosition = window.scrollY + window.innerHeight / 2;

      for (let i = sections.length - 1; i >= 0; i--) {
        const section = sections[i];
        if (section && section.offsetTop <= scrollPosition) {
          setActiveSection(links[i].id);
          break;
        }
      }
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Lock body scroll when mobile menu is open
  useEffect(() => {
    if (mobileOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => { document.body.style.overflow = ""; };
  }, [mobileOpen]);

  const handleLinkClick = (e: React.MouseEvent<HTMLAnchorElement>, id: string) => {
    e.preventDefault();
    setActiveSection(id);
    setMobileOpen(false);

    // Use Lenis for precise programmatic scrolling
    const lenis = (window as any).lenis;
    const el = document.getElementById(id);
    if (lenis && el) {
      lenis.scrollTo(el, { offset: -50, duration: 1.2 });
    } else if (el) {
      el.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <motion.nav
      initial={{ y: -40, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
      className="fixed top-0 left-0 right-0 z-50 w-full"
    >
      {/* Mobile gradient backdrop */}
      <div className="md:hidden absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-background via-background/80 to-transparent pointer-events-none" />

      <div className="relative max-w-[1280px] mx-auto mt-6 flex items-center justify-between text-[15px] px-4">
        <a
          href="#top"
          className="flex items-center gap-2 pl-2 font-semibold tracking-tight"
        >
          <Image src="/logo.png" alt="ommi-logo" width={40} height={40} className="sm:w-[50px] sm:h-[50px]" />
        </a>
        <LiquidGlassContainer className="relative hidden md:flex items-center justify-between rounded-full px-2 py-2 shadow-lg">
          <ul className="flex items-center font-medium text-foreground/80 relative">
            {links.map((link) => {
              const isActive = activeSection === link.id;

              return (
                <li key={link.id} className="relative px-1">
                  {isActive && (
                    <motion.div
                      layoutId="active-pill"
                      className="absolute inset-0 z-0"
                      transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                    >
                      <LiquidGlassContainer className="w-full h-full rounded-full" glassColor="oklch(from var(--foreground) l c h / 15%)" />
                    </motion.div>
                  )}
                  <a
                    href={`#${link.id}`}
                    onClick={(e) => handleLinkClick(e, link.id)}
                    className={`relative z-10 block px-5 py-2 rounded-full transition-colors duration-300 ${isActive ? 'text-foreground font-semibold' : 'hover:text-foreground'}`}
                  >
                    {link.name}
                  </a>
                </li>
              );
            })}
          </ul>
        </LiquidGlassContainer>

        <div className="flex items-center gap-3">
          <a href="https://calendly.com/ommimedia-in/30min" className="hidden sm:block" >
            <GlassButton className="px-5 py-3 font-medium transition-transform">
              Book a Call
            </GlassButton>
          </a>

          {/* Mobile hamburger */}
          <button
            className="md:hidden flex flex-col items-center justify-center w-10 h-10 gap-[5px] rounded-full"
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label="Toggle menu"
          >
            <span className={`block w-5 h-[2px] bg-foreground transition-all duration-300 ${mobileOpen ? 'rotate-45 translate-y-[7px]' : ''}`} />
            <span className={`block w-5 h-[2px] bg-foreground transition-all duration-300 ${mobileOpen ? 'opacity-0' : ''}`} />
            <span className={`block w-5 h-[2px] bg-foreground transition-all duration-300 ${mobileOpen ? '-rotate-45 -translate-y-[7px]' : ''}`} />
          </button>
        </div>
      </div>

      {/* Mobile dropdown menu */}
      {mobileOpen && (
        <motion.div
          initial={{ opacity: 0, y: -10, scaleY: 0.95 }}
          animate={{ opacity: 1, y: 0, scaleY: 1 }}
          exit={{ opacity: 0, y: -10, scaleY: 0.95 }}
          transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
          className="md:hidden mt-3 mx-2 origin-top rounded-2xl bg-background/95 backdrop-blur-xl border border-border/50 shadow-xl overflow-hidden"
        >
          <div className="flex flex-col py-3">
            {links.map((link) => (
              <a
                key={link.id}
                href={`#${link.id}`}
                onClick={(e) => handleLinkClick(e, link.id)}
                className={`px-6 py-3 text-base font-medium transition-colors ${activeSection === link.id ? 'text-foreground bg-foreground/5' : 'text-foreground/60 hover:text-foreground hover:bg-foreground/5'}`}
              >
                {link.name}
              </a>
            ))}
            <div className="px-6 py-3 pt-2 border-t border-border/30 mt-1">
              <a
                href="https://calendly.com/ommimedia-in/30min"
                className="w-full inline-flex h-11 items-center justify-center rounded-full bg-foreground px-6 text-sm font-medium text-background"
              >
                Book a Call
              </a>
            </div>
          </div>
        </motion.div>
      )}

    </motion.nav>
  );
}
