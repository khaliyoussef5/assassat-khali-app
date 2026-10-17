# ASSASSAT KHALI — Visual Design System v2 (Prototype)

## Source and method
Inspired by UI/UX Pro Max open-source skill decision framework:
https://github.com/nextlevelbuilder/ui-ux-pro-max-skill

Relevant dataset matches: **B2B Service**, **Construction/Architecture**, **Minimalism & Swiss Style**.
The project-specific tokens below are *our design decisions*, not direct output of the skill CLI.

## Design thesis
Homepage: Premium Industrial navigation/catalogue (already accepted).

**Calculator pages: Original Armstrong + BA13 visual style is the approved reference.** It takes precedence over the homepage styling for the interiors of all calculator tools. Keep its light grey backdrop, teal gradient header, white rounded panels, green outlined selected options, understated tables, compact system typography and the sequence dimensions → suggestions → plan → materials.
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

## Calculator visual language — explicit reference (2026-10-16)
- Reference source (unchanged): `public/calculators/armstrong/index.html`.
- Reusable stylesheet: `public/assets/ak-classic.css` (applied after `ak-tools.css`).
- Approved colors: background `#f3f6f7`, text `#142c35`, header `#112c36 → #174a51`, option accent `#178c79`, primary button `#166e65`, pale selected option `#eaf8f3`.
- Panel style: white, border `#e0e7e7`, radius 18px, shadow `0 9px 28px #112c3610`.
- No extra decorative navigation or stage guide on calculator pages: leave focus on inputs, options and technical drawing.
- Reuse classic styling for `armstrong-full`, `ba13-ceiling`, and `walls`. Keep the original reference calculator untouched.
- Technical diagram colors, hanger visibility, numbers and PDF rules are separately approved and must **not** be changed by UI skin edits.
- Homepage retains previously accepted premium palette until its own review; keep home styling and calculator styling distinct.
