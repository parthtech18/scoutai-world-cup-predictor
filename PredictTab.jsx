import { useState } from 'react';
import ResultCard, { getFlag } from './ResultCard.jsx';
import { getPrediction } from '../utils/api.js';
import {
  getDailyCount, getFreeLimit, incrementDailyCount,
  addToHistory, hasUsedToken, useToken,
} from '../utils/storage.js';

const TEAMS = [
  'Argentina','Australia','Belgium','Brazil','Cameroon','Canada',
  'Costa Rica','Croatia','Denmark','Ecuador','Egypt','England',
  'France','Germany','Ghana','Iran','Italy','Japan',
  'Mexico','Morocco','Netherlands','Nigeria','Poland','Portugal',
  'Qatar','Saudi Arabia','Senegal','Serbia','South Korea','Spain',
  'Switzerland','Tunisia','Uruguay','USA','Wales',
];

const STAGES = [
  'Group Stage','Round of 16','Quarter-Final','Semi-Final','3rd Place Play-off','Final',
];

const CONDITIONS = [
  'Neutral','Hot & Humid','High Altitude','Indoor/Cool','Evening','Rain',
];

const LOADING_STEPS = [
  '🔍 Scanning squad depth and key players...',
  '📊 Analysing head-to-head record...',
  '📈 Calculating current form index...',
  '🧠 Processing tactical matchup data...',
  '⚽ Generating prediction...',
];

export default function PredictTab({ isPro, onPaywall, onPredictionMade }) {
  const [teamA, setTeamA] = useState('Brazil');
  const [teamB, setTeamB] = useState('Germany');
  const [stage, setStage] = useState('Group Stage');
  const [conditions, setConditions] = useState('Neutral');
  const [loading, setLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState(0);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');

  const tokenUsed = hasUsedToken();
  const effectivePro = isPro || !tokenUsed;
  const dailyCount = getDailyCount();
  const freeLimit = getFreeLimit();
  const usageRatio = isPro ? 0 : dailyCount / freeLimit;
  const usageFillClass = usageRatio >= 1 ? 'full' : usageRatio >= 0.66 ? 'warn' : '';

  const handlePredict = async () => {
    setError('');
    if (tokenUsed && !isPro) { onPaywall(false); return; }
    if (teamA === teamB) { setError('Please select two different teams.'); return; }

    setLoading(true);
    setResult(null);

    let step = 0;
    setLoadingStep(0);
    setLoadingProgress(0);
    const stepInterval = setInterval(() => {
      step = Math.min(step + 1, LOADING_STEPS.length - 1);
      setLoadingStep(step);
    }, 800);
    const startTime = Date.now();
    const progInterval = setInterval(() => {
      setLoadingProgress(Math.min(((Date.now() - startTime) / (LOADING_STEPS.length * 800)) * 90, 90));
    }, 50);

    try {
      const prediction = await getPrediction({ teamA, teamB, stage, conditions });
      clearInterval(stepInterval);
      clearInterval(progInterval);
      setLoadingProgress(100);
      setTimeout(() => setLoadingProgress(0), 300);
      if (!isPro) incrementDailyCount();
      addToHistory(prediction);
      onPredictionMade();
      setResult(prediction);
      if (!tokenUsed) {
        useToken();
        setTimeout(() => onPaywall(true), 1400);
      }
    } catch (err) {
      clearInterval(stepInterval);
      clearInterval(progInterval);
      setError('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="tab-content">
      <div className="page-header">
        <div className="page-title">PREDICT</div>
        <div className="page-subtitle">World Cup 2026 match predictions</div>
      </div>

      <div className="predict-tab">
        {!tokenUsed && !isPro && (
          <div className="token-banner">
            <div className="token-banner-icon">🎁</div>
            <div>
              <div className="token-banner-title">1 FREE Pro prediction unlocked — all features included</div>
              <div className="token-banner-desc">Tactical breakdown, form analysis and more.</div>
            </div>
          </div>
        )}

        {!isPro && tokenUsed && (
          <div className="usage-bar-wrap">
            <div className="usage-bar-header">
              <span className="usage-label">Daily predictions used</span>
              <span className="usage-count">{dailyCount}/{freeLimit}</span>
            </div>
            <div className="usage-track">
              <div className={`usage-fill ${usageFillClass}`} style={{ width: `${Math.min(usageRatio * 100, 100)}%` }} />
            </div>
          </div>
        )}

        {/* Match Banner */}
        <MatchBanner teamA={teamA} teamB={teamB} stage={stage} conditions={conditions} />

        {/* Team selectors */}
        <div className="team-selector-row">
          <TeamSelect label="HOME" value={teamA} onChange={setTeamA} exclude={teamB} />
          <TeamSelect label="AWAY" value={teamB} onChange={setTeamB} exclude={teamA} />
        </div>

        {/* Stage + Conditions */}
        <div className="card card-section">
          <div className="conditions-row">
            <div className="form-group">
              <label>Stage</label>
              <div className="select-wrap">
                <select value={stage} onChange={(e) => setStage(e.target.value)}>
                  {STAGES.map((s) => <option key={s}>{s}</option>)}
                </select>
              </div>
            </div>
            <div className="form-group">
              <label>Conditions</label>
              <div className="select-wrap">
                <select value={conditions} onChange={(e) => setConditions(e.target.value)}>
                  {CONDITIONS.map((c) => <option key={c}>{c}</option>)}
                </select>
              </div>
            </div>
          </div>
        </div>

        {error && (
          <div className="error-banner">
            <span className="error-banner-icon">⚠️</span>
            <span className="error-banner-text">{error}</span>
          </div>
        )}

        <button
          className={`predict-cta ${loading ? 'loading' : ''}`}
          onClick={handlePredict}
          disabled={loading}
        >
          {loading ? (
            <div className="loading-dots">
              <div className="loading-dot" />
              <div className="loading-dot" />
              <div className="loading-dot" />
            </div>
          ) : 'GENERATE PREDICTION'}
        </button>

        {loading && (
          <div className="loading-card">
            <div className="loading-card-step">{LOADING_STEPS[loadingStep]}</div>
            <div className="loading-progress-track">
              <div className="loading-progress-bar" style={{ width: `${loadingProgress}%` }} />
            </div>
          </div>
        )}

        {!loading && !result && <EmptyStatePlaceholder />}
        {result && <ResultCard result={result} isPro={effectivePro} />}
      </div>
    </div>
  );
}

function MatchBanner({ teamA, teamB, stage, conditions }) {
  return (
    <div className="match-banner">
      <div className="match-banner-teams">
        <div className="match-banner-team home">
          <span className="match-banner-flag">{getFlag(teamA)}</span>
          <span className="match-banner-name">{teamA.toUpperCase()}</span>
        </div>
        <div className="match-banner-vs-wrap">
          <span className="match-banner-vs">VS</span>
        </div>
        <div className="match-banner-team away">
          <span className="match-banner-name">{teamB.toUpperCase()}</span>
          <span className="match-banner-flag">{getFlag(teamB)}</span>
        </div>
      </div>
      <div className="match-banner-meta">
        {stage.toUpperCase()} · {conditions.toUpperCase()}
      </div>
    </div>
  );
}

function EmptyStatePlaceholder() {
  return (
    <div className="empty-predict-placeholder">
      <div className="empty-predict-icon">⚽</div>
      <div className="empty-predict-title">Select two teams and generate a prediction</div>
      <div className="empty-predict-claim">"Accurate for 68% of World Cup matches"</div>
    </div>
  );
}

function TeamSelect({ label, value, onChange, exclude }) {
  return (
    <div className="team-select-wrap">
      <label>{label}</label>
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
        <span style={{ fontSize: '22px', lineHeight: 1 }}>{getFlag(value)}</span>
        <div className="select-wrap" style={{ flex: 1 }}>
          <select value={value} onChange={(e) => onChange(e.target.value)}>
            {TEAMS.filter((t) => t !== exclude).map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
}
