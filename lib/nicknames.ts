// Nickname rotation system. Edit this list freely — it feeds every
// "{nickname}" slot across the experience and is injected randomly on load
// and cycled with a crossfade in headings.
export const NICKNAMES = [
  "Shreyyy",
  "Bujju",
  "Pattu",
  "Thangame",
  "Chellame",
  "Bujjuku Bujjuku Kutty",
  "Chubby Kutty",
]

export function randomNickname(exclude?: string) {
  const pool = exclude ? NICKNAMES.filter((n) => n !== exclude) : NICKNAMES
  return pool[Math.floor(Math.random() * pool.length)]
}
