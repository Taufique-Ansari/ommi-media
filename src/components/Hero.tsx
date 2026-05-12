"use client";
import { motion } from "framer-motion";

export function Hero() {
  return (
    <section
      id="home"
      className="relative flex min-h-[100vh] items-center justify-center overflow-hidden"
    >
      <div className="absolute inset-0 grid-bg" />
      <div className="site-container relative z-10 text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="mb-6 inline-flex items-center gap-2 rounded-full border border-border/70 bg-background/40 px-3 py-1 text-xs text-muted-foreground backdrop-blur"
        >
          <span className="h-1.5 w-1.5 rounded-full bg-green-500 animate-pulse" />
          Available for new projects.
        </motion.div>
        <motion.h1
          initial={{ opacity: 0, y: 30, filter: "blur(10px)" }}
          animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
          transition={{ duration: 1, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
          className="font-display font-extrabold uppercase text-[clamp(2.5rem,10vw,6rem)] leading-[0.85] tracking-[-0.02em] text-foreground drop-shadow-sm"
        >
          CONTENT THAT BUILDS
          <br />
          YOUR <span className="text-foreground/40 italic">AUTHORITY</span>.
        </motion.h1>
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5, duration: 0.8 }}
          className="mx-auto mt-4 sm:mt-6 max-w-xl text-sm sm:text-base text-muted-foreground font-medium tracking-tighter"
        >
          From script to post — we build the content engine that turns founders into the face of their industry.
        </motion.p>
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7, duration: 0.8 }}
          className="mt-8"
        >
          <a
            href="https://calendly.com/ommimedia-in/30min"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex h-11 sm:h-12 items-center justify-center rounded-full bg-foreground px-6 sm:px-8 text-sm font-medium text-background transition-transform hover:scale-105"
          >
            Book a strategy call →
          </a>
        </motion.div>
      </div>
    </section>
  );
}
