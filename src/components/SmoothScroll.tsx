"use client";

import { useEffect } from "react";

export function SmoothScroll() {
  useEffect(() => {
    let locomotiveScroll: any;
    
    (async () => {
      const LocomotiveScroll = (await import("locomotive-scroll")).default;
      locomotiveScroll = new LocomotiveScroll({
        lenisOptions: {
          wrapper: window,
          content: document.documentElement,
          lerp: 0.1,
          duration: 1.2,
          orientation: 'vertical',
          gestureOrientation: 'vertical',
          smoothWheel: true,
          wheelMultiplier: 1,
          touchMultiplier: 2,
          // normalizeWheel: true,
          easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)), // https://www.desmos.com/calculator/brs54l4xou
        }
      });
      // @ts-ignore
      window.lenis = locomotiveScroll.lenisInst || locomotiveScroll;
    })();

    return () => {
      if (locomotiveScroll) locomotiveScroll.destroy();
      // @ts-ignore
      window.lenis = null;
    };
  }, []);

  return null;
}
