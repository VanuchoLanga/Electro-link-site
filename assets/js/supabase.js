/* ═══════════════════════════════════════════════
   ElectroLink — Supabase Client
   ═══════════════════════════════════════════════ */

import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm'

const SUPABASE_URL = 'https://svvtdehfwdghsezafhgx.supabase.co'
const SUPABASE_KEY = 'sb_publishable_mVp27CQVZFWlZqRzSDkgaA_HERxV2r_'

export const sb = createClient(SUPABASE_URL, SUPABASE_KEY)

/* Helpers de data */
export function fmtDate(iso) {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('pt-MZ', { day: '2-digit', month: 'short', year: 'numeric' })
}

export function fmtMoney(val) {
  return Number(val || 0).toLocaleString('pt-MZ', { minimumFractionDigits: 2 }) + ' MT'
}

export function today() {
  return new Date().toISOString().split('T')[0]
}
