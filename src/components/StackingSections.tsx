"use client";
import { useInView } from "framer-motion";
import { useRef, useState, useEffect } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

type Panel = {
  tag: string;
  title: string;
  body: string;
  bg: string;
  fg: string;
  image?: string;
};

const panels: Panel[] = [
  {
    tag: "01 — Content Research",
    title: "We don't guess what works.",
    body: "Before a single word is written, we study your niche, your competitors, and what your audience is already responding to. Every piece of content starts with a reason to exist.",
    bg: "#1A1A2E",
    fg: "#E8E8FF",
    image: "/section1.png",
  },
  {
    tag: "02 — Scripting",
    title: "Your voice. Our structure.",
    body: "We write scripts that sound like you on your best day — clear, confident, and built to hold attention past the first three seconds. No filler, no fluff.",
    bg: "#F5F0E8",
    fg: "#2C2416",
    image: "/section2.png",
  },
  {
    tag: "03 — Editing",
    title: "Where good footage becomes content people finish.",
    body: "Pacing, cuts, captions, sound design — every edit is crafted to stop the scroll and keep the watch time climbing.",
    bg: "#0D0D0D",
    fg: "#F0F0F0",
    image: "/section3.png",
  },
  {
    tag: "04 — Posting & Scheduling",
    title: "Consistency is the strategy.",
    body: "We handle publishing across platforms at the right times so your content works even when you're not. You stay present without being glued to your phone.",
    bg: "#E8F5EE",
    fg: "#0D3D22",
    image: "/section4.png",
  },
  {
    tag: "05 — SEO Optimisation",
    title: "Built to be found, not just seen.",
    body: "Titles, descriptions, hashtags, and metadata — optimised so your content keeps pulling in views long after the upload day.",
    bg: "#FFF3E0",
    fg: "#3E1F00",
    image: "/section5.png",
  },
];

function Panel({
  panel,
  index,
}: {
  panel: Panel;
  index: number;
  totalPanels: number;
}) {
  const panelRef = useRef<HTMLDivElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);

  // ── GSAP: all animations in one context, one RAF loop ──
  useEffect(() => {
    const card = cardRef.current;
    if (!card) return;

    const ctx = gsap.context(() => {
      // Card entrance: scrub-linked rotate + scale
      // scrub: 0.5 = smooth 500ms lag behind scroll for organic feel
      gsap.set(card, {
        rotate: index === 0 ? -2 : -3,
        scale: index === 0 ? 0.96 : 0.94,
        willChange: "transform",  // pre-allocate GPU compositor layer
        z: 0,                     // force hardware acceleration
      });
      gsap.to(card, {
        rotate: 0,
        scale: 1,
        ease: "none",
        scrollTrigger: {
          trigger: panelRef.current,
          start: "top bottom",  // start as soon as card enters viewport
          end: "top 20%",       // finish before card is fully in position
          scrub: 0.5,           // butter-smooth, tied directly to scroll speed
        },
      });

      // Content reveal: trigger-based stagger timeline
      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: panelRef.current,
          start: "top 65%",
          toggleActions: "play none none reverse",
        },
        defaults: { ease: "power2.out" },
      });

      tl.from("[data-gsap='tag']",   { y: 22, opacity: 0, duration: 0.4 }, 0)
        .from("[data-gsap='body-word']", { y: "105%", duration: 0.35, stagger: 0.02 }, 0.08)
        .from("[data-gsap='title']", { y: 28, opacity: 0, duration: 0.45 }, 0.16)
        .from("[data-gsap='image']", { clipPath: "inset(100% 0 0 0)", duration: 0.8, ease: "power2.inOut" }, 0.04)
        .from("[data-gsap='line']",  { scaleY: 0, transformOrigin: "top center", duration: 0.55 }, 0)
        .from("[data-gsap='caption']", { y: "110%", duration: 0.45 }, 0.45);
    }, panelRef); // scope to panelRef — selectors only match within this panel

    return () => ctx.revert();
  }, [index]);

  return (
    <div
      ref={panelRef}
      className="sticky top-16 sm:top-0 flex h-[80vh] sm:h-screen w-full items-stretch justify-center px-3 sm:px-4 md:px-8 py-4 sm:py-8 md:py-12 max-w-[2080px] mx-auto"
      style={{ zIndex: index + 1 }}
    >
      <div
        ref={cardRef}
        style={{ background: panel.bg, color: panel.fg }}
        className="relative flex h-full w-full overflow-hidden rounded-[20px] sm:rounded-[28px] shadow-2xl"
      >
        {/* ── MOBILE LAYOUT (< md) ── */}
        <div className="md:hidden flex flex-col justify-between w-full p-5 sm:p-8">
          {/* Tag */}
          <div
            data-gsap="tag"
            className="text-base sm:text-lg uppercase tracking-[0.25em] opacity-70"
          >
            {panel.tag}
            {/* horizontal Line */}
            <hr className="border-t border-gray-300 opacity-70 w-full animate-slow-line mt-2" />
          </div>
          
          {/* Body */}
          <div className="text-lg sm:text-2xl leading-[1.2] opacity-80 my-4 flex flex-wrap gap-x-[0.3em]">
            {panel.body.split(" ").map((word, i) => (
              <span key={i} className="inline-block overflow-hidden">
                <span data-gsap="body-word" className="inline-block">{word}</span>
              </span>
            ))}
          </div>

          {/* Title */}
          <h3
            data-gsap="title"
            className="font-display text-[clamp(2rem,8vw,3.5rem)] font-bold leading-[0.95] tracking-tighter"
          >
            {panel.title}
          </h3>

          {/* Mobile image */}
          {panel.image && (
            <div
              data-gsap="image"
              className="mt-4 w-full overflow-hidden  shadow-lg"
              style={{ clipPath: "inset(0 0 0 0)" }}
            >
              <img src={panel.image} alt={panel.tag} className="w-full h-auto" />
            </div>
          )}
        </div>

        {/* ── DESKTOP LAYOUT (≥ md) ── */}
        <div className="hidden md:flex w-full h-full">

          {/* LEFT SIDE */}
          <div className="flex flex-col justify-between w-1/2 h-full p-14">

            {/* Top: number + separator + body */}
            <div className="flex items-start gap-6">
              {/* Number */}
              <div className="overflow-hidden flex-shrink-0 pt-1">
                <span
                  data-gsap="tag"
                  className="block font-mono lg:text-[34px] text-xl tracking-widest opacity-50"
                >
                  {panel.tag.split("—")[0].trim()}
                </span>
              </div>

              {/* Vertical separator */}
              <div
                data-gsap="line"
                className="w-px flex-shrink-0 mt-1 self-stretch opacity-30"
                style={{ backgroundColor: "currentColor" }}
              />

              {/* Body text */}
              <p className="text-lg lg:text-[34px] leading-[34px] opacity-75 max-w-2xl flex flex-wrap gap-x-[0.3em]">
                {panel.body.split(" ").map((word, i) => (
                  <span key={i} className="inline-block overflow-hidden">
                    <span data-gsap="body-word" className="inline-block">{word}</span>
                  </span>
                ))}
              </p>
            </div>

            {/* Bottom: title */}
            <div className="flex flex-col gap-5">
              <h3
                data-gsap="title"
                className="font-display text-[clamp(2.5rem,5.5vw,6rem)] font-bold leading-[0.9] tracking-tighter"
              >
                {panel.title}
              </h3>

              {/* Title underline */}
              <div
                className="h-px w-full opacity-20"
                style={{ backgroundColor: "currentColor" }}
              />
            </div>
          </div>

          {/* RIGHT SIDE — image with caption */}
          {panel.image && (
            <div className="relative w-1/2 h-full flex items-center justify-center p-10">
              {/* Vertical line decoration */}
              <div
                data-gsap="line"
                className="absolute left-0 top-10 bottom-10 w-px opacity-20"
                style={{ backgroundColor: "currentColor" }}
              />

              {/* Image */}
              <div
                data-gsap="image"
                className="relative h-full w-full max-h-[75%] overflow-hidden shadow-2xl"
                style={{ clipPath: "inset(0 0 0 0)" }}
              >
                <img src={panel.image} alt={panel.tag} className="h-full w-auto" />
              </div>

              {/* Caption label */}
              <div className="absolute bottom-10 left-10 right-10 overflow-hidden">
                <p
                  data-gsap="caption"
                  className="text-xs tracking-[0.2em] uppercase opacity-50"
                >
                  ( {panel.tag.split("—")[1]?.trim() ?? panel.tag} )
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Typewriter: pure setInterval, no framer-motion, zero render overhead ──
function TypeWriter({ text, className }: { text: string; className?: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });
  const [displayed, setDisplayed] = useState("");
  const [cursorVisible, setCursorVisible] = useState(true);

  useEffect(() => {
    if (!isInView) return;

    let i = 0;
    let typing = true;
    let timeout: ReturnType<typeof setTimeout>;

    const tick = () => {
      if (typing) {
        i++;
        setDisplayed(text.slice(0, i));
        if (i >= text.length) {
          timeout = setTimeout(() => { typing = false; tick(); }, 1500);
          return;
        }
        timeout = setTimeout(tick, 70);
      } else {
        i--;
        setDisplayed(text.slice(0, i));
        if (i <= 0) {
          timeout = setTimeout(() => { typing = true; tick(); }, 500);
          return;
        }
        timeout = setTimeout(tick, 40);
      }
    };

    tick();

    const blinkInterval = setInterval(() => setCursorVisible((v) => !v), 530);

    return () => { clearTimeout(timeout); clearInterval(blinkInterval); };
  }, [isInView, text]);

  return (
    <span ref={ref} className={className}>
      {displayed}
      <span
        className="inline-block w-[0.06em] h-[0.85em] ml-[0.05em] align-middle bg-current"
        style={{
          opacity: isInView && cursorVisible ? 1 : 0,
          transform: "skewX(-12deg)",
          transition: "opacity 0.1s",
        }}
      />
    </span>
  );
}

export function StackingSections() {
  return (
    <section id="about" className="relative bg-background vertical-lines border-t border-border">
      <div className="site-container pb-12 sm:pb-20 pt-20 sm:pt-28 text-center relative z-10">
        <h2 className="font-display-lc uppercase text-[clamp(3rem,10vw,6rem)] font-bold leading-[0.85] tracking-tight drop-shadow-sm text-foreground">
          WHAT YOU GET WHEN STRATEGY
          <br />
          <TypeWriter text="MEETS EXECUTION" className="italic text-foreground/40" />
        </h2>
        <p className="mx-auto mt-4 sm:mt-6 max-w-2xl text-base leading-[1.2] sm:text-base md:text-lg text-muted-foreground font-medium">
          Most founders have something worth saying. They just don't have the system to say it consistently, clearly, and on every platform that matters. That's exactly what we build.
        </p>
      </div>
      <div className="relative">
        {panels.map((p, i) => (
          <Panel
            key={i}
            panel={p}
            index={i}
            totalPanels={panels.length}
          />
        ))}
      </div>
    </section>
  );
}
