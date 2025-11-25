import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface CarouselProps {
  banners: Array<{
    id: number;
    image: string;
    alt: string;
  }>;
}

const Carousel = ({ banners }: CarouselProps) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [touchStart, setTouchStart] = useState(0);
  const [touchEnd, setTouchEnd] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % banners.length);
    }, 5000);

    return () => clearInterval(timer);
  }, [banners.length]);

  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStart(e.targetTouches[0].clientX);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const handleTouchEnd = () => {
    if (touchStart - touchEnd > 75) {
      setCurrentIndex((prev) => (prev + 1) % banners.length);
    }

    if (touchStart - touchEnd < -75) {
      setCurrentIndex((prev) => (prev - 1 + banners.length) % banners.length);
    }
  };

  return (
    <section 
      className="relative w-full overflow-hidden bg-muted"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      role="region"
      aria-label="Promotional carousel"
    >
      <div className="relative aspect-[16/9] w-full md:aspect-[21/9]">
        <AnimatePresence mode="wait">
          <motion.img
            key={currentIndex}
            src={banners[currentIndex].image}
            alt={banners[currentIndex].alt}
            className="absolute inset-0 h-full w-full object-cover"
            initial={{ opacity: 0, x: 100 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -100 }}
            transition={{ duration: 0.5 }}
          />
        </AnimatePresence>

        <div className="absolute bottom-4 left-1/2 z-10 flex -translate-x-1/2 gap-2">
          {banners.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentIndex(index)}
              className={`h-2 w-2 rounded-full transition-all ${
                index === currentIndex
                  ? "w-8 bg-primary"
                  : "bg-background/50 hover:bg-background/70"
              }`}
              aria-label={`Go to slide ${index + 1}`}
              aria-current={index === currentIndex ? "true" : "false"}
            />
          ))}
        </div>
      </div>
    </section>
  );
};

export default Carousel;

