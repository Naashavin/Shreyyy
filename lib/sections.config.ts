// Central section registry. Adding a future page (5, 6, 7...) is a config
// addition here, not a rewrite: each section declares its id, the asset folder
// it draws from, and its default ScrollTrigger behaviour. The Experience
// orchestrator reads this to know pin/scrub defaults per section.

export type SectionScrollConfig = {
  pin: boolean
  scrub: boolean | number
  snap?: boolean
}

export type SectionConfig = {
  id: string
  label: string
  /** Component key — mapped to a React component in the orchestrator. */
  component: string
  assets: string
  scroll: SectionScrollConfig
  /** Built and shippable now, or reserved scaffold for later. */
  status: "live" | "scaffold"
}

export const SECTIONS: SectionConfig[] = [
  {
    id: "candle-intro",
    label: "Make a wish",
    component: "CandleIntro",
    assets: "/assets/photos/hero/",
    scroll: { pin: true, scrub: 1, snap: true },
    status: "live",
  },
  {
    id: "about-her",
    label: "About her",
    component: "AboutHer",
    assets: "/assets/photos/hero/",
    scroll: { pin: false, scrub: true },
    status: "scaffold",
  },
  {
    id: "temple",
    label: "Temple",
    component: "TempleReveal",
    assets: "/assets/photos/temple/",
    scroll: { pin: true, scrub: true },
    status: "scaffold",
  },
  {
    id: "mosaic",
    label: "The big picture",
    component: "MosaicCollage",
    assets: "/assets/photos/collage/",
    scroll: { pin: false, scrub: false },
    status: "scaffold",
  },
]
