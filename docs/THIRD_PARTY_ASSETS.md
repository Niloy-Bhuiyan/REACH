# Third-party brand assets

REACH draws its own iconography — the pixel-glyph family in `frontend/public/art`. The only
non-REACH marks in the product identify third-party services a user connects to: evidence
sources and analysis engines. A recognisable logo answers "is my GitHub connected?" faster than
any house glyph could; nowhere else is a third-party mark used.

Each mark below was downloaded from the source named, inlined into
`frontend/src/components/ui/BrandIcon.tsx` as path data, and kept in its original form in
`frontend/public/brand/` for provenance. None was redrawn, recoloured in a way that alters the
mark, stretched, or combined with other marks.

| Mark | File | Source | Licence of the icon file |
| --- | --- | --- | --- |
| GitHub | `public/brand/github.svg` | [Simple Icons](https://github.com/simple-icons/simple-icons/blob/master/icons/github.svg) | CC0 1.0 Universal |
| Kaggle | `public/brand/kaggle.svg` | [Font Awesome Free 6.7.2](https://github.com/FortAwesome/Font-Awesome/blob/6.x/svgs/brands/kaggle.svg) | CC BY 4.0 (icons) |
| Claude | `public/brand/claude.svg` | [Simple Icons](https://github.com/simple-icons/simple-icons/blob/master/icons/claude.svg) | CC0 1.0 Universal |
| LinkedIn | `public/brand/linkedin.svg` | [Font Awesome Free 6.7.2](https://github.com/FortAwesome/Font-Awesome/blob/6.x/svgs/brands/linkedin-in.svg) — `linkedin-in` | CC BY 4.0 (icons) |
| OpenAI | `public/brand/openai.svg` | [`@lobehub/icons-static-svg`](https://www.npmjs.com/package/@lobehub/icons-static-svg) v1.94.0 | MIT |

LinkedIn and OpenAI were both removed from Simple Icons at the request of the respective
trademark holders, which is why they come from the two sources above instead.

Kaggle is available from both. Simple Icons ships the **wordmark**, which is illegible in an
18px icon box beside square marks, so the product uses Font Awesome's **symbol** mark instead.
The wordmark is kept unused at `public/brand/kaggle-wordmark.svg` for provenance.

## Attribution

Font Awesome Free icons are CC BY 4.0 and require attribution. The licence header shipped in
`public/brand/linkedin.svg` and `public/brand/kaggle.svg` is preserved verbatim in those files,
and this document is the attribution of record:

> LinkedIn and Kaggle icons by [Font Awesome](https://fontawesome.com) — Font Awesome Free
> 6.7.2, icons licensed under [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/).

## Trademarks

A permissive licence on an icon **file** is not a licence to the **trademark** it depicts.
GitHub, LinkedIn, Kaggle, Claude/Anthropic and OpenAI/ChatGPT are trademarks of their
respective owners. REACH uses these marks nominatively — to identify the service a user is
connecting, in a list of services — which is what each brand's guidelines permit.

Rules the product follows, and must keep following:

- The mark identifies a connection the user chose. It never implies partnership, endorsement,
  certification or affiliation.
- Marks are rendered at their published proportions, never stretched, rotated, outlined,
  animated, or placed inside another logo.
- Marks are monochrome (`currentColor`) so they sit in REACH's palette without altering the
  mark's shape. Where a brand requires its exact colour, the original file in `public/brand/`
  is the one to switch to.
- No third-party mark appears in REACH's own logo, favicon, marketing hero, or app icon.
- Analysis-engine provider marks are confined to `/profile/settings`, per DNA v2 §09.

Before any public launch, re-check each brand's current guidelines — they change:

| Brand | Guidelines |
| --- | --- |
| GitHub | https://github.com/logos |
| LinkedIn | https://brand.linkedin.com/ |
| Kaggle | https://www.kaggle.com/ (contact for brand use) |
| Anthropic / Claude | https://www.anthropic.com/legal/brand |
| OpenAI | https://openai.com/brand |

## Adding another mark

1. Download the SVG from the brand's own asset page, or from Simple Icons if it is listed.
2. Save the untouched file into `frontend/public/brand/`.
3. Re-run the generator note in `BrandIcon.tsx` — add the slug, label, viewBox and path data.
4. Add a row to the table above, with the source URL and the licence.
5. If the licence requires attribution, add it to the Attribution section.

Never substitute a lookalike, a redrawn approximation, an emoji, or a generated icon for a real
brand mark.
