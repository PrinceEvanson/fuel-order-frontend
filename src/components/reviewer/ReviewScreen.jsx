import { useEffect, useState } from 'react'
import { api } from '../../lib/api.js'
import PdfViewer from '../common/PdfViewer.jsx'
import FlagList from '../common/FlagList.jsx'
import StatusPill from '../common/StatusPill.jsx'
import ExtractedForm from './ExtractedForm.jsx'
import RejectDialog from './RejectDialog.jsx'
import AuditTrail from './AuditTrail.jsx'
import MetricsPanel from './MetricsPanel.jsx'
import AnalysisLoader from './AnalysisLoader.jsx'

const TABS = [
  ['checks', 'Checks'],
  ['details', 'Details'],
  ['units', 'Currency and units'],
  ['history', 'History'],
]

const MAX_ACK_WARNINGS = 5

export default function ReviewScreen({ docId, onChanged, onClose, reading = false, readError = '', onRetry }) {
  const [doc, setDoc] = useState(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [blockers, setBlockers] = useState([])
  const [ack, setAck] = useState(false)
  const [rejecting, setRejecting] = useState(false)
  const [auditKey, setAuditKey] = useState(0)
  const [tab, setTab] = useState(reading ? 'details' : 'checks')
  const [loadingDoc, setLoadingDoc] = useState(true)
  const [reRead, setReRead] = useState(false)

  const [prevReading, setPrevReading] = useState(reading)
  if (prevReading !== reading) {
    setPrevReading(reading)
    if (!reading) setLoadingDoc(true)
  }

  useEffect(() => {
    let live = true
    setLoadingDoc(true)
    api.reviewDoc(docId)
      .then((d) => { if (live) { setDoc(d); setLoadingDoc(false) } })
      .catch((e) => { if (live) { setError(e.message); setLoadingDoc(false) } })
    return () => { live = false }
  }, [docId, reading])

  if (error && !doc) return <p className="rounded-lg bg-red-50 p-4 text-sm text-red-700">{error}</p>
  if (!doc) return <p className="rounded-2xl bg-white p-6 text-sm text-slate-500">Loading...</p>

  const actionable = doc.status === 'submitted' || doc.status === 'post_failed'
  const warns = doc.flags.filter((f) => f.severity === 'warn')
  const hasErrors = doc.flags.some((f) => f.severity === 'error')
  const canAck = warns.length > 0 && warns.length < MAX_ACK_WARNINGS
  const tooManyWarns = warns.length >= MAX_ACK_WARNINGS

  const run = async (fn) => {
    setBusy(true); setError(''); setBlockers([])
    try { return await fn() } catch (e) {
      setError(e.message); setBlockers(e.detail?.blockers || [])
    } finally { setBusy(false); setAuditKey((k) => k + 1) }
  }

  const save = (body) => run(async () => { setDoc(await api.edit(doc.id, body)); setAck(false); onChanged() })
  const approve = () => run(async () => { setDoc(await api.approve(doc.id, ack)); onChanged() })
  const rescan = () => run(async () => {
    setReRead(true)
    try { setDoc(await api.rescan(doc.id)); setAck(false); onChanged() } finally { setReRead(false) }
  })
  const reject = (reason) => run(async () => { setDoc(await api.reject(doc.id, reason)); setRejecting(false); onChanged() })

  const last = doc.feedback?.at(-1)
  const analysing = reading || reRead || loadingDoc
  const showLoader = analysing && tab !== 'history'

  return (
    <section className="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-slate-200">
      <header className="flex flex-wrap items-start justify-between gap-3 border-b border-slate-200 px-5 py-4">
        <div className="min-w-0">
          <h2 className="truncate text-lg font-semibold text-slate-900">{doc.customer_name || doc.filename}</h2>
          <p className="truncate text-xs text-slate-500">
            {doc.filename} | from {doc.owner} | {new Date(doc.created_at).toLocaleString()} | scan attempt #{doc.attempts}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <StatusPill value={doc.ai_status} />
          <StatusPill value={doc.status} />
          <button onClick={onClose} aria-label="Close preview"
            className="rounded-lg border border-slate-300 px-3 py-1 text-sm text-slate-700 transition hover:border-red-600 hover:bg-red-600 hover:text-white">
            Close
          </button>
        </div>
      </header>

      {last && (
        <p className="border-b border-slate-200 bg-slate-50 px-5 py-2 text-xs text-slate-600">
          The client redid this scan {doc.feedback.length}x. Last issue reported: {last.error_types.join(', ').replaceAll('_', ' ') || '-'}
          {last.comment && ` - "${last.comment}"`}
        </p>
      )}

      <div className="grid xl:grid-cols-[minmax(0,5fr)_minmax(0,6fr)]">
        <div className="border-slate-200 bg-slate-50 p-4 xl:border-r">
          <PdfViewer docId={doc.id} className="h-[70vh]" />
        </div>

        <div className="min-w-0">
          <div role="tablist" className="flex gap-1 overflow-x-auto border-b border-slate-200 px-3 pt-2">
            {TABS.map(([key, label]) => (
              <button key={key} role="tab" aria-selected={tab === key} onClick={() => setTab(key)}
                className={`-mb-px whitespace-nowrap border-b-2 px-3 py-2 text-sm font-medium transition ${tab === key ? 'border-emerald-600 text-slate-900' : 'border-transparent text-slate-500 hover:text-slate-900'}`}>
                {label}
                {key === 'checks' && doc.flags.length > 0 && (
                  <span className={`ml-1.5 rounded-full px-1.5 py-0.5 text-xs ${hasErrors ? 'bg-red-100 text-red-800' : 'bg-slate-200 text-slate-700'}`}>{doc.flags.length}</span>
                )}
              </button>
            ))}
          </div>

          <div className="max-h-[64vh] overflow-y-auto p-4">
            {readError && !analysing && (
              <div role="alert" className="mb-4 flex flex-wrap items-center justify-between gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
                <span>The AI could not read this document: {readError}</span>
                <button onClick={onRetry} className="rounded-md border border-red-500 px-3 py-1 font-medium text-red-700 transition hover:bg-red-600 hover:text-white">Try again</button>
              </div>
            )}
            {showLoader && <AnalysisLoader />}
            <div key={doc.data?.ai_read_at || 'unread'} className={`${showLoader ? 'hidden' : 'fade-in'}`}>
              <div className={tab === 'checks' ? '' : 'hidden'}><FlagList flags={doc.flags} /></div>
              <div className={tab === 'details' ? '' : 'hidden'}><ExtractedForm doc={doc} onSave={save} saving={busy} readOnly={!actionable} /></div>
              <div className={tab === 'units' ? '' : 'hidden'}><MetricsPanel key={doc.id} doc={doc} /></div>
              <div className={tab === 'history' ? '' : 'hidden'}><AuditTrail docId={doc.id} refreshKey={auditKey} /></div>
            </div>
          </div>
        </div>
      </div>

      {doc.status === 'posted' && (
        <p className="border-t border-emerald-200 bg-emerald-50 px-5 py-3 text-sm text-emerald-800">
          Sage quote <b>{doc.sage_quote_number}</b> created by {doc.reviewed_by}.{' '}
          {doc.sage_url && <a className="underline" href={doc.sage_url} target="_blank" rel="noreferrer">Open in Sage</a>}
        </p>
      )}
      {doc.status === 'rejected' && <p className="border-t border-red-200 bg-red-50 px-5 py-3 text-sm text-red-800">Rejected by {doc.reviewed_by}: {doc.reject_reason}</p>}
      {doc.status === 'post_failed' && doc.sage_error && <p className="border-t border-red-200 bg-red-50 px-5 py-3 text-sm text-red-800">Sage error: {doc.sage_error}</p>}

      {error && (
        <div role="alert" className="border-t border-red-200 bg-red-50 px-5 py-3 text-sm text-red-800">
          <p className="font-medium">{error}</p>
          {blockers.length > 0 && <ul className="mt-1 list-disc pl-5">{blockers.map((b, i) => <li key={i}>{b.message}</li>)}</ul>}
        </div>
      )}

      {actionable && (
        <footer className="flex flex-wrap items-center gap-3 border-t border-slate-200 bg-slate-50 px-5 py-3">
          {canAck && (
            <label className="flex items-center gap-2 text-sm text-slate-700">
              <input type="checkbox" checked={ack} onChange={(e) => setAck(e.target.checked)} /> I have reviewed the {warns.length} warning{warns.length > 1 ? 's' : ''}
            </label>
          )}
          <button onClick={approve} disabled={busy || analysing || hasErrors || tooManyWarns || (canAck && !ack)}
            className="rounded-lg bg-emerald-600 px-5 py-2 font-medium text-white transition hover:bg-emerald-700 disabled:opacity-50">
            {busy ? 'Working...' : 'Approve and post to Sage'}
          </button>
          <button onClick={() => setRejecting(true)} disabled={busy || analysing}
            className="rounded-lg border border-red-500 px-5 py-2 font-medium text-red-700 transition hover:bg-red-600 hover:text-white disabled:opacity-50">
            Reject
          </button>
          <button onClick={rescan} disabled={busy || analysing}
            className="rounded-lg border border-slate-400 px-5 py-2 font-medium text-slate-700 transition hover:bg-slate-200 disabled:opacity-50">
            {reRead ? 'Reading...' : 'Re-read with AI'}
          </button>
          {hasErrors && <span className="text-xs text-slate-500">Fix the red checks in Details, or reject.</span>}
          {!hasErrors && tooManyWarns && <span className="text-xs text-slate-500">{warns.length} warnings is too many to tick off together. Fix them in Details, or reject.</span>}
        </footer>
      )}

      {rejecting && <RejectDialog busy={busy} onConfirm={reject} onCancel={() => setRejecting(false)} />}
    </section>
  )
}
