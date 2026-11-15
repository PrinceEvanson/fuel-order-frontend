import { useEffect, useRef, useState } from 'react'

export function useAnimatedNumber(target, duration = 550) {
  const [value, setValue] = useState(target)
  const from = useRef(target)

  useEffect(() => {
    if (target == null || !Number.isFinite(target)) {
      from.current = target
      setValue(target)
      return undefined
    }
    const start = Number.isFinite(from.current) ? from.current : target
    const reduced = typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (start === target || reduced) {
      from.current = target
      setValue(target)
      return undefined
    }
    let frame = 0
    const t0 = performance.now()
    const step = (now) => {
      const p = Math.min(1, (now - t0) / duration)
      const eased = 1 - Math.pow(1 - p, 3)
      const v = p === 1 ? target : start + (target - start) * eased
      from.current = v
      setValue(v)
      if (p < 1) frame = requestAnimationFrame(step)
    }
    frame = requestAnimationFrame(step)
    return () => cancelAnimationFrame(frame)
  }, [target, duration])

  return value
}

export default function AnimatedNumber({ value, decimals = 2 }) {
  const v = useAnimatedNumber(value)
  if (v == null || !Number.isFinite(v)) return <span className="text-slate-400">-</span>
  return (
    <span className="tabular-nums">
      {v.toLocaleString(undefined, { minimumFractionDigits: decimals, maximumFractionDigits: decimals })}
    </span>
  )
}
