"use client";
const brands = [
  "Attention compound",
  "Content Flow",
  "Akima Films",
  "Ritesh Agarwal",
];

import { motion } from "framer-motion";

export function Marquee() {
  return (
    <section className="border-y border-border/60 bg-background py-6 sm:py-10">
      <motion.div 
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true, margin: "-50px" }}
        transition={{ duration: 0.8 }}
        className="mb-6 flex items-center gap-3 px-6"
      >
        <span className="text-xs uppercase tracking-[0.25em] text-muted-foreground">
          work · trusted by
        </span>
        <span className="h-px flex-1 bg-border" />
      </motion.div>
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.8, delay: 0.2 }}
        className="overflow-hidden"
      >
        <div className="marquee-track flex items-center gap-8 sm:gap-16 px-4 sm:px-8 text-xl sm:text-2xl font-medium tracking-tighter md:text-4xl group">
          {[...brands, ...brands].map((b, i) => (
            <span
              key={i}
              className="whitespace-nowrap text-foreground/50 transition-all duration-300 hover:!text-foreground hover:!opacity-100 group-hover:opacity-30 hover:scale-110 cursor-default"
            >
              {b}
            </span>
          ))}
        </div>
      </motion.div>
    </section>
  );
}
