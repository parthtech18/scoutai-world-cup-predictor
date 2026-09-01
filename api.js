const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';
const GROQ_MODEL = 'deepseek-r1-distill-llama-70b';

const ALL_SCORES = [
  '1-0','0-1','1-1','2-1','1-2','2-0','0-2',
  '2-2','3-1','1-3','3-0','0-3','3-2','2-3',
  '4-0','0-4','4-1','1-4','4-2','2-4',
  '3-3','5-0','0-5','5-1','1-5',
  '1-0','1-0','1-0','2-1','2-1',
  '3-0','4-1','3-1','2-0','4-0',
];

const MOCK_FORMS = ['W','D','L','W','W'];

const MOCK_SUMMARIES = {
  default: (a, b) =>
    `${a} enter this fixture with a well-organized defensive block and dangerous transitions through their pacy wide men. ${b} will look to dominate possession and press high, forcing mistakes in the build-up phase. The midfield battle will be decisive — whoever controls the central zone controls the tempo of this match. Expect a tight, tactical contest with the first goal likely to be defining.`,
};

const MOCK_FACTORS = (a, b) => [
  `${a}'s high-press system creates turnovers in dangerous areas and has unlocked compact defences recently`,
  `${b} rely heavily on set-piece delivery and aerial duels — a potential weakness against mobile defenders`,
  `The central midfield duel will determine whether ${a}'s quick transitions or ${b}'s structured build-up wins out`,
];

const MOCK_TACTICAL = (a, b) =>
  `${a} typically deploy a 4-3-3 with inverted wingers cutting inside to support a dynamic number nine, pressing aggressively from the front. ${b} counter with a disciplined 4-2-3-1, shielding the defence with a double pivot and relying on their number ten to link play. The key battleground is the half-space between ${b}'s lines, where ${a}'s interior midfielders will look to receive and turn.`;

function seededRandom(seed) {
  let s = seed;
  return () => {
    s = (s * 1664525 + 1013904223) & 0xffffffff;
    return (s >>> 0) / 0xffffffff;
  };
}

function getMockPrediction(teamA, teamB, stage) {
  const seed =
    teamA.charCodeAt(0) +
    (teamB.charCodeAt(1) ?? 0) * 3 +
    teamA.length * 7 +
    (teamB.charCodeAt(0) ?? 0) * 13;
  const rand = seededRandom(seed);

  const scoreIdx = Math.floor(rand() * ALL_SCORES.length);
  const score = ALL_SCORES[scoreIdx];
  const [homeGoals, awayGoals] = score.split('-').map(Number);

  let winner = 'Draw';
  if (homeGoals > awayGoals) winner = teamA;
  else if (awayGoals > homeGoals) winner = teamB;

  const base = Math.floor(rand() * 30) + 35;
  const drawPct = Math.floor(rand() * 20) + 15;
  const homePct = winner === teamA ? base : Math.floor(rand() * 20) + 20;
  const awayPct = 100 - homePct - drawPct;

  const conf = ['Low','Medium','Medium','High'][Math.floor(rand() * 4)];

  const formLetters = ['W','D','L'];
  const mkForm = () => Array.from({length: 5}, () => formLetters[Math.floor(rand() * 3)]);

  const over = homeGoals + awayGoals > 2;
  const bts = homeGoals > 0 && awayGoals > 0;

  return {
    teamA, teamB, stage,
    predictedScore: score,
    winner,
    homeWin: Math.max(homePct, 5),
    draw: Math.max(drawPct, 5),
    awayWin: Math.max(awayPct, 5),
    confidence: conf,
    bothTeamsScore: bts,
    over25Goals: over,
    summary: MOCK_SUMMARIES.default(teamA, teamB),
    keyFactors: MOCK_FACTORS(teamA, teamB),
    tacticalBreakdown: MOCK_TACTICAL(teamA, teamB),
    homeForm: mkForm(),
    awayForm: mkForm(),
    keyPlayerMatchup: `Watch the wide areas — ${teamA}'s attacking fullback versus ${teamB}'s defensive winger will be a pivotal battle throughout this match`,
  };
}

function buildPrompt(teamA, teamB, stage, conditions) {
  return `You are a world-class football analyst covering FIFA World Cup 2026. You have just reviewed the latest news, squad announcements, training reports and injury updates for both teams.

MATCH: ${teamA} vs ${teamB}
STAGE: ${stage}
CONDITIONS: ${conditions}

Provide a comprehensive, deeply researched prediction as if you have access to the latest:
- Confirmed starting lineups and squad fitness
- Recent international form (last 5 matches with scores)
- Head-to-head history at World Cups
- Tactical formations each manager typically uses
- Key individual player matchups
- Tournament momentum and any injuries to key players

CRITICAL: Be 100% specific to ${teamA} vs ${teamB}. Name real star players by name. Reference real formations (e.g. 4-3-3, 3-5-2). Mention real tactical traits of each team. Never write generic analysis that could apply to any match.

Return ONLY this JSON, no markdown, no text outside the JSON:
{
  "homeWin": <integer 0-100>,
  "draw": <integer 0-100>,
  "awayWin": <integer 0-100>,
  "predictedScore": "<realistic score like 2-1>",
  "winner": "<${teamA} or ${teamB} or Draw>",
  "confidence": "<Low|Medium|High>",
  "summary": "<4 sentences. Name real players. Mention real tactical systems. Reference actual team strengths. Be specific to this exact matchup.>",
  "keyFactors": [
    "<real strength or weakness specific to ${teamA}>",
    "<real strength or weakness specific to ${teamB}>",
    "<one factor unique to THIS matchup e.g. a specific player duel or tactical clash>"
  ],
  "tacticalBreakdown": "<2-3 sentences on how ${teamA}'s actual formation and style matches up against ${teamB}'s. Name the formations. Name the key players in each role.>",
  "homeForm": ["W|D|L","W|D|L","W|D|L","W|D|L","W|D|L"],
  "awayForm": ["W|D|L","W|D|L","W|D|L","W|D|L","W|D|L"],
  "keyPlayerMatchup": "<e.g. Vinicius Jr vs Kyle Walker — one sentence on this duel>",
  "bothTeamsScore": <true|false>,
  "over25Goals": <true|false>
}`;
}

function parsePrediction(text, teamA, teamB, stage) {
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error('No JSON in response');
  const data = JSON.parse(jsonMatch[0]);
  const total = (data.homeWin || 0) + (data.draw || 0) + (data.awayWin || 0);
  if (Math.abs(total - 100) > 2) {
    const f = 100 / total;
    data.homeWin = Math.round(data.homeWin * f);
    data.draw = Math.round(data.draw * f);
    data.awayWin = 100 - data.homeWin - data.draw;
  }
  const mkForm = (raw) => {
    if (!Array.isArray(raw)) return ['W','D','W','W','L'];
    return raw.slice(0, 5).map((v) => ['W','D','L'].includes(v) ? v : 'D');
  };
  return {
    teamA: data.teamA || teamA,
    teamB: data.teamB || teamB,
    stage: data.stage || stage,
    predictedScore: data.predictedScore || '1-1',
    winner: data.winner || 'Draw',
    homeWin: data.homeWin || 33,
    draw: data.draw || 34,
    awayWin: data.awayWin || 33,
    confidence: data.confidence || 'Medium',
    bothTeamsScore: Boolean(data.bothTeamsScore),
    over25Goals: Boolean(data.over25Goals),
    summary: data.summary || '',
    keyFactors: Array.isArray(data.keyFactors) ? data.keyFactors : [],
    tacticalBreakdown: data.tacticalBreakdown || '',
    homeForm: mkForm(data.homeForm),
    awayForm: mkForm(data.awayForm),
    keyPlayerMatchup: data.keyPlayerMatchup || '',
  };
}

export async function getPrediction({ teamA, teamB, stage, conditions }) {
  // Read from localStorage first (set via Settings tab), fall back to env var
  const apiKey =
    localStorage.getItem('scout_groq_api_key') ||
    import.meta.env.VITE_GROQ_API_KEY ||
    '';

  if (!apiKey) return getMockPrediction(teamA, teamB, stage);

  try {
    const response = await fetch(GROQ_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: GROQ_MODEL,
        messages: [{ role: 'user', content: buildPrompt(teamA, teamB, stage, conditions) }],
        temperature: 0.85,
        max_tokens: 1200,
      }),
    });

    if (!response.ok) {
      console.error('Groq API error:', response.status);
      return getMockPrediction(teamA, teamB, stage);
    }

    const data = await response.json();
    const rawText = data.choices?.[0]?.message?.content || '';
    // DeepSeek R1 wraps its reasoning in <think>...</think> before the JSON.
    // Strip it out before parsing.
    const text = rawText.replace(/<think>[\s\S]*?<\/think>/gi, '').trim();
    return parsePrediction(text, teamA, teamB, stage);
  } catch (err) {
    console.error('Prediction error:', err);
    return getMockPrediction(teamA, teamB, stage);
  }
}
