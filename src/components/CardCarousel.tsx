"use client";
import React, { useRef, useEffect, useState, useCallback } from "react";
import { Swiper, SwiperSlide } from "swiper/react";
import { Autoplay, Pagination, Navigation } from "swiper/modules";
import { motion, AnimatePresence } from "framer-motion";

import "swiper/css";
import "swiper/css/pagination";
import "swiper/css/navigation";

export interface CarouselItem {
  src: string;
  poster?: string;
  alt: string;
}

export interface CarouselProps {
  items: CarouselItem[];
  autoplayDelay?: number;
  showPagination?: boolean;
  showNavigation?: boolean;
}

function getVideoPoster(videoSrc: string): string {
  const transformed = videoSrc
    .replace('/video/upload/', '/video/upload/so_auto,w_400/')
    .replace('.mp4', '.jpg');
  return transformed;
}

// ─────────────────────────────────────────────────────────────────────────────

export const CardCarousel: React.FC<CarouselProps> = ({
  items,
  autoplayDelay = 5000,
  showPagination = true,
  showNavigation = true,
}) => {
  /**
   * Swiper loop needs: total slides > slidesPerView × 2.
   * With slidesPerView="auto" showing ~3 cards at once, duplicate until we
   * have at least 12 slides so there is always content on both sides.
   */
  const minSlides = 12;
  const times     = Math.ceil(minSlides / items.length);
  const loopItems = Array.from({ length: times }, () => items).flat();
  const swiperRef = useRef<any>(null);
  const [isMuted, setIsMuted] = useState(true);
  const [isHovered, setIsHovered] = useState(false);
  const [selectedVideo, setSelectedVideo] = useState<CarouselItem | null>(null);

  const handleVideoClick = useCallback((item: CarouselItem) => {
    setSelectedVideo(item);
    const swiper = swiperRef.current?.swiper || swiperRef.current;
    if (swiper?.autoplay) {
      swiper.autoplay.stop();
    }
  }, []);

  const handleCloseModal = useCallback(() => {
    setSelectedVideo(null);
    const swiper = swiperRef.current?.swiper || swiperRef.current;
    if (swiper?.autoplay) {
      swiper.autoplay.start();
    }
  }, []);

  const slideNext = useCallback(() => {
    swiperRef.current?.slideNext();
  }, []);

  const toggleMute = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    setIsMuted(prev => !prev);
  }, []);

  const css = `
    /* ── Shell ── */
    .work-swiper               { width: 100%; padding-bottom: 52px; }

    /* ── All slides: dimmed + scaled ── */
    .work-swiper .swiper-slide {
      width: 260px;
      transition: transform 0.5s cubic-bezier(0.16, 1, 0.3, 1),
                  opacity  0.5s ease;
      opacity:   0.45;
      transform: scale(0.88);
      will-change: transform, opacity;
    }

    @media (min-width: 640px)  { .work-swiper .swiper-slide { width: 300px; } }
    @media (min-width: 1024px) { .work-swiper .swiper-slide { width: 340px; } }

    /* ── Active (centre) slide ── */
    .work-swiper .swiper-slide-active {
      opacity:   1;
      transform: scale(1);
      z-index:   2;
    }

    /* ── Pagination ── */
    .work-swiper .swiper-pagination-bullet {
      background: var(--foreground);
      opacity: 0.25;
      transition: all 0.2s ease;
    }
    .work-swiper .swiper-pagination-bullet-active {
      opacity: 1;
      transform: scale(1.25);
    }

    /* ── Nav arrows ── */
    .work-swiper .swiper-button-prev,
    .work-swiper .swiper-button-next {
      color: var(--foreground);
      opacity: 0.45;
      transition: opacity 0.2s;
    }
    .work-swiper .swiper-button-prev:hover,
    .work-swiper .swiper-button-next:hover { opacity: 1; }
  `;

  return (
    <section
      id="work"
      className="w-full bg-background py-12 sm:py-20 overflow-x-hidden"
    >
      <style>{css}</style>

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-100px" }}
        transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
        /* ── Matches .site-container max-width so it aligns with every other section ── */
        className="w-full max-w-[1400px] mx-auto"
      >
        <Swiper
          ref={swiperRef}
          /* ── Fixed-width slides; Swiper works out how many fit ── */
          slidesPerView="auto"
          spaceBetween={20}
          centeredSlides={true}

          /* ── Seamless infinite loop ── */
          loop={true}

          /* ── Auto-advance between cards ── */
          autoplay={{ 
            delay: autoplayDelay, 
            disableOnInteraction: false,
            pauseOnMouseEnter: true,
          }}

          grabCursor={true}
          pagination={showPagination ? { clickable: true, dynamicBullets: true } : false}
          navigation={showNavigation}
          modules={[Autoplay, Pagination, Navigation]}
          className="work-swiper"
        >
          {loopItems.map((item, index) => {
            return (
              <SwiperSlide key={index}>
                {({ isActive }) => {
                  const videoRef = useRef<HTMLVideoElement>(null);

                  useEffect(() => {
                    const video = videoRef.current;
                    if (!video) return;

                    if (isActive && !isHovered) {
                      video.play().catch(() => {});
                    } else if (!isActive) {
                      video.pause();
                      video.currentTime = 0;
                    }
                  }, [isActive, isHovered]);

                  useEffect(() => {
                    const video = videoRef.current;
                    if (!video) return;

                    if (isHovered && isActive) {
                      video.currentTime = 0;
                      video.play().catch(() => {});
                    }
                  }, [isHovered, isActive]);

                  useEffect(() => {
                    const handleEnded = () => {
                      slideNext();
                    };
                    const video = videoRef.current;
                    if (video && isHovered && isActive) {
                      video.addEventListener('ended', handleEnded);
                      return () => video.removeEventListener('ended', handleEnded);
                    }
                  }, [isHovered, isActive, slideNext]);

                  useEffect(() => {
                    const video = videoRef.current;
                    if (video) {
                      video.muted = isMuted;
                    }
                  }, [isMuted]);

                  return (
                    <div 
                      className="aspect-[9/16] overflow-hidden rounded-2xl sm:rounded-3xl bg-muted shadow-2xl relative cursor-pointer"
                      onMouseEnter={() => setIsHovered(true)}
                      onMouseLeave={() => setIsHovered(false)}
                      onClick={() => handleVideoClick(item)}
                    >
                      <video
                        ref={videoRef}
                        src={item.src}
                        poster={item.poster || getVideoPoster(item.src)}
                        className="w-full h-full object-cover"
                        muted={isMuted}
                        playsInline
                        loop={!isHovered}
                        preload="none"
                      />
                      {isActive && isHovered && (
                        <button
                          onClick={toggleMute}
                          className="absolute top-4 right-4 w-10 h-10 rounded-full bg-black/60 flex items-center justify-center text-white hover:bg-black/80 transition-colors"
                        >
                          {isMuted ? (
                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon>
                              <line x1="23" y1="9" x2="17" y2="15"></line>
                              <line x1="17" y1="9" x2="23" y2="15"></line>
                            </svg>
                          ) : (
                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon>
                              <path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"></path>
                            </svg>
                          )}
                        </button>
                      )}
                    </div>
                  );
                }}
              </SwiperSlide>
            );
          })}
        </Swiper>
      </motion.div>

      {/* Fullscreen Video Preview Modal */}
      <AnimatePresence>
        {selectedVideo && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-md p-4 sm:p-8"
            onClick={(e) => {
              if (e.target === e.currentTarget) {
                handleCloseModal();
              }
            }}
          >
            {/* Close Button */}
            <button
              onClick={handleCloseModal}
              className="absolute top-4 right-4 sm:top-6 sm:right-6 w-12 h-12 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white backdrop-blur border border-white/20 transition-all z-50 cursor-pointer shadow-lg"
              aria-label="Close video preview"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </button>

            {/* Video Content Card */}
            <motion.div
              initial={{ scale: 0.9, y: 20, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.9, y: 20, opacity: 0 }}
              transition={{ type: "spring", damping: 25, stiffness: 220 }}
              className="relative max-w-[420px] w-full aspect-[9/16] rounded-2xl overflow-hidden bg-black border border-white/10 shadow-2xl flex items-center justify-center"
            >
              <video
                src={selectedVideo.src}
                className="w-full h-full object-cover"
                controls
                autoPlay
                playsInline
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
};

export default CardCarousel;
