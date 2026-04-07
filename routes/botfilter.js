// ════════════════════════════════════════════════════════
// BOT DETECTION UTILITIES
// Option 2: Block obvious bot name patterns
// Option 3: Honeypot field check
// ════════════════════════════════════════════════════════
'use strict';

// Patterns that are clearly automated/bot names
const BOT_NAME_PATTERNS = [
  /^player\d+$/i,           // Player1, Player2, player3 etc.
  /^(tabu|taboo)host$/i,     // TabuHost, TabooHost
  /^testhost$/i,              // TestHost
  /^testguest$/i,             // TestGuest
  /^test\d*$/i,              // Test, Test1, Test2
  /^bot\d*$/i,               // Bot, Bot1
  /^user\d+$/i,              // User1, User123
  /^guest\d+$/i,             // Guest1, Guest123
  /^host\d*$/i,              // Host, Host1 (generic, not real names)
  /^player[a-z]$/i,          // PlayerA, PlayerB
];

function isBotName(name) {
  if (!name) return false;
  const trimmed = name.trim();
  return BOT_NAME_PATTERNS.some(p => p.test(trimmed));
}

// Honeypot check - field should always be empty for real browsers
function isHoneypot(website) {
  return !!(website && website.trim().length > 0);
}

module.exports = { isBotName, isHoneypot };
