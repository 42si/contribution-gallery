# Embedded fonts

GitHub serves these SVGs as images, which cannot load a remote font. Each SVG therefore carries the few glyphs it needs as a static TrueType subset, together with the font's copyright notice and the SIL Open Font License in its metadata.

## Display face

Titles are set in Fraunces Italic (optical size 72, weight 500, soft serifs). `display.json` holds one subset per card, containing only the letters of that card's titles: the four profile cards carry 3–4 KB each, and the ambient card carries 11 KB for its ten scene names. The strings come from `../titles.ts` and the scene list.

After changing a title or adding a scene, regenerate with `npx tsx scripts/update-display-font.ts`; a test fails while any title letter is missing from its subset. Source family: [Fraunces](https://github.com/google/fonts/tree/main/ofl/fraunces), licensed in `fraunces-OFL.txt`.

## Numerals

Outfit, Inter, and Space Grotesk (medium, 500) are bundled as static subsets containing `0123456789,.%-`. Each SVG embeds only the selected family.

`numerals.json` records each downloaded subset's source URL and license. The adjacent license files cover their respective fonts. Source families: [Outfit](https://github.com/google/fonts/tree/main/ofl/outfit), [Inter](https://github.com/google/fonts/tree/main/ofl/inter), [Space Grotesk](https://github.com/google/fonts/tree/main/ofl/spacegrotesk).

Regenerate intentionally with `npx tsx scripts/update-numeral-fonts.ts`; normal builds use the checked-in subsets and require no font download.
