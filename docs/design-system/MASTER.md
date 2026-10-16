# ASSASSAT KHALI — Visual Design System v2 (Prototype)

## Source and method
Inspired by UI/UX Pro Max open-source skill decision framework:
https://github.com/nextlevelbuilder/ui-ux-pro-max-skill

Relevant dataset matches: **B2B Service**, **Construction/Architecture**, **Minimalism & Swiss Style**.
The project-specific tokens below are *our design decisions*, not direct output of the skill CLI.

## Design thesis
Premium Industrial: credible, precise construction-tech utility rather than marketing decoration.
Product is a calculation tool with technical diagrams and quantified output.
Strong geometry, sober materials, a single warm highlight to guide the eye.
Content order stays: **dimensions → suggestions → plan → materials → PDF**.

## Foundations
- Font: IBM Plex Sans Arabic, followed by system Arabic fallback; Manrope for Latin labels.
- Main page background: `#f5f7f5`
- Text / ink: `#172a31`
- Primary dark surface: `#11282f`
- Primary green: `#146b62`
- Supporting line: `#dce5e2`
- Warm action highlight: `#efb167` on dark backgrounds
- Muted labels: `#566e74`
- Cards: white; radius 22–24 px; modest layered shadow
- Icons: stroke-only SVG, consistent 1.6–2 px, no emojis
- Light patterns: faint technical grid; decorative only

## Components
- Top navbar: 72–84 px; clear active route, one dark launch CTA.
- Hero: dark engineering canvas + diagram illustration; one primary CTA.
- Calculator catalog: 2 columns desktop, 1 column mobile; only operational cards clickable.
- Coming soon: semantic status, no dummy anchor.
- Steps: numbered 01–04, clear path from measurement to PDF.

## Rules for subsequent calculators
- Keep HTML/CSS tokens reusable; avoid ad hoc palettes on each new page.
- Maintain 375px and 768px responsive layouts and RTL labels.
- Touch/keyboard target >=44px for primary actions, focus visible.
- Preserve meaningful heading order and accessible link labels.
- Respect reduced motion.
- Do not alter calculator formulas during visual-only PRs.
- Keep calculator route functional at `/calculators/armstrong/`.
- Add new calculators as independent routes and create accompanying test cases.
- Dark-background paragraphs should remain >= 4.5:1 contrast.

## Deployment discipline
- Work in feature branch; Cloudflare preview for review.
- Never merge visual-only work without explicit approval.
- After approval merge to `main`, and Google Sites automatically gets update.
