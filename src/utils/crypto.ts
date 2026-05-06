/**
 * Hashes a password with SHA-256 via the native Web Crypto API.
 * This is suitable for a static/frontend-only app. In a real backend
 * context, use bcrypt/argon2 server-side — never hash passwords client-side
 * for a production system with a real auth server.
 */
export async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder()
  const data = encoder.encode(password)
  const hashBuffer = await crypto.subtle.digest('SHA-256', data)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  const candidate = await hashPassword(password)
  return candidate === hash
}
