import { useState, useEffect, useCallback } from 'react';
import Bannerimg1 from '../assets/bannerimg1.jpg';
import Bannerimg2 from '../assets/bannerimg2.jpg';

const useCarousel = (
  totalSlides: number,
  autoSlide: boolean = true,
  intervalTime: number = 6000
) => {
  const [activeIndex, setActiveIndex] = useState(0);

  const nextSlide = useCallback(() => {
    setActiveIndex((prevIndex) => (prevIndex + 1) % totalSlides);
  }, [totalSlides]);

  const prevSlide = useCallback(() => {
    setActiveIndex((prevIndex) => (prevIndex - 1 + totalSlides) % totalSlides);
  }, [totalSlides]);

  const goToSlide = useCallback((index: number) => {
    setActiveIndex(index);
  }, []);

  useEffect(() => {
    if (!autoSlide) return;
    const interval = setInterval(nextSlide, intervalTime);
    return () => clearInterval(interval);
  }, [nextSlide, autoSlide, intervalTime]);

  return { activeIndex, nextSlide, prevSlide, goToSlide };
};

function SliderBanner() {
  const images = [Bannerimg1, Bannerimg2];
  const { activeIndex, nextSlide, prevSlide, goToSlide } = useCarousel(images.length);
  return (
    <div className="container mx-auto">
      <div id="gallery" className="relative w-full">
        <div className="relative h-56 overflow-hidden rounded-b-lg md:h-96">
          {images.map((image, index) => (
            <div
              key={index}
              className={`absolute inset-0 transition-opacity duration-700 ease-in-out ${
                index === activeIndex ? 'opacity-100' : 'opacity-0'
              }`}
            >
              <img
                src={image}
                alt={`Slide ${index + 1}`}
                className="block w-full h-full object-cover"
              />
            </div>
          ))}
        </div>

        <button
          type="button"
          className="absolute top-1/2 left-4 transform -translate-y-1/2 z-30 bg-white/30 hover:bg-white/50 rounded-full p-2 focus:outline-none focus:ring-2 focus:ring-white"
          onClick={prevSlide}
          aria-label="Previous Slide"
        >
          <svg
            className="w-5 h-5 text-gray-800"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <button
          type="button"
          className="absolute top-1/2 right-4 transform -translate-y-1/2 z-30 bg-white/30 hover:bg-white/50 rounded-full p-2 focus:outline-none focus:ring-2 focus:ring-white"
          onClick={nextSlide}
          aria-label="Next Slide"
        >
          <svg
            className="w-5 h-5 text-gray-800"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>

      <div className="flex justify-center mt-4 space-x-2">
  {images.map((_, index) => (
    <button
      key={index}
      onClick={() => goToSlide(index)}
      className={`w-4 h-[4px] rounded-full ${
        index === activeIndex ? 'bg-gray-800' : 'bg-gray-400'
      }`}
      aria-label={`Go to slide ${index + 1}`}
    />
  ))}
</div>

    </div>
  );
}

export default SliderBanner;
