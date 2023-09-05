import './css/index.xcss';

import { Footer } from './components/Footer';
import { Reader } from './components/Reader';

declare global {
  interface HTMLElement {
    /** `stage1` synthetic click event handler. */
    __click?(event: MouseEvent): void | Promise<void>;
  }
}

const frag = createFragment();

append(Reader(), frag);
append(Footer(), frag);
append(frag, document.body);

setupSyntheticEvent('click');