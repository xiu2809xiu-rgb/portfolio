export const VELOCITY_DASHBOARD_DARK =
  "https://examples.motion.dev/photos/velocity-dashboard/overview-dark.png"
export const VELOCITY_DASHBOARD_LIGHT =
  "https://examples.motion.dev/photos/velocity-dashboard/overview-light.png"

export const VELOCITY_DASHBOARD_ALT =
  "Velocity analytics overview: daily active users trending up, with activation rate and weekly retention alongside a chart and top product events."

export interface VelocityDashboardShotProps {
  /** Accessible name for the shot. Defaults to the shared overview description. */
  alt?: string
  /** Extra classes on the wrapper (sizing, radius, shadow). */
  className?: string
  /** When true, hide the shot from assistive tech (hero already has a label). */
  decorative?: boolean
}

export function VelocityDashboardShot({
  alt = VELOCITY_DASHBOARD_ALT,
  className,
  decorative = false,
}: VelocityDashboardShotProps) {
  const classes = ["velocity-dashboard-shot", className].filter(Boolean).join(" ")
  return (
    <span
      className={classes}
      {...(decorative
        ? { "aria-hidden": true as const }
        : { role: "img" as const, "aria-label": alt })}
    >
      <img
        data-scheme="dark"
        src={VELOCITY_DASHBOARD_DARK}
        alt=""
        className="hidden h-auto w-full dark:block"
        decoding="async"
        draggable={false}
      />
      <img
        data-scheme="light"
        src={VELOCITY_DASHBOARD_LIGHT}
        alt=""
        className="block h-auto w-full dark:hidden"
        decoding="async"
        draggable={false}
      />
    </span>
  )
}
