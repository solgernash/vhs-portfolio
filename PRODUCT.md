# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Stack

Astro 5 (static output) with a three.js scene, deployed as a Cloudflare Worker with static assets.
Astro 5 was chosen because the development machine runs Node 20.17; newer Astro needs Node 22.

## Users

Recruiters and hiring managers filling software engineering roles. They arrive from a resume link, a
LinkedIn profile or a link someone forwarded, often on a phone, and have a minute or two to decide
whether Nash is worth a conversation. They need to see what he built, what his part was, and how to
reach him.

## Product Purpose

Nash Carroll's portfolio. It shows shipped and course work, his resume and contact details, and a little
of who he is. Success is a visitor reaching a project page or the resume quickly, understanding Nash's
role in the work, and getting in touch.

## Positioning

A portfolio that leads with the work: the name, three projects with role and year, and case studies a
recruiter can read and link to. The personal side (ballroom, Spanish, running, games) sits beside the work
rather than in front of it. The site began as a 3D VHS entertainment center, which now lives on the Making Of
page as a piece of work in its own right.

## Operating Context

- Links are shared one page at a time, so every tape has its own URL, title and preview image.
- Visitors read on phones and laptops; some have no WebGL, JavaScript or mouse.
- Nash finishes his M.S. in Computer Science at the University of Georgia in May 2027 and is looking for
  software engineering roles, especially full-stack, real-time and 3D/XR work.

## Capabilities and Constraints

- Pages: Home, About, ScorePlus, Cinema Ninja, XR Lab, Resume, Contact, Making Of.
- The footer shows what Nash is listening to through `/api/now-playing` (Cloudflare Worker, Spotify API).
- Making Of embeds the original three.js shelf; its objects open notes about Nash.
- ScorePlus production code is proprietary. The demo on its tape is a from-scratch recreation and must
  stay labeled as one.
- Every page must be readable without the 3D scene.

## Brand Commitments

- Name on the site: Nash Carroll.
- Voice: first person, plain, specific about what he did himself versus with a team.
- The VHS shelf is no longer the identity (dropped by Nash on 2026-11-17 in favor of a cleaner look); it is
  kept as an exhibit on Making Of.

## Evidence on Hand

- ScorePlus interactive recreation: `public/demos/scoreplus/`.
- Resume PDF: `public/resume.pdf`.
- First-performance photo: `public/eggs/first-performance.jpg`.
- Cinema Ninja source: https://github.com/solgernash/cinja-box-office.
- Not on hand: screenshots or video of Cinema Ninja, the digital-patient module, the motion-capture
  workflow, or the production ScorePlus app. Do not invent these or describe them beyond the resume.

## Product Principles

1. The work is reachable in one click and readable in any browser; the shelf is a way in, never a gate.
2. Say what Nash did, exactly. Team work names the team.
3. Show the thing running where possible; where it is not possible, say why.
4. Personality lives on the side shelves and stays out of the way of the projects.

## Accessibility & Inclusion

WCAG 2.2 AA. Everything the 3D scene offers must also be available to keyboard and screen-reader users,
and motion must respect `prefers-reduced-motion`.
