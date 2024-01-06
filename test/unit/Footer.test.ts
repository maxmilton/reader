// FIXME: Uncomment this file once bun macro issues are fixed:
//  ↳ https://github.com/oven-sh/bun/issues/3641
//  ↳ https://github.com/oven-sh/bun/issues/3832

// import { afterEach, expect, test } from 'bun:test';
// import { Footer } from '../../src/components/Footer';
// import { cleanup, render } from './utils';

// afterEach(cleanup);

// test('rendered DOM contains expected elements', () => {
//   const rendered = render(Footer());
//   expect(rendered.container.firstChild?.nodeName).toBe('FOOTER');
//   expect(rendered.container.querySelector('a[href="https://maxmilton.com"]')).toBeTruthy();
//   expect(
//     rendered.container.querySelector('a[href="https://github.com/maxmilton/reader/issues"]'),
//   ).toBeTruthy();

//   // TODO: More/better assertions
// });

// test('rendered DOM matches snapshot', () => {
//   const rendered = render(Footer());
//   expect(rendered.container.innerHTML).toMatchSnapshot();
// });

// test('contains the app release version number', () => {
//   const rendered = render(Footer());
//   expect(rendered.container.innerHTML).toMatch(/v\d+\.\d+\.\d+/);
// });

console2.warn('FIXME: Footer tests are disabled');
