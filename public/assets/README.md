# Assets

Drop real media here. Paths match `lib/sections.config.ts` and the section
components. Everything below the fold should be lazy-loaded (`loading="lazy"`)
with a base64 LQIP blur-up placeholder.

```
/assets/
  /photos/
    /hero/      hero-birth-photo.jpg        (Page 2 — 2000px+ wide, parallaxed)
    /temple/    temple-full.jpg             (Page 3 — source for the 3-slice clip-path)
                temple-bottom-extra.jpg     (Page 3 — paired with the bottom slice)
    /collage/   collage-01.jpg ... NN.jpg   (Page 4 — consistent aspect ratio, e.g. 1:1 or 4:5)
    /future/                                (reserved for Pages 5, 6, 7...)
  /audio/       background-music.mp3, sfx-candle-blow.mp3, sfx-page-chime.mp3, sfx-photo-tap.mp3
  /textures/    grain-overlay.png
```

Note: the Page 1 prototype synthesizes all audio via the Web Audio API
(`lib/audio.ts`) and needs no files. Swap the synth methods for buffer
playback of the `/audio/*.mp3` tracks above when real audio is added.
