import { useCallback, useEffect, useRef, useState } from 'react'
import { api } from './api.js'

const LIMIT = 3

export const needsRead = (d) => (d.status === 'submitted' || d.status === 'post_failed') && !d.ai_read

export function useAnalysis(items, aiEnabled, onDone) {
  const inflight = useRef(new Map())
  const queued = useRef([])
  const tried = useRef(new Set())
  const pumpRef = useRef(() => {})
  const doneRef = useRef(onDone)
  doneRef.current = onDone
  const [busy, setBusy] = useState({})
  const [errors, setErrors] = useState({})

  const start = useCallback((id) => {
    if (inflight.current.has(id)) return inflight.current.get(id)
    tried.current.add(id)
    setBusy((b) => ({ ...b, [id]: true }))
    setErrors((e) => { const next = { ...e }; delete next[id]; return next })
    const p = api.analyse(id)
      .catch((err) => setErrors((e) => ({ ...e, [id]: err.message })))
      .finally(() => {
        inflight.current.delete(id)
        setBusy((b) => { const next = { ...b }; delete next[id]; return next })
        doneRef.current()
        pumpRef.current()
      })
    inflight.current.set(id, p)
    return p
  }, [])

  pumpRef.current = () => {
    while (inflight.current.size < LIMIT && queued.current.length) start(queued.current.shift())
  }

  useEffect(() => {
    if (!aiEnabled) return
    for (const d of items) {
      if (needsRead(d) && !tried.current.has(d.id) && !queued.current.includes(d.id) && !inflight.current.has(d.id)) {
        queued.current.push(d.id)
      }
    }
    pumpRef.current()
  }, [items, aiEnabled])

  return { busy, errors, start }
}
