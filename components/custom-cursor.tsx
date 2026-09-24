"use client"

import { useEffect, useRef } from "react"
import { useIsTouch } from "@/lib/use-reduced-motion"

export function CustomCursor() {
  const isTouch = useIsTouch()
  const dotRef = useRef<HTMLDivElement>(null)
  const ringRef = useRef<HTMLDivElement>(null)
  const labelRef = useRef<HTMLSpanElement>(null)
  const rippleLayer = useRef<HTMLDivElement>(null)

  // ---- Desktop: lerp-follow dot + ring with contextual hover label ----
  useEffect(() => {
    if (isTouch) return
    const dot = dotRef.current
    const ring = ringRef.current
    const label = labelRef.current
    if (!dot || !ring || !label) return

    const mouse = { x: window.innerWidth / 2, y: window.innerHeight / 2 }
    const ringPos = { x: mouse.x, y: mouse.y }
    let hovering = false
    let visible = false

    const onMove = (e: MouseEvent) => {
      mouse.x = e.clientX
      mouse.y = e.clientY
      if (!visible) {
        visible = true
        dot.style.opacity = "1"
        ring.style.opacity = "1"
      }
      const target = (e.target as HTMLElement)?.closest<HTMLElement>(
        "[data-cursor]",
      )
      if (target) {
        hovering = true
        const text = target.dataset.cursorLabel || ""
        label.textContent = text
        ring.dataset.state = "hover"
      } else {
        hovering = false
        ring.dataset.state = "default"
        label.textContent = ""
      }
    }

    const onLeave = () => {
      visible = false
      dot.style.opacity = "0"
      ring.style.opacity = "0"
    }
    const onDown = () => (ring.dataset.press = "true")
    const onUp = () => (ring.dataset.press = "false")

    window.addEventListener("mousemove", onMove)
    window.addEventListener("mouseout", onLeave)
    window.addEventListener("mousedown", onDown)
    window.addEventListener("mouseup", onUp)

    let raf = 0
    const render = () => {
      ringPos.x += (mouse.x - ringPos.x) * 0.16
      ringPos.y += (mouse.y - ringPos.y) * 0.16
      dot.style.transform = `translate3d(${mouse.x}px, ${mouse.y}px, 0) translate(-50%, -50%)`
      ring.style.transform = `translate3d(${ringPos.x}px, ${ringPos.y}px, 0) translate(-50%, -50%) scale(${hovering ? 1 : 0.9})`
      raf = requestAnimationFrame(render)
    }
    raf = requestAnimationFrame(render)

    document.documentElement.style.cursor = "none"
    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener("mousemove", onMove)
      window.removeEventListener("mouseout", onLeave)
      window.removeEventListener("mousedown", onDown)
      window.removeEventListener("mouseup", onUp)
      document.documentElement.style.cursor = ""
    }
  }, [isTouch])

  // ---- Touch: ripple-on-tap ----
  useEffect(() => {
    if (!isTouch) return
    const layer = rippleLayer.current
    if (!layer) return
    const onTouch = (e: TouchEvent) => {
      const t = e.touches[0] || e.changedTouches[0]
      if (!t) return
      const r = document.createElement("span")
      r.className = "cursor-ripple"
      r.style.left = `${t.clientX}px`
      r.style.top = `${t.clientY}px`
      layer.appendChild(r)
      r.addEventListener("animationend", () => r.remove())
    }
    window.addEventListener("touchstart", onTouch, { passive: true })
    return () => window.removeEventListener("touchstart", onTouch)
  }, [isTouch])

  if (isTouch) {
    return (
      <div
        ref={rippleLayer}
        aria-hidden
        className="pointer-events-none fixed inset-0 z-[80]"
      />
    )
  }

  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 z-[80] max-md:hidden">
      <div
        ref={dotRef}
        className="fixed left-0 top-0 h-1.5 w-1.5 rounded-full bg-rose-100 opacity-0 transition-opacity duration-300"
      />
      <div
        ref={ringRef}
        data-state="default"
        data-press="false"
        className="cursor-ring fixed left-0 top-0 flex items-center justify-center rounded-full border border-rose-200/60 opacity-0 transition-[width,height,background-color,border-color] duration-300"
      >
        <span
          ref={labelRef}
          className="font-serif text-[0.7rem] uppercase tracking-[0.2em] text-rose-50"
        />
      </div>
    </div>
  )
}
