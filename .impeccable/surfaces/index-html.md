---
version: 1
slug: "index-html"
primary_target: "index.html"
related_targets: ["src/pages"]
---

# Whole site: home and project pages

Scope: every route. Home is Experience mode (the work leads); project, resume and contact pages are Read mode.

Audience and job: SWE recruiters deciding in a minute or two whether to talk to Nash. Proof: the ScorePlus
recreation, the resume, the Cinema Ninja source, and the site itself (Making Of keeps the earlier 3D shelf).

Constraints: pages work without JavaScript; one accent color; the 3D shelf survives only as a figure on Making Of.

## Direction contract

THESIS: A Swiss typographic poster that is also an index of work. Refuses the dark sidebar-plus-cards developer
template and the old cluttered 3D room; the name and the work list carry the page with type and rules alone.

OWN-WORLD: Cool off-white paper, near-black ink, one signal red. Schibsted Grotesk only, from regular to black,
set tight at poster scale and plain at reading size. A 12-column grid, heavy 2px rules opening each block, 1px
rules between rows, tabular figures for years. No cards, no shadows, no radii, no icons beyond arrows.

STORY: The visitor reads the name and one line, scans three projects with role and year, opens one, reads a
case study laid out like a poster's text block, and reaches the resume or an email in one click from anywhere.

FIRST VIEWPORT: Desktop: thin top bar (name left, Work, Resume, Contact right) over a 2px rule; the name across
two lines at poster size in columns 1–8; a short intro with "Open to SWE roles" in red in columns 9–12; the ruled
work index (name, role, year, arrow) starting in the bottom third. Phone: name across two lines filling the width,
intro below, then the index.

FORM: Safer-register lineup, chosen card "Swiss Grid" (grounded, 2 of 3 in the presented lineup). seed:36d1dcd8b78c3223.
Signature interaction: a project name in the index grows into that project's page title (cross-document view
transition); on hover the row's name turns red and its arrow advances. Reduced motion: instant.

FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict,
DESIGN.md, and every shipping raster carrying its provenance
