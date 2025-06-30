TODO: Write me.

## Font Optimization

Because this is a **browser extension** fonts are served directly from user's local disk, so we optimize for load speed and rendering performance rather than download size. TTF format is used because it has simpler glyph geometry than OTF and doesn't have the decompression or embedding controls overhead of WOFF/WOFF2.

### Source Files

> These specific versions are optimized for rendering at 36pt (48px).

- Regular: <https://github.com/googlefonts/literata/blob/main/fonts/ttf/Literata36pt-Regular.ttf> (~316 KiB)
- Italic: <https://github.com/googlefonts/literata/blob/main/fonts/ttf/Literata36pt-Italic.ttf> (~300 KiB)

### Generating Subsets

Requires [fonttools](https://github.com/fonttools/fonttools) to be installed.

1. Core Latin characters, dashes, and quotes (`literata.ttf`):

```sh
pyftsubset Literata36pt-Regular.ttf \
  --unicodes="U+0020-007E,U+2013-2014,U+2018-201D" \
  --no-hinting \
  --layout-features=liga,kern \
  --layout-scripts=latn \
  --name-IDs=1 \
  --drop-tables+=DSIG,GDEF,STAT,SVG,MATH \
  --recommended-glyphs \
  --desubroutinize \
  --verbose \
  --output-file=literata.ttf
```

2. Fallback with all glyphs and default features (`literata-extended.ttf`):

```sh
pyftsubset Literata36pt-Regular.ttf \
  --unicodes="*" \
  --no-hinting \
  --name-IDs=1 \
  --drop-tables+=DSIG,STAT,SVG,MATH \
  --recommended-glyphs \
  --output-file=literata-extended.ttf
```

3. Special case with only the characters "ﬁn." in italic (`literata-fin.ttf`):

```sh
pyftsubset Literata36pt-Italic.ttf \
  --text="ﬁn." \
  --no-hinting \
  --layout-features= \
  --layout-scripts=latn \
  --name-IDs=1 \
  --drop-tables+=DSIG,GDEF,STAT,SVG,MATH \
  --output-file=literata-fin.ttf
```

### Optimization Notes

- Hinting can be removed because we render at a large, fixed size (48px).
