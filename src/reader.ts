import "#css/index.xcss";

import { Footer } from "#components/Footer.ts";
import { Reader } from "#components/Reader.ts";
import { append, fragment, handleClick } from "stage1/fast";

const container = fragment();

append(Reader(), container);
append(Footer(), container);
append(container, document.body);

document.onclick = handleClick;
