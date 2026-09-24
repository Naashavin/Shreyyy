"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { Cake, type CakeHandle } from "@/components/cake"
import { useParticles } from "@/components/particle-field"
import { audio } from "@/lib/audio"
import { useReducedMotion } from "@/lib/use-reduced-motion"
import { NICKNAMES, randomNickname } from "@/lib/nicknames"

const CANDLE_COUNT = 6
const CHARGE_MS = 800

export function CandleIntro({ onComplete }: { onComplete: () => void }) {
  const cakeRef = useRef<CakeHandle>(null)
  const ringRef = useRef<HTMLDivElement>(null)
  const particles = useParticles()
  const reduced = useReducedMotion()

  const [phase, setPhase] = useState<"idle" | "blowing" | "done">("idle")
  const [micState, setMicState] = useState<"off" | "listening" | "denied">("off")
  const [nickname, setNickname] = useState("birthday girl")

  const chargingRef = useRef(false)
  const progressRef = useRef(0)
  const rafRef = useRef(0)
  const phaseRef = useRef(phase)
  phaseRef.current = phase

  // Crossfade nickname cycler for the heading.
  useEffect(() => {
    setNickname(randomNickname())
    const id = window.setInterval(() => {
      setNickname((prev) => randomNickname(prev))
    }, 2000)
    return () => window.clearInterval(id)
  }, [])

  const cakeCenter = useCallback(() => {
    const el = document.getElementById("cake-svg-wrap")
    if (!el) return { x: window.innerWidth / 2, y: window.innerHeight / 2 }
    const r = el.getBoundingClientRect()
    return { x: r.left + r.width / 2, y: r.top + r.height * 0.34 }
  }, [])

  const runBlowOut = useCallback(() => {
    if (phaseRef.current !== "idle") return
    setPhase("blowing")
    const cake = cakeRef.current
    if (!cake) return

    // Staggered extinguish — never simultaneous.
    for (let i = 0; i < CANDLE_COUNT; i++) {
      const delay = i * (reduced ? 90 : 200)
      window.setTimeout(() => {
        const pos = cake.extinguishAt(i)
        if (pos) {
          particles.smoke(pos.x, pos.y)
          audio.whoosh(0)
        }
      }, delay)
    }

    const totalDelay = CANDLE_COUNT * (reduced ? 90 : 200) + 350
    window.setTimeout(() => {
      const c = cakeCenter()
      particles.burstConfetti(c.x, c.y)
      particles.flash()
      audio.celebrate()
      setPhase("done")
      window.setTimeout(onComplete, 1600)
    }, totalDelay)
  }, [reduced, particles, cakeCenter, onComplete])

  // ---- Hold-to-charge mechanic (desktop click-hold + mobile tap-hold) ----
  useEffect(() => {
    if (reduced) return
    const ring = ringRef.current

    const updateRing = () => {
      if (ring) {
        ring.style.setProperty("--p", `${progressRef.current * 360}deg`)
        ring.style.opacity = chargingRef.current ? "1" : "0"
      }
    }

    let last = performance.now()
    const loop = (t: number) => {
      const dt = t - last
      last = t
      if (chargingRef.current && phaseRef.current === "idle") {
        progressRef.current = Math.min(1, progressRef.current + dt / CHARGE_MS)
        if (progressRef.current >= 1) {
          chargingRef.current = false
          runBlowOut()
        }
      } else if (!chargingRef.current && progressRef.current > 0) {
        progressRef.current = Math.max(0, progressRef.current - dt / 300)
      }
      updateRing()
      rafRef.current = requestAnimationFrame(loop)
    }
    rafRef.current = requestAnimationFrame(loop)

    const move = (x: number, y: number) => {
      if (!ring) return
      ring.style.transform = `translate3d(${x}px, ${y}px, 0) translate(-50%, -50%)`
    }
    const onPointerMove = (e: PointerEvent) => move(e.clientX, e.clientY)
    const onPointerUp = () => (chargingRef.current = false)

    window.addEventListener("pointermove", onPointerMove)
    window.addEventListener("pointerup", onPointerUp)
    window.addEventListener("pointercancel", onPointerUp)
    return () => {
      cancelAnimationFrame(rafRef.current)
      window.removeEventListener("pointermove", onPointerMove)
      window.removeEventListener("pointerup", onPointerUp)
      window.removeEventListener("pointercancel", onPointerUp)
    }
  }, [reduced, runBlowOut])

  const onCakePointerDown = (e: React.PointerEvent) => {
    if (phase !== "idle" || reduced) return
    chargingRef.current = true
    if (ringRef.current) {
      ringRef.current.style.transform = `translate3d(${e.clientX}px, ${e.clientY}px, 0) translate(-50%, -50%)`
    }
  }

  // ---- Optional: blow into the mic to extinguish ----
  const enableMic = async (e: React.MouseEvent) => {
    e.stopPropagation()
    if (micState === "listening") return
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      setMicState("listening")
      const AC =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext })
          .webkitAudioContext
      const ac = new AC()
      const src = ac.createMediaStreamSource(stream)
      const analyser = ac.createAnalyser()
      analyser.fftSize = 512
      src.connect(analyser)
      const data = new Uint8Array(analyser.frequencyBinCount)
      let sustained = 0
      const check = () => {
        if (phaseRef.current !== "idle") {
          stream.getTracks().forEach((t) => t.stop())
          ac.close()
          return
        }
        analyser.getByteTimeDomainData(data)
        let sum = 0
        for (let i = 0; i < data.length; i++) {
          const v = (data[i] - 128) / 128
          sum += v * v
        }
        const rms = Math.sqrt(sum / data.length)
        if (rms > 0.18) sustained += 1
        else sustained = Math.max(0, sustained - 1)
        if (sustained > 6) {
          stream.getTracks().forEach((t) => t.stop())
          ac.close()
          runBlowOut()
          return
        }
        requestAnimationFrame(check)
      }
      check()
    } catch {
      setMicState("denied")
    }
  }

  const blowNowReduced = () => {
    if (phase !== "idle") return
    runBlowOut()
  }

  return (
    <section
      id="candle-intro"
      className="relative flex min-h-[100svh] w-full flex-col items-center justify-center overflow-hidden px-6"
    >
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_35%,rgba(255,183,3,0.12),transparent_55%)]" />

      <header className="relative z-10 mb-8 text-center">
        <p className="font-serif text-xs uppercase tracking-[0.45em] text-rose-200/70">
          Make a wish
        </p>
        <h2 className="mt-3 font-script text-5xl text-rose-50 sm:text-6xl">
          <span className="opacity-70">Happy Birthday, </span>
          <span key={nickname} className="nickname-swap inline-block text-amber-200">
            {nickname}
          </span>
        </h2>
      </header>

      <div
        id="cake-svg-wrap"
        data-cursor
        data-cursor-label={phase === "idle" ? "hold to blow" : ""}
        onPointerDown={onCakePointerDown}
        className="relative z-10 w-[min(78vw,420px)] touch-none select-none"
      >
        <Cake ref={cakeRef} candleCount={CANDLE_COUNT} className="h-auto w-full drop-shadow-[0_20px_40px_rgba(255,120,26,0.15)]" />
      </div>

      <div className="relative z-10 mt-8 flex flex-col items-center gap-4 text-center">
        {phase === "done" ? (
          <p className="font-script text-2xl text-amber-200">Make it count.</p>
        ) : reduced ? (
          <button
            onClick={blowNowReduced}
            className="rounded-full border border-rose-200/50 px-6 py-2 font-serif text-sm uppercase tracking-[0.3em] text-rose-50 transition-colors hover:bg-rose-200/10"
          >
            Blow out the candles
          </button>
        ) : (
          <>
            <p className="font-serif text-sm tracking-[0.15em] text-rose-100/80">
              Press &amp; hold the cake to blow them out
            </p>
            <button
              onClick={enableMic}
              data-cursor
              data-cursor-label="breathe"
              className="rounded-full border border-rose-200/40 px-5 py-1.5 font-serif text-xs uppercase tracking-[0.25em] text-rose-100/70 transition-colors hover:bg-rose-200/10"
            >
              {micState === "listening"
                ? "Listening… blow!"
                : micState === "denied"
                  ? "Mic blocked — just hold instead"
                  : "Or blow into your mic"}
            </button>
          </>
        )}
      </div>

      {/* Charge ring that follows the pointer */}
      <div
        ref={ringRef}
        aria-hidden
        className="charge-ring pointer-events-none fixed left-0 top-0 z-[75] h-[92px] w-[92px] rounded-full opacity-0 transition-opacity duration-200"
      />

      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 font-serif text-[0.7rem] uppercase tracking-[0.3em] text-rose-100/40">
        {NICKNAMES.length} names · one wish
      </div>
    </section>
  )
}
