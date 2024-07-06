import { afterEach, expect, test } from 'bun:test';
import { ORP, type ORPComponent } from '../../src/components/ORP';
import { cleanup, render } from './utils';

afterEach(cleanup);

test('rendered DOM contains expected elements', () => {
  expect.assertions(4);
  const rendered = render(ORP('x'));
  const root = rendered.container.firstChild as HTMLSpanElement;
  expect(root).toBeTruthy();
  expect(rendered.container.querySelector('#orp')).toBe(root);
  expect(root).toBeInstanceOf(window.HTMLSpanElement);
  expect(root.textContent).toBe('x');
});

test('rendered DOM matches snapshot', () => {
  expect.assertions(1);
  const rendered = render(ORP('x'));
  expect(rendered.container.innerHTML).toMatchSnapshot();
});

test('returns the same reused node every call', () => {
  expect.assertions(10);
  let node1: ORPComponent;
  let node2: ORPComponent;
  let node3: ORPComponent;
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
