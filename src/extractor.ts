/* eslint-disable unicorn/prefer-includes, unicorn/no-for-loop */

// Import html5parser from source directly to avoid tslib in their dist
import {
  parse,
  SyntaxKind,
  walk,
  type INode,
  type ITag,
} from 'html5parser/src';
import { create } from 'stage1';

interface Tag extends Omit<ITag, 'attributeMap'> {
  attributeMap: Record<string, string | undefined>;
}

const EXTRANEOUS_ELEMENTS = [
  '!--',
  'aside',
  'button',
  'canvas',
  'embed',
  'figcaption',
  'figure',
  'form',
  'head',
  'iframe',
  'input',
  'nav',
  'noscript',
  'script',
  'style',
  'svg',
  'textarea',
];
// FIXME: Needs more real-world testing as false positives are possible
//  ↳ Might need some kind of scoring logic to determine confidence
//  ↳ What if the user wants to read comments? Should the matching be different
//    if the input is the user selection?
const EXTRANEOUS_CLASSES = /comment|communit|contact|disqus|donat|extra|fundrais|meta|pager|pagination|popup|promo|related|remark|rss|share|shout|sidebar|sponsor|social|tags|tool|widget/i;
const BLOCK_ELEMENTS = [
  'address',
  'article',
  // 'aside',
  'blockquote',
  // 'canvas',
  'dd',
  'div',
  'dl',
  'fieldset',
  // 'figcaption',
  // 'figure',
  'footer',
  // 'form',
  'h1',
  'h2',
  'h3',
  'h4',
  'h5',
  'h6',
  'header',
  'hgroup',
  'hr',
  'li',
  'main',
  // 'nav',
  // 'noscript',
  'ol',
  'output',
  'p',
  'pre',
  'section',
  'table',
  'tfoot',
  'ul',
];
const SKIP = true;

const textarea = create('textarea');

function decodeHTMLEntities(html: string) {
  textarea.innerHTML = html;
  return textarea.value;
}

function buildAttributeMap(node: ITag | Tag): asserts node is Tag {
  // eslint-disable-next-line no-param-reassign
  node.attributeMap = {};

  for (let index = 0; index < node.attributes.length; index++) {
    const attr = node.attributes[index];
    // eslint-disable-next-line no-param-reassign
    node.attributeMap[attr.name.value] = attr.value && attr.value.value;
  }
}

// Custom AST walker that can skip over subtrees
// https://github.com/lukeed/astray/blob/017484ce67402224304836e7d1a2fe2e116c3ae9/src/index.js
function walk2(
  node: INode[] | INode,
  parent: ITag,
  enter: (node: INode, parent: ITag) => void | typeof SKIP,
  leave: (node: INode) => void,
) {
  if (Array.isArray(node)) {
    for (let index = 0; index < node.length; index++) {
      walk2(node[index], parent, enter, leave);
    }
  } else {
    if (enter(node, parent) === SKIP) return;
    if (node.type === SyntaxKind.Tag && node.body) {
      walk2(node.body, node, enter, leave);
    }
    leave(node);
  }
}

/**
 * Attempt to extract the main content of a given HTML document.
 *
 * @param html - HTML markup. Since this is coming from the browser after the
 * page was rendered, it will be well-formed and safe.
 * @returns The main content of the document.
 */
export function extractText(html: string): string {
  const ast = parse(html);

  const idMap: Record<string, ITag> = {};
  const articles: ITag[] = [];
  const mains: ITag[] = [];
  let body: ITag;

  // First pass; populate attribute maps and collect references
  walk(ast, {
    enter: (node) => {
      if (node.type === SyntaxKind.Tag) {
        switch (node.name) {
          case 'article':
            articles.push(node);
            break;
          case 'body':
            body = node;
            break;
          case 'main':
            mains.push(node);
            break;
          default:
            break;
        }

        buildAttributeMap(node);

        const attrId = node.attributeMap.id;
        if (attrId) {
          idMap[attrId] = node;
        }
      }
    },
  });

  // Choose the best root node:
  //  1. <article> element if there is only one
  //  2. Element with id = article
  //  3. Element with id = post
  //  4. Element with id = content
  //  5. Element with id = main
  //  6. <main> element if there is only one
  //  7. Element with id = app
  //  8. Element with id = root
  //  9. <body> element (always defined)
  const root = articles.length === 1
    ? articles[0]
    : idMap.article
        || idMap.post
        || idMap.content
        || idMap.main
        || (mains.length === 1 ? mains[0] : idMap.app || idMap.root || body!);
  let text = '';

  // Second pass; clean up superfluous nodes and extract meaningful text
  walk2(
    root.body!,
    root,
    // eslint-disable-next-line consistent-return
    (node, parent) => {
      if (node.type === SyntaxKind.Tag) {
        if (
          EXTRANEOUS_ELEMENTS.indexOf(node.name) !== -1
          || (node.name === 'footer' && parent.name !== 'blockquote')
          // TODO: Fix types
          || ((node as unknown as Tag).attributeMap.class
            && EXTRANEOUS_CLASSES.test(
              (node as unknown as Tag).attributeMap.class!,
            ))
        ) {
          return SKIP;
        }
      } else {
        // Add text with consecutive whitespace collapsed
        text += (
          node.value.indexOf('&') !== -1
            ? decodeHTMLEntities(node.value)
            : node.value
        ).replace(/\s+/g, ' ');
      }
    },
    (node) => {
      if (
        node.type === SyntaxKind.Tag
        && BLOCK_ELEMENTS.indexOf(node.name) !== -1
      ) {
        // Add double space (which is turned into a newline later)
        text += '  ';
      }
    },
  );

  // console.log(stringify(root, html));
  // console.log(root);

  return (
    text
      .trim()
      // ensure single consecutive \n padded with space
      .replace(/[\n ]{2,}/g, ' \n ')
      // fix missing space around em dashes
      .replace(/(\S)—(\S)/g, '$1 — $2')
  );
}

// // Simple stringify AST to prettified HTML-like structure for debugging
// function stringify(node: INode, html: string, level = 1): string {
//   if (node.type === SyntaxKind.Text) return node.value.replace(/\s+/g, ' ');
//   if (node.name === '!--') return html.slice(node.start, node.end);

//   const attrs = node.attributes
//     .map((attr) => html.slice(attr.start, attr.end))
//     .join(' ');
//   const head = `<${node.rawName}${attrs ? ` ${attrs}` : ''}>`;

//   if (!node.body || node.body.length === 0) return head;

//   /* eslint-disable prefer-template */ // template string breaks after minification
//   return (
//     head
//     + '\n'
//     + '  '.repeat(level)
//     + node.body
//       .filter((n) => !(n.type === SyntaxKind.Text && n.value.trim() === ''))
//       .map((n) => stringify(n, html, level + 1))
//       .join('\n' + '  '.repeat(level))
//     + '\n'
//     + '  '.repeat(level - 1)
//     + '</'
//     + node.rawName
//     + '>'
//   );
// }
