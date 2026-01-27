const CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

export function generateProtocol(): string {
  let result = '';
  for (let i = 0; i < 8; i++) {
    result += CHARS.charAt(Math.floor(Math.random() * CHARS.length));
  }
  return result;
}
