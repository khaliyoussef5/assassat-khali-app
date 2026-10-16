# ASSASSAT KHALI — Calculateur Technique

Project: Armstrong calculator + future BA13 ceilings, walls and insulation.

## Current release
- Existing Armstrong V1.4 preserved (3 layout options, plan under choices, two-page PDF).
- Main Porteur T profiles run along the room length only.
- Technical rules: docs/RULES.md.
- npm test validates approved 8x4m reference and further configurations.

## Deployment
Connect this repository to Cloudflare Pages: production branch main, build command npm test, output directory public. Embed the resulting pages.dev URL once in Google Sites.

Repository contains no credentials or client information. Quantities need checking against actual manufacturer system.

## Working process
New feature -> separate branch -> run tests -> preview -> owner approval -> merge to main -> automatic production deployment.
