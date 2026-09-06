# Product

## Register

brand

## Users

Gaming PC buyers and enthusiasts shopping online for prebuilt/custom gaming rigs, laptops, monitors, and components (currency AED, bilingual English/Arabic toggle in the nav — Middle East market). They arrive with either a specific build in mind (via the PC Builder or a curated "Series") or general browsing intent, and expect fast comparison of specs/price before committing to what is often a significant purchase. A secondary surface (`/admin/*`) exists for internal staff managing catalog, orders, and content — that is a separate "product" register, handled case-by-case, not the default this file describes.

## Product Purpose

Bidayah PC is a storefront for buying gaming PCs and components: prebuilt "Series" lines, a custom PC Builder, and a general hardware/accessories catalog. Success looks like a customer trusting the brand enough to complete a high-consideration purchase — which means the site needs to read as competent and premium, not like a hobbyist gaming forum skin.

## Brand Personality

Toned-down, premium tech — quieter and more restrained than an aggressive gaming/esports skin. Dark and tech-forward, confident without shouting. The existing amber/orange accent, NeonCard glow, and orbitron/rajdhani type pairing stay, but glow/neon effects should read as occasional emphasis, not ambient decoration on every element. Closer to a premium hardware brand (think: confident product photography, generous space, restrained motion) than an esports/cyberpunk skin.

## Anti-references

- Generic soft-SaaS pastel/cream minimalism — wrong category entirely, this is still a dark tech brand.
- Loud, ambient cyberpunk excess (neon glow on every card, scanline/glitch effects everywhere, RGB-everything) — the codebase has these utilities available but they should be used sparingly, not as the default finish on every surface.
- Cluttered "gamer forum" density — this is a considered purchase; give content room to breathe.

## Design Principles

- Confidence through restraint — one deliberate accent moment per section beats glow on every card.
- Let the product (and the people) speak — real photography and real specs carry the page, not decorative chrome around them.
- Reuse before inventing — `NeonCard`, `CyberButton`, `GSAPScrollReveal` and the existing type/color tokens are the system; extend it deliberately rather than bolting on new one-off patterns.
- Content dictates layout, not the other way around — a portrait photo, a short bio, a spec table each get the shape that fits them, not a forced identical card template.

## Accessibility & Inclusion

Solid baseline: WCAG AA contrast throughout, `prefers-reduced-motion` respected on all animation, full keyboard navigability. No formal compliance audit mandate beyond that.
