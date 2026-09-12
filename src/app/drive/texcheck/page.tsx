'use client';
import { useEffect, useState } from 'react';

export default function TexCheck() {
  const [urls, setUrls] = useState<Record<string, string>>({});
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const t0 = performance.now();
      const mod = await import('@/components/drive/textures');
      const grass = mod.grassMaps();
      const tarmac = mod.tarmacMaps();
      const ms = Math.round(performance.now() - t0);
      const grab = (tex: { image: HTMLCanvasElement }) => tex.image.toDataURL('image/png');
      if (cancelled) return;
      setUrls({
        ms: String(ms),
        grassMap: grab(grass.map as unknown as { image: HTMLCanvasElement }),
        grassNormal: grab(grass.normalMap as unknown as { image: HTMLCanvasElement }),
        grassRough: grab(grass.roughnessMap as unknown as { image: HTMLCanvasElement }),
        tarmacMap: grab(tarmac.map as unknown as { image: HTMLCanvasElement }),
        tarmacNormal: grab(tarmac.normalMap as unknown as { image: HTMLCanvasElement }),
        tarmacRough: grab(tarmac.roughnessMap as unknown as { image: HTMLCanvasElement }),
      });
    })();
    return () => { cancelled = true; };
  }, []);

  return (
    <div id="texcheck" style={{ background: '#111', padding: 16, minHeight: '100vh' }}>
      <p id="ms" style={{ color: '#b4ff39', fontFamily: 'monospace' }}>build ms: {urls.ms ?? '...'}</p>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 256px)', gap: 12 }}>
        {['grassMap', 'grassNormal', 'grassRough', 'tarmacMap', 'tarmacNormal', 'tarmacRough'].map((k) => (
          <div key={k}>
            <p style={{ color: '#aaa', fontFamily: 'monospace', fontSize: 11 }}>{k}</p>
            {urls[k] ? <img src={urls[k]} width={256} height={256} alt={k} /> : null}
          </div>
        ))}
      </div>
    </div>
  );
}
