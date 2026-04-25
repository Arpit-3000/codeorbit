"use client"

import { useCounterAnimation } from "@/hooks/use-counter-animation"

interface AnimatedNumberProps {
  value: number
  duration?: number
  decimals?: number
  prefix?: string
  suffix?: string
  className?: string
  formatNumber?: boolean
}

export function AnimatedNumber({
  value,
  duration = 2000,
  decimals = 0,
  prefix = "",
  suffix = "",
  className = "",
  formatNumber = false
}: AnimatedNumberProps) {
  const animatedValue = useCounterAnimation({
    end: value,
    duration,
    decimals
  })

  const formatValue = (num: number) => {
    if (formatNumber && num >= 1000) {
      if (num >= 1000000) {
        return (num / 1000000).toFixed(1) + 'M'
      } else if (num >= 1000) {
        return (num / 1000).toFixed(1) + 'K'
      }
    }
    return decimals > 0 ? num.toFixed(decimals) : num.toString()
  }

  return (
    <span className={`${className} animate-count-up`}>
      {prefix}{formatValue(animatedValue)}{suffix}
    </span>
  )
}