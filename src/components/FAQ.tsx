"use client";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { motion } from "framer-motion";

const faqs = [
  {
    q: "Are you an agency or a freelancer?",
    a: "We're a small, senior-led studio. You'll work directly with the people building your project — no account managers, no hand-offs.",
  },
  {
    q: "Why not hire an in-house editor?",
    a: "Working with us gets you a multidisciplinary team — strategy, design and engineering — for less than a single senior hire.",
  },
  {
    q: "What types of videos do you specialize in?",
    a: "Brand films, product launches, founder stories, and short-form social cuts optimized per channel.",
  },
  {
    q: "Can you help with video strategy?",
    a: "Yes. Strategy is where we start: positioning, messaging, distribution and measurable goals before a single frame is shot.",
  },
];

export function FAQ() {
  return (
    <section id="faqs" className="bg-background vertical-lines py-16 sm:py-28 border-b border-border">
      <div className="site-container relative z-10">
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.8 }}
          className="mb-12 text-center"
        >
          <span className="text-xs uppercase tracking-[0.3em] text-muted-foreground">
            FAQs
          </span>
          <h2 className="mt-3 font-display font-extrabold uppercase text-[clamp(2.5rem,8vw,6rem)] leading-[0.85] tracking-tight drop-shadow-sm">
            Got questions?<br/><span className="text-foreground/40 italic">answers.</span>
          </h2>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.8, delay: 0.2 }}
        >
          <Accordion type="single" collapsible className="w-full">
          {faqs.map((f, i) => (
            <AccordionItem key={i} value={`item-${i}`} className="border-b">
              <AccordionTrigger className="text-left text-base font-medium hover:no-underline">
                {f.q}
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground">
                {f.a}
              </AccordionContent>
            </AccordionItem>
          ))}
          </Accordion>
        </motion.div>
      </div>
    </section>
  );
}
