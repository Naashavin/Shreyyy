"use client"

import { useEffect, useRef, useState } from "react"
import { audio } from "@/lib/audio"
import { randomNickname } from "@/lib/nicknames"

export function EntryGate({ onBegin }: { onBegin: () => void }) {
  const [leaving, setLeaving] = useState(false)
  const [nickname, setNickname] = useState("Shreyyy")
  const rootRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    setNickname(randomNickname())
  }, [])

  const begin = async () => {
    if (leaving) return
    await audio.unlock()
    audio.startMusic()
    setLeaving(true)
    window.setTimeout(onBegin, 900)
  }

  return (
    <div
      ref={rootRef}
      data-cursor
      data-cursor-label="begin"
      onClick={begin}
      className={`fixed inset-0 z-[70] flex cursor-pointer flex-col items-center justify-center overflow-hidden bg-[#0a0710] transition-opacity duration-700 ${
        leaving ? "pointer-events-none opacity-0" : "opacity-100"
      }`}
    >
      {/* soft radial ambience */}
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_40%,rgba(255,143,177,0.16),transparent_60%)]" />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_80%,rgba(200,182,255,0.12),transparent_55%)]" />

      <p className="mb-4 font-serif text-sm uppercase tracking-[0.5em] text-rose-200/70">
        A birthday wish for
      </p>
      <h1 className="gate-name font-script text-6xl text-rose-50 sm:text-7xl md:text-8xl">
        {nickname}
      </h1>

      <div className="mt-16 flex flex-col items-center gap-4">
        <span className="gate-pulse relative flex h-16 w-16 items-center justify-center rounded-full border border-rose-200/50">
          <span className="absolute inset-0 rounded-full border border-rose-200/40" />
          <span className="h-2.5 w-2.5 rounded-full bg-rose-100" />
        </span>
        <span className="font-serif text-xs uppercase tracking-[0.4em] text-rose-100/70">
          Tap to begin
        </span>
      </div>
    </div>
  )
}
