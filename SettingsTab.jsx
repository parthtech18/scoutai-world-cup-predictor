import { useState } from 'react';
import {
  getGroqApiKey, setGroqApiKey,
  getFootballApiKey, setFootballApiKey,
  getIsPro, setIsPro, clearHistory,
} from '../utils/storage.js';

export default function SettingsTab({ footballApiKey, isPro, onUpdate }) {
  const [groqKeyInput, setGroqKeyInput] = useState(getGroqApiKey);
  const [groqSaved, setGroqSaved] = useState(false);
  const [apiKeyInput, setApiKeyInput] = useState(footballApiKey);
  const [saved, setSaved] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const handleSaveGroqKey = () => {
    setGroqApiKey(groqKeyInput.trim());
    setGroqSaved(true);
    setTimeout(() => setGroqSaved(false), 2000);
  };

  const handleSaveKey = () => {
    setFootballApiKey(apiKeyInput);
    onUpdate({ footballApiKey: apiKeyInput });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleTogglePro = () => {
    const next = !isPro;
    setIsPro(next);
    onUpdate({ isPro: next });
  };

  const handleClearHistory = () => {
    clearHistory();
    setShowConfirm(false);
  };

  return (
    <div className="tab-content">
      <div className="page-header">
        <div className="page-title">SETTINGS</div>
        <div className="page-subtitle">App configuration</div>
      </div>

      <div className="settings-tab">
        <div className="settings-section">
          <div className="settings-section-title">Subscription</div>
          <div className="plan-cards">
            <div className={`plan-card ${!isPro ? 'active' : ''}`}>
              <div className="plan-card-name">FREE</div>
              <div className="plan-card-price">$0</div>
              <ul className="plan-card-features">
                <li>3 predictions/day</li>
                <li>Basic analysis</li>
                <li>Match history</li>
              </ul>
              {!isPro && <div className="plan-active-badge">ACTIVE</div>}
            </div>
            <div className={`plan-card pro-card ${isPro ? 'active' : ''}`}>
              <div className="plan-card-discount">BEST VALUE</div>
              <div className="plan-card-name">PRO</div>
              <div className="plan-card-price">$4.99</div>
              <ul className="plan-card-features">
                <li>Unlimited predictions</li>
                <li>Tactical breakdown</li>
                <li>Injury inputs</li>
                <li>Form analysis</li>
              </ul>
              {isPro && <div className="plan-active-badge">ACTIVE</div>}
            </div>
          </div>
          <button className="upgrade-btn" onClick={handleTogglePro}>
            {isPro ? 'DOWNGRADE TO FREE' : 'UPGRADE TO PRO'}
          </button>
        </div>

        <div className="settings-section">
          <div className="settings-section-title">Groq API Key</div>
          <div className="settings-row">
            <div className="settings-row-label">API Key</div>
            <div className="settings-row-desc">
              Required for real AI predictions. Get yours free at{' '}
              <a href="https://console.groq.com" target="_blank" rel="noreferrer" style={{color:'#00e676'}}>
                console.groq.com
              </a>
            </div>
            <div className="api-key-row">
              <input
                type="password"
                placeholder="gsk_..."
                value={groqKeyInput}
                onChange={(e) => setGroqKeyInput(e.target.value)}
              />
              <button className="save-btn" onClick={handleSaveGroqKey}>
                {groqSaved ? '✓ Saved' : 'Save'}
              </button>
            </div>
            {!groqKeyInput && (
              <div className="settings-row-desc" style={{color:'#ffc107',marginTop:'6px'}}>
                ⚠ No key set — app is using smart mock predictions
              </div>
            )}
            {groqKeyInput && (
              <div className="settings-row-desc" style={{color:'#00e676',marginTop:'6px'}}>
                ✓ Key saved — real AI predictions active
              </div>
            )}
          </div>
        </div>

        <div className="settings-section">
          <div className="settings-section-title">Football Data API</div>
          <div className="settings-row">
            <div className="settings-row-label">API Key</div>
            <div className="settings-row-desc">Optional: for live scores. Get free key at football-data.org</div>
            <div className="api-key-row">
              <input
                type="password"
                placeholder="Enter API key..."
                value={apiKeyInput}
                onChange={(e) => setApiKeyInput(e.target.value)}
              />
              <button className="save-btn" onClick={handleSaveKey}>
                {saved ? '✓ Saved' : 'Save'}
              </button>
            </div>
          </div>
        </div>

        <div className="settings-section">
          <div className="settings-section-title">Data</div>
          <div className="settings-row">
            <div className="settings-row-inline">
              <div>
                <div className="settings-row-label">Prediction History</div>
                <div className="settings-row-desc">Delete all saved predictions</div>
              </div>
            </div>
          </div>
          <button className="danger-btn" onClick={() => setShowConfirm(true)}>
            Clear History
          </button>
        </div>

        <div className="settings-section">
          <div className="app-info">
            <div className="app-info-row">
              <span className="app-info-key">Version</span>
              <span className="app-info-val">1.0.0</span>
            </div>
            <div className="app-info-row">
              <span className="app-info-key">AI Model</span>
              <span className="app-info-val">DeepSeek R1</span>
            </div>
            <div className="app-info-row">
              <span className="app-info-key">Tournament</span>
              <span className="app-info-val">FIFA World Cup 2026</span>
            </div>
          </div>
        </div>
      </div>

      {showConfirm && (
        <div className="confirm-overlay">
          <div className="confirm-dialog">
            <div className="confirm-body">
              <div className="confirm-title">Clear History?</div>
              <div className="confirm-desc">This will permanently delete all your saved predictions. This action cannot be undone.</div>
            </div>
            <div className="confirm-actions">
              <button className="confirm-cancel" onClick={() => setShowConfirm(false)}>Cancel</button>
              <button className="confirm-ok" onClick={handleClearHistory}>Delete All</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
