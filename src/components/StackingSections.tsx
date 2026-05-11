"use client";
import { motion, useScroll, useTransform, useInView } from "framer-motion";
import { useRef, useState, useEffect } from "react";

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
  totalPanels,
}: {
  panel: Panel;
  index: number;
  totalPanels: number;
}) {
  const panelRef = useRef<HTMLDivElement>(null);
  
  // Track this specific panel as its top edge goes from the bottom of the viewport to the top of the viewport
  const { scrollYProgress } = useScroll({
    target: panelRef,
    offset: ["start end", "start start"],
  });

  // Entrance animations based on local scroll progress (0 to 1)
  const rotate = useTransform(
    scrollYProgress,
    [0.2, 1], // Start animating when it's 20% into the viewport
    index === 0 ? [-2, 0] : [-3, 0],
  );
  
  const scale = useTransform(
    scrollYProgress,
    [0.2, 3],
    index === 0 ? [0.96, 1] : [0.94, 1],
  );

  return (
    <div
      ref={panelRef}
      className="sticky top-16 sm:top-0 flex h-[80vh] sm:h-screen w-full items-stretch justify-center px-3 sm:px-4 md:px-8 py-4 sm:py-8 md:py-12"
      style={{ zIndex: index + 1 }}
    >
      <motion.div
        style={{
          rotate,
          scale,
          background: panel.bg,
          color: panel.fg,
        }}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: false, amount: index === totalPanels - 1 ? 0.6 : 0.85 }}
        variants={{
          hidden: {},
          visible: {
            transition: {
              staggerChildren: 0.15,
            }
          }
        }}
        className="relative flex h-full w-full flex-col justify-between overflow-hidden rounded-[20px] sm:rounded-[28px] p-5 sm:p-8 md:p-14 shadow-2xl"
      >
        {/* Top section: tag + body */}
        <div className="max-w-2xl z-10 flex flex-col gap-4 sm:gap-6">
          <div className="text-xs uppercase tracking-[0.3em]">
            <span className="sr-only">{panel.tag}</span>
            <motion.span 
              aria-hidden="true" 
              className="flex flex-wrap gap-x-[0.3em]"
              variants={{
                hidden: {},
                visible: { transition: { staggerChildren: 0.04 } }
              }}
            >
              {panel.tag.split(" ").map((word, idx) => (
                <motion.span
                  key={idx}
                  variants={{
                    hidden: { opacity: 0, y: 30 },
                    visible: { opacity: 0.7, y: 0, transition: { duration: 0.8, ease: [0.22, 1, 0.36, 1] } }
                  }}
                  className="inline-block"
                >
                  {word}
                </motion.span>
              ))}
            </motion.span>
          </div>
          
          <div className="text-base sm:text-base leading-relaxed md:text-lg">
            <span className="sr-only">{panel.body}</span>
            <motion.span 
              aria-hidden="true" 
              className="flex flex-wrap gap-x-[0.25em] gap-y-[0.1em]"
              variants={{
                hidden: {},
                visible: { transition: { staggerChildren: 0.02 } }
              }}
            >
              {panel.body.split(" ").map((word, idx) => (
                <motion.span
                  key={idx}
                  variants={{
                    hidden: { opacity: 0, y: 30 },
                    visible: { opacity: 0.9, y: 0, transition: { duration: 0.8, ease: [0.22, 1, 0.36, 1] } }
                  }}
                  className="inline-block"
                >
                  {word}
                </motion.span>
              ))}
            </motion.span>
          </div>
        </div>
        
        {/* Title */}
        <h3 className="font-display text-[clamp(1.8rem,5vw,5rem)] font-bold leading-[1.1] tracking-tighter max-w-4xl z-10">
          <span className="sr-only">{panel.title}</span>
          <motion.span 
            aria-hidden="true" 
            className="flex flex-wrap gap-x-[0.25em]"
            variants={{
              hidden: {},
              visible: { transition: { staggerChildren: 0.08 } }
            }}
          >
            {panel.title.split(" ").map((word, idx) => (
              <motion.span
                key={idx}
                variants={{
                  hidden: { opacity: 0, y: 40 },
                  visible: { opacity: 1, y: 0, transition: { duration: 0.8, ease: [0.22, 1, 0.36, 1] } }
                }}
                className="inline-block"
              >
                {word}
              </motion.span>
            ))}
          </motion.span>
        </h3>

        {/* Mobile image - at the bottom, natural aspect ratio, small screens only */}
        {panel.image && (
          <motion.div 
            className="md:hidden w-full overflow-hidden rounded-xl shadow-lg z-10"
            variants={{
              hidden: { clipPath: "inset(0 0 100% 0)", scale: 1.05 },
              visible: { clipPath: "inset(0 0 0% 0)", scale: 1, transition: { duration: 1.2, ease: [0.22, 1, 0.36, 1], delay: 0.2 } }
            }}
          >
            <img src={panel.image} alt={panel.tag} className="w-full h-auto object-contain" />
          </motion.div>
        )}

        {/* Desktop image - absolute positioned, hidden on small screens */}
        {panel.image && (
          <motion.div 
            className="hidden md:block absolute right-20 bottom-[25vh] h-[50vh] w-[20vw] overflow-hidden rounded-2xl shadow-2xl opacity-90"
            variants={{
              hidden: { clipPath: "inset(0 0 100% 0)", scale: 1.05 },
              visible: { clipPath: "inset(0 0 0% 0)", scale: 1, transition: { duration: 1.2, ease: [0.22, 1, 0.36, 1], delay: 0.2 } }
            }}
          >
            <img src={panel.image} alt={panel.tag} className="h-full w-full object-cover" />
          </motion.div>
        )}
      </motion.div>
    </div>
  );
}

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
          // Pause at full text, then erase
          timeout = setTimeout(() => {
            typing = false;
            tick();
          }, 1500);
          return;
        }
        timeout = setTimeout(tick, 70);
      } else {
        i--;
        setDisplayed(text.slice(0, i));
        if (i <= 0) {
          // Pause at empty, then type again
          timeout = setTimeout(() => {
            typing = true;
            tick();
          }, 500);
          return;
        }
        timeout = setTimeout(tick, 40);
      }
    };

    tick();

    // Blink the cursor independently
    const blinkInterval = setInterval(() => {
      setCursorVisible((v) => !v);
    }, 530);

    return () => {
      clearTimeout(timeout);
      clearInterval(blinkInterval);
    };
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
      <div className="mx-auto max-w-5xl px-4 sm:px-6 pb-12 sm:pb-20 pt-20 sm:pt-28 text-center relative z-10">
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
