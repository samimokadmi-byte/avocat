/**
 * Password hashing via PBKDF2 (Web Crypto API, no dependencies).
 *
 * Why PBKDF2 and not SHA-256?
 * SHA-256 runs at ~1 billion iterations/second on a GPU — trivially brute-forceable.
 * PBKDF2 applies the hash 200 000 times per attempt, reducing attack speed to
 * ~5 000 attempts/second — 200 000× slower with zero extra dependencies.
 *
 * For a real production system with a backend, use bcrypt/argon2 server-side.
 * PBKDF2 here is the best achievable security for a 100% static frontend app.
 */

const ITERATIONS = 200_000
const SALT_PREFIX = 'avocat-v1-'

/**
 * Derives a hex key from a password using PBKDF2-SHA-256.
 * The salt is deterministic (prefix + email) so we don't need to store it separately.
 * In a backend context, use a random salt stored alongside the hash.
 */
export async function hashPassword(password: string, email = ''): Promise<string> {
  const enc = new TextEncoder()
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    enc.encode(password),
    'PBKDF2',
    false,
    ['deriveBits']
  )
  const bits = await crypto.subtle.deriveBits(
    {
      name: 'PBKDF2',
      hash: 'SHA-256',
      salt: enc.encode(SALT_PREFIX + email.toLowerCase()),
      iterations: ITERATIONS,
    },
    keyMaterial,
    256
  )
  return Array.from(new Uint8Array(bits)).map(b => b.toString(16).padStart(2, '0')).join('')
}

export async function verifyPassword(password: string, hash: string, email = ''): Promise<boolean> {
  const candidate = await hashPassword(password, email)
  return candidate === hash
}
