"use client";
import { motion } from "framer-motion";

export function CTA() {
  return (
    <section
      id="contact"
      className="relative overflow-hidden bg-foreground px-4 sm:px-6 py-20 sm:py-32 text-background"
    >
      <div className="pointer-events-none absolute inset-0 opacity-30">
        <div className="absolute -left-20 top-10 h-72 w-[60%] rotate-[-8deg] bg-gradient-to-r from-fuchsia-400 to-violet-400 blur-2xl" />
        <div className="absolute -right-20 bottom-10 h-72 w-[60%] rotate-[6deg] bg-gradient-to-r from-emerald-300 to-cyan-400 blur-2xl" />
      </div>
      <div className="relative z-10 mx-auto max-w-4xl text-center">
        <motion.h2
          initial={{ opacity: 0, y: 30, filter: "blur(10px)" }}
          whileInView={{ opacity: 1, y: 0, filter: "blur(0px)" }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
          className="font-display uppercase text-[clamp(2rem,10vw,4rem)] font-extrabold leading-[0.85] tracking-tight drop-shadow-sm"
        >
          Let's Create
          <br />
          <span className="text-background/50 italic">Something Great</span>
        </motion.h2>
        <p className="mx-auto mt-6 max-w-md text-sm text-background/70">
          Tell us about your project. We typically reply within 24 hours.
        </p>
        <a
          href="mailto:ommimedia.in@gmail.com"
          className="mt-8 inline-flex items-center gap-2 rounded-full bg-background px-6 py-3 text-sm font-medium text-foreground transition-transform hover:scale-[1.03]"
        >
          Let's Talk →
        </a>
      </div>
    </section>
  );
}

export function Footer() {
  return (
    <footer className="fixed bottom-0 left-0 w-full h-[40vh] sm:h-[60vh] bg-background py-6 sm:py-10 flex flex-col justify-end">
      <div className="mx-auto max-w-7xl px-6 w-full">
        <h3 className="font-display sm:text-[clamp(3rem,18vw,13rem)] text-[clamp(3rem,10vw,10rem)] font-extrabold leading-none tracking-tighter text-foreground text-center sm:text-left drop-shadow-sm">
          OMMIMEDIA
        </h3>
        <div className="mt-4 sm:mt-6 flex flex-col sm:flex-row sm:flex-wrap items-center sm:justify-between gap-3 text-xs text-muted-foreground">
          <span>© {new Date().getFullYear()} ommi media. All rights reserved.</span>
          <div className="flex gap-4">
            <a href="https://www.instagram.com/ommimedia.in/" target="_blank" rel="noopener noreferrer" className="hover:text-foreground transition-colors">Instagram</a>
            <a href="mailto:ommimedia.in@gmail.com" className="hover:text-foreground transition-colors">ommimedia.in@gmail.com</a>
          </div>
        </div>
      </div>
    </footer>
  );
}
