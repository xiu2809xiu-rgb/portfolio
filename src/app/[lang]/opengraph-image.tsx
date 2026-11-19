import { ImageResponse } from 'next/og';
import { profile } from '@/content/profile';

export const runtime = 'nodejs';
export const alt = `${profile.fullName} — ${profile.role}`;
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

/**
 * Social share card, generated at build time.
 *
 * Uses only system-safe fonts and flat colour: `next/og` runs in a constrained
 * renderer with no access to the site's stylesheet, so the design is rebuilt here
 * with inline styles rather than shared with the page.
 */
export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          background: '#05070a',
          padding: 72,
          position: 'relative',
        }}
      >
        {/* Lime glow, bottom-left. */}
        <div
          style={{
            position: 'absolute',
            width: 700,
            height: 700,
            left: -220,
            bottom: -320,
            borderRadius: 9999,
            background: 'radial-gradient(circle, rgba(180,255,57,0.20) 0%, rgba(5,7,10,0) 70%)',
            display: 'flex',
          }}
        />
        <div
          style={{
            position: 'absolute',
            width: 620,
            height: 620,
            right: -200,
            top: -260,
            borderRadius: 9999,
            background: 'radial-gradient(circle, rgba(57,255,216,0.14) 0%, rgba(5,7,10,0) 70%)',
            display: 'flex',
          }}
        />

        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div
            style={{ width: 12, height: 12, borderRadius: 9999, background: '#b4ff39', display: 'flex' }}
          />
          <div
            style={{
              fontSize: 22,
              letterSpacing: 6,
              textTransform: 'uppercase',
              color: '#8b949e',
              display: 'flex',
            }}
          >
            {profile.role} · {profile.location}
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <div
            style={{
              fontSize: 96,
              fontWeight: 800,
              letterSpacing: -3,
              lineHeight: 1.02,
              color: '#e9ecef',
              display: 'flex',
            }}
          >
            I craft web experiences
          </div>
          <div
            style={{
              fontSize: 96,
              fontWeight: 800,
              letterSpacing: -3,
              lineHeight: 1.02,
              color: '#b4ff39',
              display: 'flex',
            }}
          >
            that matter.
          </div>
        </div>

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            borderTop: '1px solid rgba(255,255,255,0.09)',
            paddingTop: 28,
          }}
        >
          <div style={{ fontSize: 30, fontWeight: 700, color: '#e9ecef', display: 'flex' }}>
            RICHIE<span style={{ color: '#b4ff39' }}>.</span>KOH
          </div>
          <div style={{ fontSize: 22, color: '#8b949e', display: 'flex' }}>
            Flask · TypeScript · Next.js
          </div>
        </div>
      </div>
    ),
    size,
  );
}
