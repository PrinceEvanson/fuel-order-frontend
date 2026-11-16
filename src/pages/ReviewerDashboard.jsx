import { useCallback, useEffect, useState } from 'react'
import { api } from '../lib/api.js'
import AppShell from '../components/common/AppShell.jsx'
import SageNotice from '../components/reviewer/SageNotice.jsx'
import DocumentQueue from '../components/reviewer/DocumentQueue.jsx'
import ReviewScreen from '../components/reviewer/ReviewScreen.jsx'
import { needsRead, useAnalysis } from '../lib/useAnalysis.js'

export default function ReviewerDashboard() {
  const [bucket, setBucket] = useState('pending')
  const [items, setItems] = useState([])
  const [counts, setCounts] = useState({})
  const [selected, setSelected] = useState(null)
  const [aiEnabled, setAiEnabled] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const load = useCallback(async () => {
    try {
      const q = await api.queue(bucket)
      setItems(q.items); setCounts(q.counts); setAiEnabled(!!q.ai_enabled); setError('')
    } catch (e) { setError(e.message) } finally { setLoading(false) }
  }, [bucket])

  useEffect(() => { setLoading(true); load() }, [load])
  useEffect(() => { const t = setInterval(load, 20000); return () => clearInterval(t) }, [load])

  const { busy, errors, start } = useAnalysis(items, aiEnabled, load)

  const choose = (id) => {
    setSelected(id)
    const d = items.find((x) => x.id === id)
    if (aiEnabled && d && needsRead(d)) start(id)
  }

  const open = selected !== null

  return (
    <AppShell wide title="Review Desk" subtitle="Check AI-read purchase orders, then post them to Sage" notice={<SageNotice />}>
      {error && <p role="alert" className="mb-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>}
      <div className="flex items-start gap-4">
        <div className={`transition-all duration-300 ${open ? 'hidden w-80 shrink-0 lg:block' : 'w-full'}`}>
          <DocumentQueue bucket={bucket} onBucket={(b) => { setBucket(b); setSelected(null) }} items={items} counts={counts}
            selectedId={selected} onSelect={choose} loading={loading} compact={open} busy={busy} />
        </div>
        {open && (
          <div className="slide-in-right fixed inset-0 z-40 overflow-y-auto bg-slate-900 p-3 lg:static lg:z-auto lg:min-w-0 lg:flex-1 lg:overflow-visible lg:bg-transparent lg:p-0">
            <ReviewScreen key={selected} docId={selected} onChanged={load} onClose={() => setSelected(null)}
              reading={!!busy[selected]} readError={errors[selected]} onRetry={() => start(selected)} />
          </div>
        )}
      </div>
    </AppShell>
  )
}
