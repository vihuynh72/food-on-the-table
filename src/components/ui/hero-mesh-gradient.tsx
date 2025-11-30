"use client"

import { MeshGradient } from "@paper-design/shaders-react"
import { useEffect, useState, useRef } from "react"
import { motion } from "framer-motion"
import { cn } from "@/lib/utils"

interface HeroMeshGradientProps {
  title?: string
  highlightText?: string
  description?: string
  buttonText?: string
  onButtonClick?: () => void
  colors?: string[]
  distortion?: number
  swirl?: number
  speed?: number
  offsetX?: number
  className?: string
  children?: React.ReactNode
  /** Whether to render as full-screen or contained section */
  fullScreen?: boolean
  /** Minimum height for contained mode */
  minHeight?: string
}

// Forest Moth palette converted to hex for the shader
const DEFAULT_COLORS = [
  "#8fa664", // Woodland green
  "#c4d9a8", // Pine Glade
  "#f5e6c8", // Raffia cream
  "#e8d4c4", // Desert Sand
  "#9ab86e", // Asparagus
  "#d4e8b8", // Light pine
]

export function HeroMeshGradient({
  title,
  highlightText,
  description,
  buttonText,
  onButtonClick,
  colors = DEFAULT_COLORS,
  distortion = 0.6,
  swirl = 0.5,
  speed = 0.3,
  offsetX = 0.08,
  className = "",
  children,
  fullScreen = false,
  minHeight = "min-h-[500px]",
}: HeroMeshGradientProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [dimensions, setDimensions] = useState({ width: 1200, height: 600 })
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    
    const updateDimensions = () => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect()
        setDimensions({
          width: rect.width || window.innerWidth,
          height: rect.height || 600,
        })
      } else if (fullScreen) {
        setDimensions({
          width: window.innerWidth,
          height: window.innerHeight,
        })
      }
    }

    updateDimensions()
    window.addEventListener("resize", updateDimensions)
    
    // Re-measure after a short delay to ensure accurate dimensions
    const timer = setTimeout(updateDimensions, 100)
    
    return () => {
      window.removeEventListener("resize", updateDimensions)
      clearTimeout(timer)
    }
  }, [fullScreen])

  return (
    <section
      ref={containerRef}
      className={cn(
        "relative w-full overflow-hidden flex items-center justify-center",
        fullScreen ? "min-h-screen" : minHeight,
        "rounded-3xl",
        className
      )}
    >
      {/* Mesh Gradient Background */}
      <div 
        className="absolute inset-0 w-full h-full"
        style={{ pointerEvents: 'none' }}
      >
        {mounted && (
          <>
            <div style={{ pointerEvents: 'none' }} className="[&>canvas]:pointer-events-none">
              <MeshGradient
                width={dimensions.width}
                height={dimensions.height}
                colors={colors}
                distortion={distortion}
                swirl={swirl}
                grainMixer={0}
                grainOverlay={0}
                speed={speed}
                offsetX={offsetX}
              />
            </div>
            {/* Subtle overlay for better text readability */}
            <div className="absolute inset-0 pointer-events-none bg-background/10" />
          </>
        )}
      </div>

      {/* Content - explicitly allow pointer events */}
      <div className="relative z-10 w-full max-w-4xl mx-auto px-6 py-12 md:py-16" style={{ pointerEvents: 'auto' }}>
        {children ? (
          children
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            className="text-center"
          >
            {(title || highlightText) && (
              <h1 className="font-bold text-foreground text-balance text-3xl sm:text-4xl md:text-5xl lg:text-6xl leading-tight mb-6">
                {title}{" "}
                {highlightText && (
                  <span className="text-primary">{highlightText}</span>
                )}
              </h1>
            )}
            
            {description && (
              <p className="text-lg md:text-xl text-foreground/80 text-pretty max-w-2xl mx-auto leading-relaxed mb-8">
                {description}
              </p>
            )}
            
            {buttonText && (
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={onButtonClick}
                className="px-8 py-4 rounded-full bg-primary text-primary-foreground font-semibold text-lg shadow-lg hover:shadow-xl transition-shadow duration-300"
              >
                {buttonText}
              </motion.button>
            )}
          </motion.div>
        )}
      </div>
    </section>
  )
}
