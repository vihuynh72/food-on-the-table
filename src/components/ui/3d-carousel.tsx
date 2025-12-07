import { ArrowRight, ArrowLeft, MapPin, Clock, User, Tag, AlertCircle, Utensils } from "lucide-react";
import { useState, useRef, useId, useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn, formatCategory } from "@/lib/utils";

export interface SlideData {
  title: string;
  button: string;
  src?: string;
  onClick?: () => void;
  // Rich data fields
  type?: 'offer' | 'request';
  category?: string;
  distance?: string;
  postedAt?: string;
  expiresAt?: string;
  user?: {
    name: string;
    avatar?: string;
    initials?: string;
  };
  description?: string;
}

interface SlideProps {
  slide: SlideData;
  index: number;
  current: number;
  handleSlideClick: (index: number) => void;
}

const Slide = ({ slide, index, current, handleSlideClick }: SlideProps) => {
  const slideRef = useRef<HTMLLIElement>(null);

  const xRef = useRef(0);
  const yRef = useRef(0);
  const frameRef = useRef<number>();

  useEffect(() => {
    const animate = () => {
      if (!slideRef.current) return;

      const x = xRef.current;
      const y = yRef.current;

      slideRef.current.style.setProperty("--x", `${x}px`);
      slideRef.current.style.setProperty("--y", `${y}px`);

      frameRef.current = requestAnimationFrame(animate);
    };

    frameRef.current = requestAnimationFrame(animate);

    return () => {
      if (frameRef.current) {
        cancelAnimationFrame(frameRef.current);
      }
    };
  }, []);

  const handleMouseMove = (event: React.MouseEvent) => {
    const el = slideRef.current;
    if (!el) return;

    const r = el.getBoundingClientRect();
    xRef.current = event.clientX - (r.left + Math.floor(r.width / 2));
    yRef.current = event.clientY - (r.top + Math.floor(r.height / 2));
  };

  const handleMouseLeave = () => {
    xRef.current = 0;
    yRef.current = 0;
  };

  const imageLoaded = (event: React.SyntheticEvent<HTMLImageElement>) => {
    event.currentTarget.style.opacity = "1";
  };

  const { src, button, title, onClick, type, category, distance, postedAt, expiresAt, user, description } = slide;

  // Fallback background if no image
  const hasImage = !!src;
  
  return (
    <div className="[perspective:1200px] [transform-style:preserve-3d]">
      <li
        ref={slideRef}
        className="flex flex-1 flex-col items-center justify-center relative text-center text-white opacity-100 transition-all duration-300 ease-in-out w-[70vmin] h-[70vmin] mx-[4vmin] z-10 "
        onClick={() => handleSlideClick(index)}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        style={{
          transform:
            current !== index
              ? "scale(0.98) rotateX(8deg)"
              : "scale(1) rotateX(0deg)",
          transition: "transform 0.5s cubic-bezier(0.4, 0, 0.2, 1)",
          transformOrigin: "bottom",
        }}
      >
        <div
          className={cn(
            "absolute top-0 left-0 w-full h-full rounded-[1%] overflow-hidden transition-all duration-150 ease-out",
            !hasImage && "bg-gradient-to-br from-[#8DAA66] to-[#657C45]", // Asparagus-inspired gradient (Lighter)
            hasImage && "bg-[#1D1F2F]"
          )}
          style={{
            transform:
              current === index
                ? "translate3d(calc(var(--x) / 30), calc(var(--y) / 30), 0)"
                : "none",
          }}
        >
          {hasImage ? (
            <img
              className="absolute inset-0 w-[120%] h-[120%] object-cover opacity-100 transition-opacity duration-600 ease-in-out"
              style={{
                opacity: current === index ? 1 : 0.5,
              }}
              alt={title}
              src={src}
              onLoad={imageLoaded}
              loading="eager"
              decoding="sync"
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center opacity-10">
              <Utensils className="w-[30vmin] h-[30vmin] text-[#F5F0E1]" strokeWidth={1} />
            </div>
          )}
          
          {/* Gradient Overlay for text readability */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent transition-all duration-1000" />
        </div>

        <article
          className={`relative w-full h-full flex flex-col justify-end p-[4vmin] text-left transition-opacity duration-1000 ease-in-out ${
            current === index ? "opacity-100 visible" : "opacity-0 invisible"
          }`}
        >
          {/* Top Badges */}
          <div className="absolute top-[4vmin] left-[4vmin] flex flex-wrap gap-2">
            {type && (
              <Badge variant={type === 'offer' ? "default" : "secondary"} className={cn("text-sm px-3 py-1", type === 'offer' ? "bg-primary hover:bg-primary/90" : "bg-orange-500 hover:bg-orange-600 text-white")}>
                {type === 'offer' ? 'Offer' : 'Request'}
              </Badge>
            )}
            {category && (
              <Badge variant="outline" className="text-sm px-3 py-1 bg-black/20 backdrop-blur-md border-white/30 text-white">
                {formatCategory(category)}
              </Badge>
            )}
          </div>

          {/* Main Content */}
          <div className="space-y-4">
            <h2 className="text-2xl md:text-4xl font-bold leading-tight drop-shadow-md">
              {title}
            </h2>
            
            {description && (
              <p className="text-sm md:text-base text-gray-200 line-clamp-2 drop-shadow-sm max-w-[90%]">
                {description}
              </p>
            )}

            {/* Meta Info Grid */}
            <div className="grid grid-cols-2 gap-y-2 gap-x-4 text-sm text-gray-300 mt-2">
              {distance && (
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-primary" />
                  <span>{distance}</span>
                </div>
              )}
              {postedAt && (
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-primary" />
                  <span>{postedAt}</span>
                </div>
              )}
              {expiresAt && (
                <div className="flex items-center gap-2 col-span-2 text-orange-300">
                  <AlertCircle className="w-4 h-4" />
                  <span>Best before: {expiresAt}</span>
                </div>
              )}
            </div>

            {/* User & Action */}
            <div className="flex items-center justify-between pt-4 border-t border-white/10 mt-4">
              {user && (
                <div className="flex items-center gap-3">
                  <Avatar className="w-10 h-10 border-2 border-white/20">
                    <AvatarImage src={user.avatar} />
                    <AvatarFallback className="bg-primary/20 text-white">{user.initials}</AvatarFallback>
                  </Avatar>
                  <div className="flex flex-col">
                    <span className="text-sm font-medium text-white">{user.name}</span>
                    <span className="text-xs text-gray-400">Poster</span>
                  </div>
                </div>
              )}

              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  if (onClick) onClick();
                }}
                className="px-6 py-3 bg-white text-black font-semibold rounded-full hover:bg-gray-100 transition-colors shadow-lg active:scale-95"
              >
                {button}
              </button>
            </div>
          </div>
        </article>
      </li>
    </div>
  );
};

interface CarouselControlProps {
  type: string;
  title: string;
  handleClick: () => void;
}

const CarouselControl = ({
  type,
  title,
  handleClick,
}: CarouselControlProps) => {
  return (
    <button
      className={`w-10 h-10 flex items-center justify-center bg-neutral-200 dark:bg-neutral-800 border-3 border-transparent rounded-full focus:border-[#6D64F7] focus:outline-none hover:-translate-y-0.5 active:translate-y-0.5 transition duration-200 ${
        type === "previous" ? "" : ""
      }`}
      title={title}
      onClick={handleClick}
    >
      {type === "previous" ? (
        <ArrowLeft className="text-neutral-600 dark:text-neutral-200" />
      ) : (
        <ArrowRight className="text-neutral-600 dark:text-neutral-200" />
      )}
    </button>
  );
};

interface CarouselProps {
  slides: SlideData[];
  onSlideChange?: (index: number) => void;
}

export function Carousel({ slides, onSlideChange }: CarouselProps) {
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    if (onSlideChange) {
      onSlideChange(current);
    }
  }, [current, onSlideChange]);

  const handlePreviousClick = () => {
    const previous = current - 1;
    setCurrent(previous < 0 ? slides.length - 1 : previous);
  };

  const handleNextClick = () => {
    const next = current + 1;
    setCurrent(next === slides.length ? 0 : next);
  };

  const handleSlideClick = (index: number) => {
    if (current !== index) {
      setCurrent(index);
    }
  };

  const id = useId();

  return (
    <div
      className="relative w-[70vmin] h-[70vmin] mx-auto"
      aria-labelledby={`carousel-heading-${id}`}
    >
      <ul
        className="absolute flex mx-[-4vmin] transition-transform duration-1000 ease-in-out"
        style={{
          transform: `translateX(-${current * (100 / slides.length)}%)`,
        }}
      >
        {slides.map((slide, index) => (
          <Slide
            key={index}
            slide={slide}
            index={index}
            current={current}
            handleSlideClick={handleSlideClick}
          />
        ))}
      </ul>

      <div className="absolute top-1/2 -translate-y-1/2 -left-12 z-50">
        <CarouselControl
          type="previous"
          title="Go to previous slide"
          handleClick={handlePreviousClick}
        />
      </div>

      <div className="absolute top-1/2 -translate-y-1/2 -right-12 z-50">
        <CarouselControl
          type="next"
          title="Go to next slide"
          handleClick={handleNextClick}
        />
      </div>
    </div>
  );
}
