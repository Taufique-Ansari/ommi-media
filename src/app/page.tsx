import { Navbar } from "@/components/Navbar";
import { Hero } from "@/components/Hero";
import { Marquee } from "@/components/Marquee";
import { CardCarousel } from "@/components/CardCarousel";
import { StackingSections } from "@/components/StackingSections";
import { FAQ } from "@/components/FAQ";
import { CTA, Footer } from "@/components/CTA";

export default function Home() {
  return (
    <>
      <main className="relative z-10 min-h-screen bg-background text-foreground mb-[40vh] sm:mb-[60vh] shadow-[0_20px_50px_rgba(0,0,0,0.5)]">
        <Navbar />
        <Hero />
        <Marquee />
        <CardCarousel />
        <StackingSections />
        <FAQ />
        <CTA />
      </main>
      <Footer />
    </>
  );
}
