import { useState, useEffect } from "react";

const slides = [
  "/assets/ecovacs-booth-1.jpg",
  "/assets/ecovacs-booth-2.jpg",
  "/assets/ecovacs-building.jpg",
];

const HeroBanner = () => {
  const [currentSlide, setCurrentSlide] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 4000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="relative h-48 w-full overflow-hidden rounded-b-3xl">
      {/* Slides */}
      {slides.map((image, index) => (
        <div
          key={index}
          className={`absolute inset-0 transition-all duration-700 ease-in-out ${
            index === currentSlide
              ? "translate-x-0 opacity-100"
              : index < currentSlide
              ? "-translate-x-full opacity-0"
              : "translate-x-full opacity-0"
          }`}
        >
          <img
            src={image}
            alt={`Ecovacs ${index + 1}`}
            className="h-full w-full object-cover"
          />
        </div>
      ))}

      {/* Indicators */}
      <div className="absolute bottom-4 left-1/2 z-10 flex -translate-x-1/2 gap-2">
        {slides.map((_, index) => (
          <button
            key={index}
            onClick={() => setCurrentSlide(index)}
            className={`h-1.5 rounded-full transition-all duration-300 ${
              index === currentSlide ? "w-6 bg-white" : "w-1.5 bg-white/50"
            }`}
            aria-label={`Ir para slide ${index + 1}`}
          />
        ))}
      </div>
    </div>
  );
};

export default HeroBanner;
