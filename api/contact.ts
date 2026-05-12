/**
 * api/contact.ts — Proxy Vercel → Make webhook
 * Résout le problème CORS : le navigateur ne peut pas appeler Make directement.
 * Ce proxy reçoit le formulaire côté serveur et relaie vers Make sans CORS.
 */
import type { VercelRequest, VercelResponse } from '@vercel/node'

const MAKE_WEBHOOK = 'https://hook.us2.make.com/uaxmqy4uwpwkptg2d6wipovr1allhvha'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Headers CORS pour le frontend
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')

  if (req.method === 'OPTIONS') return res.status(200).end()
  if (req.method !== 'POST') return res.status(405).json({ error: 'Méthode non autorisée' })

  const { name, email, company = '', subject = '', message = '' } = req.body ?? {}

  if (!name || !email) {
    return res.status(400).json({ error: 'Nom et email requis.' })
  }

  try {
    // Appel Make depuis le serveur — pas de problème CORS
    const makeRes = await fetch(MAKE_WEBHOOK, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, company, subject, message }),
    })

    if (makeRes.ok) {
      return res.status(200).json({ success: true })
    } else {
      throw new Error(`Make a répondu ${makeRes.status}`)
    }
  } catch (err) {
    console.error('[contact] Erreur proxy Make:', err)
    return res.status(500).json({ error: 'Échec de l\'envoi. Veuillez réessayer.' })
  }
}
