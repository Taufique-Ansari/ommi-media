"use client";

import { useEffect } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

export function SmoothScroll() {
  useEffect(() => {
    let locomotiveScroll: any;

    (async () => {
      const LocomotiveScroll = (await import("locomotive-scroll")).default;
      locomotiveScroll = new LocomotiveScroll({
        lenisOptions: {
          lerp: 0.08,
          duration: 1.0,
          orientation: "vertical",
          gestureOrientation: "vertical",
          smoothWheel: true,
          wheelMultiplier: 1,
          touchMultiplier: 2,
          easing: (t: number) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
        },
      });

      // locomotive-scroll v5 stores the Lenis instance as `lenisInstance`
      // (NOT `lenisInst` — that property doesn't exist in v5)
      const lenis = locomotiveScroll.lenisInstance;

      // @ts-ignore
      window.lenis = lenis;

      if (lenis && typeof lenis.on === "function") {
        // ─── Sync Lenis virtual scroll position with GSAP ScrollTrigger ───
        // Without this, ScrollTrigger reads native scroll which lags behind
        // Lenis's interpolated position, causing jitter in all scrub animations.
        lenis.on("scroll", ScrollTrigger.update);
        // NOTE: Do NOT drive Lenis from gsap.ticker — locomotive-scroll v5
        // manages its own RAF loop via `_raf()`. Adding a second ticker would
        // cause double-ticking and stuttering.
      }

      gsap.ticker.lagSmoothing(0);
    })();

    return () => {
      if (locomotiveScroll) locomotiveScroll.destroy();
      // @ts-ignore
      window.lenis = null;
    };
  }, []);

  return null;
}
