"use client"

import { useEffect, useState } from "react"

/** Tracks prefers-reduced-motion so sections can pick a calm fallback path. */
export function useReducedMotion() {
  const [reduced, setReduced] = useState(false)
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)")
    setReduced(mq.matches)
    const onChange = () => setReduced(mq.matches)
    mq.addEventListener("change", onChange)
    return () => mq.removeEventListener("change", onChange)
  }, [])
  return reduced
}

/** Detects touch/coarse pointers so we can swap cursor + gesture behaviour. */
export function useIsTouch() {
  const [touch, setTouch] = useState(false)
  useEffect(() => {
    const mq = window.matchMedia("(pointer: coarse)")
    setTouch(mq.matches)
    const onChange = () => setTouch(mq.matches)
    mq.addEventListener("change", onChange)
    return () => mq.removeEventListener("change", onChange)
  }, [])
  return touch
}
