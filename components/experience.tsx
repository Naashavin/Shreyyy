"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import Lenis from "lenis"
import gsap from "gsap"
import { ScrollTrigger } from "gsap/ScrollTrigger"
import { EntryGate } from "@/components/entry-gate"
import { CustomCursor } from "@/components/custom-cursor"
import { ParticleProvider } from "@/components/particle-field"
import { CandleIntro } from "@/components/sections/candle-intro"
import { audio } from "@/lib/audio"
import { useReducedMotion } from "@/lib/use-reduced-motion"

gsap.registerPlugin(ScrollTrigger)

export function Experience() {
  const [started, setStarted] = useState(false)
  const [muted, setMuted] = useState(false)
  const lenisRef = useRef<Lenis | null>(null)
  const reduced = useReducedMotion()

  // Set up Lenis inertia scroll + GSAP ScrollTrigger sync once we've begun.
  useEffect(() => {
    if (!started || reduced) return
    const lenis = new Lenis({
      lerp: 0.09,
      wheelMultiplier: 1,
      touchMultiplier: 1.4,
    })
    lenisRef.current = lenis
    lenis.on("scroll", ScrollTrigger.update)
    const raf = (time: number) => lenis.raf(time * 1000)
    gsap.ticker.add(raf)
    gsap.ticker.lagSmoothing(0)

    return () => {
      gsap.ticker.remove(raf)
      lenis.destroy()
      lenisRef.current = null
    }
  }, [started, reduced])

  const scrollToNext = useCallback(() => {
    const target = document.getElementById("continued")
    if (!target) return
    if (lenisRef.current) {
      lenisRef.current.scrollTo(target, { duration: 2.2 })
    } else {
      target.scrollIntoView({ behavior: "smooth" })
    }
    audio.chime()
  }, [])

  const toggleMute = () => {
    setMuted((m) => {
      const next = !m
      audio.setMuted(next)
      return next
    })
  }

  return (
    <ParticleProvider>
      <CustomCursor />

      {!started && <EntryGate onBegin={() => setStarted(true)} />}

      {started && (
        <button
          onClick={toggleMute}
          data-cursor
          data-cursor-label={muted ? "unmute" : "mute"}
          aria-label={muted ? "Unmute music" : "Mute music"}
          className="fixed right-5 top-5 z-[78] flex h-11 items-center gap-2 rounded-full border border-rose-200/30 bg-black/30 px-4 font-serif text-xs uppercase tracking-[0.25em] text-rose-100/80 backdrop-blur-md transition-colors hover:bg-black/50"
        >
          <span className="flex gap-0.5">
            <i className={`sound-bar ${muted ? "muted" : ""}`} />
            <i className={`sound-bar ${muted ? "muted" : ""}`} />
            <i className={`sound-bar ${muted ? "muted" : ""}`} />
          </span>
          {muted ? "sound off" : "sound on"}
        </button>
      )}

      <main className="relative w-full bg-[#0a0710] text-rose-50">
        <CandleIntro onComplete={scrollToNext} />

        {/* Scaffold destination for the post-wish scroll transition.
            Pages 2–4 register here per sections.config.ts. */}
        <section
          id="continued"
          className="relative flex min-h-[100svh] flex-col items-center justify-center gap-5 px-8 text-center"
        >
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_20%,rgba(200,182,255,0.14),transparent_55%)]" />
          <p className="relative font-serif text-xs uppercase tracking-[0.45em] text-rose-200/60">
            The story continues
          </p>
          <h2 className="relative max-w-md font-script text-4xl leading-tight text-rose-50 sm:text-5xl">
            There&apos;s so much more of you to celebrate
          </h2>
          <p className="relative max-w-sm font-serif text-base text-rose-100/70">
            Pages 2–4 — your hero portrait, the temple, and the mosaic of us —
            slot in right here, on this same scroll.
          </p>
        </section>
      </main>
    </ParticleProvider>
  )
}
