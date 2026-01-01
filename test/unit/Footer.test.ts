// FIXME: Uncomment this file once bun macro issues are fixed:
//  ↳ https://github.com/oven-sh/bun/issues/3641
//  ↳ https://github.com/oven-sh/bun/issues/3832

// import { afterEach, expect, test } from "bun:test";
// import { cleanup, render } from "@maxmilton/test-utils/dom";
// import { Footer } from "#components/Footer.ts";

// afterEach(cleanup);

// test("rendered DOM contains expected elements", () => {
//   expect.assertions(3);
//   const rendered = render(Footer());
//   expect(rendered.container.firstChild?.nodeName).toBe("FOOTER");
//   expect(rendered.container.querySelector('a[href="https://maxmilton.com"]')).toBeTruthy();
//   expect(
//     rendered.container.querySelector('a[href="https://github.com/maxmilton/reader/issues"]'),
//   ).toBeTruthy();

//   // TODO: More/better assertions
// });

// test("rendered DOM matches snapshot", () => {
//   expect.assertions(1);
//   const rendered = render(Footer());
//   expect(rendered.container.innerHTML).toMatchSnapshot();
// });

// test("contains the app release version number", () => {
//   expect.assertions(1);
//   const rendered = render(Footer());
//   expect(rendered.container.innerHTML).toMatch(/v\d+\.\d+\.\d+/);
// });

$console.warn("FIXME: Footer tests are disabled");
