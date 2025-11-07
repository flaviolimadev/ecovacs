import { useState, useEffect } from "react";

const slides = [
  {
    image: "/assets/hero-banner.jpg",
    title: "Rendimentos Garantidos",
    subtitle: "Ganhe com a Meituan",
    info: "D: 1165 | Recarga R$0.00",
  },
  {
    image: "/assets/banner-investment.jpg",
    title: "Investimentos Inteligentes",
    subtitle: "Lucros diários automáticos",
    info: "Retorno até 10% ao dia",
  },
  {
    image: "/assets/banner-rewards.jpg",
    title: "Sorteios Premiados",
    subtitle: "Participe e ganhe prêmios",
    info: "Próximo sorteio: 24h",
  },
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
      {slides.map((slide, index) => (
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
            src={slide.image}
            alt={slide.title}
            className="h-full w-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-black/50 to-black/30">
            <div className="flex h-full flex-col justify-between p-4">
              <div className="text-sm text-white/90">Meituan Dianping</div>
              <div>
                <h2 className="text-lg font-bold text-white">{slide.title}</h2>
                <p className="text-sm text-white/90">{slide.subtitle}</p>
                <div className="mt-2 text-xs text-white/80">{slide.info}</div>
              </div>
            </div>
          </div>
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
