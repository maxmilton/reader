import { afterEach, expect, test } from 'bun:test';
import { ORP } from '../../src/components/ORP';
import { cleanup, render } from './utils';

afterEach(cleanup);

test('renders correctly', () => {
  const rendered = render(ORP('x'));
  // TODO: Use toMatchInlineSnapshot once `bun test` supports it
  expect(rendered.container.innerHTML).toBe('<span id="orp">x</span>');
});

// TODO: Remove? Testing framework internals goes against the philosophy of
// testing user behaviour.
test('has no node refs', () => {
  const rendered = render(ORP('x'));
  // @ts-expect-error - FIXME:!
  // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
  expect(rendered.container.firstChild._refs.length).toBe(0);
});

test('returns the same reused node every call', () => {
  let node1;
  let node2;
  let node3;
  const rendered1 = render((node1 = ORP('1')));
  expect(rendered1.container.firstChild).toBeTruthy();
  const rendered2 = render((node2 = ORP('2')));
  // because it's the same node, it should have moved from the previous parent
  expect(rendered1.container.firstChild).toBe(null);
  expect(rendered2.container.firstChild).toBeTruthy();
  const rendered3 = render((node3 = ORP('3')));
  expect(rendered1.container.firstChild).toBe(null);
  expect(rendered2.container.firstChild).toBe(null);
  expect(rendered3.container.firstChild).toBeTruthy();
  expect(node1.nodeName).toBe('SPAN');
  expect(node1).toBe(node2);
  expect(node2).toBe(node3);
  expect(node3).toBe(node1);
});
