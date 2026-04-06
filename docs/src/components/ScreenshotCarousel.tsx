import { useState, useRef, useEffect, useCallback } from 'react';

const screenshots = [
  { label: 'Library', file: 'lib_page.jpg', description: 'Organize your manga collection with categories and progress tracking' },
  { label: 'Browse', file: 'browse_page.jpg', description: 'Discover manga from hundreds of extension sources' },
  { label: 'Reader', file: 'read_page.jpg', description: 'Customizable reading experience with multiple modes' },
  { label: 'Downloads', file: 'downloads_page.jpg', description: 'Smart downloads with compression and background processing' },
  { label: 'Details', file: 'details_page.jpg', description: 'Rich manga details with chapter list and tracking' },
];

export default function ScreenshotCarousel({ base = '' }: { base?: string }) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(0);

  const handleScroll = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    const slideWidth = el.offsetWidth + 24; // slide = 100% of container + gap-6 (24px)
    const index = Math.round(el.scrollLeft / slideWidth);
    setActive(Math.min(index, screenshots.length - 1));
  }, []);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    el.addEventListener('scroll', handleScroll, { passive: true });
    return () => el.removeEventListener('scroll', handleScroll);
  }, [handleScroll]);

  const scrollTo = (index: number) => {
    const el = scrollRef.current;
    if (!el) return;
    const slideWidth = el.offsetWidth + 24;
    el.scrollTo({ left: slideWidth * index, behavior: 'smooth' });
  };

  const prev = () => scrollTo(Math.max(0, active - 1));
  const next = () => scrollTo(Math.min(screenshots.length - 1, active + 1));

  return (
    // Outer wrapper: centers and caps the carousel at phone width on desktop
    <div className="mx-auto w-full max-w-xs relative">
      {/* Scroll track — each slide is exactly 100% wide */}
      <div
        ref={scrollRef}
        className="flex snap-x snap-mandatory gap-6 overflow-x-auto pb-4"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        {screenshots.map((shot) => (
          <div
            key={shot.label}
            className="shrink-0 snap-start w-full"
          >
            {/* Phone frame */}
            <div
              className="relative mx-auto overflow-hidden rounded-[2.5rem] border-[3px] border-[#2A2A3D] bg-[#111118] shadow-2xl"
              style={{ aspectRatio: '9/19.5' }}
            >
              {/* Screenshot image */}
              <img
                src={`${base}/screenshots/${shot.file}`}
                alt={`${shot.label} screen`}
                className="absolute inset-0 h-full w-full object-cover"
                loading="lazy"
              />

              {/* Bottom overlay with label + description */}
              <div
                className="absolute bottom-0 left-0 right-0 z-10 px-5 pb-7 pt-10"
                style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.82) 60%, transparent 100%)' }}
              >
                <span className="block text-base font-bold text-white">{shot.label}</span>
                <p className="mt-0.5 text-xs leading-snug text-white/70">{shot.description}</p>
              </div>

              {/* Home indicator */}
              <div className="absolute bottom-2 left-1/2 z-20 h-1 w-24 -translate-x-1/2 rounded-full bg-white/30" />
            </div>
          </div>
        ))}
      </div>

      {/* Arrow navigation */}
      <button
        onClick={prev}
        className="absolute -left-14 top-1/2 hidden -translate-y-1/2 items-center justify-center rounded-full border border-[#2A2A3D] bg-[#16161F]/90 p-3 text-[#A0A0B8] backdrop-blur-sm transition-all hover:border-[#7C6EF8]/40 hover:text-white md:flex"
        aria-label="Previous screenshot"
      >
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
        </svg>
      </button>
      <button
        onClick={next}
        className="absolute -right-14 top-1/2 hidden -translate-y-1/2 items-center justify-center rounded-full border border-[#2A2A3D] bg-[#16161F]/90 p-3 text-[#A0A0B8] backdrop-blur-sm transition-all hover:border-[#7C6EF8]/40 hover:text-white md:flex"
        aria-label="Next screenshot"
      >
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
        </svg>
      </button>

      {/* Dot indicators */}
      <div className="mt-6 flex items-center justify-center gap-2">
        {screenshots.map((_shot, i) => (
          <button
            key={i}
            onClick={() => scrollTo(i)}
            className={`h-2 rounded-full transition-all duration-300 ${
              i === active ? 'w-6 bg-[#7C6EF8]' : 'w-2 bg-[#2A2A3D] hover:bg-[#606078]'
            }`}
            aria-label={`Go to screenshot ${i + 1}`}
          />
        ))}
      </div>
    </div>
  );
}
