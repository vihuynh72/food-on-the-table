import React, { useState, useEffect, useRef, HTMLAttributes } from 'react';
import { cn } from "@/lib/utils";

// Define the type for a single gallery item
export interface GalleryItem {
  common: string;
  binomial: string;
  photo?: {
    url: string; 
    text: string;
    pos?: string;
    by?: string;
  };
  icon?: React.ReactNode;
  color?: string;
}

// Define the props for the CircularGallery component
interface CircularGalleryProps extends HTMLAttributes<HTMLDivElement> {
  items: GalleryItem[];
  /** Controls how far the items are from the center. */
  radius?: number;
  /** Controls the speed of auto-rotation when not scrolling. */
  autoRotateSpeed?: number;
  /** Callback when an item is clicked */
  onItemClick?: (item: GalleryItem, index: number) => void;
}

const CircularGallery = React.forwardRef<HTMLDivElement, CircularGalleryProps>(
  ({ items, className, radius = 600, autoRotateSpeed = 0.02, onItemClick, ...props }, ref) => {
    const [rotation, setRotation] = useState(0);
    const animationFrameRef = useRef<number | null>(null);

    // Effect for auto-rotation
    useEffect(() => {
      const autoRotate = () => {
        setRotation(prev => prev + autoRotateSpeed);
        animationFrameRef.current = requestAnimationFrame(autoRotate);
      };

      animationFrameRef.current = requestAnimationFrame(autoRotate);

      return () => {
        if (animationFrameRef.current) {
          cancelAnimationFrame(animationFrameRef.current);
        }
      };
    }, [autoRotateSpeed]);

    const anglePerItem = 360 / items.length;
    
    return (
      <div
        ref={ref}
        role="region"
        aria-label="Circular 3D Gallery"
        className={cn("relative w-full h-full flex items-center justify-center", className)}
        style={{ perspective: '2000px' }}
        {...props}
      >
        <div
          className="relative w-full h-full"
          style={{
            transform: `rotateY(${rotation}deg)`,
            transformStyle: 'preserve-3d',
          }}
        >
          {items.map((item, i) => {
            const itemAngle = i * anglePerItem;
            const totalRotation = rotation % 360;
            const relativeAngle = (itemAngle + totalRotation + 360) % 360;
            const normalizedAngle = Math.abs(relativeAngle > 180 ? 360 - relativeAngle : relativeAngle);
            const opacity = Math.max(0.3, 1 - (normalizedAngle / 180));

            return (
              <div
                key={i} 
                role="group"
                aria-label={item.common}
                className="absolute w-[280px] h-[380px]"
                style={{
                  transform: `rotateY(${itemAngle}deg) translateZ(${radius}px)`,
                  left: '50%',
                  top: '50%',
                  marginLeft: '-140px',
                  marginTop: '-190px',
                  opacity: opacity,
                  transition: 'opacity 0.3s linear'
                }}
              >
                <div 
                  className={cn(
                    "relative w-full h-full rounded-3xl shadow-2xl overflow-hidden group border-2 border-white/20 backdrop-blur-lg cursor-pointer hover:scale-105 transition-transform duration-300 flex flex-col",
                    item.color ? item.color : "bg-card/90 dark:bg-card/50"
                  )}
                  onClick={() => onItemClick?.(item, i)}
                >
                  {item.photo ? (
                    <img
                      src={item.photo.url}
                      alt={item.photo.text}
                      className="absolute inset-0 w-full h-full object-cover"
                      style={{ objectPosition: item.photo.pos || 'center' }}
                    />
                  ) : (
                    <div className="flex-1 flex items-center justify-center bg-gradient-to-br from-white/20 to-transparent p-4">
                      <div className="transform group-hover:scale-110 transition-transform duration-500 drop-shadow-2xl filter">
                        {item.icon}
                      </div>
                    </div>
                  )}
                  
                  <div className="absolute bottom-0 left-0 w-full p-6 bg-black/40 backdrop-blur-sm text-white border-t border-white/10">
                    <h2 className="text-3xl font-bold mb-1 leading-tight drop-shadow-md">{item.common}</h2>
                    <em className="text-xl font-semibold opacity-100 block drop-shadow-sm text-white/90">{item.binomial}</em>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }
);

CircularGallery.displayName = 'CircularGallery';

export { CircularGallery };
