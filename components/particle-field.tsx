"use client"

import {
  createContext,
  useContext,
  useEffect,
  useRef,
  type ReactNode,
} from "react"

type ParticleKind = "dust" | "smoke" | "confetti" | "spark"

type Particle = {
  kind: ParticleKind
  x: number
  y: number
  vx: number
  vy: number
  life: number
  maxLife: number
  size: number
  rot: number
  vrot: number
  color: string
  gravity: number
  drag: number
}

type ParticleApi = {
  burstConfetti: (x: number, y: number) => void
  smoke: (x: number, y: number) => void
  flash: () => void
}

const ParticleContext = createContext<ParticleApi | null>(null)

export function useParticles() {
  const ctx = useContext(ParticleContext)
  if (!ctx) throw new Error("useParticles must be used inside ParticleProvider")
  return ctx
}

const CONFETTI_COLORS = [
  "#ffd6e7",
  "#ff8fb1",
  "#ffb703",
  "#ffe08a",
  "#c8b6ff",
  "#fff0f5",
  "#ff5d8f",
]

function isReduced() {
  return (
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches
  )
}

export function ParticleProvider({ children }: { children: ReactNode }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const particlesRef = useRef<Particle[]>([])
  const flashRef = useRef(0)
  const apiRef = useRef<ParticleApi | null>(null)
  const dprRef = useRef(1)
  const mobileRef = useRef(false)

  // Performance budget: fewer particles on mobile / low-core devices.
  const capRef = useRef(200)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext("2d")
    if (!ctx) return

    const cores =
      (navigator as Navigator & { hardwareConcurrency?: number })
        .hardwareConcurrency ?? 4
    mobileRef.current = window.innerWidth < 768 || cores <= 4
    capRef.current = mobileRef.current ? 90 : 220

    const resize = () => {
      dprRef.current = Math.min(window.devicePixelRatio || 1, 2)
      canvas.width = window.innerWidth * dprRef.current
      canvas.height = window.innerHeight * dprRef.current
      canvas.style.width = `${window.innerWidth}px`
      canvas.style.height = `${window.innerHeight}px`
    }
    resize()
    window.addEventListener("resize", resize)

    const list = particlesRef.current

    const spawnDust = () => {
      if (isReduced()) return
      const target = mobileRef.current ? 18 : 40
      const dustCount = list.filter((p) => p.kind === "dust").length
      if (dustCount < target) {
        list.push({
          kind: "dust",
          x: Math.random() * window.innerWidth,
          y: window.innerHeight + 10,
          vx: (Math.random() - 0.5) * 0.15,
          vy: -0.15 - Math.random() * 0.25,
          life: 0,
          maxLife: 8000 + Math.random() * 6000,
          size: 0.6 + Math.random() * 1.8,
          rot: 0,
          vrot: 0,
          color: "255, 226, 170",
          gravity: 0,
          drag: 1,
        })
      }
    }

    let last = performance.now()
    let raf = 0
    const tick = (t: number) => {
      const dt = Math.min(48, t - last)
      last = t
      spawnDust()

      ctx.setTransform(dprRef.current, 0, 0, dprRef.current, 0, 0)
      ctx.clearRect(0, 0, window.innerWidth, window.innerHeight)

      for (let i = list.length - 1; i >= 0; i--) {
        const p = list[i]
        p.life += dt
        if (p.life >= p.maxLife) {
          list.splice(i, 1)
          continue
        }
        p.vy += p.gravity * (dt / 16)
        p.vx *= p.drag
        p.vy *= p.drag
        p.x += p.vx * (dt / 16)
        p.y += p.vy * (dt / 16)
        p.rot += p.vrot * (dt / 16)
        const k = p.life / p.maxLife

        if (p.kind === "dust") {
          const a = Math.sin(k * Math.PI) * 0.5
          ctx.beginPath()
          ctx.fillStyle = `rgba(${p.color}, ${a})`
          ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2)
          ctx.fill()
        } else if (p.kind === "smoke") {
          const a = Math.sin(k * Math.PI) * 0.28
          const r = p.size * (1 + k * 3)
          ctx.beginPath()
          ctx.fillStyle = `rgba(${p.color}, ${a})`
          ctx.arc(p.x, p.y, r, 0, Math.PI * 2)
          ctx.fill()
        } else if (p.kind === "spark") {
          const a = 1 - k
          ctx.beginPath()
          ctx.fillStyle = `rgba(${p.color}, ${a})`
          ctx.shadowBlur = 8
          ctx.shadowColor = `rgba(${p.color}, ${a})`
          ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2)
          ctx.fill()
          ctx.shadowBlur = 0
        } else {
          // confetti
          const a = k > 0.8 ? (1 - k) / 0.2 : 1
          ctx.save()
          ctx.translate(p.x, p.y)
          ctx.rotate(p.rot)
          ctx.globalAlpha = a
          ctx.fillStyle = p.color
          const w = p.size
          const h = p.size * 0.5
          ctx.fillRect(-w / 2, -h / 2, w, h)
          ctx.restore()
          ctx.globalAlpha = 1
        }
      }

      if (flashRef.current > 0) {
        ctx.fillStyle = `rgba(255, 240, 220, ${flashRef.current * 0.6})`
        ctx.fillRect(0, 0, window.innerWidth, window.innerHeight)
        flashRef.current = Math.max(0, flashRef.current - dt / 450)
      }

      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)

    apiRef.current = {
      burstConfetti: (x, y) => {
        if (isReduced()) {
          flashRef.current = 0.6
          return
        }
        const count = mobileRef.current ? 70 : 190
        for (let i = 0; i < count; i++) {
          const angle = Math.random() * Math.PI * 2
          const speed = 3 + Math.random() * 11
          list.push({
            kind: Math.random() > 0.75 ? "spark" : "confetti",
            x,
            y,
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed - 4,
            life: 0,
            maxLife: 1600 + Math.random() * 1600,
            size: 5 + Math.random() * 7,
            rot: Math.random() * Math.PI,
            vrot: (Math.random() - 0.5) * 0.4,
            color:
              CONFETTI_COLORS[
                Math.floor(Math.random() * CONFETTI_COLORS.length)
              ],
            gravity: 0.16,
            drag: 0.99,
          })
        }
        // trim to budget
        if (list.length > capRef.current + count) {
          list.splice(0, list.length - (capRef.current + count))
        }
      },
      smoke: (x, y) => {
        if (isReduced()) return
        const count = mobileRef.current ? 5 : 9
        for (let i = 0; i < count; i++) {
          list.push({
            kind: "smoke",
            x: x + (Math.random() - 0.5) * 6,
            y,
            vx: (Math.random() - 0.5) * 0.4,
            vy: -0.8 - Math.random() * 0.8,
            life: 0,
            maxLife: 1200 + Math.random() * 900,
            size: 3 + Math.random() * 3,
            rot: 0,
            vrot: 0,
            color: "220, 220, 230",
            gravity: -0.005,
            drag: 0.99,
          })
        }
      },
      flash: () => {
        flashRef.current = 0.8
      },
    }

    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener("resize", resize)
    }
  }, [])

  // Stable API wrapper so context consumers always get a valid object.
  const api: ParticleApi = {
    burstConfetti: (x, y) => apiRef.current?.burstConfetti(x, y),
    smoke: (x, y) => apiRef.current?.smoke(x, y),
    flash: () => apiRef.current?.flash(),
  }

  return (
    <ParticleContext.Provider value={api}>
      <canvas
        ref={canvasRef}
        aria-hidden
        className="pointer-events-none fixed inset-0 z-[60]"
      />
      {children}
    </ParticleContext.Provider>
  )
}
