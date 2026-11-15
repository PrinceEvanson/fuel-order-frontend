const STYLE = {
  error: 'border-red-200 bg-red-50 text-red-800',
  warn: 'border-slate-200 border-l-4 border-l-slate-700 bg-slate-100 text-slate-800',
  info: 'border-slate-200 bg-white text-slate-600',
}

export default function FlagList({ flags = [] }) {
  if (!flags.length)
    return <p className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800">No problems found by the AI check.</p>
  return (
    <ul className="space-y-2">
      {flags.map((f, i) => (
        <li key={i} className={`flex gap-2 rounded-lg border px-3 py-2 text-sm ${STYLE[f.severity]}`}>
          <span><b className="mr-1 text-xs uppercase tracking-wide opacity-70">{f.code.replaceAll('_', ' ')}</b>{f.message}</span>
        </li>
      ))}
    </ul>
  )
}
