import { useState, useEffect, useRef, useCallback } from 'react';
import { getFlag } from './ResultCard.jsx';

const WC_START = new Date('2026-06-11T18:00:00Z');

async function fetchLiveScores() {
  try {
    const res = await fetch(
      'https://site.api.espn.com/apis/site/v2/sports/soccer/fifa.world/scoreboard'
    );
    const data = await res.json();
    return data.events || [];
  } catch (err) {
    console.error('Scores error:', err);
    return [];
  }
}

function parseEvent(event) {
  const comp = event.competitions?.[0];
  if (!comp) return null;
  const home = comp.competitors?.find((c) => c.homeAway === 'home');
  const away = comp.competitors?.find((c) => c.homeAway === 'away');
  if (!home || !away) return null;
  return {
    id: event.id,
    name: event.name,
    date: event.date,
    status: event.status?.type?.name,
    minute: event.status?.displayClock,
    home: { name: home.team?.displayName, abbr: home.team?.abbreviation, score: home.score },
    away: { name: away.team?.displayName, abbr: away.team?.abbreviation, score: away.score },
  };
}

function useCountdown(target) {
  const [diff, setDiff] = useState(() => Math.max(0, target - Date.now()));
  useEffect(() => {
    const id = setInterval(() => setDiff(Math.max(0, target - Date.now())), 1000);
    return () => clearInterval(id);
  }, [target]);
  const total = Math.floor(diff / 1000);
  return {
    days: Math.floor(total / 86400),
    hours: Math.floor((total % 86400) / 3600),
    mins: Math.floor((total % 3600) / 60),
    secs: total % 60,
  };
}

function useSecondsTicker() {
  const [secs, setSecs] = useState(0);
  const startRef = useRef(Date.now());
  useEffect(() => {
    const id = setInterval(() => setSecs(Math.floor((Date.now() - startRef.current) / 1000)), 1000);
    return () => clearInterval(id);
  }, []);
  const reset = useCallback(() => { startRef.current = Date.now(); setSecs(0); }, []);
  return [secs, reset];
}

export default function LiveScoresTab() {
  const [events, setEvents] = useState(null);
  const [fetching, setFetching] = useState(false);
  const [secsSince, resetSecs] = useSecondsTicker();

  const load = useCallback(async () => {
    setFetching(true);
    const raw = await fetchLiveScores();
    const parsed = raw.map(parseEvent).filter(Boolean);
    setEvents(parsed);
    resetSecs();
    setFetching(false);
  }, [resetSecs]);

  useEffect(() => {
    load();
    const id = setInterval(load, 60000);
    return () => clearInterval(id);
  }, [load]);

  const live = events?.filter((e) => e.status === 'STATUS_IN_PROGRESS') ?? [];
  const upcoming = events?.filter((e) => e.status === 'STATUS_SCHEDULED') ?? [];
  const finished = events?.filter((e) => e.status === 'STATUS_FINAL') ?? [];
  const hasMatches = (events?.length ?? 0) > 0;

  return (
    <div className="tab-content">
      <div className="page-header">
        <div className="page-title">LIVE SCORES</div>
        <div className="page-subtitle">ESPN · World Cup 2026</div>
      </div>

      <div className="live-scores-container">
        {events === null && (
          <div className="scores-loading">
            <div className="scores-spinner" />
            <span>Fetching scores...</span>
          </div>
        )}

        {events !== null && !hasMatches && <EmptyState />}

        {hasMatches && (
          <>
            {live.length > 0 && (
              <section className="scores-section">
                <div className="scores-section-label live-label-scores">
                  <span className="live-dot-pulse" /> LIVE NOW
                </div>
                {live.map((e) => <LiveCard key={e.id} event={e} />)}
              </section>
            )}
            {upcoming.length > 0 && (
              <section className="scores-section">
                <div className="scores-section-label">UPCOMING</div>
                {upcoming.map((e) => <UpcomingCard key={e.id} event={e} />)}
              </section>
            )}
            {finished.length > 0 && (
              <section className="scores-section">
                <div className="scores-section-label">FINISHED</div>
                {finished.map((e) => <FinishedCard key={e.id} event={e} />)}
              </section>
            )}
          </>
        )}

        {events !== null && (
          <div className="scores-footer">
            {fetching ? 'Refreshing...' : `Last updated: ${secsSince === 0 ? 'just now' : `${secsSince}s ago`}`}
          </div>
        )}
      </div>
    </div>
  );
}

function LiveCard({ event }) {
  return (
    <div className="score-card score-card--live">
      <div className="score-card-badge score-card-badge--live">
        <span className="badge-dot" /> LIVE
      </div>
      <div className="score-card-row">
        <div className="score-card-team">
          <span className="score-card-flag">{getFlag(event.home.name)}</span>
          <span className="score-card-team-name">{event.home.abbr || event.home.name}</span>
        </div>
        <div className="score-card-center">
          <div className="score-card-score">
            <span className="score-num">{event.home.score ?? '0'}</span>
            <span className="score-dash">—</span>
            <span className="score-num">{event.away.score ?? '0'}</span>
          </div>
          {event.minute && <div className="score-card-minute">{event.minute}</div>}
        </div>
        <div className="score-card-team score-card-team--right">
          <span className="score-card-team-name">{event.away.abbr || event.away.name}</span>
          <span className="score-card-flag">{getFlag(event.away.name)}</span>
        </div>
      </div>
    </div>
  );
}

function UpcomingCard({ event }) {
  const kickoff = new Date(event.date);
  const now = new Date();
  const isToday = kickoff.toDateString() === now.toDateString();
  const timeStr = kickoff.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  const dateLabel = isToday
    ? `Today · ${timeStr}`
    : `${kickoff.toLocaleDateString([], { month: 'short', day: 'numeric' })} · ${timeStr}`;

  return (
    <div className="score-card score-card--upcoming">
      <div className="score-card-badge score-card-badge--upcoming">UPCOMING</div>
      <div className="score-card-row">
        <div className="score-card-team">
          <span className="score-card-flag">{getFlag(event.home.name)}</span>
          <span className="score-card-team-name">{event.home.abbr || event.home.name}</span>
        </div>
        <div className="score-card-center">
          <div className="score-card-vs">VS</div>
          <div className="score-card-kickoff">{dateLabel}</div>
        </div>
        <div className="score-card-team score-card-team--right">
          <span className="score-card-team-name">{event.away.abbr || event.away.name}</span>
          <span className="score-card-flag">{getFlag(event.away.name)}</span>
        </div>
      </div>
    </div>
  );
}

function FinishedCard({ event }) {
  return (
    <div className="score-card score-card--finished">
      <div className="score-card-badge score-card-badge--finished">FT</div>
      <div className="score-card-row">
        <div className="score-card-team">
          <span className="score-card-flag score-card-flag--dim">{getFlag(event.home.name)}</span>
          <span className="score-card-team-name score-card-team-name--dim">{event.home.abbr || event.home.name}</span>
        </div>
        <div className="score-card-center">
          <div className="score-card-score score-card-score--ft">
            <span className="score-num score-num--dim">{event.home.score ?? '0'}</span>
            <span className="score-dash score-dash--dim">—</span>
            <span className="score-num score-num--dim">{event.away.score ?? '0'}</span>
          </div>
        </div>
        <div className="score-card-team score-card-team--right">
          <span className="score-card-team-name score-card-team-name--dim">{event.away.abbr || event.away.name}</span>
          <span className="score-card-flag score-card-flag--dim">{getFlag(event.away.name)}</span>
        </div>
      </div>
    </div>
  );
}

function EmptyState() {
  const { days, hours, mins, secs } = useCountdown(WC_START.getTime());
  return (
    <div className="scores-empty">
      <div className="countdown-card">
        <div className="countdown-header">
          <span className="countdown-ball">⚽</span>
          <span className="countdown-title">World Cup 2026 Kicks Off In</span>
        </div>
        <div className="countdown-units">
          <CountUnit value={days} label="Days" />
          <CountUnit value={hours} label="Hours" />
          <CountUnit value={mins} label="Mins" />
          <CountUnit value={secs} label="Secs" />
        </div>
        <div className="countdown-sub">Countdown to June 11, 2026 · 18:00 UTC</div>
        <div className="countdown-hosts">USA · Canada · Mexico</div>
        <div className="countdown-note">
          Live scores will appear here automatically once the tournament begins
        </div>
      </div>

      <div className="fixtures-card">
        <div className="fixtures-header">TOURNAMENT SCHEDULE</div>
        <div className="fixtures-opening">
          <div className="fixtures-opening-label">OPENING MATCH · GROUP STAGE</div>
          <div className="fixtures-opening-detail">June 11 · SoFi Stadium, Los Angeles</div>
        </div>
        <div className="fixtures-list">
          {[
            { label: 'Group Stage',    dates: 'Jun 11 – Jun 27' },
            { label: 'Round of 16',    dates: 'Jun 29 – Jul 4' },
            { label: 'Quarter-Finals', dates: 'Jul 5 – Jul 9' },
            { label: 'Semi-Finals',    dates: 'Jul 14 – Jul 15' },
            { label: 'Final',          dates: 'Jul 19 · MetLife Stadium, New York', highlight: true },
          ].map((r) => (
            <div key={r.label} className={`fixtures-row ${r.highlight ? 'fixtures-row--final' : ''}`}>
              <span className="fixtures-stage">{r.label}</span>
              <span className="fixtures-dates">{r.dates}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function CountUnit({ value, label }) {
  return (
    <div className="count-unit">
      <div className="count-box">{String(value).padStart(2, '0')}</div>
      <div className="count-label">{label}</div>
    </div>
  );
}
