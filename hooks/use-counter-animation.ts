import { useEffect, useState } from 'react'

interface UseCounterAnimationOptions {
  end: number
  start?: number
  duration?: number
  decimals?: number
}

export function useCounterAnimation({
  end,
  start = 0,
  duration = 2000,
  decimals = 0
}: UseCounterAnimationOptions) {
  const [count, setCount] = useState(start)

  useEffect(() => {
    if (start === end) return

    const startTime = Date.now()
    const startValue = start
    const endValue = end
    const totalChange = endValue - startValue

    const animateCount = () => {
      const now = Date.now()
      const elapsed = now - startTime
      const progress = Math.min(elapsed / duration, 1)

      // Easing function for smooth animation (ease-out)
      const easeOut = 1 - Math.pow(1 - progress, 3)
      
      const currentValue = startValue + (totalChange * easeOut)
      
      if (decimals > 0) {
        setCount(parseFloat(currentValue.toFixed(decimals)))
      } else {
        setCount(Math.floor(currentValue))
      }

      if (progress < 1) {
        requestAnimationFrame(animateCount)
      } else {
        setCount(endValue)
      }
    }

    const timer = setTimeout(() => {
      requestAnimationFrame(animateCount)
    }, 100) // Small delay to make the animation more noticeable

    return () => clearTimeout(timer)
  }, [end, start, duration, decimals])

  return count
}