import { Navbar } from "@/components/Navbar";
import { Hero } from "@/components/Hero";
import { Marquee } from "@/components/Marquee";
import { CardCarousel, CarouselItem } from "@/components/CardCarousel";
import { StackingSections } from "@/components/StackingSections";
import { Packages } from "@/components/Packages";
import { FAQ } from "@/components/FAQ";
import { CTA, Footer } from "@/components/CTA";
import { getReels } from "@/sanity/lib/client";
import { getCloudinaryVideos } from "@/lib/cloudinary";
import { BookingModal } from "@/components/BookingModal";

export default async function Home() {
  // Fetch reels from Sanity
  const reels = await getReels();
  
  // Fetch videos dynamically from Cloudinary folder (defaulting to "reels")
  const cloudinaryVideos = await getCloudinaryVideos(process.env.CLOUDINARY_FOLDER || "reels");

  const defaultItems: CarouselItem[] = [
    {
      src: "https://res.cloudinary.com/dtvwoycjx/video/upload/v1778844041/Rock_g6362s.mp4",
      poster: "https://res.cloudinary.com/dtvwoycjx/video/upload/so_auto,w_400/v1778844041/Rock_g6362s.jpg",
      alt: "Rock Video",
    },
    {
      src: "https://res.cloudinary.com/dtvwoycjx/video/upload/v1778844029/KitKat_lnftjp.mp4",
      poster: "https://res.cloudinary.com/dtvwoycjx/video/upload/so_auto,w_400/v1778844029/KitKat_lnftjp.jpg",
      alt: "KitKat Video",
    },
    {
      src: "https://res.cloudinary.com/dtvwoycjx/video/upload/v1778844025/S5_oj98vx.mp4",
      poster: "https://res.cloudinary.com/dtvwoycjx/video/upload/so_auto,w_400/v1778844025/S5_oj98vx.jpg",
      alt: "S5 Video",
    },
  ];

  const carouselItems: CarouselItem[] = [];

  if (cloudinaryVideos && cloudinaryVideos.length > 0) {
    // 1. Cloudinary videos take top priority for the media assets
    carouselItems.push(...cloudinaryVideos);
  } else if (reels && reels.length > 0) {
    // 2. Sanity as second priority
    carouselItems.push(...reels.map((reel) => ({
      src: reel.videoUrl,
      poster: reel.fallbackImage?.asset?.url,
      alt: reel.title || "Reel",
    })));
  } else {
    // 3. Fallback to local default clips
    carouselItems.push(...defaultItems);
  }

  return (
    <>
      <main className="relative z-10 min-h-screen bg-background text-foreground mb-[40vh] sm:mb-[60vh] shadow-[0_20px_50px_rgba(0,0,0,0.5)]">
        <Navbar />
        <Hero />
        <Marquee />
        <CardCarousel items={carouselItems} />
        <StackingSections />
        <Packages />
        <FAQ />
        <CTA />
        <BookingModal />
      </main>
      <Footer />
    </>
  );
}
