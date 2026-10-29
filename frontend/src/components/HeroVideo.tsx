import './HeroVideo.css';

interface HeroVideoProps {
  src?: string;
  type?: string;
}

/**
 * Background video layer for a hero section.
 * Place it as the first child of an element with class "hero-section".
 */
export function HeroVideo({
  src = '/videos/hero.mp4',
  type = 'video/mp4',
}: HeroVideoProps) {
  return (
    <>
      <video
        className="hero-video"
        autoPlay
        muted
        loop
        playsInline
        preload="metadata"
        aria-hidden="true"
      >
        <source src={src} type={type} />
      </video>

      <div className="hero-overlay" aria-hidden="true" />
    </>
  );
}

export default HeroVideo;