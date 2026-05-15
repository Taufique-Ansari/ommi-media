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
    q: "So… are you a video editing service or something more?",
    a: "Honestly? We're way more. Most agencies hand you back an edited file and call it a day. At Ommi Media, we run your entire content system — from scripting your ideas into scroll-stopping stories, to editing, optimising, and posting. You show up, we handle the rest. Think of us less like a vendor and more like your content team that actually gets it.",
  },
  {
    q: "I've tried content agencies before and it felt generic. Why will this be different?",
    a: "Because we don't treat your brand like a template. We study how your audience thinks, what makes them stop scrolling, and what makes them trust you — then we build content around that. No recycled formats, no cookie-cutter carousels. Every piece of content we make is built to sound like you, only sharper.",
  },
  {
    q: "I'm a coach/consultant — I sell expertise, not products. Can content actually grow my business?",
    a: "That's exactly who we built this for. When you're selling knowledge and credibility, content isn't optional — it's your storefront. We turn your ideas, frameworks, and opinions into content that positions you as the obvious expert in your space. The right post can do more selling than a cold pitch ever will.",
  },
  {
    q: "We're a small startup — is content even a priority right now?",
    a: "Especially now. The brands that win aren't always the ones with the biggest budgets — they're the ones that show up consistently and build trust early. We help startups and personal brands punch above their weight by creating content that makes you look established, sound credible, and feel familiar to your audience — long before you have a massive following. Early content is how you build the audience that funds the next phase.",
  },
  {
    q: "How involved do I need to be in the process?",
    a: "As little or as much as you want. Most of our clients are busy founders and creators who don't have time to micromanage content. We handle the heavy lifting — strategy, scripting, editing, posting — and check in with you at the right moments. You stay in control without being in the weeds.",
  },
  {
    q: "What's the actual goal here — views or business results?",
    a: "Both, but in the right order. Views without strategy is just vanity. We build content that grows your audience and moves them toward trusting you, booking you, or buying from you. Every content decision we make is tied back to one question: does this help your brand grow in a way that actually matters?",
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
