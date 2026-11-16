import { useEffect, useState } from 'react'

const STEPS = [
  'Opening the document',
  'Reading the text and tables',
  'Finding the customer, PO number and dates',
  'Detecting the currency and units',
  'Checking quantities, prices and totals',
  'Matching the customer and products',
]

function Check() {
  return (
    <svg className="h-4 w-4 text-emerald-600" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M4 10.5l4 4 8-9" />
    </svg>
  )
}

export default function AnalysisLoader() {
  const [active, setActive] = useState(0)

  useEffect(() => {
    const t = setInterval(() => setActive((a) => Math.min(a + 1, STEPS.length - 1)), 2400)
    return () => clearInterval(t)
  }, [])

  const pct = Math.min(95, Math.round(((active + 0.6) / STEPS.length) * 100))

  return (
    <div role="status" aria-live="polite" className="space-y-5">
      <div className="flex items-center gap-3">
        <span className="h-6 w-6 shrink-0 animate-spin rounded-full border-[3px] border-emerald-600 border-t-transparent" />
        <div>
          <p className="font-semibold text-slate-900">Claude is reading this document</p>
          <p className="text-xs text-slate-500">Large or scanned files can take up to a minute. You can keep looking at the PDF.</p>
        </div>
      </div>

      <div className="h-1.5 overflow-hidden rounded-full bg-slate-200">
        <div className="h-full rounded-full bg-emerald-600 transition-all duration-700 ease-out" style={{ width: `${pct}%` }} />
      </div>

      <ol className="space-y-2.5">
        {STEPS.map((label, i) => (
          <li key={label} className={`flex items-center gap-3 text-sm transition-colors duration-500 ${i < active ? 'text-slate-700' : i === active ? 'font-medium text-slate-900' : 'text-slate-400'}`}>
            <span className="flex h-5 w-5 shrink-0 items-center justify-center">
              {i < active ? <Check /> : i === active
                ? <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-emerald-600 border-t-transparent" />
                : <span className="h-2 w-2 rounded-full bg-slate-300" />}
            </span>
            {label}
          </li>
        ))}
      </ol>

      <div className="space-y-2 pt-1" aria-hidden="true">
        <div className="h-9 animate-pulse rounded-lg bg-slate-100" />
        <div className="grid grid-cols-2 gap-2">
          <div className="h-9 animate-pulse rounded-lg bg-slate-100" />
          <div className="h-9 animate-pulse rounded-lg bg-slate-100" />
        </div>
        <div className="h-20 animate-pulse rounded-lg bg-slate-100" />
      </div>
    </div>
  )
}
