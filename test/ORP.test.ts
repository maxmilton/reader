import { test } from 'uvu';
import * as assert from 'uvu/assert';
import { ORP } from '../src/components/ORP';
import { cleanup, render } from './utils';

test.after.each(cleanup);

test('renders correctly', () => {
  const rendered = render(ORP('x'));
  assert.fixture(rendered.container.innerHTML, '<span class="orp">x</span>');
});

// TODO: Remove? Testing framework internals goes against the philosophy of
// testing user behaviour.
test('has no node refs', () => {
  const rendered = render(ORP('x'));
  // @ts-expect-error - FIXME:!
  // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
  assert.is(rendered.container.firstChild._refs.length, 0);
});

test('returns the same reused node every call', () => {
  let node1;
  let node2;
  let node3;
  const rendered1 = render((node1 = ORP('1')));
  assert.ok(rendered1.container.firstChild);
  const rendered2 = render((node2 = ORP('2')));
  // because it's the same node, it should have moved from the previous parent
  assert.is(rendered1.container.firstChild, null);
  assert.ok(rendered2.container.firstChild);
  const rendered3 = render((node3 = ORP('3')));
  assert.is(rendered1.container.firstChild, null);
  assert.is(rendered2.container.firstChild, null);
  assert.ok(rendered3.container.firstChild);
  assert.is(node1.nodeName, 'SPAN');
  assert.is(node1, node2);
  assert.is(node2, node3);
  assert.is(node3, node1);
});

test.run();
