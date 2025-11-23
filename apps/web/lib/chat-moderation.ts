// Chat moderation - blocks slurs but allows swears

const BLOCKED_WORDS = [
  // Racial slurs
  'nigger',
  'nigga',
  'chink',
  'gook',
  'wetback',
  'beaner',
  'spic',
  'kike',
  'kyke',
  'towelhead',
  'raghead',
  'paki',
  'coon',
  'jigaboo',
  'wog',
  'golliwog',
  
  // Homophobic slurs
  'faggot',
  'fag',
  'dyke',
  'tranny',
  
  // Ableist slurs
  'retard',
  'retarded',
  
  // Other offensive slurs
  'kys', // kill yourself
  'kill yourself'
];

/**
 * Check if a message contains blocked slurs
 * Returns { allowed: boolean, reason?: string }
 */
export function moderateMessage(message: string): { allowed: boolean; reason?: string } {
  const normalizedMessage = message.toLowerCase()
    // Remove common character substitutions
    .replace(/[0]/g, 'o')
    .replace(/[1]/g, 'i')
    .replace(/[3]/g, 'e')
    .replace(/[4]/g, 'a')
    .replace(/[5]/g, 's')
    .replace(/[7]/g, 't')
    .replace(/[@]/g, 'a')
    .replace(/[$]/g, 's')
    // Remove spaces, dots, dashes, underscores between letters
    .replace(/[\s\.\-_]+/g, '');

  for (const word of BLOCKED_WORDS) {
    // Check if the word appears as a whole word or with common variations
    const regex = new RegExp(`\\b${word}\\b|${word}`, 'i');
    if (regex.test(normalizedMessage)) {
      return {
        allowed: false,
        reason: 'Message contains prohibited language'
      };
    }
  }

  return { allowed: true };
}

