"use client";
import React from "react";
import { Swiper, SwiperSlide } from "swiper/react";
import { Autoplay, EffectCoverflow, Pagination, Navigation } from "swiper/modules";
import { SparklesIcon } from "lucide-react";

import "swiper/css";
import "swiper/css/effect-coverflow";
import "swiper/css/pagination";
import "swiper/css/navigation";

import { Badge } from "@/components/ui/badge";

interface CarouselProps {
  items?: { src: string; alt: string; type?: "image" | "video" }[];
  autoplayDelay?: number;
  showPagination?: boolean;
  showNavigation?: boolean;
}

const defaultImages = [
  { src: "https://images.unsplash.com/photo-1529253355930-ddbe423a2ac7?w=900&q=80", alt: "Brand Films", type: "image" as const },
  { src: "https://images.unsplash.com/photo-1517059224940-d4af9eec41b7?w=900&q=80", alt: "Editorial", type: "image" as const },
  { src: "https://images.unsplash.com/photo-1492724724894-7464c27d0ceb?w=900&q=80", alt: "Campaigns", type: "image" as const },
  { src: "https://images.unsplash.com/photo-1521335629791-ce4aec67dd47?w=900&q=80", alt: "Product", type: "image" as const },
  { src: "https://images.unsplash.com/photo-1497366216548-37526070297c?w=900&q=80", alt: "Spaces", type: "image" as const },
];

// Duplicate default images to prevent Swiper loop warnings (20 items total for ultra-widescreen safety)
const defaultCarouselImages = [...defaultImages, ...defaultImages, ...defaultImages, ...defaultImages];

// Helper to extract direct video link from Google Drive
function getGoogleDriveDirectLink(url: string) {
  if (!url) return url;
  const driveRegex = /(?:drive\.google\.com\/file\/d\/|drive\.google\.com\/open\?id=)([^/&?]+)/;
  const match = url.match(driveRegex);
  if (match && match[1]) {
    return `https://drive.google.com/uc?export=download&id=${match[1]}`;
  }
  return url;
}

// Duplicate default images to prevent Swiper loop warnings (20 items total for ultra-widescreen safety)
// const defaultCarouselImages = [...defaultImages, ...defaultImages, ...defaultImages, ...defaultImages];

import { motion } from "framer-motion";

export const CardCarousel: React.FC<CarouselProps> = ({
  items = defaultCarouselImages,
  autoplayDelay = 1500,
  showPagination = true,
  showNavigation = true,
}) => {
  const css = `
  .swiper { width: 100%; padding-bottom: 50px; }
  .swiper-slide {
    background-position: center;
    background-size: cover;
    width: 280px;
    border-radius: 24px;
    transition: transform 0.4s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.4s ease;
  }
  @media (min-width: 640px) {
    .swiper-slide { width: 350px; }
  }
  .swiper-slide:not(.swiper-slide-active) {
    opacity: 0.6;
  }
  .swiper-slide img { display: block; width: 100%; border-radius: 24px; }
  .swiper-3d .swiper-slide-shadow-left { background-image: none; }
  .swiper-3d .swiper-slide-shadow-right { background: none; }
  .swiper-pagination-bullet { background: var(--foreground); opacity: 0.3; transition: all 0.2s ease; }
  .swiper-pagination-bullet-active { opacity: 1; transform: scale(1.2); }
  `;

  return (
    <section id="work" className="w-full bg-background py-12 sm:py-20 overflow-hidden">
      <style>{css}</style>


      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        whileInView={{ opacity: 1, scale: 1 }}
        viewport={{ once: true, margin: "-100px" }}
        transition={{ duration: 1, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
        className="w-full max-w-[100vw]"
      >
          <Swiper
            spaceBetween={20}
            autoplay={{ delay: autoplayDelay, disableOnInteraction: false }}
            effect="coverflow"
            grabCursor={true}
            centeredSlides={true}
            loop={true}
            slidesPerView="auto"
            coverflowEffect={{ rotate: 0, stretch: 0, depth: 150, modifier: 1.5, slideShadows: false }}
            pagination={showPagination ? { clickable: true, dynamicBullets: true } : false}
            navigation={showNavigation}
            modules={[EffectCoverflow, Autoplay, Pagination, Navigation]}
            className="!px-4 md:!px-0"
          >
            {items.map((item, index) => {
              const isVideo = item.type === "video" || item.src?.endsWith(".mp4") || item.src?.includes("drive.google.com");
              const mediaSrc = isVideo ? getGoogleDriveDirectLink(item.src) : item.src;
              
              return (
                <SwiperSlide key={index}>
                  {({ isActive }) => (
                    <div className="aspect-[4/5] sm:aspect-[3/4] overflow-hidden rounded-2xl sm:rounded-3xl bg-muted shadow-2xl relative group">
                      {isVideo ? (
                        <video 
                          src={mediaSrc} 
                          autoPlay={isActive} 
                          loop 
                          muted 
                          playsInline 
                          className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105" 
                        />
                      ) : (
                        <img 
                          src={mediaSrc} 
                          alt={item.alt} 
                          className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105" 
                        />
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                      <div className="absolute bottom-0 left-0 p-8 translate-y-4 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300 pointer-events-none">
                        <h3 className="text-white text-2xl font-semibold tracking-tight">{item.alt}</h3>
                      </div>
                    </div>
                  )}
                </SwiperSlide>
              );
            })}
          </Swiper>
        </motion.div>
    </section>
  );
};

export default CardCarousel;
