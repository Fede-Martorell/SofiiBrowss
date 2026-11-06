import { useEffect, useState } from 'react';

interface CrossfadeImageProps {
  src: string;
  alt: string;
  fit?: 'cover' | 'contain';
}

// Keep two stable layers so a new source never replaces a visible image.
export function CrossfadeImage({ src, alt, fit = 'cover' }: CrossfadeImageProps) {
  const [frame, setFrame] = useState({
    layers: [{ src, alt }, { src: '', alt: '' }],
    active: 0,
    transitioning: false,
  });

  useEffect(() => {
    if (frame.transitioning || frame.layers[frame.active].src === src) return;
    let cancelled = false;
    const image = new Image();
    image.src = src;
    // Decode before fading: on slow connections the previous photo stays visible.
    image.decode().then(() => {
      if (cancelled) return;
      setFrame(previous => {
        const active = 1 - previous.active;
        const layers = [...previous.layers];
        layers[active] = { src, alt };
        return { layers, active, transitioning: true };
      });
    }).catch(() => { /* Keep the last good photo if this one cannot load. */ });
    return () => { cancelled = true; };
  }, [src, alt, frame]);

  useEffect(() => {
    if (!frame.transitioning) return;
    // Finish the current fade before processing the latest rapid navigation.
    const timer = window.setTimeout(() => {
      setFrame(previous => ({ ...previous, transitioning: false }));
    }, 650);
    return () => window.clearTimeout(timer);
  }, [frame.transitioning]);

  return (
    <span className="crossfade-image">
      {frame.layers.map((layer, index) => (
        <img
          key={index}
          src={layer.src || undefined}
          alt={index === frame.active ? layer.alt : ''}
          aria-hidden={index !== frame.active}
          loading="lazy"
          decoding="async"
          draggable={false}
          className={index === frame.active ? 'is-active' : ''}
          style={{ objectFit: fit, visibility: layer.src ? undefined : 'hidden' }}
        />
      ))}
    </span>
  );
}
