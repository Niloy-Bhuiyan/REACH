# REACH pixel art

The restored true-alpha glyph family. Integer scaling only, `image-rendering: pixelated`,
no drop shadow, no glow. Rendered through `src/components/ui/PixelIcon.tsx`.

## Do not use — opaque screenshot crops

Four files in this directory are **not** artwork. They are crops of a rendered page, with
fragments of the old UI baked into the pixels — headings, card edges, search fields, and copy
that no longer exists in the product. They render as ghost text behind the hero.

| File | What is baked in |
| --- | --- |
| `hero-left.png` | A "Biggest blocker" card, a search field edge, a clipped headline |
| `hero-right.png` | A "View My Roadmap" card and a search field edge |
| `horizon.png` | Most of the old Focus screen — headline, search, three cards |
| `horizon-mobile.png` | A line of body copy across the top, a card edge at the bottom |

The clean pair is **`horizon-left.png` and `horizon-right.png`**. Every hero — desktop and
mobile — composes from those two.

`scene-path.png`, `scene-path-390.png` and `scene-profile.png` are flat placeholder bands
rather than finished scenery; treat them as unfinished, not as assets.
