"use client"

import {
  motion,
  useMotionTemplate,
  useMotionValue,
  useTransform,
} from "motion/react"
import {
  useLayoutEffect,
  useRef,
  type ReactNode,
} from "react"
import { useMotionUITheme, useMotionUITransition } from "@/components/motion-ui/ui-theme"
import {
  ParallaxLayer,
  ParallaxScene,
  useParallaxScroll,
} from "@/components/motion-ui/parallax-layers"
import { VelocityDashboardShot } from "./velocity-dashboard-shot"
import "./styles.css"

const FOCUS_RING =
  "outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"

interface Insight {
  label: string
  title: string
  value: string
  detail: string
  progress?: boolean
}

const INSIGHTS: Insight[] = [
  {
    label: "Biggest drop-off",
    title: "Invite teammates",
    value: "39%",
    detail: "Users leave before their workspace becomes collaborative.",
    progress: true,
  },
  {
    label: "Recovered",
    title: "Day-three prompt",
    value: "+12.4%",
    detail: "More teams return after a timely activation reminder.",
  },
  {
    label: "Week four",
    title: "Team retention",
    value: "68.2%",
    detail: "Collaborative workspaces keep their weekly habit.",
  },
]

interface HeroContentProps {
  fgSpeed?: number
}

export function HeroContent({ fgSpeed = 0.95 }: HeroContentProps = {}) {
  const uiTheme = useMotionUITheme()
  const still = uiTheme.motionMode === "off"
  const calm = uiTheme.motionMode === "calm"
  const fullMotion = uiTheme.motionMode === "full"

  const enterTransition = useMotionUITransition("gentle")
  const copyInitial = still
    ? false
    : { opacity: 0, transform: calm ? "translateY(0px)" : "translateY(20px)" }
  const windowInitial = still
    ? false
    : { opacity: 0, transform: calm ? "translateY(0px)" : "translateY(28px)" }

  return (
    <ParallaxScene
      as="section"
      offset={["start start", "end end"]}
      className={`velocity-hero relative w-full bg-background font-sans text-foreground antialiased ${
        fullMotion
          ? "h-[325dvh]"
          : "min-h-[var(--velocity-demo-min-h,auto)]"
      }`}
    >
      <div
        data-velocity-parallax-stage=""
        className={`relative flex w-full flex-col ${
          fullMotion
            ? "sticky top-0 h-[100dvh] overflow-hidden"
            : "min-h-[var(--velocity-demo-min-h,auto)] overflow-x-hidden"
        }`}
      >
        <div
          className={`relative z-10 mx-auto flex w-full max-w-[1440px] flex-col px-6 pt-[clamp(3rem,8vh,6rem)] md:px-10 lg:px-16 ${
            fullMotion
              ? "h-full"
              : "min-h-[var(--velocity-demo-min-h,auto)] pb-12"
          }`}
        >
          <ParallaxLayer speed={fgSpeed}>
            <motion.div
              initial={copyInitial}
              animate={{ opacity: 1, transform: "translateY(0px)" }}
              transition={{ ...enterTransition }}
              className="w-full"
            >
              <ScrollFade enabled={fullMotion}>
                <div className="flex max-w-[980px] flex-col items-start">
                  <h1
                    id="velocity-parallax-heading"
                    className="velocity-hero-title max-w-[11ch] text-balance text-[clamp(3.5rem,6.6vw,7.25rem)] leading-[0.92] tracking-[-0.055em] text-foreground"
                  >
                    Find where journeys break.
                  </h1>

                  <p className="sr-only">
                    Preview: a Velocity analytics overview with daily active
                    users trending up, activation rate and weekly retention
                    alongside a chart and top product events.
                  </p>

                  <div className="mt-7 flex w-full max-w-[820px] flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
                    <p className="velocity-hero-sub max-w-[44ch] text-base text-balance text-muted-foreground sm:text-lg">
                      Trace each session from first click to conversion, then
                      fix the step that loses people.
                    </p>
                    <div className="flex shrink-0 flex-wrap items-center gap-3">
                      <a
                        href="https://motion.dev/docs"
                        target="_blank"
                        rel="noreferrer"
                        className={`inline-flex h-11 items-center justify-center whitespace-nowrap rounded-sm bg-primary px-[1.375rem] text-[0.9375rem] font-medium text-primary-foreground transition-colors duration-[var(--motion-ui-transition-snap-duration)] ease-[var(--motion-ui-transition-snap)] hover:bg-primary/90 ${FOCUS_RING}`}
                      >
                        Start free trial
                      </a>
                      <a
                        href="https://motion.dev/docs"
                        target="_blank"
                        rel="noreferrer"
                        className={`inline-flex h-11 items-center justify-center whitespace-nowrap rounded-sm border border-border px-[1.375rem] text-[0.9375rem] font-medium text-foreground transition-colors duration-[var(--motion-ui-transition-snap-duration)] ease-[var(--motion-ui-transition-snap)] hover:bg-accent ${FOCUS_RING}`}
                      >
                        Book a demo
                      </a>
                    </div>
                  </div>
                </div>
              </ScrollFade>
            </motion.div>
          </ParallaxLayer>

          <CenteringParallaxLayer className="mt-[clamp(2.5rem,6vh,5rem)]">
            <motion.div
              initial={windowInitial}
              animate={{ opacity: 1, transform: "translateY(0px)" }}
              transition={{ ...enterTransition, delay: uiTheme.stagger.base }}
              className="velocity-dashboard-frame relative"
            >
              <div
                aria-hidden="true"
                className="velocity-dashboard-shadow absolute inset-x-[8%] bottom-[-6%] h-[18%]"
              />
              <VelocityDashboardShot
                decorative
                className="relative w-full overflow-hidden rounded-lg border border-border shadow-2xl"
              />
            </motion.div>
          </CenteringParallaxLayer>

          {!fullMotion && <StaticInsightCards />}
        </div>
      </div>

      {fullMotion && <ScrollingInsightCards />}
    </ParallaxScene>
  )
}

interface CenteringParallaxLayerProps {
  children: ReactNode
  className?: string
}

function CenteringParallaxLayer({
  children,
  className,
}: CenteringParallaxLayerProps) {
  const progress = useParallaxScroll()
  const uiTheme = useMotionUITheme()
  const motionAllowed = uiTheme.motionMode === "full"
  const layerRef = useRef<HTMLDivElement>(null)
  const travelY = useMotionValue(0)

  useLayoutEffect(() => {
    const layer = layerRef.current
    if (!layer || !motionAllowed) {
      travelY.set(0)
      return
    }

    const stage = layer.closest("[data-velocity-parallax-stage]")
    if (!(stage instanceof HTMLElement)) return

    const measure = () => {
      const stageRect = stage.getBoundingClientRect()
      const layerRect = layer.getBoundingClientRect()
      const transform = getComputedStyle(layer).transform
      const currentY =
        transform && transform !== "none"
          ? new DOMMatrixReadOnly(transform).m42
          : 0
      const naturalCenterY = layerRect.top + layerRect.height / 2 - currentY
      const stageCenterY = stageRect.top + stageRect.height / 2
      travelY.set(stageCenterY - naturalCenterY)
    }

    measure()

    const ro = new ResizeObserver(measure)
    ro.observe(layer)
    ro.observe(stage)
    window.addEventListener("resize", measure)

    const images = Array.from(layer.querySelectorAll("img"))
    for (const image of images) {
      if (!image.complete) image.addEventListener("load", measure)
    }

    return () => {
      ro.disconnect()
      window.removeEventListener("resize", measure)
      for (const image of images) {
        image.removeEventListener("load", measure)
      }
    }
  }, [motionAllowed, travelY])

  const y = useTransform([progress, travelY], ([p, travel]) =>
    motionAllowed ? Number(p) * Number(travel) : 0
  )
  const transform = useMotionTemplate`translateY(${y}px)`

  return (
    <motion.div ref={layerRef} style={{ transform }} className={className}>
      {children}
    </motion.div>
  )
}

interface ScrollFadeProps {
  children: ReactNode
  enabled: boolean
}

// Keep scroll opacity on its own node, separate from the entrance animation.
function ScrollFade({ children, enabled }: ScrollFadeProps) {
  const progress = useParallaxScroll()
  const opacity = useTransform(progress, (latest) => {
    if (latest <= 0.12) return 1
    if (latest >= 0.34) return 0
    return 1 - (latest - 0.12) / (0.34 - 0.12)
  })

  return (
    <motion.div style={enabled ? { opacity } : undefined}>{children}</motion.div>
  )
}

function ScrollingInsightCards() {
  return (
    <aside
      aria-label="Product insights"
      className="pointer-events-none absolute inset-x-0 top-[100dvh] z-20"
    >
      {INSIGHTS.map((insight, index) => (
        <div
          key={insight.label}
          className={`mx-auto flex h-[70dvh] w-full max-w-[1440px] items-center px-6 md:px-10 lg:px-16 ${
            index === 1 ? "justify-start" : "justify-end"
          }`}
        >
          <InsightCard insight={insight} index={index} />
        </div>
      ))}
    </aside>
  )
}

function StaticInsightCards() {
  return (
    <aside
      aria-label="Product insights"
      className="mt-8 flex w-full flex-col gap-4"
    >
      {INSIGHTS.map((insight, index) => (
        <div
          key={insight.label}
          className={`flex w-full ${
            index === 1 ? "justify-start" : "justify-end"
          }`}
        >
          <InsightCard insight={insight} index={index} />
        </div>
      ))}
    </aside>
  )
}

interface InsightCardProps {
  insight: Insight
  index: number
}

function InsightCard({ insight, index }: InsightCardProps) {
  const width =
    index === 0
      ? "w-[88%] max-w-[420px]"
      : index === 1
        ? "w-[82%] max-w-[360px]"
        : "w-[84%] max-w-[380px]"

  return (
    <article
      className={`velocity-insight-card rounded-lg border border-border bg-card p-5 text-card-foreground shadow-lg sm:p-6 ${width}`}
    >
      <div className="flex items-start justify-between gap-6">
        <div>
          <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
            {insight.label}
          </p>
          <h2 className="mt-2 text-xl text-balance text-foreground sm:text-2xl">
            {insight.title}
          </h2>
        </div>
        <span className="font-mono text-3xl tabular-nums text-foreground">
          {insight.value}
        </span>
      </div>

      {insight.progress && (
        <div
          aria-hidden="true"
          className="mt-5 h-1 overflow-hidden rounded-sm bg-muted"
        >
          <span className="block h-full w-[61%] bg-primary" />
        </div>
      )}

      <p
        className={`max-w-[38ch] text-sm text-muted-foreground ${
          insight.progress ? "mt-4" : "mt-5"
        }`}
      >
        {insight.detail}
      </p>
    </article>
  )
}

export default HeroContent
