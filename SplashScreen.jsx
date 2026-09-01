import { useState, useEffect } from 'react';

export default function SplashScreen({ onDone }) {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const start = Date.now();
    const duration = 1800;
    const raf = () => {
      const pct = Math.min((Date.now() - start) / duration * 100, 100);
      setProgress(pct);
      if (pct < 100) requestAnimationFrame(raf);
      else setTimeout(onDone, 100);
    };
    requestAnimationFrame(raf);
  }, [onDone]);

  return (
    <div className="splash">
      <div className="splash-logo">
        <div className="splash-ball">⚽</div>
        <div className="splash-title">SCOUTAI</div>
        <div className="splash-subtitle">World Cup Predictor</div>
      </div>
      <div className="splash-tagline">AI-powered match predictions</div>
      <div className="splash-progress-wrap">
        <div className="splash-progress-bar" style={{ width: `${progress}%` }} />
      </div>
    </div>
  );
}
