"use client"

import React, { useEffect, useState, useRef, useCallback } from "react"
import { motion } from "framer-motion"
import { Link, useLocation } from "react-router-dom"
import { LucideIcon } from "lucide-react"
import { cn } from "@/lib/utils"

interface NavItem {
  name: string
  url: string
  icon: LucideIcon
}

interface NavBarProps {
  items: NavItem[]
  className?: string
}

export function NavBar({ items, className }: NavBarProps) {
  const location = useLocation()
  const [isMobile, setIsMobile] = useState(false)
  const [indicatorStyle, setIndicatorStyle] = useState<{ left: number; width: number } | null>(null)
  const navRef = useRef<HTMLDivElement>(null)
  const itemRefs = useRef<(HTMLAnchorElement | null)[]>([])
  const isFirstRender = useRef(true)

  // Find active index based on current route
  const activeIndex = items.findIndex(item => item.url === location.pathname)
  const safeActiveIndex = activeIndex >= 0 ? activeIndex : 0

  // Update indicator position when active item changes
  const updateIndicator = useCallback(() => {
    const activeElement = itemRefs.current[safeActiveIndex]
    const navElement = navRef.current
    
    if (activeElement && navElement) {
      const navRect = navElement.getBoundingClientRect()
      const activeRect = activeElement.getBoundingClientRect()
      
      setIndicatorStyle({
        left: activeRect.left - navRect.left,
        width: activeRect.width,
      })
      
      // After first calculation, allow animations
      if (isFirstRender.current) {
        isFirstRender.current = false
      }
    }
  }, [safeActiveIndex])

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768)
      updateIndicator()
    }

    handleResize()
    window.addEventListener("resize", handleResize)
    return () => window.removeEventListener("resize", handleResize)
  }, [updateIndicator])

  useEffect(() => {
    // Small delay to ensure DOM is ready
    const timer = setTimeout(updateIndicator, 10)
    return () => clearTimeout(timer)
  }, [safeActiveIndex, location.pathname, updateIndicator])

  return (
    <div
      className={cn(
        "fixed bottom-0 sm:bottom-auto sm:top-0 left-1/2 -translate-x-1/2 z-50 mb-6 sm:mb-0 sm:pt-6",
        className,
      )}
    >
      <div 
        ref={navRef}
        className="relative flex items-center gap-1 sm:gap-2 bg-background/90 border border-border backdrop-blur-lg py-2 px-3 rounded-full shadow-lg"
      >
        {/* Sliding background indicator - always mounted, just moves */}
        {indicatorStyle && (
          <motion.div
            className="absolute bg-primary/5 rounded-full -z-10"
            initial={{ 
              left: indicatorStyle.left, 
              width: indicatorStyle.width,
              top: 8,
              bottom: 8,
            }}
            animate={{
              left: indicatorStyle.left,
              width: indicatorStyle.width,
              top: 8,
              bottom: 8,
            }}
            transition={isFirstRender.current ? { duration: 0 } : {
              type: "tween",
              ease: [0.25, 0.1, 0.25, 1],
              duration: 0.3,
            }}
          />
        )}
        
        {/* Sliding tubelight glow - always mounted, just moves */}
        {indicatorStyle && (
          <motion.div
            className="absolute -top-1.5 h-1 pointer-events-none"
            initial={{
              left: indicatorStyle.left + indicatorStyle.width / 2 - 16,
              width: 32,
              opacity: 0.8,
            }}
            animate={{
              left: indicatorStyle.left + indicatorStyle.width / 2 - 16,
              width: 32,
              opacity: 0.8,
            }}
            transition={isFirstRender.current ? { duration: 0 } : {
              type: "tween",
              ease: [0.25, 0.1, 0.25, 1],
              duration: 0.3,
            }}
          >
            <div className="w-full h-full bg-primary/60 rounded-full" />
            <div className="absolute w-10 h-4 bg-primary/10 rounded-full blur-md -top-1 -left-1" />
          </motion.div>
        )}

        {items.map((item, index) => {
          const Icon = item.icon
          const isActive = index === safeActiveIndex

          return (
            <Link
              key={item.name}
              ref={(el) => { itemRefs.current[index] = el }}
              to={item.url}
              className={cn(
                "relative cursor-pointer font-semibold rounded-full transition-colors duration-200",
                "flex items-center gap-2 whitespace-nowrap",
                "text-base sm:text-lg px-3 py-2 sm:px-6 sm:py-3",
                "text-foreground/70 hover:text-primary",
                isActive && "text-primary",
              )}
            >
              {/* Always show icon */}
              <Icon size={20} strokeWidth={2.5} className="flex-shrink-0" />
              {/* Show text on medium screens and up */}
              <span className="hidden md:inline">{item.name}</span>
            </Link>
          )
        })}
      </div>
    </div>
  )
}

// Spacer component to prevent content from being hidden behind the fixed navbar
export function NavBarSpacer({ className }: { className?: string }) {
  return (
    <div className={cn("h-24 sm:h-28", className)} aria-hidden="true" />
  )
}
