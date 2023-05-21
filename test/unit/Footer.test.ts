import { afterEach, expect, test } from 'bun:test';
import { Footer } from '../../src/components/Footer';
import { cleanup, render } from './utils';

afterEach(cleanup);

test('renders correctly', () => {
  // process.env.APP_RELEASE = '1.0.0';

  const rendered = render(Footer());
  expect(rendered.container.firstChild?.nodeName).toBe('FOOTER');
  // expect(rendered.container.innerHTML).toMatchInlineSnapshot(`<footer class="mv2 muted fss tc">
  // // © <a href="https://maxmilton.com" class="normal muted" target="_blank">Max Milton</a> ・ v1.0.0 ・ <a href="https://github.com/maxmilton/reader/issues" target="_blank">report bug</a>
  // // </footer>`);
  expect(rendered.container.innerHTML).toMatchSnapshot();
});

// TODO: Remove? Testing framework internals goes against the philosophy of
// testing user behaviour.
test('has no node refs', () => {
  const rendered = render(Footer());
  // @ts-expect-error - FIXME:!
  // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
  expect(rendered.container.firstChild._refs.length).toBe(0);
});

test('contains a link to GitHub issues', () => {
  const rendered = render(Footer());
  expect(
    rendered.container.querySelector('a[href="https://github.com/maxmilton/reader/issues"]'),
  ).toBeTruthy();
});
