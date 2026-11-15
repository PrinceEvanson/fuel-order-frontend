export const CURRENCIES = {
  USD: { name: 'US dollar', perUsd: 1 },
  KES: { name: 'Kenya shilling', perUsd: 129 },
  TZS: { name: 'Tanzania shilling', perUsd: 2600 },
  UGX: { name: 'Uganda shilling', perUsd: 3650 },
  RWF: { name: 'Rwanda franc', perUsd: 1430 },
  EUR: { name: 'Euro', perUsd: 0.92 },
  GBP: { name: 'British pound', perUsd: 0.78 },
  ZAR: { name: 'South African rand', perUsd: 18 },
}

export const UNITS = {
  litre: { label: 'Litre', short: 'L', family: 'volume', base: 1 },
  gallon_us: { label: 'US gallon', short: 'gal (US)', family: 'volume', base: 3.785411784 },
  gallon_uk: { label: 'UK gallon', short: 'gal (UK)', family: 'volume', base: 4.54609 },
  m3: { label: 'Cubic metre', short: 'm3', family: 'volume', base: 1000 },
  barrel: { label: 'Barrel', short: 'bbl', family: 'volume', base: 158.987294928 },
  kg: { label: 'Kilogram', short: 'kg', family: 'mass', base: 1 },
  tonne: { label: 'Metric tonne', short: 't', family: 'mass', base: 1000 },
  lb: { label: 'Pound', short: 'lb', family: 'mass', base: 0.45359237 },
}

const SYMBOLS = {
  '$': 'USD', 'US$': 'USD', 'USD$': 'USD', 'KSH': 'KES', 'KSHS': 'KES', 'K.SH': 'KES', 'KES.': 'KES',
  'TSH': 'TZS', 'TSHS': 'TZS', 'TZSH': 'TZS', 'USH': 'UGX', 'USHS': 'UGX', 'UGSH': 'UGX',
  'FRW': 'RWF', 'RF': 'RWF',
}

export function normalizeCurrency(raw) {
  const s = String(raw || '').trim().toUpperCase()
  if (!s) return null
  if (CURRENCIES[s]) return s
  if (SYMBOLS[s]) return SYMBOLS[s]
  const code = s.match(/\b(USD|KES|TZS|UGX|RWF|EUR|GBP|ZAR)\b/)
  if (code) return code[1]
  if (s.includes('SHILLING')) {
    if (s.includes('KEN')) return 'KES'
    if (s.includes('TANZ')) return 'TZS'
    if (s.includes('UGAN')) return 'UGX'
  }
  if (s.includes('DOLLAR')) return 'USD'
  if (s.includes('EURO')) return 'EUR'
  if (s.includes('POUND')) return 'GBP'
  if (s.includes('RAND')) return 'ZAR'
  return null
}

export function normalizeUnit(raw) {
  const s = String(raw || '').toLowerCase().replace(/[^a-z0-9 ]/g, ' ').replace(/\s+/g, ' ').trim()
  if (!s) return null
  if (/\b(imp|imperial|uk)\b/.test(s) && /gal/.test(s)) return 'gallon_uk'
  if (/^(m3|m 3|kl|cubic met(er|re)s?|kilolit(re|er)s?)$/.test(s)) return 'm3'
  if (/^(bbl|bbls|barrels?)$/.test(s)) return 'barrel'
  if (/^(kg|kgs|kilos?|kilograms?)$/.test(s)) return 'kg'
  if (/^(t|mt|tonnes?|tons?|metric tons?)$/.test(s)) return 'tonne'
  if (/^(lb|lbs|pounds?)$/.test(s)) return 'lb'
  if (/gal/.test(s) || s === 'usg') return 'gallon_us'
  if (/^(l|lt|lts|ltr|ltrs)$/.test(s) || /^lit/.test(s)) return 'litre'
  return null
}

export function densityFor(description) {
  const s = String(description || '').toLowerCase()
  if (/petrol|gasoline|ulg|unleaded|mogas|super/.test(s)) return 0.745
  if (/kerosene|paraffin|jet/.test(s)) return 0.8
  return 0.84
}

export function unitFactor(src, tgt, density) {
  const a = UNITS[src]
  const b = UNITS[tgt]
  if (!a || !b) return null
  if (a.family === b.family) return a.base / b.base
  if (a.family === 'volume') return (a.base * density) / b.base
  return (a.base / density) / b.base
}

export function currencyRate(src, tgt, override) {
  if (src === tgt) return 1
  const o = Number(override)
  if (Number.isFinite(o) && o > 0) return o
  const a = CURRENCIES[src]
  const b = CURRENCIES[tgt]
  if (!a || !b) return null
  return b.perUsd / a.perUsd
}

export function mostCommon(values) {
  const counts = {}
  values.forEach((v) => { counts[v] = (counts[v] || 0) + 1 })
  return Object.entries(counts).sort((x, y) => y[1] - x[1])[0]?.[0] || null
}
