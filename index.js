const { createBot } = require('./bot');

console.log('=== Discord Multi-Bot Suite Starting ===');
console.log(`Node version: ${process.version}`);

// Read tokens from environment variables (TOKEN_1, TOKEN_2, ... TOKEN_n)
const tokens = [];
for (let i = 1; i <= 50; i++) {
  const key = `TOKEN_${i}`;
  if (process.env[key]) {
    tokens.push(process.env[key]);
  }
}

console.log(`Found ${tokens.length} bot token(s) in environment variables`);

if (tokens.length === 0) {
  console.error('[-] No tokens found! Add TOKEN_1, TOKEN_2, etc. as environment variables on Render.');
  console.error('    Example: TOKEN_1=your_discord_token_here');
  process.exit(1);
}

// Start all bots
tokens.forEach((token, index) => {
  console.log(`[${index + 1}] Starting bot ${index + 1}...`);
  createBot(token);
});

console.log('=== All bots initiated ===');
console.log('Waiting for connections...');
