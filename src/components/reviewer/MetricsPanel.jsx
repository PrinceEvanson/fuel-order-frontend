import { useMemo, useState } from 'react'
import AnimatedNumber from '../common/AnimatedNumber.jsx'
import { CURRENCIES, UNITS, normalizeCurrency, normalizeUnit, unitFactor, densityFor, currencyRate, mostCommon } from '../../lib/metrics.js'

const select = 'w-full min-w-0 rounded-md border border-slate-300 bg-white px-2 py-1 text-xs focus:border-emerald-600 focus:outline-none'
const num = (v) => (v === null || v === undefined || v === '' || !Number.isFinite(Number(v)) ? null : Number(v))

function UnitOptions() {
  const group = (family) => Object.entries(UNITS).filter(([, u]) => u.family === family)
  return (
    <>
      <optgroup label="Volume">{group('volume').map(([k, u]) => <option key={k} value={k}>{u.label} ({u.short})</option>)}</optgroup>
      <optgroup label="Weight">{group('mass').map(([k, u]) => <option key={k} value={k}>{u.label} ({u.short})</option>)}</optgroup>
    </>
  )
}

function CurrencyOptions() {
  return Object.entries(CURRENCIES).map(([k, c]) => <option key={k} value={k}>{k} - {c.name}</option>)
}

export default function MetricsPanel({ doc }) {
  const d = doc.data || {}
  const lines = d.lines || []

  const detectedCurrency = normalizeCurrency(d.currency)
  const detectedUnit = useMemo(() => mostCommon(lines.map((l) => normalizeUnit(l.unit)).filter(Boolean)), [doc.data])

  const [srcCurrencyPick, setSrcCurrencyPick] = useState('')
  const [srcUnitPick, setSrcUnitPick] = useState('')
  const [tgtCurrency, setTgtCurrency] = useState('')
  const [tgtUnit, setTgtUnit] = useState('')
  const [rateText, setRateText] = useState('')

  const srcCurrency = srcCurrencyPick || detectedCurrency || ''
  const srcUnit = srcUnitPick || detectedUnit || ''

  const rate = !tgtCurrency || tgtCurrency === srcCurrency
    ? 1
    : srcCurrency ? currencyRate(srcCurrency, tgtCurrency, rateText) : null
  const tableRate = srcCurrency && tgtCurrency && srcCurrency !== tgtCurrency ? currencyRate(srcCurrency, tgtCurrency) : null
  const currencyLabel = tgtCurrency || srcCurrency || d.currency || ''

  const rows = lines.map((ln) => {
    const lineUnit = normalizeUnit(ln.unit) || srcUnit || null
    const density = densityFor(ln.description)
    const target = tgtUnit || lineUnit
    const f = tgtUnit ? (lineUnit ? unitFactor(lineUnit, tgtUnit, density) : null) : 1
    const q = num(ln.quantity)
    const p = num(ln.unit_price)
    const t = num(ln.line_total)
    return {
      description: ln.description,
      unitLabel: target ? UNITS[target].short : (ln.unit || '-'),
      qty: q !== null && f !== null ? q * f : null,
      price: p !== null && f !== null && rate !== null ? (p / f) * rate : null,
      total: t !== null && rate !== null ? t * rate : null,
      cross: !!(lineUnit && tgtUnit && UNITS[lineUnit].family !== UNITS[tgtUnit].family),
    }
  })

  const docTotal = num(d.document_total)
  const changed = !!tgtCurrency || !!tgtUnit
  const anyCross = rows.some((r) => r.cross)
  const detectedText = `${detectedCurrency || 'currency not found'} / ${detectedUnit ? UNITS[detectedUnit].short : 'unit not found'}`
  const detectedOk = detectedCurrency && detectedUnit

  const reset = () => { setTgtCurrency(''); setTgtUnit(''); setRateText('') }

  return (
    <section className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm">
      <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
        <h3 className="font-semibold text-slate-900">Currency and units</h3>
        <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${detectedOk ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-700'}`}>
          {d.mock ? 'Placeholder guess' : 'Read by AI'}: {detectedText}
        </span>
      </div>

      <div className="grid grid-cols-[5rem_minmax(0,1fr)_minmax(0,1fr)] items-center gap-x-2 gap-y-2 text-xs text-slate-600">
        <span>On document</span>
        <select aria-label="Document currency" className={select} value={srcCurrency} onChange={(e) => { setSrcCurrencyPick(e.target.value); setRateText('') }}>
          {!srcCurrency && <option value="">Choose currency</option>}
          <CurrencyOptions />
        </select>
        <select aria-label="Document unit" className={select} value={srcUnit} onChange={(e) => setSrcUnitPick(e.target.value)}>
          {!srcUnit && <option value="">Choose unit</option>}
          <UnitOptions />
        </select>

        <span>Show as</span>
        <select aria-label="Show currency" className={select} value={tgtCurrency} onChange={(e) => { setTgtCurrency(e.target.value); setRateText('') }}>
          <option value="">Same as document</option>
          <CurrencyOptions />
        </select>
        <select aria-label="Show unit" className={select} value={tgtUnit} onChange={(e) => setTgtUnit(e.target.value)}>
          <option value="">Same as document</option>
          <UnitOptions />
        </select>
      </div>

      {tableRate !== null && (
        <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-slate-600">
          <span>Rate: 1 {srcCurrency} =</span>
          <input
            type="number" step="any" min="0" aria-label="Exchange rate"
            value={rateText} placeholder={tableRate.toLocaleString(undefined, { maximumFractionDigits: 4 })}
            onChange={(e) => setRateText(e.target.value)}
            className="w-28 rounded-md border border-slate-300 bg-white px-2 py-1 focus:border-emerald-600 focus:outline-none"
          />
          <span>{tgtCurrency}</span>
          <span className="text-slate-400">{rateText ? 'your rate' : 'indicative rate, type your own'}</span>
        </div>
      )}

      {rate === null && <p className="mt-2 text-xs text-red-700">Choose the currency used on the document to convert prices.</p>}

      {rows.length > 0 && (
        <div className="mt-3 overflow-x-auto rounded-lg border border-slate-200 bg-white">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-100 uppercase text-slate-500">
              <tr>
                <th className="p-2">Product</th>
                <th className="p-2 text-right">Qty</th>
                <th className="p-2 text-right">Price <span key={currencyLabel} className="fade-swap inline-block normal-case">({currencyLabel || '-'})</span></th>
                <th className="p-2 text-right">Total <span key={currencyLabel} className="fade-swap inline-block normal-case">({currencyLabel || '-'})</span></th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r, i) => (
                <tr key={i} className="border-t border-slate-100">
                  <td className="max-w-[9rem] truncate p-2">{r.description}</td>
                  <td className="p-2 text-right">
                    <AnimatedNumber value={r.qty} />{' '}
                    <span key={r.unitLabel} className="fade-swap inline-block text-slate-500">{r.unitLabel}</span>
                  </td>
                  <td className="p-2 text-right">
                    <AnimatedNumber value={r.price} />
                    <span key={r.unitLabel} className="fade-swap ml-1 inline-block text-slate-400">/ {r.unitLabel}</span>
                  </td>
                  <td className="p-2 text-right"><AnimatedNumber value={r.total} /></td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="border-t border-slate-200 bg-slate-50 font-medium">
                <td className="p-2" colSpan={3}>Document total</td>
                <td className="p-2 text-right"><AnimatedNumber value={docTotal !== null && rate !== null ? docTotal * rate : null} /></td>
              </tr>
            </tfoot>
          </table>
        </div>
      )}

      {anyCross && <p className="mt-2 text-xs text-slate-500">Volume to weight uses an assumed density: diesel 0.84 kg/L, petrol 0.745 kg/L, kerosene 0.80 kg/L.</p>}

      <div className="mt-2 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500">
        <span>Display only. The quote posted to Sage keeps the document values{srcCurrency ? ` in ${srcCurrency}` : ''}.</span>
        {changed && <button onClick={reset} className="rounded-md border border-slate-300 bg-white px-2 py-1 font-medium text-slate-700 hover:bg-slate-100">Back to document values</button>}
      </div>
    </section>
  )
}
