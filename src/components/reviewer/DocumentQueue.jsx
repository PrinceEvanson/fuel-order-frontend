import { useState } from 'react'
import StatusPill from '../common/StatusPill.jsx'

const TABS = [
  ['pending', 'All pending', 'Pending'],
  ['passed', 'Passed AI check', 'Passed'],
  ['flagged', 'Flagged', 'Flagged'],
  ['posted', 'Posted to Sage', 'Posted'],
  ['rejected', 'Rejected', 'Rejected'],
]

const matches = (d, q) =>
  [d.customer_name, d.filename, d.po_number, d.owner, d.status, d.ai_status]
    .some((v) => String(v || '').toLowerCase().includes(q))

export default function DocumentQueue({ bucket, onBucket, items, counts, selectedId, onSelect, loading, compact, busy = {} }) {
  const [query, setQuery] = useState('')
  const q = query.trim().toLowerCase()
  const shown = q ? items.filter((d) => matches(d, q)) : items

  return (
    <div className="overflow-hidden rounded-xl bg-white ring-1 ring-slate-200">
      <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 bg-slate-50 p-2">
        <div className="flex flex-wrap gap-1">
          {TABS.map(([key, label, short]) => (
            <button key={key} onClick={() => onBucket(key)}
              className={`rounded-lg px-3 py-1.5 text-sm ${compact ? 'px-2 py-1 text-xs' : ''} ${bucket === key ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-200'}`}>
              {compact ? short : label} <span className="opacity-70">({counts?.[key] ?? 0})</span>
            </button>
          ))}
        </div>
        <div className={`relative ${compact ? 'w-full' : 'ml-auto w-72'}`}>
          <svg className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
            <circle cx="9" cy="9" r="6" />
            <path d="M14 14l4 4" strokeLinecap="round" />
          </svg>
          <input
            type="text" value={query} onChange={(e) => setQuery(e.target.value)}
            placeholder="Search customer, PO, file or sender"
            aria-label="Search documents"
            className="w-full rounded-lg border border-slate-300 bg-white py-1.5 pl-9 pr-8 text-sm text-slate-900 placeholder:text-slate-400 focus:border-emerald-600 focus:outline-none focus:ring-2 focus:ring-emerald-200"
          />
          {query && (
            <button onClick={() => setQuery('')} aria-label="Clear search"
              className="absolute right-1.5 top-1/2 flex h-6 w-6 -translate-y-1/2 items-center justify-center rounded-md text-slate-500 transition hover:bg-red-600 hover:text-white">
              <svg className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" aria-hidden="true">
                <path d="M5 5l10 10M15 5L5 15" />
              </svg>
            </button>
          )}
        </div>
      </div>
      {loading ? <p className="p-6 text-sm text-slate-500">Loading...</p> : !shown.length ? (
        <p className="p-6 text-center text-sm text-slate-500">{q ? `No documents match "${query.trim()}".` : 'Nothing here.'}</p>
      ) : (
        <ul className={`divide-y divide-slate-100 ${compact ? 'max-h-[calc(100vh-16rem)] overflow-y-auto' : ''}`}>
          {shown.map((d) => {
            const active = selectedId === d.id
            return (
              <li key={d.id}>
                <button onClick={() => onSelect(d.id)}
                  className={`flex w-full items-center justify-between gap-3 border-l-4 text-left transition hover:bg-emerald-50 ${compact ? 'p-2' : 'p-3'} ${active ? 'border-emerald-600 bg-emerald-50' : 'border-transparent'}`}>
                  <div className="min-w-0">
                    <div className={`truncate font-medium ${compact ? 'text-sm' : ''}`}>{d.customer_name || d.filename}</div>
                    {compact
                      ? <div className="truncate text-xs text-slate-500">{d.filename}</div>
                      : <div className="truncate text-xs text-slate-500">PO {d.po_number || '-'} | from {d.owner} | {d.filename}</div>}
                  </div>
                  <div className="flex shrink-0 flex-col items-end gap-1">
                    {busy[d.id]
                      ? <span className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-700">
                          <span className="h-3 w-3 animate-spin rounded-full border-2 border-emerald-600 border-t-transparent" />Reading
                        </span>
                      : <StatusPill value={d.status === 'submitted' ? d.ai_status : d.status} />}
                    {!busy[d.id] && d.flag_count > 0 && d.status === 'submitted' && <span className="text-xs text-red-700">{d.flag_count} issue{d.flag_count > 1 ? 's' : ''}</span>}
                  </div>
                </button>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
