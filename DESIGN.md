---
name: Nash Carroll — Portfolio
description: A Swiss typographic poster that is also an index of work. Paper, ink, one red.
colors:
  paper: "#f4f4f1"
  ink: "#111111"
  ink-2: "#4a4a46"
  hair: "#b9b9b2"
  signal: "#cf2a15"
typography:
  poster:
    fontFamily: "'Schibsted Grotesk Variable', 'Schibsted Grotesk', 'Helvetica Neue', Arial, sans-serif"
    fontSize: "clamp(4.5rem, 16vw, 16rem)"
    fontWeight: 800
    lineHeight: 0.84
    letterSpacing: "-0.055em"
  display:
    fontFamily: "'Schibsted Grotesk Variable', 'Schibsted Grotesk', 'Helvetica Neue', Arial, sans-serif"
    fontSize: "clamp(3.5rem, 9.5vw, 8.5rem)"
    fontWeight: 800
    lineHeight: 0.88
    letterSpacing: "-0.05em"
  headline:
    fontFamily: "'Schibsted Grotesk Variable', 'Schibsted Grotesk', 'Helvetica Neue', Arial, sans-serif"
    fontSize: "clamp(2rem, 3.9vw, 3.5rem)"
    fontWeight: 700
    lineHeight: 1
    letterSpacing: "-0.035em"
  lede:
    fontFamily: "'Schibsted Grotesk Variable', 'Schibsted Grotesk', 'Helvetica Neue', Arial, sans-serif"
    fontSize: "clamp(1.375rem, 2.1vw, 1.75rem)"
    fontWeight: 500
    lineHeight: 1.32
    letterSpacing: "-0.012em"
  title:
    fontFamily: "'Schibsted Grotesk Variable', 'Schibsted Grotesk', 'Helvetica Neue', Arial, sans-serif"
    fontSize: "1.375rem"
    fontWeight: 700
    lineHeight: 1.15
    letterSpacing: "-0.015em"
  body:
    fontFamily: "'Schibsted Grotesk Variable', 'Schibsted Grotesk', 'Helvetica Neue', Arial, sans-serif"
    fontSize: "1.125rem"
    fontWeight: 400
    lineHeight: 1.55
  small:
    fontFamily: "'Schibsted Grotesk Variable', 'Schibsted Grotesk', 'Helvetica Neue', Arial, sans-serif"
    fontSize: "1rem"
    fontWeight: 400
    lineHeight: 1.45
  label:
    fontFamily: "'Schibsted Grotesk Variable', 'Schibsted Grotesk', 'Helvetica Neue', Arial, sans-serif"
    fontSize: "0.875rem"
    fontWeight: 700
    lineHeight: 1.2
rounded:
  none: "0px"
spacing:
  margin: "clamp(20px, 4.4vw, 64px)"
  gutter: "clamp(16px, 1.7vw, 24px)"
  block: "clamp(72px, 9vw, 128px)"
  tap: "44px"
components:
  button:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.paper}"
    rounded: "{rounded.none}"
    padding: "0 22px"
    height: "52px"
  button-hover:
    backgroundColor: "{colors.signal}"
    textColor: "{colors.paper}"
  index-row:
    textColor: "{colors.ink}"
    typography: "{typography.headline}"
    padding: "22px 0 24px"
  index-row-hover:
    textColor: "{colors.signal}"
---

# Design System: Nash Carroll — Portfolio

## Overview

**Creative North Star: "The poster that is also the index"**

International Typographic Style, applied to a portfolio. The page is set like a Swiss poster: a 12-column
grid, one grotesk in several weights, black rules, and the name at poster scale. Below the poster the same
grid becomes an index: ruled rows for work, ruled rows for facts about a project, ruled rows for the resume.
Hierarchy comes from size, weight and rules, never from boxes, shadows or color.

**Key characteristics**

- Light paper, black ink, one red used sparingly.
- One family (Schibsted Grotesk) from regular to black. No second face.
- Every block opens with a 2px rule; rows inside a block are divided by 1px rules.
- Headings sit in the left three columns, text in columns 4–10, so every page reads like the same poster.
- No cards, no radii, no drop shadows, no decorative icons. Arrows only.

## Colors

### Primary
- **Signal red** (#cf2a15): the one accent. "Open to software engineering roles", the step numbers in a
  process, inline code, hover on links and index rows, focus rings and selection. Never a background area
  except the button's hover state.

### Neutral
- **Paper** (#f4f4f1): the page.
- **Ink** (#111111): text, rules, and the solid button.
- **Ink 2** (#4a4a46): secondary text: summaries, captions, dates.
- **Hair** (#b9b9b2): the underline color of in-text links.

**The One Red Rule.** Red marks the one thing on a screen that is live or asks for action. If two things
on a screen are red, one of them is wrong.

## Typography

**Family:** Schibsted Grotesk (variable, self-hosted), with Helvetica Neue and Arial as fallbacks.

### Hierarchy
- **Poster** (800, clamp(4.5rem, 16vw, 16rem), 0.84, -0.055em): the name on the home page only.
- **Display** (800, clamp(3.5rem, 9.5vw, 8.5rem), 0.88, -0.05em): page titles.
- **Headline** (700, clamp(2rem, 3.9vw, 3.5rem), 1): project names in the index, the "Next" link, the
  footer email.
- **Lede** (500, clamp(1.375rem, 2.1vw, 1.75rem), 1.32): the opening paragraph of a page, max 8 columns.
- **Title** (700, 1.375rem): section headings in the left columns.
- **Body** (400, 1.125rem, 1.55): max 66ch.
- **Small** (400, 1rem / 0.9375rem): summaries, captions, roles.
- **Label** (700, 0.875–1rem): block labels ("Selected work") and fact labels ("Role").

Display sizes get `word-spacing: 0.08em` because the tight tracking also closes word spaces.
Years and dates use tabular figures.

## Layout

- 12 columns, gutter `clamp(16px, 1.7vw, 24px)`, side margin `clamp(20px, 4.4vw, 64px)`, max 1600px.
- Home: name in columns 1–9, intro in 10–12 aligned to the name's baseline; then the work index; then
  "Off the clock" (notes in 1–8, photo in 10–12).
- Page title block: title in 1–9, facts list in 10–12, lede in 1–8.
- Sections: 2px rule, heading in 1–3, body in 4–10. Wide figures (the ScorePlus demo) span 1–12.
- Each ruled block starts `clamp(72px, 9vw, 128px)` below the last.
- Under 900px everything stacks to one column; index rows put the year on the right of the name.

## Elevation & Depth

None. The system is flat: depth is replaced by rule weight (2px opens a block, 1px divides rows) and type
size. The only framed object is the ScorePlus demo and the 3D shelf on Making Of, outlined 2px in ink.

## Shapes

Square everywhere: no border radius on buttons, figures or images.

## Components

- **Top bar**: name left, Work / Resume / Contact right, 2px rule below. Current page underlined 2px.
- **Index row**: name (headline), role and summary, year, arrow. Hover: name and arrow turn red, arrow
  moves 8px right.
- **Facts list**: 2px rule on top, each fact a bold label over a value, 1px rules between.
- **Button**: solid ink, paper text, 52px tall, square; red on hover.
- **Process steps**: four columns over a 1px rule, each a large red number, a bold name and a caption.
- **Next link**: 2px rule, "Next" label, the next page's name at headline-to-display size with an arrow.
- **Footer**: 2px rule, availability line, the email at headline size, a ruled list of links.

## Motion

- The signature: a project's name in the home index grows into that page's title (cross-document view
  transitions, `view-transition-name: t-{id}`), 0.42s on `cubic-bezier(0.23, 1, 0.32, 1)`.
- Hover: color 0.2s, arrows translate 0.25s.
- Reduced motion turns view transitions off and makes transitions instant.

## Do's and Don'ts

- Do keep everything on the 12-column grid; no element floats free of it.
- Do open every block with a 2px rule.
- Don't add cards, rounded corners, shadows, gradients or a second typeface.
- Don't use red for more than one thing per screen.
- Don't put a label above a page title; facts go in the facts list beside it.
