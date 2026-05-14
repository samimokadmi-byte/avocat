/**
 * api/contact.ts — Proxy Vercel → Google Apps Script
 * Résout le CORS : le navigateur appelle /api/contact (même domaine),
 * Vercel relaie vers le Google Apps Script Web App.
 *
 * Variable Vercel requise :
 *   APPS_SCRIPT_URL = https://script.google.com/macros/s/XXXX/exec
 */
import type { VercelRequest, VercelResponse } from '@vercel/node'

const APPS_SCRIPT_URL = process.env.APPS_SCRIPT_URL
  ?? 'https://script.google.com/macros/s/AKfycbwJ4DDG6cO4DOJkK-45-GuljQoDwCFmTvSx9y9txiXmGrQId6InBB09n5a7K5rJ-bjNZA/exec'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
  if (req.method === 'OPTIONS') return res.status(200).end()
  if (req.method !== 'POST') return res.status(405).json({ error: 'Méthode non autorisée' })

  const { name, email, company = '', subject = '', message = '' } = req.body ?? {}
  if (!name || !email) return res.status(400).json({ error: 'Nom et email requis.' })

  try {
    const scriptRes = await fetch(APPS_SCRIPT_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, company, subject, message }),
    })

    const text = await scriptRes.text()
    let data: { success: boolean; message?: string } = { success: false }
    try { data = JSON.parse(text) } catch { data = { success: scriptRes.ok } }

    if (data.success) {
      return res.status(200).json({ success: true })
    } else {
      throw new Error(data.message ?? 'Erreur Apps Script')
    }
  } catch (err) {
    console.error('[contact] Erreur proxy Apps Script:', err)
    return res.status(500).json({ error: 'Échec de l\'envoi. Veuillez réessayer.' })
  }
}
