import { useState } from 'react';
import { setOnboardingSeen } from '../utils/storage.js';

const SLIDES = [
  {
    icon: '⚽',
    title: 'WORLD CUP 2026',
    desc: 'AI-powered predictions for every match in the biggest tournament on earth.',
    features: ['32 national teams', 'Group stage to final', 'Real-time updates'],
  },
  {
    icon: '🧠',
    title: 'AI ANALYSIS',
    desc: 'Powered by Llama 3.3, our model analyses form, head-to-head records, and tactical data.',
    features: ['Win probability', 'Predicted scoreline', 'Key match factors'],
  },
  {
    icon: '📊',
    title: 'PRO INSIGHTS',
    desc: 'Unlock tactical breakdowns, custom injury inputs, and detailed match context.',
    features: ['Tactical breakdown', 'Injury & suspension inputs', 'Unlimited predictions'],
  },
];

export default function Onboarding({ onDone }) {
  const [slide, setSlide] = useState(0);

  const next = () => {
    if (slide < SLIDES.length - 1) {
      setSlide(slide + 1);
    } else {
      setOnboardingSeen();
      onDone();
    }
  };

  const skip = () => {
    setOnboardingSeen();
    onDone();
  };

  const s = SLIDES[slide];

  return (
    <div className="onboarding">
      <div className="onboarding-header">
        <button className="skip-btn" onClick={skip}>Skip</button>
      </div>
      <div className="slides-container">
        {SLIDES.map((sl, i) => (
          <div key={i} className={`slide ${i === slide ? 'active' : i < slide ? 'prev' : ''}`}>
            <div className="slide-icon">{sl.icon}</div>
            <div className="slide-title">{sl.title}</div>
            <div className="slide-desc">{sl.desc}</div>
            <ul className="slide-features">
              {sl.features.map((f) => <li key={f}>{f}</li>)}
            </ul>
          </div>
        ))}
      </div>
      <div className="onboarding-footer">
        <div className="dots">
          {SLIDES.map((_, i) => (
            <div key={i} className={`dot ${i === slide ? 'active' : ''}`} />
          ))}
        </div>
        <button className="btn-next" onClick={next}>
          {slide < SLIDES.length - 1 ? 'NEXT' : 'GET STARTED'}
        </button>
      </div>
    </div>
  );
}
