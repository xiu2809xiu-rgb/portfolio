"use client"

import {
  motion,
  useMotionTemplate,
  useScroll,
  useTransform,
  type MotionValue,
  type UseScrollOptions,
} from "motion/react"
import {
  createContext,
  createElement,
  useContext,
  useRef,
  type ElementType,
  type ReactNode,
} from "react"
import { useMotionUITheme } from "@/components/motion-ui/ui-theme"

interface ParallaxSceneContextValue {
  /** Scroll progress of the scene target, 0 → 1. */
  scrollYProgress: MotionValue<number>
  /** Travel unit each layer's `speed` scales, in px. */
  parallaxUnit: number
  /** Whether travel is allowed. */
  motionAllowed: boolean
}

const ParallaxSceneContext = createContext<ParallaxSceneContextValue | null>(
  null
)

function useParallaxSceneContext(part: string): ParallaxSceneContextValue {
  const ctx = useContext(ParallaxSceneContext)
  if (!ctx) {
    throw new Error(`${part} must be rendered inside a <ParallaxScene>.`)
  }
  return ctx
}

const DEFAULT_OFFSET: UseScrollOptions["offset"] = ["start start", "end start"]
const TRAVEL_UNIT_MULTIPLIER = 6

export interface ParallaxSceneProps {
  /** Scene contents: `ParallaxLayer`s and static chrome. */
  children?: ReactNode
  /** Merged onto the scene element. */
  className?: string
  /** Element type for the scene root. Default `"div"`. */
  as?: ElementType
  /** Scroll offset defining 0 → 1 progress. */
  offset?: UseScrollOptions["offset"]
}

/** Scroll-driving scene root that publishes progress to layers. */
export function ParallaxScene({
  children,
  className,
  as = "div",
  offset = DEFAULT_OFFSET,
}: ParallaxSceneProps) {
  const uiTheme = useMotionUITheme()
  const motionMode = uiTheme.motionMode
  const motionAllowed = motionMode === "full"
  const sceneRef = useRef<HTMLElement>(null)
  const { scrollYProgress } = useScroll({ target: sceneRef, offset })

  const value: ParallaxSceneContextValue = {
    scrollYProgress,
    parallaxUnit: uiTheme.travel.section * TRAVEL_UNIT_MULTIPLIER,
    motionAllowed,
  }

  return (
    <ParallaxSceneContext.Provider value={value}>
      {createElement(as, { ref: sceneRef, className }, children)}
    </ParallaxSceneContext.Provider>
  )
}

export interface ParallaxLayerProps {
  /** Layer content. */
  children?: ReactNode
  /** Scroll speed multiplier. */
  speed: number
  /** Scale drift from 1 to `1 + scaleDrift * speed`. Default `0`. */
  scaleDrift?: number
  /** Merged onto the moving element. */
  className?: string
  /** Set on purely decorative layers. */
  "aria-hidden"?: boolean
}

/** Single depth layer that moves with scroll progress. */
export function ParallaxLayer({
  children,
  speed,
  scaleDrift = 0,
  className,
  "aria-hidden": ariaHidden,
}: ParallaxLayerProps) {
  const { scrollYProgress, parallaxUnit, motionAllowed } =
    useParallaxSceneContext("<ParallaxLayer>")

  const effectiveSpeed = motionAllowed ? speed : 0

  // Deliberately unsmoothed: springing scroll-linked transforms feels like lag.
  const y = useTransform(
    scrollYProgress,
    [0, 1],
    [0, -parallaxUnit * effectiveSpeed]
  )

  const scale = useTransform(
    scrollYProgress,
    [0, 1],
    [1, 1 + scaleDrift * effectiveSpeed]
  )

  const transform = scaleDrift
    ? useMotionTemplate`translateY(${y}px) scale(${scale})`
    : useMotionTemplate`translateY(${y}px)`

  return (
    <motion.div
      aria-hidden={ariaHidden}
      style={{ transform }}
      className={className}
    >
      {children}
    </motion.div>
  )
}

/** Raw `scrollYProgress` from the enclosing `ParallaxScene`. */
export function useParallaxScroll(): MotionValue<number> {
  return useParallaxSceneContext("useParallaxScroll").scrollYProgress
}
