import { useState, useEffect } from 'react';

const FEATURES = [
  'Unlimited AI predictions',
  'Tactical breakdown analysis',
  'Key player matchup reports',
  'Form guide per match',
  'Advanced form & fitness context',
  'Priority processing',
];

export default function PaywallModal({ onUpgrade, onDismiss, isTokenPaywall }) {
  const [timeLeft, setTimeLeft] = useState(600);

  useEffect(() => {
    const id = setInterval(() => setTimeLeft((t) => Math.max(0, t - 1)), 1000);
    return () => clearInterval(id);
  }, []);

  const mins = String(Math.floor(timeLeft / 60)).padStart(2, '0');
  const secs = String(timeLeft % 60).padStart(2, '0');

  return (
    <div className="paywall-overlay" onClick={(e) => e.target === e.currentTarget && onDismiss()}>
      <div className="paywall-sheet">
        <div className="paywall-handle" />
        <div className="paywall-header">
          <div className="paywall-icon">🏆</div>
          <div className="paywall-title">
            {isTokenPaywall ? 'ENJOYED IT?' : 'UNLOCK PRO'}
          </div>
          <div className="paywall-sub">
            {isTokenPaywall
              ? 'Your free prediction is used. Upgrade to keep predicting unlimited.'
              : 'Get unlimited predictions and professional-grade analysis.'}
          </div>
        </div>

        <ul className="paywall-features">
          {FEATURES.map((f) => (
            <li key={f} className="paywall-feature">
              <div className="paywall-feature-check">✓</div>
              {f}
            </li>
          ))}
        </ul>

        <div className="paywall-pricing">
          <div className="paywall-price-old">₹299/month</div>
          <div className="paywall-price-new">₹150/month</div>
          <div className="paywall-discount">50% LAUNCH DISCOUNT</div>
          <div className="paywall-timer">
            Offer expires in <span className="timer-value">{mins}:{secs}</span>
          </div>
          <div className="paywall-social">143 fans upgraded in the last 24 hours</div>
        </div>

        <button className="paywall-cta" onClick={onUpgrade}>
          UPGRADE TO PRO
        </button>
        <button className="paywall-dismiss" onClick={onDismiss}>
          Maybe later
        </button>
      </div>
    </div>
  );
}
