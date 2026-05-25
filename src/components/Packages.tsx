"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import gsap from "gsap";

interface PackageData {
  id: string;
  tabLabel: string;
  chip: string;
  headline: string;
  included: string[];
  outcomeLabel: string;
  outcomeText: string;
  ctaNote: string;
}

const packages: PackageData[] = [
  {
    id: "personal",
    tabLabel: "For Personal Brands & Startups",
    chip: "Brand Content System",
    headline: "For founders, coaches, consultants, and startups building authority online — from script to post, fully done for you.",
    included: [
      "15–20 short-form videos/month — Reels, Shorts & TikTok",
      "Weekly scripts written from your story, ideas & offers",
      "Carousels & graphics for LinkedIn and Instagram",
      "Platform strategy for LinkedIn, Instagram & X",
      "Captions, hooks & posting — handled end to end",
      "Monthly content calendar + performance review"
    ],
    outcomeLabel: "What this gets you",
    outcomeText: "Turn your expertise into a content engine that builds authority, grows your audience, and drives inbound leads",
    ctaNote: "Limited spots available each month."
  },
  {
    id: "finance",
    tabLabel: "For Finance Companies",
    chip: "Finance Content Engine",
    headline: "For macro research firms and fintech companies turning complex insights into content that builds brand and drives inbound.",
    included: [
      "Weekly short-form video scripts from your research & reports",
      "15–20 videos/month across LinkedIn and YouTube Shorts",
      "Data-led carousels and infographics from your reports",
      "Platform strategy for LinkedIn and X (Twitter)",
      "Monthly content calendar + performance review"
    ],
    outcomeLabel: "What this gets you",
    outcomeText: "Turn your research into reach. Build brand and inbound from the audience that matters — investors, analysts, and decision-makers.",
    ctaNote: "Limited spots available each month."
  },
  {
    id: "ai",
    tabLabel: "For AI Companies",
    chip: "AI Growth Content System",
    headline: "For AI startups, SaaS tools, and dev-focused companies that need content to cut through the noise and build a real audience.",
    included: [
      "15–20 short-form videos/month explaining your product & vision",
      "Founder-led content scripted around your POV and insights",
      "Thought-leadership carousels & threads for LinkedIn and X",
      "Platform strategy built for tech & AI-native audiences",
      "Monthly content calendar + performance review"
    ],
    outcomeLabel: "What this gets you",
    outcomeText: "Turn your product and vision into a distribution engine. Build a community of early adopters, attract top talent, and stay top-of-mind in your category.",
    ctaNote: "Limited spots available each month."
  }
];

export function Packages() {
  const [activeTab, setActiveTab] = useState("personal");
  const activePackage = packages.find((p) => p.id === activeTab) || packages[0];

  // Mobile stacked cards deck state: stores package index array e.g., [0, 1, 2]
  // The first element stack[0] is the card currently on top.
  const [stack, setStack] = useState([0, 1, 2]);

  // DOM Refs for high-performance direct animations (bypasses React trigger cycles during active dragging)
  const cardRefs = useRef<(HTMLDivElement | null)[]>([]);
  
  // Drag transaction values
  const dragInfo = useRef({
    startX: 0,
    startY: 0,
    currentX: 0,
    currentY: 0,
    isDragging: false,
    isSwipeLocked: false,
  });

  // GSAP: Animate cards to their target stacking depths (offset to the right side to prompt left swiping)
  useEffect(() => {
    stack.forEach((pkgIndex, position) => {
      const cardEl = cardRefs.current[pkgIndex];
      if (!cardEl) return;

      // Kill active tweens to prevent scroll/drag conflict overlaps
      gsap.killTweensOf(cardEl);

      // Horizontal depth layers:
      // Offset to the right (x: position * 12) with a subtle fan rotation (rotate: position * 1.5)
      // and strictly centered vertically (y: 0). Keep opacity solid 1.0 to block background text.
      gsap.to(cardEl, {
        scale: 1 - position * 0.04,
        x: position * 12,
        y: 0,
        rotate: position * 1.5,
        opacity: 1,
        duration: 0.55,
        ease: "power2.out",
        overwrite: "auto",
      });

      // Apply zIndex directly so the stacking layers match position
      cardEl.style.zIndex = String(10 - position);
    });
  }, [stack]);

  // Gestures: Touch/Mouse drag start
  const handleDragStart = (e: React.TouchEvent | React.MouseEvent, pkgIndex: number) => {
    const clientX = "touches" in e ? e.touches[0].clientX : e.clientX;
    const clientY = "touches" in e ? e.touches[0].clientY : e.clientY;
    dragInfo.current.startX = clientX;
    dragInfo.current.startY = clientY;
    dragInfo.current.currentX = clientX;
    dragInfo.current.currentY = clientY;
    dragInfo.current.isDragging = true;
    dragInfo.current.isSwipeLocked = false;
    
    const cardEl = cardRefs.current[pkgIndex];
    if (cardEl) {
      gsap.killTweensOf(cardEl);
    }
  };

  // Gestures: Touch/Mouse drag move
  const handleDragMove = (e: React.TouchEvent | React.MouseEvent, pkgIndex: number) => {
    if (!dragInfo.current.isDragging) return;
    if (dragInfo.current.isSwipeLocked) return;
    
    const clientX = "touches" in e ? e.touches[0].clientX : e.clientX;
    const clientY = "touches" in e ? e.touches[0].clientY : e.clientY;
    
    const deltaX = clientX - dragInfo.current.startX;
    const deltaY = clientY - dragInfo.current.startY;

    // Detect if this is a vertical scroll (intended page scrolling) or horizontal swipe (intended card browse).
    // We check this after a small threshold of 10px of movement.
    const moveThreshold = 10;
    if (Math.abs(deltaX) > moveThreshold || Math.abs(deltaY) > moveThreshold) {
      if (Math.abs(deltaY) > Math.abs(deltaX)) {
        // Vertical movement is dominant -> Lock the horizontal swiper gesture
        // so standard native page scrolling continues without cards shifting!
        dragInfo.current.isSwipeLocked = true;
        dragInfo.current.isDragging = false;
        
        // Softly spring the card back to center in case it moved a few pixels
        const cardEl = cardRefs.current[pkgIndex];
        if (cardEl) {
          gsap.to(cardEl, { x: 0, rotate: 0, scale: 1, duration: 0.25, ease: "power2.out" });
        }
        return;
      }
    }

    // Cancel browser native scroll behavior ONLY during a valid horizontal card swipe gesture
    if (e.cancelable) {
      e.preventDefault();
    }

    dragInfo.current.currentX = clientX;
    dragInfo.current.currentY = clientY;
    
    const cardEl = cardRefs.current[pkgIndex];
    if (cardEl) {
      // 0-latency raw manipulation for buttery-soft finger/mouse tracking
      gsap.set(cardEl, {
        x: deltaX,
        rotate: deltaX * 0.07, // 7deg rotation for every 100px dragged
        scale: 1.015,
      });
    }
  };

  // Gestures: Touch/Mouse drag end
  const handleDragEnd = (pkgIndex: number) => {
    if (!dragInfo.current.isDragging) return;
    dragInfo.current.isDragging = false;

    const deltaX = dragInfo.current.currentX - dragInfo.current.startX;
    const cardEl = cardRefs.current[pkgIndex];
    if (!cardEl) return;

    const threshold = 90; // swipe offset threshold

    if (deltaX < -threshold) {
      // Swipe Left fly-off: top card flies off to the left and joins the bottom of the stack
      // Bring the second card (stack[1]) forward immediately to eliminate overlapping lag!
      const nextTopIndex = stack[1];
      const nextTopCardEl = cardRefs.current[nextTopIndex];
      if (nextTopCardEl) {
        gsap.killTweensOf(nextTopCardEl);
        gsap.to(nextTopCardEl, {
          scale: 1,
          x: 0,
          y: 0,
          rotate: 0,
          opacity: 1,
          duration: 0.35,
          ease: "power2.out",
        });
        nextTopCardEl.style.zIndex = "10";
      }

      gsap.to(cardEl, {
        x: -450,
        rotate: -25,
        opacity: 0,
        duration: 0.35,
        ease: "power2.out",
        onComplete: () => {
          setStack((prev) => {
            const next = [...prev];
            const top = next.shift()!;
            next.push(top);
            return next;
          });
          // Instantly reset properties at the bottom layer (useEffect will animate it in)
          gsap.set(cardEl, { x: 0, rotate: 0, opacity: 0 });
        },
      });
    } else {
      // Snap-back: drag was within threshold or to the right, bounce top card back to center fanned alignment
      gsap.to(cardEl, {
        x: 0,
        rotate: 0,
        scale: 1,
        duration: 0.55,
        ease: "elastic.out(1, 0.75)",
      });
    }
  };

  return (
    <section
      id="services"
      className="relative bg-background vertical-lines py-16 sm:py-28 border-b border-border overflow-hidden"
    >
      <div className="site-container relative z-10">
        
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.8 }}
          className="mb-12 text-center"
        >
          <span className="text-xs uppercase tracking-[0.3em] text-muted-foreground font-semibold">
            Services
          </span>
          <h2 className="mt-3 font-display font-extrabold uppercase text-[clamp(2.5rem,8vw,6rem)] leading-[0.85] tracking-tight drop-shadow-sm">
            Bundled<br />
            <span className="text-foreground/40 italic">packages.</span>
          </h2>
        </motion.div>

        {/* ── DESKTOP LAYOUT (md and above) ── */}
        <div className="hidden md:block">
          {/* Tab Row Selector */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.8, delay: 0.1 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-2 mb-12 border-b border-border/80 pb-4 max-w-4xl mx-auto"
          >
            {packages.map((pkg) => {
              const isActive = activeTab === pkg.id;
              return (
                <button
                  key={pkg.id}
                  onClick={() => setActiveTab(pkg.id)}
                  className={`relative px-6 py-3 rounded-full text-xs sm:text-sm font-semibold tracking-wider uppercase transition-colors duration-300 ${
                    isActive ? "text-foreground font-bold" : "text-muted-foreground hover:text-foreground/80"
                  }`}
                >
                  {isActive && (
                    <motion.div
                      layoutId="active-package-tab"
                      className="absolute inset-0 bg-foreground/[0.04] rounded-full border border-border/60"
                      transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                    />
                  )}
                  <span className="relative z-10">{pkg.tabLabel}</span>
                </button>
              );
            })}
          </motion.div>

          {/* Active Package Content Card */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="max-w-[1080px] mx-auto w-full"
          >
            <AnimatePresence mode="wait">
              <motion.div
                key={activePackage.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                transition={{ duration: 0.4, ease: "easeInOut" }}
              >
                <div 
                  className="rounded-[24px] md:rounded-[32px] p-6 sm:p-10 md:p-14 border border-border/80 bg-card shadow-2xl relative overflow-hidden"
                >
                  {/* Visual Dot Tag */}
                  <div className="inline-flex items-center gap-2 rounded-full border border-border/70 bg-background/50 px-3.5 py-1.5 text-[10px] tracking-[0.2em] uppercase text-foreground/80 font-bold mb-6 sm:mb-8">
                    <span className="h-1.5 w-1.5 rounded-full bg-foreground animate-pulse" />
                    {activePackage.chip}
                  </div>

                  {/* Card Headline */}
                  <h3 className="text-lg sm:text-xl md:text-2xl font-light text-foreground/80 leading-relaxed max-w-3xl mb-8 sm:mb-12 tracking-tight">
                    {activePackage.headline}
                  </h3>

                  {/* Thin custom divider */}
                  <div className="h-px bg-border/70 mb-8 sm:mb-12" />

                  {/* Details Grid */}
                  <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 sm:gap-12 mb-8 sm:mb-12">
                    
                    {/* Checklist Column */}
                    <div className="lg:col-span-3">
                      <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground mb-6 font-bold">
                        What's included
                      </p>
                      <div className="space-y-4">
                        {activePackage.included.map((item, index) => (
                          <div key={index} className="flex items-start gap-3.5 text-sm sm:text-base text-foreground/90 font-medium tracking-tight">
                            <span className="flex-shrink-0 w-5 h-5 rounded-full border border-border/70 bg-background/50 flex items-center justify-center mt-0.5">
                              <svg className="w-3 h-3 text-foreground" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <polyline points="12,5 6.5,11 3.5,8" />
                              </svg>
                            </span>
                            <span className="leading-snug">{item}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Outcome Box Column */}
                    <div className="lg:col-span-2 flex flex-col justify-start">
                      <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground mb-6 font-bold">
                        Outcome
                      </p>
                      <div className="bg-foreground/[0.03] border border-border/70 rounded-2xl p-6 sm:p-8 backdrop-blur-sm shadow-inner">
                        <p className="text-xs uppercase tracking-[0.18em] text-foreground font-bold mb-3">
                          {activePackage.outcomeLabel}
                        </p>
                        <p className="text-sm sm:text-base text-foreground/80 leading-relaxed font-medium">
                          {activePackage.outcomeText}
                        </p>
                      </div>
                    </div>

                  </div>

                  {/* CTA / Footer block */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 pt-6 sm:pt-8 border-t border-border/50">
                    <p className="text-xs sm:text-sm text-muted-foreground italic font-medium">
                      {activePackage.ctaNote}
                    </p>
                    <button
                      onClick={() => window.dispatchEvent(new Event("open-booking-modal"))}
                      className="inline-flex h-12 items-center justify-center rounded-full bg-foreground px-8 text-sm font-semibold text-background transition-transform hover:scale-[1.03] shadow-md cursor-pointer"
                    >
                      Book a Call &rarr;
                    </button>
                  </div>

                </div>
              </motion.div>
            </AnimatePresence>
          </motion.div>
        </div>

        {/* ── MOBILE LAYOUT (Stack of playing cards with custom GSAP transitions) ── */}
        <div className="block md:hidden max-w-[380px] mx-auto">
          
          {/* Deck Container (increased height to accommodate taller cards cleanly) */}
          <div className="relative w-full h-[660px] flex items-center justify-center select-none mb-4">
            
            {packages.map((pkg, pkgIndex) => {
              const position = stack.indexOf(pkgIndex); // 0 = top, 1 = middle, 2 = bottom
              const isTop = position === 0;

              return (
                <div
                  key={pkg.id}
                  ref={(el) => {
                    cardRefs.current[pkgIndex] = el;
                  }}
                  onTouchStart={(e) => isTop && handleDragStart(e, pkgIndex)}
                  onTouchMove={(e) => isTop && handleDragMove(e, pkgIndex)}
                  onTouchEnd={() => isTop && handleDragEnd(pkgIndex)}
                  onMouseDown={(e) => isTop && handleDragStart(e, pkgIndex)}
                  onMouseMove={(e) => isTop && handleDragMove(e, pkgIndex)}
                  onMouseUp={() => isTop && handleDragEnd(pkgIndex)}
                  onMouseLeave={() => isTop && handleDragEnd(pkgIndex)}
                  className="absolute w-full h-[660px] rounded-[24px] border border-border/80 bg-card p-6 shadow-xl flex flex-col justify-between overflow-hidden touch-pan-y"
                  style={{
                    transformOrigin: "bottom center",
                    cursor: isTop ? "grab" : "default",
                  }}
                >
                  {/* Card Content Wrapper */}
                  <div className="flex flex-col h-full justify-between">
                    
                    {/* Top Content Block */}
                    <div>
                      {/* Visual Dot Tag */}
                      <div className="inline-flex items-center gap-1.5 rounded-full border border-border/70 bg-background/50 px-2.5 py-1 text-[11px] tracking-[0.15em] uppercase text-foreground/80 font-bold mb-3">
                        <span className="h-1.5 w-1.5 rounded-full bg-foreground animate-pulse" />
                        {pkg.chip}
                      </div>

                      {/* Card Headline */}
                      <h3 className="text-[15px] leading-relaxed font-light text-foreground/85 tracking-tight mb-3">
                        {pkg.headline}
                      </h3>
                      
                      {/* Divider */}
                      <div className="h-px bg-border/60 mb-3" />
                    </div>

                    {/* Content lists (rendered naturally with NO scrollbar) */}
                    <div className="flex-1 mb-3 space-y-4 pt-1">
                      
                      {/* What's included block */}
                      <div>
                        <p className="text-[11px] uppercase tracking-wider text-muted-foreground font-bold mb-2">
                          What's included
                        </p>
                        <div className="space-y-2.5">
                          {pkg.included.map((item, idx) => (
                            <div key={idx} className="flex items-start gap-2.5 text-sm text-foreground/90 font-medium">
                              <span className="flex-shrink-0 w-4.5 h-4.5 rounded-full border border-border/70 bg-background/50 flex items-center justify-center mt-0.5">
                                <svg className="w-2.5 h-2.5 text-foreground" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                  <polyline points="12,5 6.5,11 3.5,8" />
                                </svg>
                              </span>
                              <span className="leading-snug">{item}</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Outcome block */}
                      <div className="pt-1">
                        <p className="text-[11px] uppercase tracking-wider text-muted-foreground font-bold mb-2">
                          Outcome
                        </p>
                        <div className="bg-foreground/[0.02] border border-border/60 rounded-xl p-3">
                          <p className="text-[12.5px] text-foreground/80 leading-relaxed font-medium">
                            {pkg.outcomeText}
                          </p>
                        </div>
                      </div>

                    </div>

                    {/* Footer / CTA block */}
                    <div className="pt-3 border-t border-border/50 flex items-center justify-between gap-4">
                      <div className="flex flex-col">
                        <p className="text-[11px] text-muted-foreground italic font-medium leading-none mb-1">
                          {pkg.ctaNote}
                        </p>
                        <p className="text-[9px] text-foreground/40 font-bold uppercase tracking-widest leading-none">
                          Swipe left to browse
                        </p>
                      </div>
                      <button
                        onClick={() => window.dispatchEvent(new Event("open-booking-modal"))}
                        className="inline-flex h-9 items-center justify-center rounded-full bg-foreground px-4 text-xs font-semibold text-background transition-transform active:scale-95 shadow-md cursor-pointer"
                      >
                        Book &rarr;
                      </button>
                    </div>

                  </div>
                </div>
              );
            })}
          </div>

          {/* Dots Pagination Indicator */}
          <div className="flex items-center justify-center gap-1.5 mt-2">
            {packages.map((_, idx) => {
              // Active index corresponds to the top card in stack (stack[0])
              const isActive = stack[0] === idx;
              return (
                <div
                  key={idx}
                  className={`h-1.5 rounded-full transition-all duration-300 ${
                    isActive ? "w-4 bg-foreground" : "w-1.5 bg-foreground/20"
                  }`}
                />
              );
            })}
          </div>

        </div>

      </div>
    </section>
  );
}
