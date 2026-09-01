import { useState } from 'react';
import { getFlag } from './ResultCard.jsx';

export default function HistoryTab({ history, isPro, onPaywall }) {
  const [search, setSearch] = useState('');
  const [expanded, setExpanded] = useState(null);

  const filtered = history.filter((h) => {
    const q = search.toLowerCase();
    return !q || h.teamA?.toLowerCase().includes(q) || h.teamB?.toLowerCase().includes(q);
  });

  const handleExport = () => {
    const csv = [
      'Date,Home,Away,Score,Winner,Home Win%,Draw%,Away Win%,Confidence',
      ...history.map((h) =>
        [
          new Date(h.savedAt).toLocaleDateString(),
          h.teamA, h.teamB, h.predictedScore, h.winner,
          h.homeWin, h.draw, h.awayWin, h.confidence,
        ].join(',')
      ),
    ].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'scoutai-predictions.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="tab-content">
      <div className="page-header">
        <div className="page-title">HISTORY</div>
        <div className="page-subtitle">{history.length} prediction{history.length !== 1 ? 's' : ''} saved</div>
      </div>

      <div className="history-tab">
        {history.length > 0 && (
          <div className="history-toolbar">
            <div className="search-wrap">
              <svg viewBox="0 0 24 24" strokeWidth="2"><circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" /></svg>
              <input className="search-input" type="text" placeholder="Search teams..." value={search} onChange={(e) => setSearch(e.target.value)} />
            </div>
            <button className="export-btn" onClick={handleExport}>Export CSV</button>
          </div>
        )}

        {filtered.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">📋</div>
            <div className="empty-title">NO PREDICTIONS YET</div>
            <div className="empty-desc">Your prediction history will appear here after you generate your first match prediction.</div>
          </div>
        ) : (
          <div className="history-list">
            {filtered.map((h, i) => (
              <HistoryCard
                key={i}
                prediction={h}
                isExpanded={expanded === i}
                onToggle={() => setExpanded(expanded === i ? null : i)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function HistoryCard({ prediction: h, isExpanded, onToggle }) {
  const date = h.savedAt ? new Date(h.savedAt).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' }) : '';
  return (
    <div className="history-card">
      <div className="history-card-header" onClick={onToggle}>
        <div className="history-matchup">
          <div className="history-teams">
            {getFlag(h.teamA)} {h.teamA} vs {h.teamB} {getFlag(h.teamB)}
          </div>
          <div className="history-meta">{h.stage} · {date}</div>
        </div>
        <div className="history-score">{h.predictedScore}</div>
        <svg className={`history-chevron ${isExpanded ? 'open' : ''}`} viewBox="0 0 24 24" strokeWidth="2"><path d="m6 9 6 6 6-6" /></svg>
      </div>
      <div className={`history-expanded ${isExpanded ? '' : 'hidden'}`}>
        <div className="history-prob-row">
          {[
            { val: h.homeWin, lbl: h.teamA },
            { val: h.draw, lbl: 'Draw' },
            { val: h.awayWin, lbl: h.teamB },
          ].map(({ val, lbl }) => (
            <div key={lbl} className="history-prob-item">
              <div className="history-prob-val">{val}%</div>
              <div className="history-prob-lbl">{lbl}</div>
            </div>
          ))}
        </div>
        {h.summary && <div className="history-summary">{h.summary}</div>}
      </div>
    </div>
  );
}
