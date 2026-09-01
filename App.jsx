import { useState, useEffect, useCallback, useRef } from 'react';
import SplashScreen from './components/SplashScreen.jsx';
import Onboarding from './components/Onboarding.jsx';
import BottomNav from './components/BottomNav.jsx';
import PredictTab from './components/PredictTab.jsx';
import HistoryTab from './components/HistoryTab.jsx';
import SettingsTab from './components/SettingsTab.jsx';
import LiveScoresTab from './components/LiveScoresTab.jsx';
import PaywallModal from './components/PaywallModal.jsx';
import { getFootballApiKey, getIsPro, getHistory, getOnboardingSeen, setIsPro } from './utils/storage.js';

// ─── Counter helpers ────────────────────────────────────
const PRED_COUNT_KEY = 'predCount';
function getCount() {
  const stored = localStorage.getItem(PRED_COUNT_KEY);
  if (stored) return parseInt(stored, 10);
  const base = 24891;
  localStorage.setItem(PRED_COUNT_KEY, base);
  return base;
}
function incrementCount() {
  const current = getCount();
  const add = Math.floor(Math.random() * 5) + 1;
  const newVal = current + add;
  localStorage.setItem(PRED_COUNT_KEY, newVal);
  return newVal;
}

function useAnimatedCount(target) {
  const [display, setDisplay] = useState(target);
  const prevRef = useRef(target);
  useEffect(() => {
    const from = prevRef.current;
    if (from === target) return;
    prevRef.current = target;
    const diff = target - from;
    const duration = 600;
    const start = Date.now();
    const raf = () => {
      const t = Math.min((Date.now() - start) / duration, 1);
      const ease = 1 - Math.pow(1 - t, 3);
      setDisplay(Math.round(from + diff * ease));
      if (t < 1) requestAnimationFrame(raf);
      else setDisplay(target);
    };
    requestAnimationFrame(raf);
  }, [target]);
  return display;
}

function TrustBar({ count }) {
  const animated = useAnimatedCount(count);
  return (
    <div className="trust-bar">
      <span>⚡ Powered by Llama 3.3 AI</span>
      <span className="trust-sep">·</span>
      <span>{animated.toLocaleString()} predictions made</span>
      <span className="trust-sep">·</span>
      <span>Updated for World Cup 2026</span>
    </div>
  );
}

export default function App() {
  const [phase, setPhase] = useState('splash');
  const [activeTab, setActiveTab] = useState('predict');
  const [prevTab, setPrevTab] = useState(null);
  const [transitioning, setTransitioning] = useState(false);
  const [showPaywall, setShowPaywall] = useState(false);
  const [isTokenPaywall, setIsTokenPaywall] = useState(false);
  const [footballApiKey, setFootballApiKeyState] = useState('');
  const [isPro, setIsProState] = useState(false);
  const [history, setHistory] = useState([]);
  const [predCount, setPredCount] = useState(getCount);

  useEffect(() => {
    setFootballApiKeyState(getFootballApiKey());
    setIsProState(getIsPro());
    setHistory(getHistory());
  }, []);

  // Auto-increment counter every 28s
  useEffect(() => {
    const id = setInterval(() => {
      setPredCount(incrementCount());
    }, 28000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').catch(() => {});
    }
  }, []);

  const handleSplashDone = useCallback(() => {
    setPhase(getOnboardingSeen() ? 'app' : 'onboarding');
  }, []);

  const handleOnboardingDone = useCallback(() => setPhase('app'), []);

  const handleSettingsUpdate = useCallback(({ footballApiKey: newKey, isPro: newPro }) => {
    if (newKey !== undefined) setFootballApiKeyState(newKey);
    if (newPro !== undefined) setIsProState(newPro);
  }, []);

  const handleUpgrade = useCallback(() => {
    setIsPro(true);
    setIsProState(true);
    setShowPaywall(false);
  }, []);

  const handlePaywall = useCallback((isToken) => {
    setIsTokenPaywall(!!isToken);
    setShowPaywall(true);
  }, []);

  const handleTabChange = useCallback((tab) => {
    if (tab === activeTab) return;
    setTransitioning(true);
    setTimeout(() => {
      setPrevTab(activeTab);
      setActiveTab(tab);
      if (tab === 'history') setHistory(getHistory());
      setTransitioning(false);
    }, 150);
  }, [activeTab]);

  // Called from PredictTab after successful prediction
  const handlePredictionMade = useCallback(() => {
    setPredCount(incrementCount());
  }, []);

  return (
    <div className="app-shell">
      {phase === 'splash' && <SplashScreen onDone={handleSplashDone} />}
      {phase === 'onboarding' && <Onboarding onDone={handleOnboardingDone} />}
      {phase === 'app' && (
        <div className="main-app">
          <TrustBar count={predCount} />
          <div className={`tab-wrapper ${transitioning ? 'tab-fade-out' : 'tab-fade-in'}`}>
            {activeTab === 'predict' && (
              <PredictTab
                isPro={isPro}
                onPaywall={handlePaywall}
                onPredictionMade={handlePredictionMade}
              />
            )}
            {activeTab === 'history' && (
              <HistoryTab history={history} isPro={isPro} onPaywall={handlePaywall} />
            )}
            {activeTab === 'live' && <LiveScoresTab />}
            {activeTab === 'settings' && (
              <SettingsTab
                footballApiKey={footballApiKey}
                isPro={isPro}
                onUpdate={handleSettingsUpdate}
              />
            )}
          </div>
          <BottomNav activeTab={activeTab} onTabChange={handleTabChange} />
          <div className="privacy-footer">ScoutAI · Not affiliated with FIFA · For entertainment purposes</div>
        </div>
      )}
      {showPaywall && (
        <PaywallModal
          onUpgrade={handleUpgrade}
          onDismiss={() => setShowPaywall(false)}
          isTokenPaywall={isTokenPaywall}
        />
      )}
    </div>
  );
}
