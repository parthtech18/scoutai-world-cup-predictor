const STORAGE_KEYS = {
  GROQ_API_KEY: 'scout_groq_api_key',
  FOOTBALL_API_KEY: 'scout_football_api_key',
  IS_PRO: 'scout_is_pro',
  HISTORY: 'scout_history',
  DAILY_COUNT: 'scout_daily_count',
  DAILY_DATE: 'scout_daily_date',
  ONBOARDING_SEEN: 'scout_onboarding_seen',
  TOKEN_USED: 'scout_token_used',
};

const FREE_LIMIT = 3;

export function getGroqApiKey() {
  return localStorage.getItem(STORAGE_KEYS.GROQ_API_KEY) || '';
}
export function setGroqApiKey(key) {
  localStorage.setItem(STORAGE_KEYS.GROQ_API_KEY, key);
}

export function getFootballApiKey() {
  return localStorage.getItem(STORAGE_KEYS.FOOTBALL_API_KEY) || '';
}
export function setFootballApiKey(key) {
  localStorage.setItem(STORAGE_KEYS.FOOTBALL_API_KEY, key);
}

export function getIsPro() {
  return localStorage.getItem(STORAGE_KEYS.IS_PRO) === 'true';
}
export function setIsPro(val) {
  localStorage.setItem(STORAGE_KEYS.IS_PRO, String(val));
}

export function getOnboardingSeen() {
  return localStorage.getItem(STORAGE_KEYS.ONBOARDING_SEEN) === 'true';
}
export function setOnboardingSeen() {
  localStorage.setItem(STORAGE_KEYS.ONBOARDING_SEEN, 'true');
}

export function hasUsedToken() {
  return localStorage.getItem(STORAGE_KEYS.TOKEN_USED) === 'true';
}
export function useToken() {
  localStorage.setItem(STORAGE_KEYS.TOKEN_USED, 'true');
}

export function getFreeLimit() {
  return FREE_LIMIT;
}

export function getDailyCount() {
  const today = new Date().toDateString();
  const storedDate = localStorage.getItem(STORAGE_KEYS.DAILY_DATE);
  if (storedDate !== today) {
    localStorage.setItem(STORAGE_KEYS.DAILY_DATE, today);
    localStorage.setItem(STORAGE_KEYS.DAILY_COUNT, '0');
    return 0;
  }
  return parseInt(localStorage.getItem(STORAGE_KEYS.DAILY_COUNT) || '0', 10);
}

export function incrementDailyCount() {
  const today = new Date().toDateString();
  localStorage.setItem(STORAGE_KEYS.DAILY_DATE, today);
  const current = getDailyCount();
  localStorage.setItem(STORAGE_KEYS.DAILY_COUNT, String(current + 1));
}

export function canPredict(isPro) {
  if (isPro) return true;
  return getDailyCount() < FREE_LIMIT;
}

export function getHistory() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEYS.HISTORY) || '[]');
  } catch {
    return [];
  }
}

export function addToHistory(prediction) {
  const history = getHistory();
  history.unshift({ ...prediction, savedAt: new Date().toISOString() });
  if (history.length > 50) history.pop();
  localStorage.setItem(STORAGE_KEYS.HISTORY, JSON.stringify(history));
}

export function clearHistory() {
  localStorage.removeItem(STORAGE_KEYS.HISTORY);
}
