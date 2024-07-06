# Ideas

- Would be interesting for bold or italicised words to appear as such
  - How would it impact focus and retention?
- Would it be useful for a contextual phrase to be shown at certain times?
  - "Quote" or "“" or "“”" when inside a blockquote
  - "Table" when inside a table or maybe a table header when in a cell
- There's still more opportunity to tweak the speed/rate words are shown to improve flow to feel more natural and improve retention
  - Right now, words are examined individually but perhaps there could be analysis based on the word context
    - Words are inspected as they're shown but this may require analysis of the entire text body or AST before play
    - Pre-defined delay timeout for each word would also make the timing very consistent and predictable
  - Should some words be replaced for better readability?
    - "&" --> "and"
  - Dates and number ranges (e.g., with en dash) can be hard to comprehend
    - Could dates be expanded to a localised written form? "2021-12-25" --> "the 25th of December 2021" (in Australian locale datetime format)
- Would it be useful when clicking on the word, to jump to its location on the page?
- Look over ideas in <https://github.com/mozilla/readability>
