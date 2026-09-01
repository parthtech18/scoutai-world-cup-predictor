import { useRef, useEffect, useState } from 'react';

const FLAGS = {
  'Brazil':'🇧🇷','Germany':'🇩🇪','France':'🇫🇷','Spain':'🇪🇸',
  'Argentina':'🇦🇷','England':'🏴󠁧󠁢󠁥󠁮󠁧󠁿','Netherlands':'🇳🇱','Portugal':'🇵🇹',
  'Italy':'🇮🇹','Belgium':'🇧🇪','Croatia':'🇭🇷','Uruguay':'🇺🇾',
  'Mexico':'🇲🇽','USA':'🇺🇸','Japan':'🇯🇵','South Korea':'🇰🇷',
  'Australia':'🇦🇺','Morocco':'🇲🇦','Senegal':'🇸🇳','Ghana':'🇬🇭',
  'Cameroon':'🇨🇲','Nigeria':'🇳🇬','Egypt':'🇪🇬','Tunisia':'🇹🇳',
  'Saudi Arabia':'🇸🇦','Iran':'🇮🇷','Qatar':'🇶🇦','Poland':'🇵🇱',
  'Switzerland':'🇨🇭','Denmark':'🇩🇰','Serbia':'🇷🇸','Ecuador':'🇪🇨',
  'Canada':'🇨🇦','Wales':'🏴󠁧󠁢󠁷󠁬󠁳󠁿','Costa Rica':'🇨🇷',
};

export function getFlag(team) {
  return FLAGS[team] || '🏳️';
}

const CONF_COLOR = { High: 'var(--primary)', Medium: 'var(--gold)', Low: 'var(--red)' };
const CONF_CLASS = { High: 'high', Medium: 'medium', Low: 'low' };

function useCountUp(target, duration = 1200, delay = 0) {
  const [value, setValue] = useState(0);
  useEffect(() => {
    setValue(0);
    let start = null;
    let raf;
    const step = (ts) => {
      if (!start) start = ts + delay;
      if (ts < start) { raf = requestAnimationFrame(step); return; }
      const elapsed = ts - start;
      const progress = Math.min(elapsed / duration, 1);
      const ease = 1 - Math.pow(1 - progress, 3);
      setValue(Math.round(ease * target));
      if (progress < 1) raf = requestAnimationFrame(step);
      else setValue(target);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [target, duration, delay]);
  return value;
}

function FormPill({ result }) {
  const color = result === 'W' ? 'form-w' : result === 'D' ? 'form-d' : 'form-l';
  return <span className={`form-pill ${color}`}>{result}</span>;
}

function FormGuide({ teamA, teamB, homeForm, awayForm }) {
  return (
    <div className="form-guide">
      <div className="section-label">RECENT FORM</div>
      <div className="form-row">
        <span className="form-team-name">{teamA}</span>
        <div className="form-pills">
          {homeForm.map((r, i) => <FormPill key={i} result={r} />)}
        </div>
      </div>
      <div className="form-row">
        <span className="form-team-name">{teamB}</span>
        <div className="form-pills">
          {awayForm.map((r, i) => <FormPill key={i} result={r} />)}
        </div>
      </div>
    </div>
  );
}

export default function ResultCard({ result, isPro }) {
  const homeBarRef = useRef(null);
  const drawBarRef = useRef(null);
  const awayBarRef = useRef(null);
  const [scoreVisible, setScoreVisible] = useState(false);
  const [winnerVisible, setWinnerVisible] = useState(false);
  const [barsVisible, setBarsVisible] = useState(false);
  const [bodyVisible, setBodyVisible] = useState(false);
  const [shareMsg, setShareMsg] = useState('');
  const [showTooltip, setShowTooltip] = useState(false);

  const homeCount = useCountUp(result.homeWin, 1200, 300);
  const drawCount = useCountUp(result.draw, 1200, 400);
  const awayCount = useCountUp(result.awayWin, 1200, 500);

  useEffect(() => {
    setScoreVisible(false);
    setWinnerVisible(false);
    setBarsVisible(false);
    setBodyVisible(false);
    const t1 = setTimeout(() => setScoreVisible(true), 80);
    const t2 = setTimeout(() => setWinnerVisible(true), 380);
    const t3 = setTimeout(() => {
      setBarsVisible(true);
      if (homeBarRef.current) homeBarRef.current.style.width = `${result.homeWin}%`;
      if (drawBarRef.current) drawBarRef.current.style.width = `${result.draw}%`;
      if (awayBarRef.current) awayBarRef.current.style.width = `${result.awayWin}%`;
    }, 500);
    const t4 = setTimeout(() => setBodyVisible(true), 800);
    return () => [t1, t2, t3, t4].forEach(clearTimeout);
  }, [result]);

  const isHomeWinner = result.winner === result.teamA;
  const isAwayWinner = result.winner === result.teamB;
  const confClass = CONF_CLASS[result.confidence] || 'medium';
  const borderColor = CONF_COLOR[result.confidence] || CONF_COLOR.Medium;

  const handleShare = async () => {
    const text = `${result.teamA} vs ${result.teamB} — ScoutAI predicts: ${result.winner} (${result.predictedScore}) with ${result.confidence} confidence.`;
    if (navigator.share) {
      try { await navigator.share({ title: 'ScoutAI Prediction', text }); } catch (_) {}
    } else {
      try {
        await navigator.clipboard.writeText(text);
        setShareMsg('Copied ✓');
        setTimeout(() => setShareMsg(''), 2500);
      } catch (_) {}
    }
  };

  return (
    <div className="result-card" style={{ borderTop: `3px solid ${borderColor}` }}>
      {/* Header: broadcast-style match graphic */}
      <div className="result-header">
        <div className="result-matchup">
          <div className={`result-team ${isHomeWinner ? 'winner' : ''}`}>
            <div className="result-team-flag">{getFlag(result.teamA)}</div>
            <div className="result-team-name">{result.teamA}</div>
          </div>
          <div className="result-score-block">
            <div className={`result-score ${scoreVisible ? 'score-pop' : 'score-hidden'}`}>
              {result.predictedScore}
            </div>
            <div className="result-score-label">PREDICTED FINAL SCORE</div>
            <div className="result-stage">{result.stage}</div>
          </div>
          <div className={`result-team ${isAwayWinner ? 'winner' : ''}`}>
            <div className="result-team-flag">{getFlag(result.teamB)}</div>
            <div className="result-team-name">{result.teamB}</div>
          </div>
        </div>
        <div
          className={`confidence-tag ${confClass} ${winnerVisible ? 'conf-visible' : 'conf-hidden'}`}
          style={{ position: 'relative', cursor: 'help' }}
          onMouseEnter={() => setShowTooltip(true)}
          onMouseLeave={() => setShowTooltip(false)}
          onTouchStart={() => setShowTooltip(true)}
          onTouchEnd={() => setTimeout(() => setShowTooltip(false), 1800)}
        >
          ● {result.confidence} Confidence
          {showTooltip && (
            <div className="conf-tooltip">
              Confidence is based on data consistency and historical predictability of this matchup
            </div>
          )}
        </div>
      </div>

      <div className={`result-body ${bodyVisible ? 'body-visible' : 'body-hidden'}`}>
        {/* Probabilities */}
        <div className="prob-section">
          <div className="section-label live-label">
            <span className="live-dot-pulse" /> LIVE ANALYSIS
          </div>
          <ProbRow label={result.teamA} displayValue={homeCount} barRef={homeBarRef} barClass="home" highlight={isHomeWinner} />
          <ProbRow label="Draw" displayValue={drawCount} barRef={drawBarRef} barClass="draw" highlight={!isHomeWinner && !isAwayWinner} />
          <ProbRow label={result.teamB} displayValue={awayCount} barRef={awayBarRef} barClass="away" highlight={isAwayWinner} />
        </div>

        {/* Form Guide */}
        {result.homeForm && result.awayForm && (
          <FormGuide
            teamA={result.teamA}
            teamB={result.teamB}
            homeForm={result.homeForm}
            awayForm={result.awayForm}
          />
        )}

        {/* Markets */}
        <div>
          <div className="section-label">MARKETS</div>
          <div className="market-pills">
            <MarketPill label="Both Teams Score" value={result.bothTeamsScore} />
            <MarketPill label="Over 2.5 Goals" value={result.over25Goals} />
          </div>
        </div>

        {/* Analysis */}
        <div>
          <div className="section-label">ANALYSIS</div>
          <p className="analysis-text">{result.summary}</p>
        </div>

        {/* Key Factors */}
        {result.keyFactors?.length > 0 && (
          <div>
            <div className="section-label">KEY FACTORS</div>
            <ul className="key-factors">
              {result.keyFactors.map((f, i) => (
                <li key={i} className="key-factor">
                  <span className="factor-num">{i + 1}</span>
                  <span>{f}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Key Player Duel */}
        {result.keyPlayerMatchup && (
          <div className="player-duel-card">
            <div className="player-duel-header">
              <span className="player-duel-icon">⚔️</span>
              <span className="player-duel-title">KEY MATCHUP</span>
            </div>
            <p className="player-duel-text">{result.keyPlayerMatchup}</p>
          </div>
        )}

        {/* Tactical Breakdown — always shown */}
        {result.tacticalBreakdown && (
          <div className="tactical-section">
            <div className="tactical-header">
              <span className="tactical-icon">🧠</span>
              <div className="tactical-title">TACTICAL BREAKDOWN</div>
            </div>
            <p className="tactical-text">{result.tacticalBreakdown}</p>
          </div>
        )}

        <button className="share-btn" onClick={handleShare}>
          <span>📤</span>
          <span>{shareMsg || 'Share this prediction'}</span>
        </button>
      </div>
    </div>
  );
}

function ProbRow({ label, displayValue, barRef, barClass, highlight }) {
  return (
    <div className="prob-row">
      <div className="prob-label-row">
        <span className="prob-label">{label}</span>
        <span className={`prob-value ${highlight ? 'highlight' : ''}`}>{displayValue}%</span>
      </div>
      <div className="prob-bar-track">
        <div ref={barRef} className={`prob-bar-fill ${barClass}`} style={{ width: '0%' }} />
      </div>
    </div>
  );
}

function MarketPill({ label, value }) {
  return (
    <div className={`market-pill ${value ? 'yes' : 'no'}`}>
      <div className="market-pill-dot" />
      {value ? 'YES' : 'NO'} — {label}
    </div>
  );
}
