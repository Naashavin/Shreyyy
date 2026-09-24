"use client"

import { useEffect, useImperativeHandle, useRef, forwardRef } from "react"
import { fbm1D } from "@/lib/noise"

export type CakeHandle = {
  /** Extinguish one candle; resolves the flame's screen position for smoke. */
  extinguishAt: (index: number) => { x: number; y: number } | null
  candleCount: number
}

type FlameProps = {
  index: number
  x: number
  baseY: number
  seed: number
  speed: number
  litRef: React.MutableRefObject<boolean[]>
}

// One candle flame. Flicker is driven by layered value-noise (never a CSS
// loop), and each flame has its own seed + speed so they never move in unison.
function Flame({ index, x, baseY, seed, speed, litRef }: FlameProps) {
  const groupRef = useRef<SVGGElement>(null)
  const flameRef = useRef<SVGGElement>(null)
  const glowRef = useRef<SVGCircleElement>(null)
  const extinguishRef = useRef(1) // 1 = full, animates to 0 when blown out

  useEffect(() => {
    let raf = 0
    const start = performance.now()
    const flame = flameRef.current
    const glow = glowRef.current
    if (!flame || !glow) return
    flame.style.transformBox = "fill-box"
    flame.style.transformOrigin = "50% 100%"

    const render = (t: number) => {
      const time = (t - start) / 1000
      const lit = litRef.current[index]
      if (!lit && extinguishRef.current > 0) {
        extinguishRef.current = Math.max(0, extinguishRef.current - 0.06)
      }
      const e = extinguishRef.current

      if (e <= 0.001) {
        flame.style.opacity = "0"
        glow.style.opacity = "0"
        raf = requestAnimationFrame(render)
        return
      }

      const n1 = fbm1D(time * speed, seed, 3)
      const n2 = fbm1D(time * speed + 50, seed + 7, 3)
      const n3 = fbm1D(time * speed + 120, seed + 13, 2)

      const scaleY = (1 + (n1 - 0.5) * 0.55) * e
      const scaleX = (1 + (n2 - 0.5) * 0.32) * (0.6 + e * 0.4)
      const skew = (n3 - 0.5) * 14
      const dx = (n2 - 0.5) * 2.2

      flame.style.transform = `translateX(${dx}px) skewX(${skew}deg) scale(${scaleX}, ${scaleY})`
      flame.style.opacity = `${(0.85 + n1 * 0.15) * e}`

      const glowPulse = 0.35 + n1 * 0.25
      glow.style.opacity = `${glowPulse * e}`
      glow.setAttribute("r", `${(11 + n2 * 4) * e}`)

      raf = requestAnimationFrame(render)
    }
    raf = requestAnimationFrame(render)
    return () => cancelAnimationFrame(raf)
  }, [index, seed, speed, litRef])

  const flameTop = baseY - 22
  const flameMid = baseY - 12

  return (
    <g ref={groupRef}>
      <circle
        ref={glowRef}
        cx={x}
        cy={baseY - 12}
        r={12}
        fill="url(#flameGlow)"
        style={{ mixBlendMode: "screen" }}
      />
      <g ref={flameRef}>
        <path
          d={`M ${x} ${flameTop} C ${x + 5} ${flameMid}, ${x + 4} ${baseY}, ${x} ${baseY} C ${x - 4} ${baseY}, ${x - 5} ${flameMid}, ${x} ${flameTop} Z`}
          fill="url(#flameOuter)"
        />
        <path
          d={`M ${x} ${baseY - 15} C ${x + 2.6} ${baseY - 9}, ${x + 2.2} ${baseY - 2}, ${x} ${baseY - 2} C ${x - 2.2} ${baseY - 2}, ${x - 2.6} ${baseY - 9}, ${x} ${baseY - 15} Z`}
          fill="url(#flameInner)"
        />
      </g>
    </g>
  )
}

type CakeProps = {
  candleCount?: number
  className?: string
}

export const Cake = forwardRef<CakeHandle, CakeProps>(function Cake(
  { candleCount = 6, className },
  ref,
) {
  const svgRef = useRef<SVGSVGElement>(null)
  const litRef = useRef<boolean[]>(Array.from({ length: candleCount }, () => true))
  const flameRefs = useRef<Array<{ x: number; y: number }>>([])

  // Even candle spacing across the top tier.
  const cx = 150
  const spread = Math.min(24 * (candleCount - 1), 150)
  const candleXs = Array.from({ length: candleCount }, (_, i) =>
    candleCount === 1 ? cx : cx - spread / 2 + (spread / (candleCount - 1)) * i,
  )
  const candleTopY = 96
  const flameBaseY = candleTopY - 4

  candleXs.forEach((x, i) => {
    flameRefs.current[i] = { x, y: flameBaseY }
  })

  const personalities = [
    { seed: 1.3, speed: 3.1 },
    { seed: 4.7, speed: 2.4 },
    { seed: 8.2, speed: 3.8 },
    { seed: 2.9, speed: 2.9 },
  ]

  useImperativeHandle(ref, () => ({
    candleCount,
    extinguishAt: (index: number) => {
      if (index < 0 || index >= candleCount) return null
      if (!litRef.current[index]) return null
      litRef.current[index] = true // keep reference stable
      litRef.current = litRef.current.map((v, i) => (i === index ? false : v))
      // Convert the flame's SVG coords to screen coords for smoke/confetti.
      const svg = svgRef.current
      if (!svg) return null
      const rect = svg.getBoundingClientRect()
      const vb = 300
      const scale = rect.width / vb
      const { x, y } = flameRefs.current[index]
      return {
        x: rect.left + x * scale,
        y: rect.top + (y - 14) * scale,
      }
    },
  }))

  return (
    <svg
      ref={svgRef}
      viewBox="0 0 300 260"
      className={className}
      role="img"
      aria-label="A birthday cake with lit candles"
    >
      <defs>
        <radialGradient id="flameGlow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#ffd27a" stopOpacity="0.9" />
          <stop offset="100%" stopColor="#ff9d2f" stopOpacity="0" />
        </radialGradient>
        <linearGradient id="flameOuter" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#fff3b0" />
          <stop offset="45%" stopColor="#ffb703" />
          <stop offset="100%" stopColor="#ff7a1a" />
        </linearGradient>
        <linearGradient id="flameInner" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#ffffff" />
          <stop offset="100%" stopColor="#ffe6a1" />
        </linearGradient>
        <linearGradient id="frosting" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#fff0f5" />
          <stop offset="100%" stopColor="#ffd0e0" />
        </linearGradient>
        <linearGradient id="tier1" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#ff9dc0" />
          <stop offset="100%" stopColor="#e06a97" />
        </linearGradient>
        <linearGradient id="tier2" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#c39bff" />
          <stop offset="100%" stopColor="#8f66d6" />
        </linearGradient>
        <radialGradient id="plateGlow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#ffb703" stopOpacity="0.25" />
          <stop offset="100%" stopColor="#ffb703" stopOpacity="0" />
        </radialGradient>
      </defs>

      {/* Ambient glow pooling under the cake */}
      <ellipse cx="150" cy="235" rx="140" ry="26" fill="url(#plateGlow)" />

      {/* Candles */}
      {candleXs.map((x, i) => (
        <g key={`candle-${i}`}>
          <rect
            x={x - 3}
            y={candleTopY}
            width="6"
            height="34"
            rx="3"
            fill={i % 2 === 0 ? "#ff6f91" : "#7dd3fc"}
          />
          <rect
            x={x - 3}
            y={candleTopY}
            width="3"
            height="34"
            rx="1.5"
            fill="rgba(255,255,255,0.35)"
          />
          {/* wick */}
          <rect x={x - 0.6} y={candleTopY - 6} width="1.2" height="6" fill="#4a3a2a" />
        </g>
      ))}

      {/* Flames (rendered above wicks) */}
      {candleXs.map((x, i) => (
        <Flame
          key={`flame-${i}`}
          index={i}
          x={x}
          baseY={flameBaseY}
          seed={personalities[i % personalities.length].seed}
          speed={personalities[i % personalities.length].speed}
          litRef={litRef}
        />
      ))}

      {/* Top frosting with drips */}
      <path
        d="M 70 150 Q 70 128 95 128 L 205 128 Q 230 128 230 150 L 230 152 Q 214 168 200 152 Q 186 168 172 152 Q 158 168 144 152 Q 130 168 116 152 Q 102 168 88 152 Q 78 160 70 152 Z"
        fill="url(#frosting)"
      />
      {/* Top tier */}
      <rect x="70" y="148" width="160" height="42" rx="10" fill="url(#tier1)" />
      {/* Sprinkle dots */}
      {Array.from({ length: 10 }).map((_, i) => (
        <circle
          key={`s-${i}`}
          cx={82 + i * 15}
          cy={168 + (i % 2) * 8}
          r="2"
          fill={["#fff0f5", "#ffe08a", "#c8b6ff"][i % 3]}
        />
      ))}
      {/* Bottom tier */}
      <rect x="55" y="188" width="190" height="46" rx="12" fill="url(#tier2)" />
      <path
        d="M 55 200 Q 74 214 92 200 Q 110 214 128 200 Q 146 214 164 200 Q 182 214 200 200 Q 218 214 236 200 L 245 200 L 245 190 L 55 190 Z"
        fill="url(#frosting)"
        opacity="0.9"
      />
      {/* Plate */}
      <ellipse cx="150" cy="236" rx="120" ry="12" fill="#2a2036" />
      <ellipse cx="150" cy="234" rx="120" ry="10" fill="#3a2e4a" />
    </svg>
  )
})
