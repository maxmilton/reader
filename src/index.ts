// FIXME: Must come first; prevent import reordering. DO NOT ORGANIZE IMPORTS.
//  ↳ https://github.com/microsoft/TypeScript/issues/41494
import { append, createFragment, setupSyntheticEvent } from 'stage1';
import { Footer } from './components/Footer';
import { Reader } from './components/Reader';
import './css/index.xcss';

declare global {
  interface HTMLElement {
    /** `stage1` synthetic click event handler. */
    __click?(event: MouseEvent): void;
  }
}

const frag = createFragment();

append(Reader(), frag);
append(Footer(), frag);
append(frag, document.body);

setupSyntheticEvent('click');
