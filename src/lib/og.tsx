import type { ReactElement } from 'react';

const INK = '#05070a';
const LIME = '#b4ff39';
const AQUA = '#39ffd8';
const TEXT = '#e9ecef';
const DIM = '#8b949e';

export const OG_SIZE = { width: 1200, height: 630 };

interface CardProps {
  /** Small monospaced line above the title. */
  eyebrow: string;
  title: string;
  description?: string;
  /** Bottom-right metadata, e.g. tags or a stack list. */
  meta?: string;
  accent?: string;
}

/**
 * Shared social-card layout.
 *
 * `next/og` renders in Satori, which supports a deliberately small slice of CSS:
 * every element needs an explicit `display`, there is no `gap` on block layout,
 * and no external stylesheet. So the design is rebuilt here with inline styles
 * rather than shared with the site, and kept to flex + solid colours.
 */
export function OgCard({ eyebrow, title, description, meta, accent = LIME }: CardProps): ReactElement {
  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        background: INK,
        padding: 72,
        position: 'relative',
      }}
    >
      <div
        style={{
          position: 'absolute',
          width: 720,
          height: 720,
          left: -240,
          bottom: -340,
          borderRadius: 9999,
          background: `radial-gradient(circle, ${accent}2E 0%, ${INK}00 70%)`,
          display: 'flex',
        }}
      />
      <div
        style={{
          position: 'absolute',
          width: 620,
          height: 620,
          right: -220,
          top: -280,
          borderRadius: 9999,
          background: `radial-gradient(circle, ${AQUA}1F 0%, ${INK}00 70%)`,
          display: 'flex',
        }}
      />

      <div style={{ display: 'flex', alignItems: 'center' }}>
        <div
          style={{ width: 12, height: 12, borderRadius: 9999, background: accent, display: 'flex' }}
        />
        <div
          style={{
            marginLeft: 14,
            fontSize: 21,
            letterSpacing: 5,
            textTransform: 'uppercase',
            color: DIM,
            display: 'flex',
          }}
        >
          {eyebrow}
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', maxWidth: 1000 }}>
        <div
          style={{
            fontSize: title.length > 46 ? 66 : 82,
            fontWeight: 800,
            letterSpacing: -2.5,
            lineHeight: 1.06,
            color: TEXT,
            display: 'flex',
          }}
        >
          {title}
        </div>
        {description ? (
          <div
            style={{
              marginTop: 22,
              fontSize: 27,
              lineHeight: 1.4,
              color: DIM,
              display: 'flex',
              maxWidth: 900,
            }}
          >
            {description.length > 132 ? `${description.slice(0, 129)}…` : description}
          </div>
        ) : null}
      </div>

      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderTop: '1px solid rgba(255,255,255,0.09)',
          paddingTop: 26,
        }}
      >
        <div style={{ fontSize: 28, fontWeight: 700, color: TEXT, display: 'flex' }}>
          RICHIE<span style={{ color: accent }}>.</span>KOH
        </div>
        {meta ? <div style={{ fontSize: 21, color: DIM, display: 'flex' }}>{meta}</div> : null}
      </div>
    </div>
  );
}
