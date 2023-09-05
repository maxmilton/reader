import { describe, expect, test } from 'bun:test';

function validateHTML(_html: string): boolean {
  console.log(!!_html);
  throw new Error('Not implemented');
}

const fixtureFiles: [filename: string, bytes: number, valid: boolean][] = [
  ['basic.html', 145, true],
  ['broken.html', 1244, false],
  ['wikipedia-simple.html', 53_073, true],
  ['wikipedia.html', 430_509, true],
];

for (const [filename, bytes, valid] of fixtureFiles) {
  // eslint-disable-next-line @typescript-eslint/no-loop-func
  describe(filename, () => {
    const file = Bun.file(`test/unit/fixtures/${filename}`);

    test('file exists', () => {
      expect(file.exists()).resolves.toBeTruthy();
      expect(file.size).toBeGreaterThan(0);
    });

    test('code is correct length', async () => {
      expect(await file.text()).toHaveLength(bytes);
    });

    if (valid) {
      test.skip('code is valid HTML', async () => {
        expect(validateHTML(await file.text())).toBeTruthy();
      });
    } else {
      test.skip('code is intentionally not valid HTML', async () => {
        expect(validateHTML(await file.text())).toBeFalsy();
      });
    }
  });
}
