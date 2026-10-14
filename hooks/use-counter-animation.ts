import { useEffect, useState } from 'react'

interface UseCounterAnimationOptions {
  end: number
  start?: number
  duration?: number
  decimals?: number
}

const prefersReducedMotion = () =>
  typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches

/**
 * Count-up used for hero figures. Short by design (capped at 900ms) so numbers
 * settle quickly; skipped entirely when the user prefers reduced motion.
 */
export function useCounterAnimation({
  end,
  start = 0,
  duration = 900,
  decimals = 0
}: UseCounterAnimationOptions) {
  const [count, setCount] = useState(start)

  useEffect(() => {
    if (start === end || prefersReducedMotion()) {
      setCount(end)
      return
    }

    const total = Math.min(duration, 900)
    const startTime = performance.now()
    const change = end - start
    let raf = 0

    const tick = (now: number) => {
      const progress = Math.min((now - startTime) / total, 1)
      const eased = 1 - Math.pow(1 - progress, 3)
      const value = start + change * eased
      setCount(decimals > 0 ? parseFloat(value.toFixed(decimals)) : Math.floor(value))
      if (progress < 1) raf = requestAnimationFrame(tick)
      else setCount(end)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [end, start, duration, decimals])

  return count
}
